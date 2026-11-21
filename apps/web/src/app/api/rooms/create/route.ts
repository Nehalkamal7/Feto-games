import { NextRequest, NextResponse } from 'next/server';
import { CreateRoomDTO, Player, RoomConfig, RoomState } from '@feto-games/shared-types';
import {
  addPublicRoomDirectory,
  generateRoomCode,
  getRoomState,
  normalizeRoomCode,
  sanitizeRoomState,
  saveRoomState
} from '@/lib/redis';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: CreateRoomDTO = await req.json();

    const username = (body.username || '').trim().slice(0, 20);
    if (!username || username.length < 2) {
      return NextResponse.json(
        { success: false, error: { message: 'Username must be at least 2 characters.' } },
        { status: 400 }
      );
    }

    // Generate unique 6-character alphanumeric room code with collision prevention
    let roomCode = generateRoomCode(6);
    let attempts = 0;
    while (attempts < 8) {
      const existing = await getRoomState(roomCode);
      if (!existing) break;
      roomCode = generateRoomCode(6);
      attempts++;
    }
    roomCode = normalizeRoomCode(roomCode);

    const playerId = (body as any).playerId
      ? String((body as any).playerId).trim()
      : `usr_${nanoid(10)}`;
    const sessionToken = `ssn_${nanoid(24)}`;
    const maxPlayers = Math.min(Math.max(body.maxPlayers || 15, 2), 15);
    const hasPin = Boolean(body.pin && body.pin.trim().length === 4);

    const config: RoomConfig = {
      maxPlayers,
      isPrivate: body.isPrivate ?? false,
      hasPin,
      pinHash: hasPin ? body.pin?.trim() : undefined,
      roundDurationSeconds: body.roundDurationSeconds || 30,
      totalRounds: body.totalRounds || 5,
      gameMode: body.gameMode || 'who_is_imposter',
      vibeMode: (body as any).vibeMode || 'chill',
      allowSpectators: body.allowSpectators ?? true,
      isTeamMode: body.isTeamMode ?? false,
      customDeckId: body.customDeckId
    };

    const hostPlayer: Player = {
      id: playerId,
      socketId: playerId,
      username,
      avatar: body.avatar || 'cyber_cat',
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

    // Save to Upstash Redis with 2-hour TTL (7200s)
    await saveRoomState(roomState, 7200);

    // Register in public room directory if not private
    if (!config.isPrivate) {
      await addPublicRoomDirectory({
        code: roomCode,
        hostUsername: hostPlayer.username,
        hostAvatar: hostPlayer.avatar,
        playerCount: 1,
        maxPlayers: config.maxPlayers,
        status: 'lobby',
        gameMode: config.gameMode,
        hasPin,
        isTeamMode: config.isTeamMode,
        createdAt: roomState.createdAt
      });
    }

    const publicRoom = sanitizeRoomState(roomState);

    // Return immediately (< 500ms) so frontend redirects swiftly to /room/[code]
    return NextResponse.json({
      success: true,
      roomCode,
      playerId,
      sessionToken,
      reconnectToken: sessionToken,
      room: publicRoom,
      data: {
        roomCode,
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
          joinedAt: hostPlayer.joinedAt,
          team: hostPlayer.team
        },
        room: publicRoom
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/create] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to create room' } },
      { status: 500 }
    );
  }
}
