import { Server } from 'socket.io';
import { RoomManager } from '../services/roomManager.js';
import { TimerService } from '../services/timerService.js';
import { TokenService } from '../services/tokenService.js';
import { rateLimitEvent } from './middleware.js';
import { nanoid } from 'nanoid';
import {
  ClientToServerEvents,
  CreateRoomDTO,
  InterServerEvents,
  JoinRoomDTO,
  KickPlayerDTO,
  ReconnectDTO,
  SecretRolePayload,
  ServerToClientEvents,
  SetReadyDTO,
  SocketData,
  UpdateRoomSettingsDTO
} from '@feto-games/shared-types';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export const registerLobbyHandlers = (io: TypedServer, socket: any) => {
  /**
   * CREATE ROOM
   */
  socket.on('room:create', async (dto: CreateRoomDTO, callback: (res: any) => void) => {
    try {
      if (!rateLimitEvent(socket.id)) {
        return callback({
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' }
        });
      }

      if (!dto.username || dto.username.trim().length < 2) {
        return callback({
          success: false,
          error: { code: 'INVALID_USERNAME', message: 'Username must be at least 2 characters.' }
        });
      }

      const playerId = socket.data.playerId || `usr_${nanoid(10)}`;

      const { room, reconnectToken, hostPlayer } = await RoomManager.createRoom(
        dto,
        socket.id,
        playerId
      );

      // Bind socket data
      socket.data.playerId = playerId;
      socket.data.roomCode = room.code;
      socket.data.username = hostPlayer.username;
      socket.data.isHost = true;
      socket.data.isSpectator = false;
      socket.data.reconnectToken = reconnectToken;

      await socket.join(room.code);

      const publicState = RoomManager.toPublicState(room);

      callback({
        success: true,
        data: {
          roomCode: room.code,
          reconnectToken,
          player: {
            id: hostPlayer.id,
            username: hostPlayer.username,
            avatar: hostPlayer.avatar,
            isHost: true,
            isReady: true,
            isSpectator: false,
            score: 0,
            connectionStatus: 'connected',
            graceExpiresAt: null,
            joinedAt: hostPlayer.joinedAt
          },
          room: publicState
        }
      });

      // Broadcast fresh room state
      io.to(room.code).emit('room:state', publicState);
      console.log(`🎮 [Room Created] Room ${room.code} created by host ${hostPlayer.username}`);
    } catch (err: any) {
      console.error('❌ Error creating room:', err);
      callback({
        success: false,
        error: { code: 'CREATE_ROOM_FAILED', message: err.message || 'Failed to create room.' }
      });
    }
  });

  /**
   * JOIN ROOM
   */
  socket.on('room:join', async (dto: JoinRoomDTO, callback: (res: any) => void) => {
    try {
      if (!rateLimitEvent(socket.id)) {
        return callback({
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' }
        });
      }

      const roomCode = dto.roomCode.toUpperCase().trim();
      const playerId = socket.data.playerId || `usr_${nanoid(10)}`;

      const { room, player, reconnectToken, isSpectator } = await RoomManager.joinRoom(
        { ...dto, roomCode },
        socket.id,
        playerId
      );

      socket.data.playerId = playerId;
      socket.data.roomCode = room.code;
      socket.data.username = player.username;
      socket.data.isHost = player.isHost;
      socket.data.isSpectator = isSpectator;
      socket.data.reconnectToken = reconnectToken;

      await socket.join(room.code);

      const publicState = RoomManager.toPublicState(room);
      const playerSummary = {
        id: player.id,
        username: player.username,
        avatar: player.avatar,
        isHost: player.isHost,
        isReady: player.isReady,
        isSpectator: player.isSpectator,
        score: player.score,
        connectionStatus: player.connectionStatus,
        graceExpiresAt: null,
        joinedAt: player.joinedAt
      };

      callback({
        success: true,
        data: {
          roomCode: room.code,
          reconnectToken,
          player: playerSummary,
          room: publicState,
          isSpectator
        }
      });

      // Broadcast player joined & updated room state
      socket.to(room.code).emit('room:player-joined', playerSummary);
      io.to(room.code).emit('room:state', publicState);

      console.log(`👥 [Player Joined] ${player.username} joined ${room.code} (${isSpectator ? 'Spectator' : 'Player'})`);
    } catch (err: any) {
      let code = 'JOIN_ROOM_FAILED';
      let message = 'Failed to join room.';

      if (err.message === 'ROOM_NOT_FOUND') {
        code = 'ROOM_NOT_FOUND';
        message = 'Room does not exist or has expired.';
      } else if (err.message === 'PIN_REQUIRED') {
        code = 'PIN_REQUIRED';
        message = 'This private room requires a 4-digit PIN password.';
      } else if (err.message === 'INVALID_PIN') {
        code = 'INVALID_PIN';
        message = 'Incorrect 4-digit PIN password.';
      } else if (err.message === 'ROOM_FULL') {
        code = 'ROOM_FULL';
        message = 'Room is at maximum capacity (15 players).';
      }

      callback({
        success: false,
        error: { code, message }
      });
    }
  });

  /**
   * RECONNECT PLAYER (45-second grace period recovery)
   */
  socket.on('room:reconnect', async (dto: ReconnectDTO, callback: (res: any) => void) => {
    try {
      const payload = TokenService.verifyReconnectToken(dto.reconnectToken);
      if (!payload) {
        return callback({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Reconnection token expired or invalid.' }
        });
      }

      const { playerId, roomCode } = payload;

      // Cancel grace period timer
      TimerService.clearGracePeriod(roomCode, playerId);

      const { room, player } = await RoomManager.reconnectPlayer(playerId, roomCode, socket.id);

      socket.data.playerId = playerId;
      socket.data.roomCode = room.code;
      socket.data.username = player.username;
      socket.data.isHost = player.isHost;
      socket.data.isSpectator = player.isSpectator;
      socket.data.reconnectToken = dto.reconnectToken;

      await socket.join(room.code);

      const publicState = RoomManager.toPublicState(room);
      const playerSummary = {
        id: player.id,
        username: player.username,
        avatar: player.avatar,
        isHost: player.isHost,
        isReady: player.isReady,
        isSpectator: player.isSpectator,
        score: player.score,
        connectionStatus: player.connectionStatus,
        graceExpiresAt: null,
        joinedAt: player.joinedAt
      };

      let secretRolePayload: SecretRolePayload | null = null;
      if (player.secretRole) {
        secretRolePayload = {
          playerId: player.id,
          roleTitle: player.secretRole,
          roleDescription: 'Your persistent secret role.'
        };
      }

      callback({
        success: true,
        data: {
          roomCode: room.code,
          player: playerSummary,
          room: publicState,
          secretRole: secretRolePayload
        }
      });

      // Broadcast reconnected
      socket.to(room.code).emit('room:player-reconnected', playerSummary);
      io.to(room.code).emit('room:state', publicState);

      console.log(`⚡ [Player Reconnected] ${player.username} rejoined ${room.code} with score ${player.score}`);
    } catch (err: any) {
      console.error('❌ Reconnection error:', err.message);
      callback({
        success: false,
        error: { code: 'RECONNECT_FAILED', message: err.message || 'Failed to reconnect.' }
      });
    }
  });

  /**
   * TOGGLE READY STATUS
   */
  socket.on('lobby:set-ready', async (dto: SetReadyDTO, callback?: (res: any) => void) => {
    try {
      const { playerId, roomCode } = socket.data;
      if (!playerId || !roomCode) {
        return callback?.({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Not connected to a room.' }
        });
      }

      const { room } = await RoomManager.setPlayerReady(playerId, roomCode, dto.isReady);
      const publicState = RoomManager.toPublicState(room);

      io.to(roomCode).emit('room:state', publicState);
      callback?.({ success: true, data: undefined });
    } catch (err: any) {
      callback?.({
        success: false,
        error: { code: 'SET_READY_FAILED', message: err.message }
      });
    }
  });

  /**
   * UPDATE ROOM SETTINGS (Host only)
   */
  socket.on('lobby:update-settings', async (dto: UpdateRoomSettingsDTO, callback?: (res: any) => void) => {
    try {
      const { playerId, roomCode, isHost } = socket.data;
      if (!playerId || !roomCode || !isHost) {
        return callback?.({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only the room host can change settings.' }
        });
      }

      const room = await RoomManager.updateSettings(playerId, roomCode, dto);
      const publicState = RoomManager.toPublicState(room);

      io.to(roomCode).emit('lobby:settings-updated', publicState.config);
      io.to(roomCode).emit('room:state', publicState);

      callback?.({ success: true, data: undefined });
    } catch (err: any) {
      callback?.({
        success: false,
        error: { code: 'SETTINGS_UPDATE_FAILED', message: err.message }
      });
    }
  });

  /**
   * KICK PLAYER (Host only)
   */
  socket.on('lobby:kick-player', async (dto: KickPlayerDTO, callback?: (res: any) => void) => {
    try {
      const { playerId, roomCode, isHost } = socket.data;
      if (!playerId || !roomCode || !isHost) {
        return callback?.({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only the room host can kick players.' }
        });
      }

      if (dto.targetPlayerId === playerId) {
        return callback?.({
          success: false,
          error: { code: 'CANNOT_KICK_SELF', message: 'Host cannot kick themselves.' }
        });
      }

      const { room, removedPlayer } = await RoomManager.removePlayer(dto.targetPlayerId, roomCode);

      if (removedPlayer) {
        // Emit kick event to target socket
        io.to(removedPlayer.socketId).emit('room:kicked', {
          reason: dto.reason || 'Kicked by the room host.'
        });

        // Leave target socket from room
        const targetSocket = io.sockets.sockets.get(removedPlayer.socketId);
        if (targetSocket) {
          targetSocket.leave(roomCode);
        }

        io.to(roomCode).emit('room:player-left', {
          playerId: removedPlayer.id,
          username: removedPlayer.username
        });
      }

      if (room) {
        const publicState = RoomManager.toPublicState(room);
        io.to(roomCode).emit('room:state', publicState);
      }

      callback?.({ success: true, data: undefined });
    } catch (err: any) {
      callback?.({
        success: false,
        error: { code: 'KICK_FAILED', message: err.message }
      });
    }
  });

  /**
   * START GAME (Host only, strict server-authoritative state progression)
   */
  socket.on('lobby:start-game', async (callback?: (res: any) => void) => {
    try {
      const { playerId, roomCode, isHost } = socket.data;
      if (!playerId || !roomCode || !isHost) {
        return callback?.({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only the room host can start the game.' }
        });
      }

      const room = await RoomManager.getRoom(roomCode);
      if (!room) {
        return callback?.({
          success: false,
          error: { code: 'ROOM_NOT_FOUND', message: 'Room not found.' }
        });
      }

      const activePlayers = Object.values(room.players).filter(
        (p) => p.connectionStatus === 'connected'
      );

      if (activePlayers.length < 2) {
        return callback?.({
          success: false,
          error: {
            code: 'NOT_ENOUGH_PLAYERS',
            message: 'At least 2 players are required to start.'
          }
        });
      }

      // Check ready status for all non-host players
      const unreadyPlayers = activePlayers.filter((p) => !p.isHost && !p.isReady);
      if (unreadyPlayers.length > 0) {
        return callback?.({
          success: false,
          error: {
            code: 'PLAYERS_NOT_READY',
            message: `Waiting on ${unreadyPlayers.map((p) => p.username).join(', ')} to be ready.`
          }
        });
      }

      // Server-authoritative start sequence: Countdown (3 seconds)
      room.status = 'countdown';
      room.currentRound = 1;
      await RoomManager.saveRoomState(room);

      io.to(roomCode).emit('room:state', RoomManager.toPublicState(room));
      io.to(roomCode).emit('game:starting', { countdownSeconds: 3 });

      callback?.({ success: true, data: undefined });

      // Run 3-second server countdown then launch Round 1
      setTimeout(async () => {
        const freshRoom = await RoomManager.getRoom(roomCode);
        if (!freshRoom) return;

        freshRoom.status = 'in_game';

        // Server-authoritative secret role distribution
        const playerList = Object.values(freshRoom.players);
        const imposterIndex = Math.floor(Math.random() * playerList.length);

        playerList.forEach((player, index) => {
          const isImposter = index === imposterIndex;
          const roleTitle = isImposter ? 'The Glitch Infiltrator' : 'Neon Operative';
          player.secretRole = roleTitle;

          // Emit secret role individually to this socket only
          const targetSocket = io.sockets.sockets.get(player.socketId);
          if (targetSocket) {
            targetSocket.emit('game:secret-role', {
              playerId: player.id,
              roleTitle,
              roleDescription: isImposter
                ? 'Blend in, give believable answers, and do not get voted out!'
                : 'Identify the imposter before the round expires.',
              isImposter,
              team: isImposter ? 'imposters' : 'civilians'
            });
          }
        });

        await RoomManager.saveRoomState(freshRoom);
        io.to(roomCode).emit('room:state', RoomManager.toPublicState(freshRoom));

        // Start Round 1 question prompt phase
        const roundDuration = freshRoom.config.roundDurationSeconds || 30;
        io.to(roomCode).emit('game:phase-change', {
          phase: 'question_prompt',
          currentRound: 1,
          totalRounds: freshRoom.config.totalRounds,
          durationSeconds: roundDuration,
          prompt: {
            id: `prompt_${nanoid(8)}`,
            question: 'What is the most chaotic thing you could do in a virtual reality simulator?',
            category: 'Creative Mayhem'
          }
        });

        // Start server timer with 1s ticks
        TimerService.startRoundTimer(
          io,
          roomCode,
          roundDuration,
          'question_prompt',
          1,
          async () => {
            console.log(`⏰ Round 1 question time expired for room ${roomCode}`);
            // Advance to voting phase
            io.to(roomCode).emit('game:phase-change', {
              phase: 'player_voting',
              currentRound: 1,
              totalRounds: freshRoom.config.totalRounds,
              durationSeconds: 20
            });
          }
        );
      }, 3000);
    } catch (err: any) {
      console.error('❌ Error starting game:', err);
      callback?.({
        success: false,
        error: { code: 'START_GAME_FAILED', message: err.message }
      });
    }
  });

  /**
   * LEAVE ROOM EXPLICITLY
   */
  socket.on('room:leave', async (callback?: (res: any) => void) => {
    try {
      const { playerId, roomCode } = socket.data;
      if (!playerId || !roomCode) {
        return callback?.({ success: true, data: undefined });
      }

      const { room, removedPlayer, newHostId } = await RoomManager.removePlayer(playerId, roomCode);
      await socket.leave(roomCode);

      socket.data.roomCode = '';
      socket.data.isHost = false;

      if (removedPlayer) {
        io.to(roomCode).emit('room:player-left', {
          playerId: removedPlayer.id,
          username: removedPlayer.username,
          newHostId: newHostId || undefined
        });
      }

      if (room) {
        if (newHostId) {
          const newHost = room.players[newHostId];
          if (newHost) {
            io.to(roomCode).emit('room:host-migrated', {
              newHostId: newHost.id,
              previousHostId: playerId,
              newHostUsername: newHost.username
            });
          }
        }
        io.to(roomCode).emit('room:state', RoomManager.toPublicState(room));
      }

      callback?.({ success: true, data: undefined });
    } catch (err: any) {
      callback?.({
        success: false,
        error: { code: 'LEAVE_FAILED', message: err.message }
      });
    }
  });

  /**
   * PING / LATENCY CHECK
   */
  socket.on('ping:latency', (_data: any, callback: (res: any) => void) => {
    callback({ pong: Date.now() });
  });
};
