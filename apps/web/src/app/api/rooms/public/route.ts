import { NextResponse } from 'next/server';
import { getPublicRoomDirectory } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rooms = await getPublicRoomDirectory();
    return NextResponse.json({
      success: true,
      data: {
        rooms,
        total: rooms.length
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/public] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to list public rooms' } },
      { status: 500 }
    );
  }
}
