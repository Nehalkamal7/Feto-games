import { NextRequest, NextResponse } from 'next/server';
import { deleteRoomState, getRoomState, sanitizeRoomState, saveRoomState } from '@/lib/redis';
import { publishToRoom } from '@/lib/ably-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roomCode = (body.roomCode || '').toUpperCase().trim();
    const playerId = body.playerId;

    if (!roomCode || !playerId) {
      return NextResponse.json(
        { success: false, error: { message: 'roomCode and playerId are required.' } },
        { status: 400 }
      );
    }

    const room = await getRoomState(roomCode);
    if (!room) {
      return NextResponse.json({ success: true, message: 'Room already closed.' });
    }

    const leavingPlayer = room.players[playerId] || room.spectators[playerId];
    const username = leavingPlayer?.username || 'Player';

    delete room.players[playerId];
    delete room.spectators[playerId];

    const remainingPlayers = Object.values(room.players);

    // If room has no active players left, delete it completely from Redis and public directory
    if (remainingPlayers.length === 0) {
      await deleteRoomState(roomCode);
      return NextResponse.json({ success: true, message: 'Room closed (empty).' });
    }

    let newHostId: string | undefined;
    // If the host left, migrate host to first available player
    if (room.hostId === playerId && remainingPlayers.length > 0) {
      const nextHost = remainingPlayers[0];
      nextHost.isHost = true;
      room.hostId = nextHost.id;
      newHostId = nextHost.id;

      await publishToRoom(roomCode, 'room:host-migrated', {
        newHostId: nextHost.id,
        previousHostId: playerId,
        newHostUsername: nextHost.username
      });
    }

    room.updatedAt = Date.now();
    await saveRoomState(room, 7200);

    const publicRoom = sanitizeRoomState(room);

    await publishToRoom(roomCode, 'room:player-left', {
      playerId,
      username,
      newHostId
    });
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'room:updated', publicRoom);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ [/api/rooms/leave] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to leave room' } },
      { status: 500 }
    );
  }
}
