'use client';

import React from 'react';
import { GameMode } from '@feto-games/shared-types';

export interface GameIconProps {
  gameMode: GameMode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showContainer?: boolean;
}

const sizeMap = {
  xs: { box: 'w-5 h-5', px: 20 },
  sm: { box: 'w-7 h-7', px: 28 },
  md: { box: 'w-9 h-9', px: 36 },
  lg: { box: 'w-12 h-12', px: 48 },
  xl: { box: 'w-16 h-16', px: 64 }
};

export const GameIcon: React.FC<GameIconProps> = ({
  gameMode,
  size = 'md',
  className = '',
  showContainer = false
}) => {
  const currentSize = sizeMap[size] || sizeMap.md;

  const renderSvg = () => {
    switch (gameMode) {
      // 1. Who Is The Imposter? — Bold spy mask / sharp eye emblem in #FD3F01 & #010101 on #FEC90E
      case 'who_is_imposter':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Background geometric disc */}
            <circle cx="32" cy="32" r="28" fill="#FEC90E" stroke="#010101" strokeWidth="2.5" />
            {/* Spy Fedora Brim */}
            <path d="M12 28 C20 25, 44 25, 52 28 L50 25 L14 25 Z" fill="#010101" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
            {/* Fedora Crown */}
            <path d="M22 25 L24 14 L40 14 L42 25 Z" fill="#010101" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
            <line x1="24" y1="21" x2="40" y2="21" stroke="#FD3F01" strokeWidth="2.5" />
            {/* Sharp Eye / Mask */}
            <path
              d="M16 38 C22 30, 42 30, 48 38 C42 46, 22 46, 16 38 Z"
              fill="#FD3F01"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Eye Pupil & Glint */}
            <circle cx="32" cy="38" r="6" fill="#010101" />
            <circle cx="34" cy="36" r="2" fill="#FFFFFF" />
            {/* Question alert accent */}
            <circle cx="48" cy="18" r="3" fill="#FD3F01" stroke="#010101" strokeWidth="1.5" />
          </svg>
        );

      // 2. Draw & Guess — Crisp geometric brush & palette emblem in #0B89FD & #FEC90E
      case 'draw_and_guess':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Geometric Artist Palette */}
            <path
              d="M12 34 C12 18, 48 14, 52 28 C54 36, 44 40, 46 48 C48 54, 34 56, 24 52 C14 48, 12 42, 12 34 Z"
              fill="#FEC90E"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Thumb Hole */}
            <circle cx="40" cy="44" r="3.5" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            {/* Paint Droplets */}
            <circle cx="22" cy="28" r="3" fill="#0B89FD" stroke="#010101" strokeWidth="1.5" />
            <circle cx="32" cy="24" r="3" fill="#FD3F01" stroke="#010101" strokeWidth="1.5" />
            <circle cx="42" cy="30" r="3" fill="#10B981" stroke="#010101" strokeWidth="1.5" />
            {/* Crossing Stylus Brush */}
            <g transform="rotate(45 32 32)">
              <rect x="29" y="8" width="6" height="38" rx="2" fill="#010101" />
              <polygon points="29,8 32,2 35,8" fill="#0B89FD" stroke="#010101" strokeWidth="1.5" />
              <rect x="28" y="24" width="8" height="4" fill="#FFFFFF" stroke="#010101" strokeWidth="1.5" />
            </g>
          </svg>
        );

      // 3. Quiz Battle — Sharp lightning bolt & question badge in #FEC90E & #010101
      case 'quiz_battle':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Octagonal Battle Badge */}
            <polygon
              points="20,8 44,8 56,20 56,44 44,56 20,56 8,44 8,20"
              fill="#0B89FD"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Inner White Plate */}
            <polygon
              points="22,14 42,14 50,22 50,42 42,50 22,50 14,42 14,22"
              fill="#FFFFFF"
              stroke="#010101"
              strokeWidth="2"
            />
            {/* Bold Question Mark */}
            <path
              d="M26 24 C26 19, 38 19, 38 25 C38 29, 32 30, 32 35"
              stroke="#010101"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Sharp Crossing Lightning Bolt in #FEC90E */}
            <polygon
              points="38,16 26,34 33,34 27,48 43,30 36,30"
              fill="#FEC90E"
              stroke="#010101"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="42" r="2.5" fill="#010101" />
          </svg>
        );

      // 4. Word Battle — Bold stacked letter tiles (A-Z) in #0B89FD & #FFFFFF
      case 'word_battle':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Base Tile Shadow */}
            <rect x="22" y="24" width="32" height="32" rx="6" fill="#010101" />
            {/* Bottom Tile (Z / W) in #FFFFFF */}
            <rect x="20" y="22" width="32" height="32" rx="6" fill="#FFFFFF" stroke="#010101" strokeWidth="2.5" />
            <text x="36" y="44" fontSize="16" fontWeight="900" fill="#010101" textAnchor="middle" fontFamily="sans-serif">
              Z
            </text>
            <text x="46" y="32" fontSize="9" fontWeight="900" fill="#FD3F01" textAnchor="middle" fontFamily="monospace">
              10
            </text>

            {/* Top Tile (A) in #0B89FD */}
            <rect x="12" y="10" width="32" height="32" rx="6" fill="#0B89FD" stroke="#010101" strokeWidth="2.5" />
            <text x="28" y="32" fontSize="18" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">
              A
            </text>
            <text x="38" y="20" fontSize="9" fontWeight="900" fill="#FEC90E" textAnchor="middle" fontFamily="monospace">
              1
            </text>
          </svg>
        );

      // 5. Truth or Dare — Split dual-mask / flame & halo emblem in #FD3F01 & #0B89FD
      case 'truth_or_dare':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Left Half: Truth Halo (#0B89FD) */}
            <path
              d="M32 14 C20 14, 12 24, 12 36 C12 46, 22 52, 32 54 Z"
              fill="#0B89FD"
              stroke="#010101"
              strokeWidth="2.5"
            />
            {/* Angel Halo on Left */}
            <ellipse cx="24" cy="12" rx="8" ry="3" fill="none" stroke="#FEC90E" strokeWidth="2.5" />
            {/* Serene Eye */}
            <path d="M20 34 Q24 38 28 34" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

            {/* Right Half: Dare Flame (#FD3F01) */}
            <path
              d="M32 14 C44 14, 52 24, 52 36 C52 46, 42 52, 32 54 Z"
              fill="#FD3F01"
              stroke="#010101"
              strokeWidth="2.5"
            />
            {/* Devil Horn on Right */}
            <polygon points="42,16 52,6 48,18" fill="#FD3F01" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
            {/* Mischievous Slanted Eye */}
            <polygon points="36,32 44,36 38,38" fill="#010101" />
            {/* Central Dividing Seam */}
            <line x1="32" y1="12" x2="32" y2="54" stroke="#010101" strokeWidth="3" />
          </svg>
        );

      // 6. Never Have I Ever — Raised hand / halo & devil-horn in #FEC90E & #FD3F01
      case 'never_have_i_ever':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Background Halo */}
            <circle cx="32" cy="20" r="14" fill="#0B89FD" fillOpacity="0.2" stroke="#0B89FD" strokeWidth="2" strokeDasharray="3 3" />
            {/* Raised Hand Silhouette in #FEC90E */}
            <path
              d="M24 54 L24 32 C24 29, 27 29, 27 32 L27 24 C27 21, 30 21, 30 24 L30 20 C30 17, 33 17, 33 20 L33 24 C33 22, 36 22, 36 25 L36 36 L39 30 C42 27, 45 30, 44 33 L40 46 C38 52, 30 55, 24 54 Z"
              fill="#FEC90E"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Small Devil Horn Accent (#FD3F01) */}
            <polygon points="18,22 12,12 24,16" fill="#FD3F01" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
            <polygon points="46,22 52,12 40,16" fill="#FD3F01" stroke="#010101" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        );

      // 7. Most Likely To... — Crown & pointing-finger spotlight emblem in #FEC90E & #0B89FD
      case 'most_likely_to':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Spotlight Beam Cone */}
            <polygon points="32,8 10,54 54,54" fill="#0B89FD" fillOpacity="0.2" stroke="#0B89FD" strokeWidth="2" />
            {/* Pointing Finger Silhouette */}
            <path
              d="M26 48 L26 36 C26 33, 29 33, 29 36 L29 26 C29 22, 33 22, 33 26 L33 48 Z"
              fill="#FFFFFF"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Floating Bauhaus Crown (#FEC90E) */}
            <polygon
              points="18,22 24,12 32,18 40,12 46,22"
              fill="#FEC90E"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="12" r="2" fill="#FD3F01" />
            <circle cx="32" cy="18" r="2" fill="#FD3F01" />
            <circle cx="40" cy="12" r="2" fill="#FD3F01" />
          </svg>
        );

      // 8. Sip or Spill — Crisp geometric cup with splash droplets in #0B89FD & #FD3F01
      case 'sip_or_spill':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Diagonal Straw */}
            <line x1="32" y1="36" x2="48" y2="8" stroke="#FD3F01" strokeWidth="4" strokeLinecap="round" />
            {/* Party Cup Body (#0B89FD) */}
            <polygon
              points="18,24 46,24 40,54 24,54"
              fill="#0B89FD"
              stroke="#010101"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Cup Rim Lip */}
            <rect x="16" y="21" width="32" height="4" rx="2" fill="#FFFFFF" stroke="#010101" strokeWidth="2" />
            {/* Liquid Surface Line */}
            <polygon points="20,32 44,32 40,52 24,52" fill="#FEC90E" fillOpacity="0.4" />
            {/* Splash Droplets (#FD3F01) */}
            <circle cx="14" cy="18" r="3" fill="#FD3F01" stroke="#010101" strokeWidth="1.5" />
            <circle cx="22" cy="12" r="2" fill="#FD3F01" />
            <circle cx="50" cy="22" r="2.5" fill="#0B89FD" stroke="#010101" strokeWidth="1.5" />
          </svg>
        );

      // 9. Silly Roulette — Segmented 4-color spinning wheel icon with #010101 pointer
      case 'silly_roulette':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Outer Wheel Ring with 4 Primary Segments */}
            {/* Top-Right: #0B89FD */}
            <path d="M32 32 L32 8 A24 24 0 0 1 56 32 Z" fill="#0B89FD" stroke="#010101" strokeWidth="2" />
            {/* Bottom-Right: #FEC90E */}
            <path d="M32 32 L56 32 A24 24 0 0 1 32 56 Z" fill="#FEC90E" stroke="#010101" strokeWidth="2" />
            {/* Bottom-Left: #FD3F01 */}
            <path d="M32 32 L32 56 A24 24 0 0 1 8 32 Z" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            {/* Top-Left: #F8F8F8 */}
            <path d="M32 32 L8 32 A24 24 0 0 1 32 8 Z" fill="#F8F8F8" stroke="#010101" strokeWidth="2" />
            {/* Outer Rim */}
            <circle cx="32" cy="32" r="24" stroke="#010101" strokeWidth="2.5" fill="none" />
            {/* Center Pivot Hub */}
            <circle cx="32" cy="32" r="6" fill="#010101" />
            <circle cx="32" cy="32" r="2.5" fill="#FFFFFF" />
            {/* Top Needle Pointer */}
            <polygon points="32,2 36,12 28,12" fill="#010101" stroke="#010101" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        );

      // 10. Hot Potato — Round arcade bomb with a sparking fuse in #010101 & #FD3F01
      case 'hot_potato':
        return (
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full shrink-0"
          >
            {/* Bomb Fuse curve */}
            <path d="M32 20 Q44 8, 48 12" stroke="#FEC90E" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Spark at fuse tip */}
            <polygon points="48,12 54,8 51,14 56,16 50,18 52,24 46,20 42,24 44,17 38,15 45,13" fill="#FD3F01" stroke="#010101" strokeWidth="1.5" />
            <circle cx="48" cy="14" r="2.5" fill="#FEC90E" />
            {/* Bomb Cap */}
            <rect x="26" y="20" width="12" height="6" rx="2" fill="#FD3F01" stroke="#010101" strokeWidth="2" />
            {/* Bomb Sphere */}
            <circle cx="32" cy="40" r="18" fill="#010101" stroke="#010101" strokeWidth="2.5" />
            {/* Glossy Reflection Arc */}
            <path d="M22 32 A12 12 0 0 1 34 26" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            {/* Skull or Alert badge on bomb */}
            <text x="32" y="45" fontSize="11" fontWeight="900" fill="#FD3F01" textAnchor="middle" fontFamily="monospace">
              8s
            </text>
          </svg>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center font-black text-xs text-[#010101]">
            🎮
          </div>
        );
    }
  };

  if (showContainer) {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] p-1 ${currentSize.box} ${className}`}
      >
        {renderSvg()}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${currentSize.box} ${className}`}>
      {renderSvg()}
    </div>
  );
};
