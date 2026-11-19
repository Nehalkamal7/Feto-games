'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NeonLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'nav';
  className?: string;
  showSubtitle?: boolean;
}

export function NeonLogo({ size = 'md', className = '', showSubtitle = true }: NeonLogoProps) {
  const iconSizes = {
    nav: 'w-9 h-9',
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const fetoTextSizes = {
    nav: 'text-2xl',
    sm: 'text-2xl sm:text-3xl',
    md: 'text-4xl md:text-5xl',
    lg: 'text-6xl md:text-7xl'
  };

  const gamesTextSizes = {
    nav: 'text-2xl',
    sm: 'text-2xl sm:text-3xl',
    md: 'text-4xl md:text-5xl',
    lg: 'text-6xl md:text-7xl'
  };

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-3 sm:gap-3.5"
      >
        {/* GLOWING CYAN / PURPLE CYBER-SHIELD EMBLEM */}
        <div className={`relative ${iconSizes[size]} flex-shrink-0 group`}>
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full filter drop-shadow-[0_0_18px_rgba(0,240,255,0.7)] group-hover:drop-shadow-[0_0_25px_rgba(168,85,247,0.9)] transition-all duration-300"
          >
            <defs>
              <linearGradient id="shieldBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="50%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#FF007A" />
              </linearGradient>
              <linearGradient id="shieldBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F172A" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#060812" stopOpacity="0.95" />
              </linearGradient>
              <filter id="neonShieldGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Cyber Shield / Hexagon Outer Frame */}
            <path
              d="M50 4 L90 20 L84 68 L50 96 L16 68 L10 20 Z"
              fill="url(#shieldBgGrad)"
              stroke="url(#shieldBorderGrad)"
              strokeWidth="4"
              strokeLinejoin="round"
              filter="url(#neonShieldGlow)"
            />

            {/* Inner Cyber Circuit Accent Lines */}
            <path
              d="M50 14 L80 26 L76 64 L50 86 L24 64 L20 26 Z"
              stroke="#00F0FF"
              strokeWidth="1.2"
              strokeOpacity="0.35"
              fill="none"
            />

            {/* Controller Icon Inside Shield */}
            <g transform="translate(23, 26) scale(0.54)">
              {/* Controller Body Chassis */}
              <path
                d="M16 48 C 10 28, 28 14, 50 14 C 72 14, 90 28, 84 48 L 92 84 C 95 96, 78 108, 62 96 L 46 82 L 36 82 L 20 96 C 4 108, -13 96, -10 84 Z"
                fill="#121829"
                stroke="url(#shieldBorderGrad)"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              {/* D-Pad on Left */}
              <path
                d="M 12 40 H 28 M 20 32 V 48"
                stroke="#00F0FF"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Action Buttons on Right */}
              <circle cx="68" cy="34" r="3.5" fill="#FF007A" />
              <circle cx="60" cy="42" r="3.5" fill="#00F0FF" />
              <circle cx="76" cy="42" r="3.5" fill="#FFE600" />
              <circle cx="68" cy="50" r="3.5" fill="#39FF14" />
              {/* Center Cyber Heartbeat / Play Accent */}
              <polygon points="41,36 47,42 41,48" fill="#A855F7" />
            </g>
          </svg>
        </div>

        {/* BOLD FUTURISTIC ITALIC TYPOGRAPHY */}
        <div className="flex items-center leading-none tracking-tight">
          <span
            className={`${fetoTextSizes[size]} font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-cyan-400 to-cyan-500 drop-shadow-[0_0_16px_rgba(0,240,255,0.85)] pr-1.5`}
          >
            FETO
          </span>
          <span
            className={`${gamesTextSizes[size]} font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-feto-magenta to-cyan-400 drop-shadow-[0_0_18px_rgba(168,85,247,0.85)]`}
          >
            GAMES
          </span>
        </div>
      </motion.div>

      {showSubtitle && size !== 'nav' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-cyan-300/80 mt-1 pl-1"
        >
          Esports Multiplayer Party Hub
        </motion.div>
      )}
    </div>
  );
}
