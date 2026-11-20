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
  | 'hyper_bunny'
  | 'arcade_ghost'
  | 'party_dino'
  | 'laser_shark'
  | 'turbo_monkey'
  | 'speedy_cheetah'
  | 'mech_bear'
  | 'pixel_wizard'
  | 'astro_bot';

export interface NeonAvatarMetadata {
  id: NeonAvatarId;
  name: string;
  label?: string;
  primaryColor: string;
  glowColor: string;
  emoji: string;
}

export const NEON_AVATARS: Record<NeonAvatarId, NeonAvatarMetadata> = {
  cyber_cat: {
    id: 'cyber_cat',
    name: 'Cyber Cat',
    primaryColor: '#0B89FD', // Electric Blue
    glowColor: 'rgba(11, 137, 253, 0.4)',
    emoji: '🐱'
  },
  neon_fox: {
    id: 'neon_fox',
    name: 'Neon Fox',
    primaryColor: '#FD3F01', // Arcade Red-Orange
    glowColor: 'rgba(253, 63, 1, 0.4)',
    emoji: '🦊'
  },
  pixel_alien: {
    id: 'pixel_alien',
    name: 'Pixel Alien',
    primaryColor: '#10B981', // Bauhaus Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.4)',
    emoji: '👾'
  },
  glitch_skull: {
    id: 'glitch_skull',
    name: 'Glitch Skull',
    primaryColor: '#FD3F01', // Arcade Red-Orange
    glowColor: 'rgba(253, 63, 1, 0.4)',
    emoji: '💀'
  },
  robo_pug: {
    id: 'robo_pug',
    name: 'Robo Pug',
    primaryColor: '#FEC90E', // Vibrant Gold
    glowColor: 'rgba(254, 201, 14, 0.4)',
    emoji: '🐶'
  },
  cosmic_panda: {
    id: 'cosmic_panda',
    name: 'Cosmic Panda',
    primaryColor: '#0B89FD', // Electric Blue
    glowColor: 'rgba(11, 137, 253, 0.4)',
    emoji: '🐼'
  },
  solar_falcon: {
    id: 'solar_falcon',
    name: 'Solar Falcon',
    primaryColor: '#FEC90E', // Vibrant Gold
    glowColor: 'rgba(254, 201, 14, 0.4)',
    emoji: '🦅'
  },
  hyper_bunny: {
    id: 'hyper_bunny',
    name: 'Hyper Bunny',
    primaryColor: '#FD3F01', // Arcade Red-Orange
    glowColor: 'rgba(253, 63, 1, 0.4)',
    emoji: '🐰'
  },
  arcade_ghost: {
    id: 'arcade_ghost',
    name: 'Arcade Ghost',
    primaryColor: '#0B89FD', // Electric Blue
    glowColor: 'rgba(11, 137, 253, 0.4)',
    emoji: '👻'
  },
  party_dino: {
    id: 'party_dino',
    name: 'Party Dino',
    primaryColor: '#10B981', // Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.4)',
    emoji: '🦖'
  },
  laser_shark: {
    id: 'laser_shark',
    name: 'Laser Shark',
    primaryColor: '#0B89FD', // Electric Blue
    glowColor: 'rgba(11, 137, 253, 0.4)',
    emoji: '🦈'
  },
  turbo_monkey: {
    id: 'turbo_monkey',
    name: 'Turbo Monkey',
    primaryColor: '#FEC90E', // Vibrant Gold
    glowColor: 'rgba(254, 201, 14, 0.4)',
    emoji: '🐵'
  },
  speedy_cheetah: {
    id: 'speedy_cheetah',
    name: 'Speedy Cheetah',
    primaryColor: '#FEC90E', // Vibrant Gold
    glowColor: 'rgba(254, 201, 14, 0.4)',
    emoji: '🐆'
  },
  mech_bear: {
    id: 'mech_bear',
    name: 'Mech Bear',
    primaryColor: '#FD3F01', // Arcade Red-Orange
    glowColor: 'rgba(253, 63, 1, 0.4)',
    emoji: '🐻'
  },
  pixel_wizard: {
    id: 'pixel_wizard',
    name: 'Pixel Wizard',
    primaryColor: '#0B89FD', // Electric Blue
    glowColor: 'rgba(11, 137, 253, 0.4)',
    emoji: '🧙'
  },
  astro_bot: {
    id: 'astro_bot',
    name: 'Astro Bot',
    primaryColor: '#10B981', // Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.4)',
    emoji: '🤖'
  }
};

export type PlayerConnectionStatus = 'connected' | 'disconnected_grace' | 'disconnected';
export type PlayerTeam = 'red' | 'blue' | 'green' | 'none';

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
  team?: PlayerTeam;
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
  team?: PlayerTeam;
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
