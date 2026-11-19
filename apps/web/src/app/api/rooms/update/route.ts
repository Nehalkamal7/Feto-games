import { NextRequest, NextResponse } from 'next/server';
import { getRoomState, sanitizeRoomState, saveRoomState } from '@/lib/redis';
import { publishToRoom } from '@/lib/ably-server';
import { GameMode, PlayerTeam } from '@feto-games/shared-types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const roomCode = (body.roomCode || '').toUpperCase().trim();
    const playerId = body.playerId ? String(body.playerId).trim() : '';
    const settings = body.settings || body;

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
        { success: false, error: { message: 'Only the room host can modify match settings.' } },
        { status: 403 }
      );
    }

    if (room.status !== 'lobby') {
      return NextResponse.json(
        { success: false, error: { message: 'Cannot modify settings while a game is active.' } },
        { status: 400 }
      );
    }

    // 1. Game Mode / Selected Game
    const targetGame = settings.gameMode || settings.selectedGame;
    if (targetGame) {
      room.config.gameMode = targetGame as GameMode;
    }

    // 2. Team Mode (Solo vs Teams)
    if (settings.isTeamMode !== undefined || settings.mode !== undefined) {
      const isTeam = settings.isTeamMode !== undefined
        ? Boolean(settings.isTeamMode)
        : settings.mode === 'teams';

      room.config.isTeamMode = isTeam;

      // When teams is active, auto-assign players without teams evenly
      if (isTeam && room.players) {
        const players = Object.values(room.players);
        players.forEach((p, idx) => {
          if (!p.team) {
            p.team = (idx % 2 === 0 ? 'blue' : 'red') as PlayerTeam;
          }
        });
      }
    }

    // 3. Rounds, Timers, Max Players
    if (settings.totalRounds !== undefined) {
      room.config.totalRounds = Math.max(1, Math.min(15, Number(settings.totalRounds)));
    }

    if (settings.roundDurationSeconds !== undefined) {
      room.config.roundDurationSeconds = Math.max(10, Math.min(180, Number(settings.roundDurationSeconds)));
    }

    if (settings.maxPlayers !== undefined) {
      room.config.maxPlayers = Math.max(2, Math.min(15, Number(settings.maxPlayers)));
    }

    // 4. Vibe Mode & Solo Dev Mode
    if (settings.vibeMode !== undefined) {
      room.config.vibeMode = settings.vibeMode;
    }

    if (settings.isSoloDevMode !== undefined) {
      (room.config as any).isSoloDevMode = Boolean(settings.isSoloDevMode);
    }

    if (settings.allowSpectators !== undefined) {
      room.config.allowSpectators = Boolean(settings.allowSpectators);
    }

    if (settings.customDeckId !== undefined) {
      room.config.customDeckId = settings.customDeckId;
    }

    room.updatedAt = Date.now();
    await saveRoomState(room, 7200);

    const publicRoom = sanitizeRoomState(room);

    // Broadcast live to all connected players over Ably channel
    await publishToRoom(roomCode, 'room_state_updated', publicRoom);
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'room_state', publicRoom);
    await publishToRoom(roomCode, 'room:updated', publicRoom);
    await publishToRoom(roomCode, 'lobby:settings-updated', publicRoom.config);

    return NextResponse.json({
      success: true,
      data: {
        room: publicRoom,
        config: publicRoom.config
      }
    });
  } catch (err: any) {
    console.error('❌ [/api/rooms/update] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Failed to update room settings.' } },
      { status: 500 }
    );
  }
}
