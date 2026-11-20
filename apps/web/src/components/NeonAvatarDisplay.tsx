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
  className = '',
  isReady
}) => {
  const meta = NEON_AVATARS[avatarId] || NEON_AVATARS.cyber_cat;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl transition-all duration-150 ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: isReady ? '#0B89FD' : '#FFFFFF',
        border: '2px solid #010101',
        boxShadow: isReady ? '3px 3px 0px #010101' : '3px 3px 0px #010101'
      }}
    >
      {/* Avatar Emoji / Graphic */}
      <span className="select-none transform hover:scale-110 transition-transform font-emoji" role="img" aria-label={meta.label || 'Avatar'}>
        {meta.emoji}
      </span>

      {/* Bauhaus Geometric Corner Triangle Accent */}
      <div
        className="absolute top-0 right-0 w-3 h-3 pointer-events-none rounded-tr-xl"
        style={{
          background: isReady ? '#FEC90E' : '#0B89FD',
          clipPath: 'polygon(100% 0, 0 0, 100% 100%)'
        }}
      />
    </div>
  );
};
