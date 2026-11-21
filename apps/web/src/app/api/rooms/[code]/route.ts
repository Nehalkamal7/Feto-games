import { NextRequest, NextResponse } from 'next/server';
import { getRoomState, normalizeRoomCode, sanitizeRoomState } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const rawCode = params?.code || '';
    const roomCode = normalizeRoomCode(rawCode);

    if (!roomCode) {
      return NextResponse.json(
        { success: false, error: { message: 'Room code is required.' } },
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

    const publicRoom = sanitizeRoomState(room);
    const playerId = req.nextUrl.searchParams.get('playerId');
    const privateRole = playerId && room.gameData?.privateRoles ? room.gameData.privateRoles[playerId] || null : null;

    return NextResponse.json({
      success: true,
      room: publicRoom,
      privateRole,
      data: {
        room: publicRoom,
        privateRole
      }
    });
  } catch (err: any) {
    console.error(`❌ [GET /api/rooms/${params?.code}] Error:`, err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to fetch room state.' } },
      { status: 500 }
    );
  }
}
