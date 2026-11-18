/**
 * FETO GAMES - Shared Player Definitions
 * Supports instant guest profiles and registered user accounts.
 */

export type NeonAvatarId =
  | 'cyber_cat'
  | 'neon_fox'
  | 'pixel_alien'
  | 'glitch_skull'
  | 'robo_pug'
  | 'cosmic_panda'
  | 'solar_falcon'
  | 'hyper_bunny';

export interface NeonAvatarMetadata {
  id: NeonAvatarId;
  name: string;
  primaryColor: string;
  glowColor: string;
  emoji: string;
}

export const NEON_AVATARS: Record<NeonAvatarId, NeonAvatarMetadata> = {
  cyber_cat: {
    id: 'cyber_cat',
    name: 'Cyber Cat',
    primaryColor: '#00F0FF', // Neon Cyan
    glowColor: 'rgba(0, 240, 255, 0.6)',
    emoji: '🐱'
  },
  neon_fox: {
    id: 'neon_fox',
    name: 'Neon Fox',
    primaryColor: '#FF5E00', // Neon Orange
    glowColor: 'rgba(255, 94, 0, 0.6)',
    emoji: '🦊'
  },
  pixel_alien: {
    id: 'pixel_alien',
    name: 'Pixel Alien',
    primaryColor: '#39FF14', // Neon Green
    glowColor: 'rgba(57, 255, 20, 0.6)',
    emoji: '👾'
  },
  glitch_skull: {
    id: 'glitch_skull',
    name: 'Glitch Skull',
    primaryColor: '#FF0055', // Neon Pink / Rose
    glowColor: 'rgba(255, 0, 85, 0.6)',
    emoji: '💀'
  },
  robo_pug: {
    id: 'robo_pug',
    name: 'Robo Pug',
    primaryColor: '#FFE600', // Neon Yellow
    glowColor: 'rgba(255, 230, 0, 0.6)',
    emoji: '🐶'
  },
  cosmic_panda: {
    id: 'cosmic_panda',
    name: 'Cosmic Panda',
    primaryColor: '#BF00FF', // Neon Violet
    glowColor: 'rgba(191, 0, 255, 0.6)',
    emoji: '🐼'
  },
  solar_falcon: {
    id: 'solar_falcon',
    name: 'Solar Falcon',
    primaryColor: '#00FFCC', // Neon Mint
    glowColor: 'rgba(0, 255, 204, 0.6)',
    emoji: '🦅'
  },
  hyper_bunny: {
    id: 'hyper_bunny',
    name: 'Hyper Bunny',
    primaryColor: '#FF00A0', // Neon Magenta
    glowColor: 'rgba(255, 0, 160, 0.6)',
    emoji: '🐰'
  }
};

export type PlayerConnectionStatus = 'connected' | 'disconnected_grace';

export interface Player {
  id: string; // Unique UUID/nanoid for this player
  socketId: string; // Current active socket ID
  username: string; // Display name
  avatar: NeonAvatarId; // Selected neon avatar
  isHost: boolean; // Room owner / host
  isReady: boolean; // Ready status in lobby
  isSpectator: boolean; // Spectating mid-game or lobby overflow
  score: number; // Current match score
  joinedAt: number; // Epoch timestamp
  connectionStatus: PlayerConnectionStatus;
  disconnectedAt: number | null; // Epoch timestamp when disconnected
  graceExpiresAt: number | null; // Disconnect + 45s
  secretRole?: string | null; // Server-authoritative secret role (hidden from opponents)
  isGuest: boolean;
  userId?: string | null; // Set if player is an authenticated user
}

/**
 * Sanitized player state safe to broadcast to clients.
 * Omits server-only fields like secret roles of other players.
 */
export interface PlayerSummary {
  id: string;
  username: string;
  avatar: NeonAvatarId;
  isHost: boolean;
  isReady: boolean;
  isSpectator: boolean;
  score: number;
  connectionStatus: PlayerConnectionStatus;
  graceExpiresAt: number | null;
  joinedAt: number;
}

/**
 * Payload encoded inside the signed JWT session reconnect token.
 * Valid for 5 minutes, enables seamless 45-second reconnect on mobile refresh.
 */
export interface ReconnectTokenPayload {
  playerId: string;
  roomCode: string;
  username: string;
  isHost: boolean;
  avatar: NeonAvatarId;
  iat?: number;
  exp?: number;
}
