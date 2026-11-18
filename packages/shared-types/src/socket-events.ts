import { NeonAvatarId, PlayerSummary } from './player';
import { GameMode, PublicRoomConfig, PublicRoomState } from './room';
import {
  GamePhaseChangePayload,
  GameResultsPayload,
  PlayerScoreUpdate,
  SecretRolePayload,
  TimerTickPayload
} from './game';

/**
 * Standardized API Response wrapper for Socket.IO acknowledgements.
 */
export type SocketApiResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

// ==========================================
// DTOs (Data Transfer Objects)
// ==========================================

export interface CreateRoomDTO {
  username: string;
  avatar: NeonAvatarId;
  maxPlayers?: number; // default: 15, range: 2-15
  isPrivate?: boolean; // default: false
  pin?: string; // 4-digit PIN password
  gameMode?: GameMode;
  roundDurationSeconds?: number;
  totalRounds?: number;
  allowSpectators?: boolean;
}

export interface CreateRoomResponse {
  roomCode: string;
  reconnectToken: string;
  player: PlayerSummary;
  room: PublicRoomState;
}

export interface JoinRoomDTO {
  roomCode: string;
  username: string;
  avatar: NeonAvatarId;
  pin?: string; // 4-digit PIN if room is password-protected
}

export interface JoinRoomResponse {
  roomCode: string;
  reconnectToken: string;
  player: PlayerSummary;
  room: PublicRoomState;
  isSpectator: boolean;
}

export interface ReconnectDTO {
  reconnectToken: string;
}

export interface ReconnectResponse {
  roomCode: string;
  player: PlayerSummary;
  room: PublicRoomState;
  secretRole?: SecretRolePayload | null;
}

export interface SetReadyDTO {
  isReady: boolean;
}

export interface KickPlayerDTO {
  targetPlayerId: string;
  reason?: string;
}

export interface UpdateRoomSettingsDTO {
  maxPlayers?: number;
  isPrivate?: boolean;
  pin?: string | null;
  roundDurationSeconds?: number;
  totalRounds?: number;
  gameMode?: GameMode;
  allowSpectators?: boolean;
}

export interface GameActionDTO {
  actionType: 'submit_answer' | 'vote' | 'draw' | 'bluff_choice';
  payload: any;
}

// ==========================================
// Socket.IO Event Interfaces
// ==========================================

export interface ClientToServerEvents {
  // Room & Lobby
  'room:create': (data: CreateRoomDTO, callback: (res: SocketApiResponse<CreateRoomResponse>) => void) => void;
  'room:join': (data: JoinRoomDTO, callback: (res: SocketApiResponse<JoinRoomResponse>) => void) => void;
  'room:leave': (callback?: (res: SocketApiResponse<void>) => void) => void;
  'room:reconnect': (data: ReconnectDTO, callback: (res: SocketApiResponse<ReconnectResponse>) => void) => void;
  'lobby:set-ready': (data: SetReadyDTO, callback?: (res: SocketApiResponse<void>) => void) => void;
  'lobby:kick-player': (data: KickPlayerDTO, callback?: (res: SocketApiResponse<void>) => void) => void;
  'lobby:update-settings': (data: UpdateRoomSettingsDTO, callback?: (res: SocketApiResponse<void>) => void) => void;
  'lobby:start-game': (callback?: (res: SocketApiResponse<void>) => void) => void;

  // Game actions
  'game:action': (data: GameActionDTO, callback?: (res: SocketApiResponse<any>) => void) => void;

  // Ping/Latency
  'ping:latency': (data: { timestamp: number }, callback: (res: { pong: number }) => void) => void;
}

export interface ServerToClientEvents {
  // Room & State sync
  'room:state': (state: PublicRoomState) => void;
  'room:player-joined': (player: PlayerSummary) => void;
  'room:player-left': (data: { playerId: string; username: string; newHostId?: string }) => void;
  'room:player-disconnected': (data: {
    playerId: string;
    username: string;
    gracePeriodSeconds: number;
    graceExpiresAt: number;
  }) => void;
  'room:player-reconnected': (player: PlayerSummary) => void;
  'room:kicked': (data: { reason: string }) => void;
  'room:host-migrated': (data: {
    newHostId: string;
    previousHostId: string;
    newHostUsername: string;
  }) => void;

  // Lobby
  'lobby:settings-updated': (config: PublicRoomConfig) => void;

  // Game Lifecycle
  'game:starting': (data: { countdownSeconds: number }) => void;
  'game:phase-change': (data: GamePhaseChangePayload) => void;
  'game:secret-role': (data: SecretRolePayload) => void;
  'game:timer-tick': (data: TimerTickPayload) => void;
  'game:scores-updated': (scores: PlayerScoreUpdate[]) => void;
  'game:ended': (results: GameResultsPayload) => void;

  // Errors & notifications
  'error:notification': (data: { message: string; code?: string }) => void;
}

export interface InterServerEvents {
  'room:cluster-sync': (roomCode: string) => void;
}

export interface SocketData {
  playerId: string;
  roomCode: string;
  username: string;
  isHost: boolean;
  isSpectator: boolean;
  reconnectToken?: string;
}
