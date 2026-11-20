'use client';

import React from 'react';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';

export interface PlayerAvatarProps {
  avatarId: NeonAvatarId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isReady?: boolean;
  showBorder?: boolean;
}

const sizeMap = {
  xs: 'w-6 h-6',
  sm: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatarId,
  size = 'md',
  className = '',
  isReady = false,
  showBorder = true
}) => {
  const meta = NEON_AVATARS[avatarId] || NEON_AVATARS.cyber_cat;
  const bg = meta.primaryColor || '#0B89FD';

  // Render bespoke vector mascot for each of the 16 characters
  const renderVectorMascot = () => {
    switch (avatarId) {
      case 'cyber_cat':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Base head */}
            <circle cx="32" cy="35" r="20" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            {/* Ears */}
            <polygon points="16,26 22,8 30,20" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="48,26 42,8 34,20" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Cyber Visor */}
            <rect x="20" y="29" width="24" height="8" rx="4" fill="#0B89FD" stroke="#010101" strokeWidth="2" />
            <line x1="24" y1="33" x2="40" y2="33" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            {/* Nose & Whiskers */}
            <polygon points="32,41 29,38 35,38" fill="#010101" />
            <line x1="14" y1="39" x2="24" y2="40" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="44" x2="24" y2="43" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="39" x2="40" y2="40" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
            <line x1="50" y1="44" x2="40" y2="43" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'neon_fox':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Ears */}
            <polygon points="12,24 16,6 30,18" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="52,24 48,6 34,18" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="17,20 18,10 26,17" fill="#FEC90E" />
            <polygon points="47,20 46,10 38,17" fill="#FEC90E" />
            {/* Face shape */}
            <polygon points="32,54 12,26 52,26" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Cheek color patches */}
            <polygon points="13,27 24,27 18,40" fill="#FD3F01" />
            <polygon points="51,27 40,27 46,40" fill="#FD3F01" />
            {/* Eyes */}
            <ellipse cx="25" cy="31" rx="3.5" ry="2" fill="#010101" transform="rotate(-10 25 31)" />
            <ellipse cx="39" cy="31" rx="3.5" ry="2" fill="#010101" transform="rotate(10 39 31)" />
            {/* Nose Tip */}
            <circle cx="32" cy="50" r="3" fill="#010101" />
          </svg>
        );

      case 'pixel_alien':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Antennae */}
            <line x1="20" y1="18" x2="14" y2="10" stroke="#010101" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="13" cy="9" r="3.5" fill="#FEC90E" stroke="#010101" strokeWidth="2" />
            <line x1="44" y1="18" x2="50" y2="10" stroke="#010101" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="51" cy="9" r="3.5" fill="#FEC90E" stroke="#010101" strokeWidth="2" />
            {/* Alien Head Oval */}
            <ellipse cx="32" cy="36" rx="22" ry="18" fill="#10B981" stroke="#010101" strokeWidth="2.5" />
            {/* Huge expressive eyes */}
            <ellipse cx="23" cy="35" rx="6" ry="9" fill="#010101" transform="rotate(-15 23 35)" />
            <circle cx="21" cy="32" r="2.5" fill="#FFFFFF" />
            <ellipse cx="41" cy="35" rx="6" ry="9" fill="#010101" transform="rotate(15 41 35)" />
            <circle cx="39" cy="32" r="2.5" fill="#FFFFFF" />
            {/* Cute mouth */}
            <path d="M30 46 Q32 49 34 46" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'glitch_skull':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Skull cranium */}
            <circle cx="32" cy="28" r="18" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            {/* Jaw */}
            <path d="M22 36 L22 49 L42 49 L42 36" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Eye sockets */}
            <circle cx="25" cy="28" r="5" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            <circle cx="39" cy="28" r="5" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            {/* Inverted heart nose */}
            <polygon points="32,36 30,39 34,39" fill="#010101" />
            {/* Teeth */}
            <line x1="27" y1="42" x2="27" y2="49" stroke="#010101" strokeWidth="2" />
            <line x1="32" y1="42" x2="32" y2="49" stroke="#010101" strokeWidth="2" />
            <line x1="37" y1="42" x2="37" y2="49" stroke="#010101" strokeWidth="2" />
          </svg>
        );

      case 'robo_pug':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Droopy Ears */}
            <path d="M12 20 Q8 32 16 38 L20 28 Z" fill="#010101" stroke="#010101" strokeWidth="2" />
            <path d="M52 20 Q56 32 48 38 L44 28 Z" fill="#010101" stroke="#010101" strokeWidth="2" />
            {/* Square/Rounded head */}
            <rect x="16" y="16" width="32" height="32" rx="10" fill="#FEC90E" stroke="#010101" strokeWidth="2.5" />
            {/* Big Round Pug Eyes */}
            <circle cx="24" cy="28" r="5" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <circle cx="24" cy="28" r="3" fill="#010101" />
            <circle cx="23" cy="27" r="1" fill="#FFFFFF" />
            <circle cx="40" cy="28" r="5" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <circle cx="40" cy="28" r="3" fill="#010101" />
            <circle cx="39" cy="27" r="1" fill="#FFFFFF" />
            {/* Pug Muzzle */}
            <ellipse cx="32" cy="38" rx="8" ry="6" fill="#010101" />
            <polygon points="32,36 30,34 34,34" fill="#FEC90E" />
            <path d="M30 40 Q32 42 34 40" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'cosmic_panda':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Black Panda Ears */}
            <circle cx="16" cy="18" r="7" fill="#010101" stroke="#010101" strokeWidth="2" />
            <circle cx="48" cy="18" r="7" fill="#010101" stroke="#010101" strokeWidth="2" />
            {/* White Face */}
            <circle cx="32" cy="35" r="20" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            {/* Tilted Eye Patches */}
            <ellipse cx="23" cy="33" rx="5" ry="7" fill="#010101" transform="rotate(-20 23 33)" />
            <circle cx="24" cy="32" r="2" fill="#0B89FD" />
            <ellipse cx="41" cy="33" rx="5" ry="7" fill="#010101" transform="rotate(20 41 33)" />
            <circle cx="40" cy="32" r="2" fill="#0B89FD" />
            {/* Snout & Nose */}
            <ellipse cx="32" cy="43" rx="3" ry="2" fill="#010101" />
            <path d="M30 46 Q32 48 34 46" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'solar_falcon':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Falcon Crest Feather */}
            <polygon points="30,8 38,18 26,20" fill="#FD3F01" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
            {/* Head Silhouette */}
            <circle cx="32" cy="34" r="19" fill="#FEC90E" stroke="#010101" strokeWidth="2.5" />
            {/* Sharp Hook Beak */}
            <polygon points="32,32 48,39 32,45" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Fierce Eye with Stripe */}
            <path d="M18 32 L30 32" stroke="#010101" strokeWidth="3" strokeLinecap="round" />
            <circle cx="26" cy="32" r="3.5" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <circle cx="26" cy="32" r="2" fill="#010101" />
          </svg>
        );

      case 'hyper_bunny':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Tall Ears */}
            <rect x="18" y="6" width="9" height="24" rx="4.5" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            <rect x="20" y="10" width="5" height="16" rx="2.5" fill="#FD3F01" />
            <rect x="37" y="6" width="9" height="24" rx="4.5" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            <rect x="39" y="10" width="5" height="16" rx="2.5" fill="#FD3F01" />
            {/* Bunny Head */}
            <circle cx="32" cy="40" r="17" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            {/* Eyes */}
            <circle cx="24" cy="38" r="3" fill="#FD3F01" stroke="#010101" strokeWidth="1.5" />
            <circle cx="40" cy="38" r="3" fill="#FD3F01" stroke="#010101" strokeWidth="1.5" />
            {/* Nose */}
            <polygon points="32,44 30,42 34,42" fill="#FD3F01" />
            {/* Whiskers */}
            <line x1="16" y1="43" x2="24" y2="44" stroke="#010101" strokeWidth="1.5" />
            <line x1="48" y1="43" x2="40" y2="44" stroke="#010101" strokeWidth="1.5" />
          </svg>
        );

      case 'arcade_ghost':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Ghost body with scallop skirt */}
            <path
              d="M14 36 C14 20, 50 20, 50 36 L50 54 L44 48 L38 54 L32 48 L26 54 L20 48 L14 54 Z"
              fill="#0B89FD"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Pixel Arcade Eyes looking right */}
            <rect x="22" y="28" width="8" height="10" rx="4" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <rect x="26" y="32" width="4" height="6" rx="2" fill="#010101" />
            <rect x="36" y="28" width="8" height="10" rx="4" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <rect x="40" y="32" width="4" height="6" rx="2" fill="#010101" />
          </svg>
        );

      case 'party_dino':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Party Cone Hat */}
            <polygon points="24,18 28,4 34,16" fill="#FEC90E" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="28" cy="3" r="2" fill="#FD3F01" />
            {/* Dino Head Profile */}
            <path
              d="M18 42 L18 24 C18 18, 44 18, 48 24 L52 36 L40 36 L40 42 Z"
              fill="#10B981"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Eye */}
            <circle cx="30" cy="25" r="3.5" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <circle cx="30" cy="25" r="1.5" fill="#010101" />
            {/* Sharp White Teeth */}
            <polygon points="40,36 43,40 46,36" fill="#FFFFFF" stroke="#010101" strokeWidth="1.5" />
            <polygon points="46,36 49,40 52,36" fill="#FFFFFF" stroke="#010101" strokeWidth="1.5" />
            {/* Cheek blush */}
            <circle cx="34" cy="32" r="2.5" fill="#FD3F01" />
          </svg>
        );

      case 'laser_shark':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Top Dorsal Fin */}
            <polygon points="26,20 32,8 38,20" fill="#0B89FD" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Shark Body/Snout */}
            <path
              d="M14 42 C16 26, 48 24, 52 36 C52 46, 26 48, 14 42 Z"
              fill="#FFFFFF"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Laser Monocle / Visor */}
            <rect x="36" y="28" width="10" height="7" rx="3" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            <line x1="46" y1="31" x2="56" y2="31" stroke="#FD3F01" strokeWidth="2" strokeLinecap="round" />
            {/* Sharp Teeth Grin */}
            <path d="M26 40 L44 40" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
            <polygon points="30,40 32,44 34,40" fill="#010101" />
            <polygon points="36,40 38,44 40,40" fill="#010101" />
            {/* Gills */}
            <line x1="22" y1="34" x2="22" y2="39" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
            <line x1="25" y1="34" x2="25" y2="39" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'turbo_monkey':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Big DJ Headphones Band */}
            <path d="M12 30 C12 12, 52 12, 52 30" stroke="#010101" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Headphone Earcups */}
            <rect x="8" y="26" width="8" height="16" rx="4" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            <rect x="48" y="26" width="8" height="16" rx="4" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            {/* Monkey Face */}
            <circle cx="32" cy="34" r="16" fill="#FEC90E" stroke="#010101" strokeWidth="2.5" />
            {/* Light Muzzle */}
            <ellipse cx="32" cy="39" rx="10" ry="7" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            {/* Eyes */}
            <circle cx="26" cy="29" r="2.5" fill="#010101" />
            <circle cx="38" cy="29" r="2.5" fill="#010101" />
            {/* Nose & Smile */}
            <circle cx="30" cy="36" r="1" fill="#010101" />
            <circle cx="34" cy="36" r="1" fill="#010101" />
            <path d="M28 41 Q32 44 36 41" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      case 'speedy_cheetah':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Cheetah Ears */}
            <circle cx="18" cy="18" r="6" fill="#010101" stroke="#010101" strokeWidth="2" />
            <circle cx="18" cy="18" r="3" fill="#FEC90E" />
            <circle cx="46" cy="18" r="6" fill="#010101" stroke="#010101" strokeWidth="2" />
            <circle cx="46" cy="18" r="3" fill="#FEC90E" />
            {/* Cheetah Head */}
            <circle cx="32" cy="35" r="19" fill="#FEC90E" stroke="#010101" strokeWidth="2.5" />
            {/* Spots */}
            <circle cx="20" cy="32" r="1.5" fill="#010101" />
            <circle cx="44" cy="32" r="1.5" fill="#010101" />
            <circle cx="32" cy="22" r="1.5" fill="#010101" />
            {/* Lightning Shades */}
            <polygon points="18,28 30,28 26,36 18,34" fill="#010101" />
            <polygon points="34,28 46,28 46,34 38,36" fill="#010101" />
            <line x1="28" y1="30" x2="36" y2="30" stroke="#010101" strokeWidth="2" />
            {/* Tear marks */}
            <path d="M24 35 L22 44" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
            <path d="M40 35 L42 44" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
            {/* Nose */}
            <polygon points="32,41 29,38 35,38" fill="#010101" />
          </svg>
        );

      case 'mech_bear':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Left Natural Ear */}
            <circle cx="18" cy="18" r="6" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" />
            {/* Right Robotic Antenna Ear */}
            <rect x="42" y="12" width="8" height="10" rx="2" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <line x1="46" y1="12" x2="46" y2="6" stroke="#010101" strokeWidth="2" />
            <circle cx="46" cy="5" r="2" fill="#FEC90E" />
            {/* Bear Head */}
            <circle cx="32" cy="36" r="19" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" />
            {/* Mech Faceplate Halving */}
            <path d="M32 17 L48 26 L48 48 L32 55 Z" fill="#010101" fillOpacity="0.15" />
            {/* Left Eye (Normal) */}
            <circle cx="24" cy="33" r="3" fill="#010101" />
            {/* Right Eye (Cyber Target) */}
            <circle cx="40" cy="33" r="4.5" fill="#FEC90E" stroke="#010101" strokeWidth="2" />
            <circle cx="40" cy="33" r="2" fill="#010101" />
            {/* Muzzle */}
            <ellipse cx="32" cy="43" rx="7" ry="5" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            <circle cx="32" cy="41" r="2.5" fill="#010101" />
          </svg>
        );

      case 'pixel_wizard':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Pointy Wizard Hat */}
            <polygon points="12,30 32,4 52,30" fill="#0B89FD" stroke="#010101" strokeWidth="2.5" strokeLinejoin="round" />
            <ellipse cx="32" cy="30" rx="22" ry="4" fill="#010101" />
            {/* Star on Hat */}
            <polygon points="32,14 34,18 38,18 35,21 36,25 32,22 28,25 29,21 26,18 30,18" fill="#FEC90E" stroke="#010101" strokeWidth="1" />
            {/* Face */}
            <circle cx="32" cy="38" r="13" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            {/* Beard */}
            <polygon points="22,40 32,56 42,40" fill="#F8F8F8" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
            {/* Eyes */}
            <circle cx="27" cy="36" r="2" fill="#010101" />
            <circle cx="37" cy="36" r="2" fill="#010101" />
          </svg>
        );

      case 'astro_bot':
        return (
          <svg viewBox="0 0 64 64" className="w-full h-full shrink-0 select-none" fill="none">
            {/* Top Antenna */}
            <line x1="32" y1="16" x2="32" y2="8" stroke="#010101" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="32" cy="7" r="3" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            {/* Helmet outer shape */}
            <rect x="14" y="16" width="36" height="34" rx="14" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            {/* Robot Screen Face */}
            <rect x="18" y="22" width="28" height="22" rx="8" fill="#10B981" stroke="#010101" strokeWidth="2" />
            {/* Pixel Bot Eyes */}
            <rect x="23" y="28" width="5" height="5" rx="1.5" fill="#010101" />
            <rect x="36" y="28" width="5" height="5" rx="1.5" fill="#010101" />
            {/* Bot Smile */}
            <path d="M27 37 Q32 40 37 37" stroke="#010101" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );

      default:
        return (
          <span className="text-2xl font-emoji select-none">{meta.emoji}</span>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl overflow-hidden transition-all duration-150 ${sizeMap[size]} ${className}`}
      style={{
        backgroundColor: isReady ? '#0B89FD' : bg,
        border: showBorder ? '2px solid #010101' : 'none',
        boxShadow: showBorder ? '2px 2px 0px #010101' : 'none'
      }}
      title={meta.name}
    >
      {/* Crisp Vector Graphic */}
      <div className="w-full h-full p-0.5 flex items-center justify-center shrink-0">
        {renderVectorMascot()}
      </div>

      {/* Bauhaus Geometric Corner Triangle Accent */}
      <div
        className="absolute top-0 right-0 w-2.5 h-2.5 pointer-events-none"
        style={{
          background: isReady ? '#FEC90E' : '#010101',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
        }}
      />
    </div>
  );
};
