'use client';

import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '@/lib/sound';

interface SoundToggleProps {
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
      className={`p-2 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#FEC90E] transition-all active:translate-x-[1px] active:translate-y-[1px] ${
        isMuted ? 'opacity-60 text-[#737373]' : 'text-[#010101]'
      } ${className}`}
      title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
      aria-label="Toggle sound effects"
    >
      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}
