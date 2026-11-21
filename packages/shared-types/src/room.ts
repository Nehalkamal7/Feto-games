import { Player, PlayerSummary } from './player';
import { PartyAward } from './game';

export type RoomVisibility = 'public' | 'private';

export type RoomStatus =
  | 'lobby'
  | 'countdown'
  | 'in_game'
  | 'playing'
  | 'round_transition'
  | 'game_over'
  | 'finished';

export type GameMode =
  | 'who_is_imposter'
  | 'draw_and_guess'
  | 'quiz_battle'
  | 'word_battle'
  | 'truth_or_dare'
  | 'never_have_i_ever'
  | 'most_likely_to'
  | 'sip_or_spill'
  | 'silly_roulette'
  | 'hot_potato'
  | 'party_trivia'
  | 'bluff_master'
  | 'secret_imposter'
  | 'speed_draw';

export type VibeMode = 'chill' | 'chaotic' | 'silly' | 'sip_edition';

export interface CustomCardItem {
  id: string;
  type: string;
  prompt: string;
  authorUsername: string;
  submittedAt: number;
}

export interface RoomConfig {
  roomName?: string;
  maxPlayers: number; // 2 - 15
  isPrivate: boolean;
  hasPin: boolean;
  pinHash?: string; // Stored securely on server
  roundDurationSeconds: number; // 15 - 90 seconds
  totalRounds: number; // 1 - 10
  gameMode: GameMode;
  selectedGames?: GameMode[]; // Multi-game party playlist queue
  currentGameIndex?: number; // Current index in selectedGames
  vibeMode?: VibeMode;
  customDeckId?: string | null;
  allowSpectators: boolean;
  isTeamMode?: boolean;
}

export type PublicRoomConfig = Omit<RoomConfig, 'pinHash'>;

/**
 * Full server-authoritative Room State stored in Redis.
 */
export interface RoomState {
  code: string; // e.g. "K8M4P2" (clean 6-character alphanumeric code)
  roomName?: string; // Optional custom room title
  hostId: string; // ID of current host player
  status: RoomStatus;
  phase?: string;
  config: RoomConfig;
  selectedGames?: GameMode[]; // Live game playlist
  currentGameIndex?: number;
  players: Record<string, Player>; // Map of playerId -> Player
  spectators: Record<string, Player>; // Map of spectatorId -> Player
  createdAt: number;
  updatedAt: number;
  lastActivityAt?: number;
  currentRound: number;
  gameData?: any; // Dynamic state for the active mini-game
  teamScores?: Record<string, number>;
  sipsCount?: Record<string, number>; // Live Sip Counter across the session
  customCards?: CustomCardItem[];
}

/**
 * Sanitized public room state broadcasted to all sockets in the room.
 */
export interface PublicRoomState {
  code: string;
  roomName?: string;
  hostId: string;
  status: RoomStatus;
  phase?: string;
  config: PublicRoomConfig;
  selectedGames?: GameMode[];
  currentGameIndex?: number;
  players: PlayerSummary[];
  spectators: PlayerSummary[];
  playerCount: number;
  spectatorCount: number;
  currentRound: number;
  createdAt: number;
  updatedAt: number;
  lastActivityAt?: number;
  teamScores?: Record<string, number>;
  sipsCount?: Record<string, number>;
  customCardsCount?: number;
  awards?: PartyAward[];
  gameData?: any;
  gameState?: any;
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
  isTeamMode?: boolean;
  createdAt: number;
}
