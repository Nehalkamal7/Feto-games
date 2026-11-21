import { NextRequest, NextResponse } from 'next/server';
import { getRoomState, normalizeRoomCode, removePublicRoomDirectory, sanitizeRoomState, saveRoomState } from '@/lib/redis';
import { publishToPlayer, publishToRoom } from '@/lib/ably-server';
import { initGameSession } from '@/lib/game-engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = normalizeRoomCode(body.roomCode || '');
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

    if (room.status === 'in_game' || room.status === 'playing') {
      return NextResponse.json(
        { success: false, error: { message: 'Game match is already in progress.' } },
        { status: 400 }
      );
    }

    // Validate player count: allow 1 player if solo test/dev mode is requested or set in config
    const allowSolo = isSoloDevMode || Boolean((room.config as any).isSoloDevMode) || Boolean(body.force);
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

    const now = Date.now();
    result.updatedRoom.status = 'playing';
    result.updatedRoom.currentGameIndex = 0;
    result.updatedRoom.currentRound = 1;
    result.updatedRoom.phase = result.publicState?.phase || 'active';
    result.updatedRoom.lastActivityAt = now;
    result.updatedRoom.updatedAt = now;

    const publicRoom = sanitizeRoomState(result.updatedRoom);
    publicRoom.status = 'playing';
    publicRoom.gameState = result.publicState;
    publicRoom.gameData = result.publicState;

    // Parallelize Redis operations
    const redisPromises = [
      saveRoomState(result.updatedRoom, 7200),
      removePublicRoomDirectory(roomCode)
    ];

    // Parallelize Ably broadcasts
    const publishPromises: Promise<any>[] = [
      publishToRoom(roomCode, 'room:updated', publicRoom),
      publishToRoom(roomCode, 'room:state', publicRoom),
      publishToRoom(roomCode, 'room_state', publicRoom),
      publishToRoom(roomCode, 'game:started', {
        room: publicRoom,
        gameMode: result.updatedRoom.config.gameMode,
        gameState: result.publicState
      }),
      publishToRoom(roomCode, 'game:state_sync', {
        gameMode: result.updatedRoom.config.gameMode,
        state: result.publicState
      })
    ];

    if (result.privateRoles) {
      for (const [pId, roleData] of Object.entries(result.privateRoles)) {
        publishPromises.push(publishToPlayer(pId, 'game:private_role', roleData));
        publishPromises.push(publishToPlayer(pId, 'game:secret-role', roleData));
      }
    }

    await Promise.all([...redisPromises, ...publishPromises]);

    const requesterRole = result.privateRoles?.[playerId] || result.updatedRoom.gameData?.privateRoles?.[playerId] || null;

    return NextResponse.json({
      success: true,
      room: publicRoom,
      gameState: result.publicState,
      privateRole: requesterRole,
      data: {
        room: publicRoom,
        gameState: result.publicState,
        privateRole: requesterRole
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
