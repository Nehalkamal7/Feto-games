import { NextRequest, NextResponse } from 'next/server';
import { acquireLock, getRoomState, sanitizeRoomState, saveRoomState } from '@/lib/redis';
import { publishToPlayer, publishToRoom } from '@/lib/ably-server';
import {
  getPublicGameState,
  handleGameAction,
  initGameSession,
  resolveGamePhase
} from '@/lib/game-engine';
import { PlayerTeam } from '@feto-games/shared-types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roomCode = (body.roomCode || '').toUpperCase().trim();
    const playerId = body.playerId;
    const actionType = body.actionType;
    const payload = body.payload || {};

    if (!roomCode || !actionType) {
      return NextResponse.json(
        { success: false, error: { message: 'roomCode and actionType are required.' } },
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

    // ========================================================
    // 1. LOBBY & PRE-GAME ACTIONS
    // ========================================================

    if (actionType === 'TOGGLE_READY') {
      const player = room.players[playerId];
      if (!player) {
        return NextResponse.json({ success: false, error: { message: 'Player not found in room.' } }, { status: 404 });
      }

      player.isReady = payload.isReady !== undefined ? Boolean(payload.isReady) : !player.isReady;
      room.updatedAt = Date.now();
      await saveRoomState(room);

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room:updated', publicRoom);

      return NextResponse.json({ success: true, room: publicRoom });
    }

    if (actionType === 'UPDATE_SETTINGS') {
      if (room.hostId !== playerId) {
        return NextResponse.json({ success: false, error: { message: 'Only host can update settings.' } }, { status: 403 });
      }

      if (room.status !== 'lobby') {
        return NextResponse.json({ success: false, error: { message: 'Cannot update settings while game is in progress.' } }, { status: 400 });
      }

      const settings = payload;
      if (settings.gameMode) room.config.gameMode = settings.gameMode;
      if (settings.vibeMode) room.config.vibeMode = settings.vibeMode;
      if (settings.roundDurationSeconds) room.config.roundDurationSeconds = Math.max(10, Math.min(120, settings.roundDurationSeconds));
      if (settings.totalRounds) room.config.totalRounds = Math.max(1, Math.min(10, settings.totalRounds));
      if (settings.isTeamMode !== undefined) room.config.isTeamMode = Boolean(settings.isTeamMode);
      if (settings.allowSpectators !== undefined) room.config.allowSpectators = Boolean(settings.allowSpectators);
      if (settings.customDeckId !== undefined) room.config.customDeckId = settings.customDeckId;

      room.updatedAt = Date.now();
      await saveRoomState(room);

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'lobby:settings-updated', publicRoom.config);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room:updated', publicRoom);

      return NextResponse.json({ success: true, room: publicRoom });
    }

    if (actionType === 'SELECT_TEAM') {
      const player = room.players[playerId];
      if (!player) {
        return NextResponse.json({ success: false, error: { message: 'Player not found.' } }, { status: 404 });
      }

      const team = payload.team as PlayerTeam;
      if (team === 'red' || team === 'blue') {
        player.team = team;
        room.updatedAt = Date.now();
        await saveRoomState(room);

        const publicRoom = sanitizeRoomState(room);
        await publishToRoom(roomCode, 'room:state', publicRoom);
        return NextResponse.json({ success: true, room: publicRoom });
      }

      return NextResponse.json({ success: false, error: { message: 'Invalid team.' } }, { status: 400 });
    }

    if (actionType === 'KICK_PLAYER') {
      if (room.hostId !== playerId) {
        return NextResponse.json({ success: false, error: { message: 'Only host can kick players.' } }, { status: 403 });
      }

      const targetPlayerId = payload.targetPlayerId;
      if (!targetPlayerId || targetPlayerId === playerId) {
        return NextResponse.json({ success: false, error: { message: 'Invalid target player.' } }, { status: 400 });
      }

      const target = room.players[targetPlayerId] || room.spectators[targetPlayerId];
      delete room.players[targetPlayerId];
      delete room.spectators[targetPlayerId];

      room.updatedAt = Date.now();
      await saveRoomState(room);

      // Notify kicked player privately
      await publishToPlayer(targetPlayerId, 'room:kicked', {
        reason: payload.reason || 'Removed by host'
      });

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'room:player-left', {
        playerId: targetPlayerId,
        username: target?.username || 'Player'
      });
      await publishToRoom(roomCode, 'room:state', publicRoom);

      return NextResponse.json({ success: true, room: publicRoom });
    }

    if (actionType === 'START_GAME') {
      if (room.hostId !== playerId) {
        return NextResponse.json({ success: false, error: { message: 'Only host can start the game.' } }, { status: 403 });
      }

      if (room.status === 'in_game') {
        return NextResponse.json({ success: false, error: { message: 'Game already in progress.' } }, { status: 400 });
      }

      // Initialize game session
      const result = initGameSession(room);
      if (result.error) {
        return NextResponse.json({ success: false, error: { message: result.error } }, { status: 400 });
      }

      await saveRoomState(result.updatedRoom);

      // Broadcast countdown fanfare
      await publishToRoom(roomCode, 'game:starting', { countdownSeconds: 3 });

      // Send private roles to individual player channels (so imposters/civilians cannot cheat via network inspect)
      if (result.privateRoles) {
        for (const [pId, roleData] of Object.entries(result.privateRoles)) {
          await publishToPlayer(pId, 'game:private_role', roleData);
          await publishToPlayer(pId, 'game:secret-role', roleData);
        }
      }

      // Sync public state to entire room
      const publicRoom = sanitizeRoomState(result.updatedRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'game:state_sync', {
        gameMode: room.config.gameMode,
        state: result.publicState
      });

      return NextResponse.json({
        success: true,
        room: publicRoom,
        gameState: result.publicState
      });
    }

    if (actionType === 'REMATCH') {
      if (room.hostId !== playerId) {
        return NextResponse.json({ success: false, error: { message: 'Only host can trigger rematch.' } }, { status: 403 });
      }

      room.status = 'lobby';
      room.currentRound = 0;
      room.gameData = null;
      if (payload.nextGameMode) {
        room.config.gameMode = payload.nextGameMode;
      }
      for (const p of Object.values(room.players)) {
        p.score = 0;
        p.isReady = p.isHost;
      }

      room.updatedAt = Date.now();
      await saveRoomState(room);

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'room:state', publicRoom);

      return NextResponse.json({ success: true, room: publicRoom });
    }

    if (actionType === 'EMOJI_REACTION') {
      const emoji = payload.emoji || '🔥';
      const player = room.players[playerId] || room.spectators[playerId];

      await publishToRoom(roomCode, 'reaction:incoming', {
        id: `rx_${Date.now()}_${Math.random()}`,
        emoji,
        username: player?.username || 'Player',
        senderId: playerId
      });

      return NextResponse.json({ success: true });
    }

    // ========================================================
    // 2. CLIENT-SIDE COUNTDOWN RESOLUTION WITH IDEMPOTENCY LOCK
    // ========================================================

    if (actionType === 'RESOLVE_PHASE') {
      const round = room.currentRound || 1;
      const currentPhase = room.gameData?.phase || 'default';
      const lockKey = `phase:${roomCode}:${round}:${currentPhase}`;

      // Acquire idempotency lock so only 1 client call resolves the phase when timer hits 0
      const acquired = await acquireLock(lockKey, 6);
      if (!acquired) {
        return NextResponse.json({
          success: true,
          alreadyResolved: true,
          gameState: getPublicGameState(room)
        });
      }

      const result = resolveGamePhase(room);
      await saveRoomState(result.updatedRoom);

      // Publish private roles if new round generated private roles
      if (result.privateRoles) {
        for (const [pId, roleData] of Object.entries(result.privateRoles)) {
          await publishToPlayer(pId, 'game:private_role', roleData);
          await publishToPlayer(pId, 'game:secret-role', roleData);
        }
      }

      const publicRoom = sanitizeRoomState(result.updatedRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'game:phase-change', {
        phase: result.updatedRoom.gameData?.phase || 'round_results',
        round: result.updatedRoom.currentRound,
        totalRounds: result.updatedRoom.config.totalRounds,
        endsAt: result.updatedRoom.gameData?.phaseEndsAt
      });
      await publishToRoom(roomCode, 'game:state_sync', {
        gameMode: room.config.gameMode,
        state: result.publicState
      });

      return NextResponse.json({
        success: true,
        room: publicRoom,
        gameState: result.publicState
      });
    }

    // ========================================================
    // 3. IN-GAME PLAYER ACTIONS
    // ========================================================

    if (room.status !== 'in_game') {
      return NextResponse.json(
        { success: false, error: { message: 'Game is not currently active.' } },
        { status: 400 }
      );
    }

    const actionResult = handleGameAction(room, playerId, actionType, payload);
    if (actionResult.error) {
      return NextResponse.json({ success: false, error: { message: actionResult.error } }, { status: 400 });
    }

    await saveRoomState(actionResult.updatedRoom);

    // If action triggered an explicit broadcast event (e.g. chat guess, word claim)
    if (actionResult.broadcastEvent) {
      await publishToRoom(roomCode, actionResult.broadcastEvent.name, actionResult.broadcastEvent.data);
    }

    // If private roles changed or generated
    if (actionResult.privateRoles) {
      for (const [pId, roleData] of Object.entries(actionResult.privateRoles)) {
        await publishToPlayer(pId, 'game:private_role', roleData);
      }
    }

    // Sync public state to entire room
    const publicRoom = sanitizeRoomState(actionResult.updatedRoom);
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'game:state_sync', {
      gameMode: room.config.gameMode,
      state: actionResult.publicState
    });

    return NextResponse.json({
      success: true,
      room: publicRoom,
      gameState: actionResult.publicState
    });
  } catch (err: any) {
    console.error('❌ [/api/game/action] Error:', err);
    return NextResponse.json(
      { success: false, error: { message: err.message || 'Action dispatch failed.' } },
      { status: 500 }
    );
  }
}
