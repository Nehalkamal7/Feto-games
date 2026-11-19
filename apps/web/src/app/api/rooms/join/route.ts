import { NextRequest, NextResponse } from 'next/server';
import { JoinRoomDTO, Player, PlayerSummary } from '@feto-games/shared-types';
import { getRoomState, saveRoomState, sanitizeRoomState } from '@/lib/redis';
import { publishToRoom } from '@/lib/ably-server';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: JoinRoomDTO = await req.json();

    const roomCode = (body.roomCode || '').toUpperCase().trim();
    if (!roomCode) {
      return NextResponse.json(
        { success: false, error: { message: 'Room code is required.' } },
        { status: 400 }
      );
    }

    const username = (body.username || '').trim().slice(0, 20);
    if (!username || username.length < 2) {
      return NextResponse.json(
        { success: false, error: { message: 'Username must be at least 2 characters.' } },
        { status: 400 }
      );
    }

    const room = await getRoomState(roomCode);
    if (!room) {
      return NextResponse.json(
        { success: false, error: { message: `Room ${roomCode} not found or expired.` } },
        { status: 404 }
      );
    }

    // Verify PIN if configured
    if (room.config.hasPin && room.config.pinHash) {
      const providedPin = (body.pin || '').trim();
      if (providedPin !== room.config.pinHash) {
        return NextResponse.json(
          { success: false, error: { message: 'Incorrect room PIN.' } },
          { status: 403 }
        );
      }
    }

    // Verify room status
    const asSpectator = Boolean(body.asSpectator);
    if (room.status !== 'lobby' && !asSpectator && !room.config.allowSpectators) {
      return NextResponse.json(
        { success: false, error: { message: 'Game has already started and spectators are not allowed.' } },
        { status: 400 }
      );
    }

    // Check capacity (Strictly max 15 active players)
    const activePlayerCount = Object.keys(room.players).length;
    const maxCapacity = Math.min(room.config.maxPlayers || 15, 15);

    let isSpectator = asSpectator;
    if (!isSpectator && activePlayerCount >= maxCapacity) {
      if (room.config.allowSpectators) {
        isSpectator = true;
      } else {
        return NextResponse.json(
          { success: false, error: { message: `Room is full (max ${maxCapacity} players).` } },
          { status: 400 }
        );
      }
    }

    // Check for duplicate username in active players
    const existingPlayer = Object.values(room.players).find(
      (p) => p.username.toLowerCase() === username.toLowerCase()
    );

    let playerId: string;
    let sessionToken: string;
    let playerObj: Player;

    if (existingPlayer && existingPlayer.connectionStatus !== 'connected') {
      // Re-connecting existing player
      playerId = existingPlayer.id;
      sessionToken = `ssn_${nanoid(24)}`;
      existingPlayer.connectionStatus = 'connected';
      existingPlayer.disconnectedAt = null;
      existingPlayer.graceExpiresAt = null;
      playerObj = existingPlayer;
    } else {
      playerId = `usr_${nanoid(10)}`;
      sessionToken = `ssn_${nanoid(24)}`;

      playerObj = {
        id: playerId,
        socketId: playerId,
        username,
        avatar: body.avatar || 'neon_fox',
        isHost: false,
        isReady: false,
        isSpectator,
        score: 0,
        joinedAt: Date.now(),
        connectionStatus: 'connected',
        disconnectedAt: null,
        graceExpiresAt: null,
        secretRole: null,
        isGuest: true,
        userId: null
      };

      if (isSpectator) {
        room.spectators[playerId] = playerObj;
      } else {
        room.players[playerId] = playerObj;
      }
    }

    room.updatedAt = Date.now();
    await saveRoomState(room, 7200);

    const publicRoom = sanitizeRoomState(room);
    const playerSummary: PlayerSummary = {
      id: playerObj.id,
      username: playerObj.username,
      avatar: playerObj.avatar,
      isHost: playerObj.isHost,
      isReady: playerObj.isReady,
      isSpectator: playerObj.isSpectator,
      score: playerObj.score,
      team: playerObj.team,
      connectionStatus: 'connected',
      graceExpiresAt: playerObj.graceExpiresAt,
      joinedAt: playerObj.joinedAt
    };

    // Publish join event and updated room state via Ably Realtime to channel feto:room:${roomCode}
    await publishToRoom(roomCode, 'room:player-joined', playerSummary);
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'room:updated', publicRoom);

    return NextResponse.json({
      success: true,
      data: {
        roomCode,
        playerId,
        sessionToken,
        reconnectToken: sessionToken,
        player: playerSummary,
        room: publicRoom
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/join] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to join room' } },
      { status: 500 }
    );
  }
}
