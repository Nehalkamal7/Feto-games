import { NextRequest, NextResponse } from 'next/server';
import {
  acquireLock,
  addPublicRoomDirectory,
  getRoomState,
  removePublicRoomDirectory,
  sanitizeRoomState,
  saveRoomState
} from '@/lib/redis';
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
      await saveRoomState(room, 7200);

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'room:updated', publicRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room_state', publicRoom);

      return NextResponse.json({ success: true, room: publicRoom });
    }

    if (actionType === 'SELECT_GAMES') {
      if (room.hostId !== playerId) {
        return NextResponse.json({ success: false, error: { message: 'Only host can select game playlist.' } }, { status: 403 });
      }

      if (room.status !== 'lobby') {
        return NextResponse.json({ success: false, error: { message: 'Cannot change games while match is active.' } }, { status: 400 });
      }

      const selectedGames = Array.isArray(payload.selectedGames) ? payload.selectedGames : [payload.gameMode || 'who_is_imposter'];
      if (selectedGames.length === 0) {
        return NextResponse.json({ success: false, error: { message: 'At least one game must be selected.' } }, { status: 400 });
      }

      room.selectedGames = selectedGames;
      room.currentGameIndex = 0;
      room.config.selectedGames = selectedGames;
      room.config.gameMode = selectedGames[0];
      room.updatedAt = Date.now();
      await saveRoomState(room, 7200);

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'room:updated', publicRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room_state', publicRoom);

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
      if (settings.roomName !== undefined) {
        room.roomName = String(settings.roomName).trim().slice(0, 30);
        room.config.roomName = room.roomName;
      }
      if (settings.gameMode) room.config.gameMode = settings.gameMode;
      if (settings.selectedGames && Array.isArray(settings.selectedGames)) {
        room.selectedGames = settings.selectedGames;
        room.config.selectedGames = settings.selectedGames;
        if (settings.selectedGames[0]) room.config.gameMode = settings.selectedGames[0];
      }
      if (settings.vibeMode) room.config.vibeMode = settings.vibeMode;
      if (settings.roundDurationSeconds) room.config.roundDurationSeconds = Math.max(10, Math.min(180, settings.roundDurationSeconds));
      if (settings.totalRounds) room.config.totalRounds = Math.max(1, Math.min(15, settings.totalRounds));
      if (settings.maxPlayers) room.config.maxPlayers = Math.max(2, Math.min(15, settings.maxPlayers));
      if (settings.isTeamMode !== undefined) room.config.isTeamMode = Boolean(settings.isTeamMode);
      if (settings.allowSpectators !== undefined) room.config.allowSpectators = Boolean(settings.allowSpectators);
      if (settings.isPrivate !== undefined) {
        room.config.isPrivate = Boolean(settings.isPrivate);
        if (room.config.isPrivate) {
          await removePublicRoomDirectory(roomCode);
        } else if (room.status === 'lobby' && Object.keys(room.players).length < (room.config.maxPlayers || 15)) {
          await addPublicRoomDirectory(room.code);
        }
      }
      if (settings.pin !== undefined) {
        const pinStr = String(settings.pin).trim();
        if (pinStr) {
          room.config.hasPin = true;
          room.config.pinHash = pinStr;
        } else {
          room.config.hasPin = false;
          room.config.pinHash = undefined;
        }
      }
      if (settings.customDeckId !== undefined) room.config.customDeckId = settings.customDeckId;
      if (settings.isSoloDevMode !== undefined) (room.config as any).isSoloDevMode = Boolean(settings.isSoloDevMode);

      room.updatedAt = Date.now();
      room.lastActivityAt = Date.now();
      await saveRoomState(room, 7200);

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'lobby:settings-updated', publicRoom.config);
      await publishToRoom(roomCode, 'room:updated', publicRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room_state', publicRoom);

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
        await saveRoomState(room, 7200);

        const publicRoom = sanitizeRoomState(room);
        await publishToRoom(roomCode, 'room:updated', publicRoom);
        await publishToRoom(roomCode, 'room:state', publicRoom);
        await publishToRoom(roomCode, 'room_state', publicRoom);
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
      await saveRoomState(room, 7200);

      // Notify kicked player privately
      await publishToPlayer(targetPlayerId, 'room:kicked', {
        reason: payload.reason || 'Removed by host'
      });

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'room:player-left', {
        playerId: targetPlayerId,
        username: target?.username || 'Player'
      });
      await publishToRoom(roomCode, 'room:updated', publicRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room_state', publicRoom);

      return NextResponse.json({ success: true, room: publicRoom });
    }

    if (actionType === 'START_GAME' || actionType === 'FORCE_START') {
      if (room.hostId !== playerId) {
        return NextResponse.json({ success: false, error: { message: 'Only host can start the game.' } }, { status: 403 });
      }

      if (room.status === 'in_game' || room.status === 'playing') {
        return NextResponse.json({ success: false, error: { message: 'Game already in progress.' } }, { status: 400 });
      }

      // Check for multi-game playlist initialization
      if (room.selectedGames && room.selectedGames.length > 0) {
        room.currentGameIndex = 0;
        room.config.gameMode = room.selectedGames[0];
      }

      // Check player count (allow solo if force or solo test mode enabled)
      const allowSolo = Boolean(payload?.force) || Boolean(payload?.isSoloDevMode) || Boolean((room.config as any)?.isSoloDevMode) || actionType === 'FORCE_START';
      const activePlayers = Object.values(room.players || {}).filter(
        (p) => p.connectionStatus === 'connected'
      );

      if (activePlayers.length < (allowSolo ? 1 : 2)) {
        return NextResponse.json(
          { success: false, error: { message: 'At least 2 players are required to start.' } },
          { status: 400 }
        );
      }

      // Synchronously initialize game session and round data
      const result = initGameSession(room, allowSolo);
      if (result.error) {
        return NextResponse.json({ success: false, error: { message: result.error } }, { status: 400 });
      }

      // Set playing status, round counters, and activity timestamps
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

      // Parallelize Redis persistence and public room eviction
      const redisPromises = [
        saveRoomState(result.updatedRoom, 7200),
        removePublicRoomDirectory(roomCode)
      ];

      // Parallelize all Ably channel dispatches
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

      // Execute all async operations concurrently
      await Promise.all([...redisPromises, ...publishPromises]);

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
      room.lastActivityAt = Date.now();
      await saveRoomState(room, 7200);

      if (!room.config.isPrivate && Object.keys(room.players).length < (room.config.maxPlayers || 15)) {
        await addPublicRoomDirectory(room.code);
      }

      const publicRoom = sanitizeRoomState(room);
      await publishToRoom(roomCode, 'room:updated', publicRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room_state', publicRoom);

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
      const isGameOver = result.updatedRoom.status === 'game_over' || (result.updatedRoom.status as string) === 'finished';
      if (isGameOver) {
        await removePublicRoomDirectory(roomCode);
        await saveRoomState(result.updatedRoom, 300);
      } else {
        await saveRoomState(result.updatedRoom, 7200);
      }

      // Publish private roles if new round generated private roles
      if (result.privateRoles) {
        for (const [pId, roleData] of Object.entries(result.privateRoles)) {
          await publishToPlayer(pId, 'game:private_role', roleData);
          await publishToPlayer(pId, 'game:secret-role', roleData);
        }
      }

      const publicRoom = sanitizeRoomState(result.updatedRoom);
      await publishToRoom(roomCode, 'room:updated', publicRoom);
      await publishToRoom(roomCode, 'room:state', publicRoom);
      await publishToRoom(roomCode, 'room_state', publicRoom);
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

    if (room.status !== 'in_game' && room.status !== 'playing') {
      return NextResponse.json(
        { success: false, error: { message: 'Game is not currently active.' } },
        { status: 400 }
      );
    }

    const actionResult = handleGameAction(room, playerId, actionType, payload);
    if (actionResult.error) {
      return NextResponse.json({ success: false, error: { message: actionResult.error } }, { status: 400 });
    }

    const isGameOver = actionResult.updatedRoom.status === 'game_over' || (actionResult.updatedRoom.status as string) === 'finished';
    if (isGameOver) {
      await removePublicRoomDirectory(roomCode);
      await saveRoomState(actionResult.updatedRoom, 300);
    } else {
      await saveRoomState(actionResult.updatedRoom, 7200);
    }

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
    await publishToRoom(roomCode, 'room:updated', publicRoom);
    await publishToRoom(roomCode, 'room:state', publicRoom);
    await publishToRoom(roomCode, 'room_state', publicRoom);
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
