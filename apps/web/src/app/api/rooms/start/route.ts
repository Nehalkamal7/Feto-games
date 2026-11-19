import { NextRequest, NextResponse } from 'next/server';
import { getRoomState, sanitizeRoomState, saveRoomState } from '@/lib/redis';
import { publishToPlayer, publishToRoom } from '@/lib/ably-server';
import { initGameSession } from '@/lib/game-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = (body.roomCode || '').toUpperCase().trim();
    const playerId = body.playerId ? String(body.playerId).trim() : '';
    const isSoloDevMode = Boolean(body.isSoloDevMode);

    if (!roomCode || !playerId) {
      return NextResponse.json(
        { success: false, error: { message: 'roomCode and playerId are required.' } },
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

    // Verify requester is host
    if (room.hostId !== playerId) {
      return NextResponse.json(
        { success: false, error: { message: 'Only the room host can start the match.' } },
        { status: 403 }
      );
    }

    if (room.status === 'in_game') {
      return NextResponse.json(
        { success: false, error: { message: 'Game match is already in progress.' } },
        { status: 400 }
      );
    }

    // Validate player count: allow 1 player if solo test/dev mode is requested or set in config
    const allowSolo = isSoloDevMode || Boolean((room.config as any).isSoloDevMode);
    const activePlayers = Object.values(room.players || {}).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (activePlayers.length < (allowSolo ? 1 : 2)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: allowSolo
              ? 'At least 1 player is required to start.'
              : 'At least 2 players are required to start (or toggle Solo Test Mode).'
          }
        },
        { status: 400 }
      );
    }

    // Initialize game state (roles, prompts, secret words, canvases)
    const result = initGameSession(room, allowSolo);
    if (result.error) {
      return NextResponse.json(
        { success: false, error: { message: result.error } },
        { status: 400 }
      );
    }

    // Persist to Upstash Redis
    await saveRoomState(result.updatedRoom, 7200);

    // 1. Broadcast 3-second countdown fanfare
    await publishToRoom(roomCode, 'game:starting', { countdownSeconds: 3 });

    // 2. Transmit private roles to individual player channels (prevents cheating)
    if (result.privateRoles) {
      for (const [pId, roleData] of Object.entries(result.privateRoles)) {
        await publishToPlayer(pId, 'game:private_role', roleData);
        await publishToPlayer(pId, 'game:secret-role', roleData);
      }
    }

    const publicRoom = sanitizeRoomState(result.updatedRoom);

    // 3. Broadcast public game state to all players on room channel
    await publishToRoom(roomCode, 'game:state_sync', {
      gameMode: room.config.gameMode,
      state: result.publicState
    });
    await publishToRoom(roomCode, 'room_state_updated', publicRoom);
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'room_state', publicRoom);
    await publishToRoom(roomCode, 'room:updated', publicRoom);

    return NextResponse.json({
      success: true,
      data: {
        room: publicRoom,
        gameState: result.publicState
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/start] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to start game.' } },
      { status: 500 }
    );
  }
}
