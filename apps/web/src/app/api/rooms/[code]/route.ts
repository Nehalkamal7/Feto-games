import { NextRequest, NextResponse } from 'next/server';
import { getRoomState, sanitizeRoomState } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const rawCode = params?.code || '';
    const roomCode = rawCode.toUpperCase().trim();

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

    return NextResponse.json({
      success: true,
      room: publicRoom,
      data: {
        room: publicRoom
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
