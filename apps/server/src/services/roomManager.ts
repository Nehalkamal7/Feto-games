import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';
import { TokenService } from './tokenService.js';
import {
  CreateRoomDTO,
  JoinRoomDTO,
  Player,
  PlayerSummary,
  PublicRoomConfig,
  PublicRoomDirectoryItem,
  PublicRoomState,
  RoomConfig,
  RoomState,
  UpdateRoomSettingsDTO
} from '@feto-games/shared-types';

export class RoomManager {
  private static readonly ROOM_PREFIX = 'feto:room:';
  private static readonly PLAYER_LOOKUP_PREFIX = 'feto:player:';
  private static readonly PUBLIC_ROOMS_SET = 'feto:public_rooms';

  /**
   * Creates a new multiplayer room in Redis.
   */
  public static async createRoom(
    dto: CreateRoomDTO,
    socketId: string,
    playerId: string,
    userId?: string | null
  ): Promise<{ room: RoomState; reconnectToken: string; hostPlayer: Player }> {
    let roomCode = TokenService.generateRoomCode();
    let exists = await redisClient.exists(`${this.ROOM_PREFIX}${roomCode}`);

    // Collision retry loop
    while (exists) {
      roomCode = TokenService.generateRoomCode();
      exists = await redisClient.exists(`${this.ROOM_PREFIX}${roomCode}`);
    }

    const hasPin = Boolean(dto.pin && dto.pin.trim().length === 4);
    let pinHash: string | undefined;

    if (hasPin && dto.pin) {
      pinHash = await TokenService.hashPin(dto.pin.trim());
    }

    const maxPlayers = Math.min(Math.max(dto.maxPlayers || env.MAX_PLAYERS_PER_ROOM, 2), 15);

    const config: RoomConfig = {
      maxPlayers,
      isPrivate: dto.isPrivate ?? false,
      hasPin,
      pinHash,
      roundDurationSeconds: dto.roundDurationSeconds || 30,
      totalRounds: dto.totalRounds || 5,
      gameMode: dto.gameMode || 'party_trivia',
      allowSpectators: dto.allowSpectators ?? true,
      isTeamMode: dto.isTeamMode ?? false
    };

    const hostPlayer: Player = {
      id: playerId,
      socketId,
      username: dto.username.trim().slice(0, 20),
      avatar: dto.avatar,
      isHost: true,
      isReady: true, // Host is ready by default
      isSpectator: false,
      score: 0,
      joinedAt: Date.now(),
      connectionStatus: 'connected',
      disconnectedAt: null,
      graceExpiresAt: null,
      secretRole: null,
      isGuest: !userId,
      userId: userId || null
    };

    const roomState: RoomState = {
      code: roomCode,
      hostId: playerId,
      status: 'lobby',
      config,
      players: { [playerId]: hostPlayer },
      spectators: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentRound: 0
    };

    // Store in Redis with TTL (idle room timeout: 30 minutes)
    await this.saveRoomState(roomState);
    await redisClient.set(`${this.PLAYER_LOOKUP_PREFIX}${playerId}`, roomCode, 'EX', env.ROOM_IDLE_TIMEOUT_SECONDS);

    if (!config.isPrivate) {
      await redisClient.sadd(this.PUBLIC_ROOMS_SET, roomCode);
    }

    const reconnectToken = TokenService.generateReconnectToken({
      playerId,
      roomCode,
      username: hostPlayer.username,
      isHost: true,
      avatar: hostPlayer.avatar
    });

    return { room: roomState, reconnectToken, hostPlayer };
  }

  /**
   * Joins an existing room either as an active player or spectator.
   */
  public static async joinRoom(
    dto: JoinRoomDTO,
    socketId: string,
    playerId: string,
    userId?: string | null
  ): Promise<{
    room: RoomState;
    player: Player;
    reconnectToken: string;
    isSpectator: boolean;
  }> {
    const room = await this.getRoom(dto.roomCode.toUpperCase().trim());
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    // Verify PIN if required
    if (room.config.hasPin && room.config.pinHash) {
      if (!dto.pin) {
        throw new Error('PIN_REQUIRED');
      }
      const isValid = await TokenService.verifyPin(dto.pin.trim(), room.config.pinHash);
      if (!isValid) {
        throw new Error('INVALID_PIN');
      }
    }

    // Check if player is already registered in the room (e.g. rapid re-entry)
    const existingPlayer = room.players[playerId];
    if (existingPlayer) {
      existingPlayer.socketId = socketId;
      existingPlayer.connectionStatus = 'connected';
      existingPlayer.disconnectedAt = null;
      existingPlayer.graceExpiresAt = null;
      room.updatedAt = Date.now();
      await this.saveRoomState(room);

      const reconnectToken = TokenService.generateReconnectToken({
        playerId,
        roomCode: room.code,
        username: existingPlayer.username,
        isHost: existingPlayer.isHost,
        avatar: existingPlayer.avatar
      });

      return { room, player: existingPlayer, reconnectToken, isSpectator: false };
    }

    // Check active players count
    const activePlayerCount = Object.keys(room.players).length;
    const isGameInProgress = room.status !== 'lobby';
    const isRoomFull = activePlayerCount >= room.config.maxPlayers;

    let asSpectator = false;
    if (isGameInProgress || isRoomFull) {
      if (!room.config.allowSpectators) {
        throw new Error(isRoomFull ? 'ROOM_FULL' : 'GAME_IN_PROGRESS');
      }
      asSpectator = true;
    }

    const newPlayer: Player = {
      id: playerId,
      socketId,
      username: dto.username.trim().slice(0, 20),
      avatar: dto.avatar,
      isHost: false,
      isReady: false,
      isSpectator: asSpectator,
      score: 0,
      joinedAt: Date.now(),
      connectionStatus: 'connected',
      disconnectedAt: null,
      graceExpiresAt: null,
      secretRole: null,
      isGuest: !userId,
      userId: userId || null
    };

    if (asSpectator) {
      room.spectators[playerId] = newPlayer;
    } else {
      room.players[playerId] = newPlayer;
    }

    room.updatedAt = Date.now();
    await this.saveRoomState(room);
    await redisClient.set(`${this.PLAYER_LOOKUP_PREFIX}${playerId}`, room.code, 'EX', env.ROOM_IDLE_TIMEOUT_SECONDS);

    const reconnectToken = TokenService.generateReconnectToken({
      playerId,
      roomCode: room.code,
      username: newPlayer.username,
      isHost: false,
      avatar: newPlayer.avatar
    });

    return { room, player: newPlayer, reconnectToken, isSpectator: asSpectator };
  }

  /**
   * Reconnects an existing player using their signed session token.
   * Restores exact score, secret role, and status within the 45s grace period.
   */
  public static async reconnectPlayer(
    playerId: string,
    roomCode: string,
    socketId: string
  ): Promise<{ room: RoomState; player: Player }> {
    const room = await this.getRoom(roomCode);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    const player = room.players[playerId] || room.spectators[playerId];
    if (!player) {
      throw new Error('PLAYER_NOT_IN_ROOM');
    }

    // Restore connection
    player.socketId = socketId;
    player.connectionStatus = 'connected';
    player.disconnectedAt = null;
    player.graceExpiresAt = null;

    room.updatedAt = Date.now();
    await this.saveRoomState(room);
    await redisClient.set(`${this.PLAYER_LOOKUP_PREFIX}${playerId}`, room.code, 'EX', env.ROOM_IDLE_TIMEOUT_SECONDS);

    return { room, player };
  }

  /**
   * Handles player disconnect. Starts 45-second grace period.
   */
  public static async handlePlayerDisconnect(
    playerId: string,
    roomCode: string
  ): Promise<{ room: RoomState; player: Player; graceExpiresAt: number } | null> {
    const room = await this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players[playerId] || room.spectators[playerId];
    if (!player) return null;

    const now = Date.now();
    const graceExpiresAt = now + env.GRACE_PERIOD_SECONDS * 1000;

    player.connectionStatus = 'disconnected_grace';
    player.disconnectedAt = now;
    player.graceExpiresAt = graceExpiresAt;

    room.updatedAt = now;
    await this.saveRoomState(room);

    return { room, player, graceExpiresAt };
  }

  /**
   * Permanently removes a player after grace period expiry or explicit leave/kick.
   * Performs automatic host migration if the leaving player was the host.
   */
  public static async removePlayer(
    playerId: string,
    roomCode: string
  ): Promise<{
    room: RoomState | null;
    removedPlayer: Player | null;
    newHostId: string | null;
  }> {
    const room = await this.getRoom(roomCode);
    if (!room) return { room: null, removedPlayer: null, newHostId: null };

    const wasHost = room.hostId === playerId;
    const removedPlayer = room.players[playerId] || room.spectators[playerId] || null;

    delete room.players[playerId];
    delete room.spectators[playerId];
    await redisClient.del(`${this.PLAYER_LOOKUP_PREFIX}${playerId}`);

    const remainingActivePlayers = Object.values(room.players).filter(
      (p) => p.connectionStatus === 'connected'
    );
    const anyRemainingPlayers = Object.keys(room.players).length > 0;

    let newHostId: string | null = null;

    if (!anyRemainingPlayers && Object.keys(room.spectators).length === 0) {
      // Room is empty - clean up Redis
      await this.deleteRoom(roomCode);
      return { room: null, removedPlayer, newHostId: null };
    }

    if (wasHost && anyRemainingPlayers) {
      // Automatic host migration: select the oldest joined active player
      const nextHost =
        remainingActivePlayers.sort((a, b) => a.joinedAt - b.joinedAt)[0] ||
        Object.values(room.players).sort((a, b) => a.joinedAt - b.joinedAt)[0];

      if (nextHost) {
        nextHost.isHost = true;
        nextHost.isReady = true;
        room.hostId = nextHost.id;
        newHostId = nextHost.id;
      }
    }

    room.updatedAt = Date.now();
    await this.saveRoomState(room);

    return { room, removedPlayer, newHostId };
  }

  /**
   * Sets player ready status in lobby.
   */
  public static async setPlayerReady(
    playerId: string,
    roomCode: string,
    isReady: boolean
  ): Promise<{ room: RoomState; player: Player }> {
    const room = await this.getRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const player = room.players[playerId];
    if (!player) throw new Error('PLAYER_NOT_IN_ROOM');

    player.isReady = isReady;
    room.updatedAt = Date.now();
    await this.saveRoomState(room);

    return { room, player };
  }

  /**
   * Updates room settings (host only).
   */
  public static async updateSettings(
    hostId: string,
    roomCode: string,
    dto: UpdateRoomSettingsDTO
  ): Promise<RoomState> {
    const room = await this.getRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.hostId !== hostId) throw new Error('NOT_HOST');

    if (dto.maxPlayers !== undefined) {
      room.config.maxPlayers = Math.min(Math.max(dto.maxPlayers, 2), 15);
    }
    if (dto.roundDurationSeconds !== undefined) {
      room.config.roundDurationSeconds = dto.roundDurationSeconds;
    }
    if (dto.totalRounds !== undefined) {
      room.config.totalRounds = dto.totalRounds;
    }
    if (dto.gameMode !== undefined) {
      room.config.gameMode = dto.gameMode;
    }
    if (dto.allowSpectators !== undefined) {
      room.config.allowSpectators = dto.allowSpectators;
    }
    if (dto.isTeamMode !== undefined) {
      room.config.isTeamMode = dto.isTeamMode;
    }

    // Privacy & PIN update
    if (dto.isPrivate !== undefined) {
      room.config.isPrivate = dto.isPrivate;
      if (room.config.isPrivate) {
        await redisClient.srem(this.PUBLIC_ROOMS_SET, roomCode);
      } else {
        await redisClient.sadd(this.PUBLIC_ROOMS_SET, roomCode);
      }
    }

    if (dto.pin !== undefined) {
      if (dto.pin && dto.pin.trim().length === 4) {
        room.config.hasPin = true;
        room.config.pinHash = await TokenService.hashPin(dto.pin.trim());
      } else {
        room.config.hasPin = false;
        delete room.config.pinHash;
      }
    }

    room.updatedAt = Date.now();
    await this.saveRoomState(room);

    return room;
  }

  /**
   * Fetches full room state from Redis.
   */
  public static async getRoom(roomCode: string): Promise<RoomState | null> {
    const raw = await redisClient.get(`${this.ROOM_PREFIX}${roomCode.toUpperCase().trim()}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as RoomState;
    } catch {
      return null;
    }
  }

  /**
   * Saves room state to Redis with active idle TTL.
   */
  public static async saveRoomState(room: RoomState): Promise<void> {
    const key = `${this.ROOM_PREFIX}${room.code}`;
    await redisClient.set(key, JSON.stringify(room), 'EX', env.ROOM_IDLE_TIMEOUT_SECONDS);
  }

  /**
   * Deletes room from Redis and clears from public directory.
   */
  public static async deleteRoom(roomCode: string): Promise<void> {
    const code = roomCode.toUpperCase().trim();
    await redisClient.del(`${this.ROOM_PREFIX}${code}`);
    await redisClient.srem(this.PUBLIC_ROOMS_SET, code);
  }

  /**
   * Lists all public joinable rooms for browser matchmaking.
   */
  public static async listPublicRooms(): Promise<PublicRoomDirectoryItem[]> {
    const roomCodes = await redisClient.smembers(this.PUBLIC_ROOMS_SET);
    if (!roomCodes || roomCodes.length === 0) return [];

    const items: PublicRoomDirectoryItem[] = [];

    for (const code of roomCodes) {
      const room = await this.getRoom(code);
      if (!room || room.config.isPrivate) {
        await redisClient.srem(this.PUBLIC_ROOMS_SET, code);
        continue;
      }

      const host = room.players[room.hostId];
      items.push({
        code: room.code,
        hostUsername: host ? host.username : 'Unknown',
        hostAvatar: host ? host.avatar : 'cyber_cat',
        playerCount: Object.keys(room.players).length,
        maxPlayers: room.config.maxPlayers,
        status: room.status,
        gameMode: room.config.gameMode,
        hasPin: room.config.hasPin,
        createdAt: room.createdAt
      });
    }

    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Sets player team for Team Mode.
   */
  public static async setPlayerTeam(
    playerId: string,
    roomCode: string,
    team: 'red' | 'blue' | 'green' | 'none'
  ): Promise<{ room: RoomState; player: Player }> {
    const room = await this.getRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const player = room.players[playerId];
    if (!player) throw new Error('PLAYER_NOT_IN_ROOM');

    player.team = team;

    // Recalculate team scores if in team mode
    if (room.config.isTeamMode) {
      const scores: Record<string, number> = { red: 0, blue: 0, green: 0 };
      Object.values(room.players).forEach((p) => {
        if (p.team && p.team !== 'none' && scores[p.team] !== undefined) {
          scores[p.team] = (scores[p.team] ?? 0) + (p.score || 0);
        }
      });
      room.teamScores = scores;
    }

    room.updatedAt = Date.now();
    await this.saveRoomState(room);
    return { room, player };
  }

  /**
   * Rematch: Resets room state back to lobby for another game while keeping all players.
   */
  public static async rematchRoom(
    roomCode: string,
    nextGameMode?: any
  ): Promise<RoomState> {
    const room = await this.getRoom(roomCode);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    room.status = 'lobby';
    room.currentRound = 0;
    if (nextGameMode) {
      room.config.gameMode = nextGameMode;
    }

    // Reset scores & ready states
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.isReady = false;
      delete p.secretRole;
    });

    if (room.teamScores) {
      room.teamScores = { red: 0, blue: 0, green: 0 };
    }

    delete room.gameData;
    room.updatedAt = Date.now();
    await this.saveRoomState(room);
    return room;
  }

  /**
   * Quick Play Matchmaking: Finds open public room or returns null.
   */
  public static async findQuickPlayRoom(): Promise<string | null> {
    const publicCodes = await redisClient.smembers(this.PUBLIC_ROOMS_SET);
    for (const code of publicCodes) {
      const room = await this.getRoom(code);
      if (
        room &&
        !room.config.isPrivate &&
        !room.config.hasPin &&
        room.status === 'lobby' &&
        Object.keys(room.players).length < room.config.maxPlayers
      ) {
        return room.code;
      }
    }
    return null;
  }

  /**
   * Sanitizes server RoomState into a safe PublicRoomState for broadcasting to clients.
   * Strips secret roles and PIN hashes.
   */
  public static toPublicState(room: RoomState): PublicRoomState {
    const playersList: PlayerSummary[] = Object.values(room.players).map((p) => ({
      id: p.id,
      username: p.username,
      avatar: p.avatar,
      isHost: p.isHost,
      isReady: p.isReady,
      isSpectator: p.isSpectator,
      score: p.score,
      connectionStatus: p.connectionStatus,
      graceExpiresAt: p.graceExpiresAt,
      joinedAt: p.joinedAt,
      team: p.team || 'none'
    }));

    const spectatorsList: PlayerSummary[] = Object.values(room.spectators).map((s) => ({
      id: s.id,
      username: s.username,
      avatar: s.avatar,
      isHost: false,
      isReady: false,
      isSpectator: true,
      score: s.score,
      connectionStatus: s.connectionStatus,
      graceExpiresAt: s.graceExpiresAt,
      joinedAt: s.joinedAt,
      team: s.team || 'none'
    }));

    const publicConfig: PublicRoomConfig = {
      maxPlayers: room.config.maxPlayers,
      isPrivate: room.config.isPrivate,
      hasPin: room.config.hasPin,
      roundDurationSeconds: room.config.roundDurationSeconds,
      totalRounds: room.config.totalRounds,
      gameMode: room.config.gameMode,
      customDeckId: room.config.customDeckId,
      allowSpectators: room.config.allowSpectators,
      isTeamMode: room.config.isTeamMode
    };

    return {
      code: room.code,
      hostId: room.hostId,
      status: room.status,
      config: publicConfig,
      players: playersList,
      spectators: spectatorsList,
      playerCount: playersList.length,
      spectatorCount: spectatorsList.length,
      currentRound: room.currentRound,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      teamScores: room.teamScores
    };
  }
}
