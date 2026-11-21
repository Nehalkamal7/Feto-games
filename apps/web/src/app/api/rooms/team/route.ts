import { NextRequest, NextResponse } from 'next/server';
import { getRoomState, normalizeRoomCode, sanitizeRoomState, saveRoomState } from '@/lib/redis';
import { publishToRoom } from '@/lib/ably-server';
import { PlayerTeam } from '@feto-games/shared-types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = normalizeRoomCode(body.roomCode || '');
    const playerId = body.playerId ? String(body.playerId).trim() : '';
    const rawTeam = body.team ? String(body.team).toLowerCase().trim() : '';

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

    const player = room.players[playerId];
    if (!player) {
      return NextResponse.json(
        { success: false, error: { message: 'Player not found in room.' } },
        { status: 404 }
      );
    }

    let targetTeam: PlayerTeam = 'blue';
    if (rawTeam === 'red' || rawTeam === 'b' || rawTeam === 'team_b') {
      targetTeam = 'red';
    } else if (rawTeam === 'green' || rawTeam === 'c') {
      targetTeam = 'green';
    } else {
      targetTeam = 'blue';
    }

    // Toggle if no specific target requested
    if (!rawTeam) {
      targetTeam = player.team === 'blue' ? 'red' : 'blue';
    }

    player.team = targetTeam;
    room.updatedAt = Date.now();
    room.lastActivityAt = Date.now();
    await saveRoomState(room, 7200);

    const publicRoom = sanitizeRoomState(room);

    await publishToRoom(roomCode, 'room_state_updated', publicRoom);
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'room_state', publicRoom);
    await publishToRoom(roomCode, 'room:updated', publicRoom);

    return NextResponse.json({
      success: true,
      data: {
        room: publicRoom,
        player
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/team] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to switch team.' } },
      { status: 500 }
    );
  }
}
