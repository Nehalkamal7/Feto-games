import { NextRequest, NextResponse } from 'next/server';
import {
  addPublicRoomDirectory,
  getPublicRoomDirectory,
  getRoomState,
  sanitizeRoomState,
  saveRoomState
} from '@/lib/redis';
import { GameMode, Player, RoomConfig, RoomState } from '@feto-games/shared-types';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

function generateRoomCode(): string {
  const characters = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `FG-${suffix}`;
}

const PARTY_GAME_MODES: GameMode[] = [
  'most_likely_to',
  'sip_or_spill',
  'quiz_battle',
  'who_is_imposter',
  'hot_potato',
  'truth_or_dare'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = (body.username || '').trim().slice(0, 20) || `PartyGamer${Math.floor(10 + Math.random() * 90)}`;
    const avatar = body.avatar || 'cyber_cat';

    // 1. Check for open public rooms that have room for players (< 15) and no PIN
    const publicRooms = await getPublicRoomDirectory();
    let matchedRoomCode: string | null = null;

    for (const candidate of publicRooms) {
      if (candidate.playerCount < (candidate.maxPlayers || 15) && !candidate.hasPin && candidate.status === 'lobby') {
        const liveRoom = await getRoomState(candidate.code);
        if (
          liveRoom &&
          liveRoom.status === 'lobby' &&
          !liveRoom.config.isPrivate &&
          !liveRoom.config.hasPin &&
          Object.keys(liveRoom.players).length < (liveRoom.config.maxPlayers || 15)
        ) {
          matchedRoomCode = candidate.code;
          break;
        }
      }
    }

    if (matchedRoomCode) {
      return NextResponse.json({
        success: true,
        data: {
          roomCode: matchedRoomCode,
          isNewRoom: false,
          message: `Matched to open room ${matchedRoomCode}!`
        }
      });
    }

    // 2. If no open public room is available, create a fresh public 15-player room
    let roomCode = generateRoomCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await getRoomState(roomCode);
      if (!existing) break;
      roomCode = generateRoomCode();
      attempts++;
    }

    const playerId = body.playerId ? String(body.playerId).trim() : `usr_${nanoid(10)}`;
    const sessionToken = `ssn_${nanoid(24)}`;
    const randomGameMode = PARTY_GAME_MODES[Math.floor(Math.random() * PARTY_GAME_MODES.length)];

    const config: RoomConfig = {
      maxPlayers: 15,
      isPrivate: false,
      hasPin: false,
      roundDurationSeconds: 30,
      totalRounds: 5,
      gameMode: randomGameMode,
      vibeMode: 'chill',
      allowSpectators: true,
      isTeamMode: false
    };

    const hostPlayer: Player = {
      id: playerId,
      socketId: playerId,
      username,
      avatar,
      isHost: true,
      isReady: true,
      isSpectator: false,
      score: 0,
      joinedAt: Date.now(),
      connectionStatus: 'connected',
      disconnectedAt: null,
      graceExpiresAt: null,
      secretRole: null,
      isGuest: true,
      userId: null
    };

    const roomState: RoomState = {
      code: roomCode,
      hostId: playerId,
      status: 'lobby',
      config,
      players: { [playerId]: hostPlayer },
      spectators: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
      currentRound: 0,
      sipsCount: {},
      customCards: []
    };

    // Save to Upstash Redis with 2-hour TTL
    await saveRoomState(roomState, 7200);

    // Register in public room directory
    await addPublicRoomDirectory({
      code: roomCode,
      hostUsername: hostPlayer.username,
      hostAvatar: hostPlayer.avatar,
      playerCount: 1,
      maxPlayers: config.maxPlayers,
      status: 'lobby',
      gameMode: config.gameMode,
      hasPin: false,
      isTeamMode: false,
      createdAt: roomState.createdAt
    });

    const publicRoom = sanitizeRoomState(roomState);

    return NextResponse.json({
      success: true,
      data: {
        roomCode,
        isNewRoom: true,
        playerId,
        sessionToken,
        reconnectToken: sessionToken,
        player: {
          id: hostPlayer.id,
          username: hostPlayer.username,
          avatar: hostPlayer.avatar,
          isHost: true,
          isReady: true,
          isSpectator: false,
          score: 0,
          connectionStatus: 'connected',
          graceExpiresAt: null,
          joinedAt: hostPlayer.joinedAt
        },
        room: publicRoom,
        message: 'Created a new public room for you and strangers!'
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/quick-match] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Matchmaking failed' } },
      { status: 500 }
    );
  }
}
