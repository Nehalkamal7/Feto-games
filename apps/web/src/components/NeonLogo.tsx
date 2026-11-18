'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NeonLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showSubtitle?: boolean;
}

export function NeonLogo({ size = 'md', className = '', showSubtitle = true }: NeonLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-4xl md:text-5xl',
    lg: 'text-6xl md:text-7xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 md:gap-4"
      >
        {/* NEON SVG CYBER GAMEPAD EMBLEM */}
        <div className={`relative ${iconSizes[size]} flex-shrink-0`}>
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]">
            <defs>
              <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="50%" stopColor="#FF007A" />
                <stop offset="100%" stopColor="#FFE600" />
              </linearGradient>
            </defs>
            {/* Hexagonal controller chassis */}
            <polygon
              points="50,6 92,28 92,72 50,94 8,72 8,28"
              stroke="url(#neonGrad)"
              strokeWidth="5"
              fill="#0B0E14"
              strokeLinejoin="round"
            />
            {/* D-Pad Cross Left */}
            <path
              d="M26 44H38M32 38V50"
              stroke="#00F0FF"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Diamond Action Buttons Right */}
            <circle cx="68" cy="40" r="3" fill="#FF007A" />
            <circle cx="76" cy="48" r="3" fill="#FFE600" />
            <circle cx="60" cy="48" r="3" fill="#00F0FF" />
            <circle cx="68" cy="56" r="3" fill="#00FF66" />
            {/* Center cyber lightning / heartbeat */}
            <path
              d="M46 54L54 46L48 44L52 38"
              stroke="#FFE600"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* NEON BRAND TYPOGRAPHY */}
        <div className="flex flex-col text-left">
          <div className={`${textSizes[size]} font-black tracking-tighter leading-none`}>
            <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">FETO </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 drop-shadow-[0_0_20px_rgba(255,0,122,0.6)]">
              GAMES
            </span>
          </div>
        </div>
      </motion.div>

      {showSubtitle && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[11px] md:text-xs font-bold uppercase tracking-[0.25em] text-cyan-300/80 mt-2 text-center"
        >
          Arcade Multiplayer Party Gaming
        </motion.div>
      )}
    </div>
  );
}
