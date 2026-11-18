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
      className={`p-2 rounded-xl glass-panel border border-cyan-500/30 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-all shadow-sm ${
        isMuted ? 'opacity-60 text-slate-500' : 'text-cyan-400 shadow-neon-cyan'
      } ${className}`}
      title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
      aria-label="Toggle sound effects"
    >
      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
    </button>
  );
}
