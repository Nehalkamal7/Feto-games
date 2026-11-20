'use client';

import React from 'react';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { PlayerAvatar } from './PlayerAvatar';

export interface NeonAvatarDisplayProps {
  avatarId: NeonAvatarId;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  isGlowing?: boolean;
  className?: string;
  isReady?: boolean;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28'
};

const avatarSizeProp: Record<'sm' | 'md' | 'lg' | 'xl', 'sm' | 'md' | 'lg' | 'xl'> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
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
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl transition-all duration-200 ${sizeClasses[size]} ${
        isReady
          ? 'bg-emerald-50 border border-emerald-400 ring-2 ring-emerald-500/30 shadow-sm'
          : 'bg-white border border-gray-200 shadow-sm'
      } ${className}`}
      title={meta.name}
    >
      <PlayerAvatar
        avatarId={avatarId}
        size={avatarSizeProp[size]}
        isReady={isReady}
        showBorder={false}
        className="w-full h-full rounded-2xl p-1"
      />
    </div>
  );
};
