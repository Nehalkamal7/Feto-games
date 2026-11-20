import { NextRequest, NextResponse } from 'next/server';
import { getRoomState, removePlayerFromRoomHash, sanitizeRoomState, saveRoomState } from '@/lib/redis';
import { publishToPlayer, publishToRoom } from '@/lib/ably-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = (body.roomCode || '').toUpperCase().trim();
    const playerId = body.playerId ? String(body.playerId).trim() : '';
    const targetPlayerId = body.targetPlayerId ? String(body.targetPlayerId).trim() : '';
    const reason = body.reason || 'You were removed from the room by the host.';

    if (!roomCode || !playerId || !targetPlayerId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'roomCode, playerId (host), and targetPlayerId are required.' }
        },
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

    // 1. Verify the requester's playerId matches the room's hostId in Upstash Redis
    if (room.hostId !== playerId) {
      return NextResponse.json(
        { success: false, error: { message: 'Only the room host can kick players.' } },
        { status: 403 }
      );
    }

    // Host cannot kick themselves
    if (targetPlayerId === room.hostId) {
      return NextResponse.json(
        { success: false, error: { message: 'Host cannot kick themselves from the room.' } },
        { status: 400 }
      );
    }

    const targetPlayer = room.players[targetPlayerId] || room.spectators[targetPlayerId];
    const targetUsername = targetPlayer?.username || 'Player';

    // 2. Remove target player from Upstash Redis (Hash HDEL + roomState delete)
    await removePlayerFromRoomHash(roomCode, targetPlayerId);
    delete room.players[targetPlayerId];
    delete room.spectators[targetPlayerId];

    room.updatedAt = Date.now();
    room.lastActivityAt = Date.now();
    await saveRoomState(room, 7200);

    const publicRoom = sanitizeRoomState(room);

    // 3. Publish Ably real-time events to channel feto:room:${roomCode}
    // a. `player_kicked` with { targetPlayerId }
    await publishToRoom(roomCode, 'player_kicked', {
      targetPlayerId,
      roomCode,
      reason
    });

    // b. Updated `room_state` event (plus compatibility events)
    await publishToRoom(roomCode, 'room_state', publicRoom);
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'room:updated', publicRoom);
    await publishToRoom(roomCode, 'room:player-left', {
      playerId: targetPlayerId,
      username: targetUsername
    });

    // c. Direct private event to kicked player channel
    await publishToPlayer(targetPlayerId, 'room:kicked', {
      reason,
      roomCode
    });

    return NextResponse.json({
      success: true,
      data: {
        kickedPlayerId: targetPlayerId,
        room: publicRoom
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/kick] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to kick player.' } },
      { status: 500 }
    );
  }
}
