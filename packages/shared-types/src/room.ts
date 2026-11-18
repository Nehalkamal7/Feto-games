import { Player, PlayerSummary } from './player';

export type RoomVisibility = 'public' | 'private';

export type RoomStatus =
  | 'lobby'
  | 'countdown'
  | 'in_game'
  | 'round_transition'
  | 'game_over';

export type GameMode =
  | 'party_trivia'
  | 'bluff_master'
  | 'secret_imposter'
  | 'speed_draw';

export interface RoomConfig {
  maxPlayers: number; // 2 - 15
  isPrivate: boolean;
  hasPin: boolean;
  pinHash?: string; // Stored securely on server
  roundDurationSeconds: number; // 15 - 90 seconds
  totalRounds: number; // 3 - 10
  gameMode: GameMode;
  customDeckId?: string | null;
  allowSpectators: boolean;
}

export type PublicRoomConfig = Omit<RoomConfig, 'pinHash'>;

/**
 * Full server-authoritative Room State stored in Redis.
 */
export interface RoomState {
  code: string; // e.g. "FG-8492"
  hostId: string; // ID of current host player
  status: RoomStatus;
  config: RoomConfig;
  players: Record<string, Player>; // Map of playerId -> Player
  spectators: Record<string, Player>; // Map of spectatorId -> Player
  createdAt: number;
  updatedAt: number;
  currentRound: number;
  gameData?: any; // Dynamic state for the active mini-game
}

/**
 * Sanitized public room state broadcasted to all sockets in the room.
 */
export interface PublicRoomState {
  code: string;
  hostId: string;
  status: RoomStatus;
  config: PublicRoomConfig;
  players: PlayerSummary[];
  spectators: PlayerSummary[];
  playerCount: number;
  spectatorCount: number;
  currentRound: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Public room listing in the matchmaking lobby directory.
 */
export interface PublicRoomDirectoryItem {
  code: string;
  hostUsername: string;
  hostAvatar: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
  gameMode: GameMode;
  hasPin: boolean;
  createdAt: number;
}
