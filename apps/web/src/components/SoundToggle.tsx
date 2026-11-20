'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/lib/sound';

export interface SoundToggleProps {
  className?: string;
}

export function SoundToggle({ className = '' }: SoundToggleProps) {
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  useEffect(() => {
    return sound.subscribe((muted) => setIsMuted(muted));
  }, []);

  const handleToggle = () => {
    const newState = sound.toggleMute();
    setIsMuted(newState);
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center shrink-0 rounded-xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-700 transition-all active:scale-95 ${
        isMuted ? 'text-gray-400 bg-gray-50' : 'text-gray-700'
      } ${className}`}
      title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
      aria-label="Toggle sound effects"
    >
      {isMuted ? (
        <VolumeX className="w-4 h-4 shrink-0 text-gray-400" strokeWidth={2} />
      ) : (
        <Volume2 className="w-4 h-4 shrink-0 text-gray-700" strokeWidth={2} />
      )}
    </button>
  );
}
