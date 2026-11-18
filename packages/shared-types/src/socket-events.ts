import { NeonAvatarId, PlayerSummary, PlayerTeam } from './player';
import { GameMode, PublicRoomConfig, PublicRoomState } from './room';
import {
  ChatMessage,
  DrawStroke,
  GamePhaseChangePayload,
  GameResultsPayload,
  PlayerScoreUpdate,
  PrivateRolePayload,
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
  isTeamMode?: boolean;
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
  privateRole?: PrivateRolePayload | null;
  gameState?: any;
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
  isTeamMode?: boolean;
}

export interface GameActionDTO {
  actionType: string;
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

  // Generic Game actions
  'game:action': (data: GameActionDTO, callback?: (res: SocketApiResponse<any>) => void) => void;

  // Chat & Guessing (Draw & Guess intercept)
  'chat:send': (data: { message: string }, callback?: (res: SocketApiResponse<void>) => void) => void;

  // Drawing Events (Draw & Guess)
  'draw:stroke': (stroke: DrawStroke) => void;
  'draw:clear': () => void;
  'draw:undo': () => void;
  'draw:select_word': (data: { word: string }, callback?: (res: SocketApiResponse<void>) => void) => void;

  // Who Is The Imposter Events
  'imposter:submit_clue': (data: { clue: string }, callback?: (res: SocketApiResponse<void>) => void) => void;
  'imposter:cast_vote': (data: { targetPlayerId: string }, callback?: (res: SocketApiResponse<void>) => void) => void;
  'imposter:sudden_death_guess': (data: { guessedWord: string }, callback?: (res: SocketApiResponse<void>) => void) => void;

  // Quiz Battle Events
  'quiz:submit_answer': (data: { optionIndex: number }, callback?: (res: SocketApiResponse<void>) => void) => void;

  // Word Battle Events
  'word_battle:submit_word': (data: { word: string }, callback?: (res: SocketApiResponse<{ accepted: boolean; points?: number; reason?: string }>) => void) => void;

  // Truth or Dare Events
  'tod:choose_type': (data: { choice: 'truth' | 'dare' }, callback?: (res: SocketApiResponse<void>) => void) => void;
  'tod:complete_action': (callback?: (res: SocketApiResponse<void>) => void) => void;
  'tod:vote': (data: { vote: 'completed' | 'refused' }, callback?: (res: SocketApiResponse<void>) => void) => void;

  // Never Have I Ever Events
  'nhie:submit_choice': (data: { choice: 'have' | 'havenot' }, callback?: (res: SocketApiResponse<void>) => void) => void;

  // Social Reactions, Team Mode & Rematch
  'reaction:send': (data: { emoji: string }) => void;
  'room:select-team': (data: { team: PlayerTeam }, callback?: (res: SocketApiResponse<void>) => void) => void;
  'room:rematch': (data?: { nextGameMode?: GameMode }, callback?: (res: SocketApiResponse<void>) => void) => void;
  'room:quick-play': (data: { username: string; avatar: NeonAvatarId }, callback: (res: SocketApiResponse<{ roomCode: string }>) => void) => void;

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
  'game:private_role': (data: PrivateRolePayload) => void;
  'game:state_sync': (data: { gameMode: GameMode; state: any }) => void;
  'game:timer-tick': (data: TimerTickPayload) => void;
  'game:scores-updated': (scores: PlayerScoreUpdate[]) => void;
  'game:ended': (results: GameResultsPayload) => void;

  // In-Game Events: Chat & Guessing
  'chat:message': (message: ChatMessage) => void;
  'game:correct_guess': (data: { playerId: string; username: string; points: number }) => void;

  // In-Game Events: Canvas streaming
  'draw:stroke': (stroke: DrawStroke) => void;
  'draw:clear': () => void;
  'draw:undo': () => void;

  // Word Battle Events
  'word_battle:rejected': (data: { word: string; reason: 'already_taken' | 'invalid_letter' | 'invalid_word' }) => void;
  'word_battle:accepted': (data: { word: string; points: number; username: string }) => void;

  // Live Floating Emoji Reactions
  'reaction:broadcast': (data: { id: string; playerId: string; username: string; emoji: string; x: number }) => void;

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
