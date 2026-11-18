'use client';

import React from 'react';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';

interface NeonAvatarDisplayProps {
  avatarId: NeonAvatarId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  isGlowing?: boolean;
  className?: string;
  isReady?: boolean;
}

const sizeClasses = {
  sm: 'w-10 h-10 text-xl',
  md: 'w-16 h-16 text-3xl',
  lg: 'w-24 h-24 text-5xl',
  xl: 'w-32 h-32 text-6xl'
};

export const NeonAvatarDisplay: React.FC<NeonAvatarDisplayProps> = ({
  avatarId,
  size = 'md',
  showGlow = true,
  isGlowing,
  className = '',
  isReady
}) => {
  const meta = NEON_AVATARS[avatarId] || NEON_AVATARS.cyber_cat;
  const shouldGlow = isGlowing !== undefined ? isGlowing : showGlow;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl transition-all duration-300 ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: '#0c0e1a',
        border: `2px solid ${isReady ? '#39FF14' : meta.primaryColor}`,
        boxShadow: shouldGlow
          ? `0 0 ${size === 'xl' ? '30px' : '18px'} ${isReady ? 'rgba(57, 255, 20, 0.6)' : meta.glowColor}`
          : 'none'
      }}
    >
      {/* Avatar Emoji / Graphic */}
      <span className="select-none transform hover:scale-110 transition-transform">
        {meta.emoji}
      </span>

      {/* Futuristic cyber corner brackets */}
      <div
        className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 pointer-events-none rounded-tl-sm opacity-80"
        style={{ borderColor: meta.primaryColor }}
      />
      <div
        className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 pointer-events-none rounded-br-sm opacity-80"
        style={{ borderColor: meta.primaryColor }}
      />
    </div>
  );
};
