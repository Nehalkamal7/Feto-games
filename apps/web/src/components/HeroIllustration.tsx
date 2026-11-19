'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Play, Zap, Flame, MessageSquare } from 'lucide-react';

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[480px] lg:max-w-[540px] aspect-square mx-auto flex items-center justify-center select-none pointer-events-none">
      {/* BACKGROUND AMBIENT RADIAL NEON GLOWS */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-cyan-500/20 to-pink-500/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-72 h-72 bg-cyan-400/25 rounded-full blur-2xl top-10 right-8" />
      <div className="absolute w-64 h-64 bg-feto-magenta/20 rounded-full blur-2xl bottom-10 left-8" />

      {/* FLOATING 3D CYBER CONTROLLER ILLUSTRATION */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          rotate: [-2, 3, -2],
          scale: [0.98, 1.02, 0.98]
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: 'easeInOut'
        }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 500 500"
          className="w-full h-full filter drop-shadow-[0_0_35px_rgba(0,240,255,0.65)]"
        >
          <defs>
            <linearGradient id="heroCtrlBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e183a" />
              <stop offset="50%" stopColor="#0e1329" />
              <stop offset="100%" stopColor="#070a18" />
            </linearGradient>

            <linearGradient id="heroCtrlNeon" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#FF007A" />
            </linearGradient>

            <linearGradient id="dpadGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#0072FF" />
            </linearGradient>

            <filter id="heroGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Futuristic Cyber Orbit Rings */}
          <circle
            cx="250"
            cy="250"
            r="190"
            stroke="url(#heroCtrlNeon)"
            strokeWidth="1.5"
            strokeDasharray="12 18"
            strokeOpacity="0.4"
            fill="none"
          />
          <circle
            cx="250"
            cy="250"
            r="215"
            stroke="#00F0FF"
            strokeWidth="1"
            strokeDasharray="6 24"
            strokeOpacity="0.25"
            fill="none"
          />

          {/* Isometric Controller Chassis */}
          <g filter="url(#heroGlowFilter)">
            <path
              d="M 120 180 C 90 120, 160 80, 250 80 C 340 80, 410 120, 380 180 L 415 320 C 430 370, 370 410, 320 370 L 280 320 L 220 320 L 180 370 C 130 410, 70 370, 85 320 Z"
              fill="url(#heroCtrlBody)"
              stroke="url(#heroCtrlNeon)"
              strokeWidth="6"
              strokeLinejoin="round"
            />

            {/* Inner Grip Grip Grooves */}
            <path
              d="M 105 270 Q 130 330 160 350"
              stroke="#00F0FF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeOpacity="0.7"
              fill="none"
            />
            <path
              d="M 395 270 Q 370 330 340 350"
              stroke="#FF007A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeOpacity="0.7"
              fill="none"
            />

            {/* Thumbsticks (Dual Glowing Orbs) */}
            <circle cx="180" cy="270" r="26" fill="#080c1a" stroke="#00F0FF" strokeWidth="3.5" />
            <circle cx="180" cy="270" r="14" fill="#00F0FF" fillOpacity="0.8" />

            <circle cx="320" cy="270" r="26" fill="#080c1a" stroke="#A855F7" strokeWidth="3.5" />
            <circle cx="320" cy="270" r="14" fill="#A855F7" fillOpacity="0.8" />

            {/* Neon D-Pad on Left */}
            <path
              d="M 140 190 H 180 M 160 170 V 210"
              stroke="url(#dpadGlow)"
              strokeWidth="10"
              strokeLinecap="round"
            />

            {/* Neon Quad Action Buttons on Right */}
            <circle cx="340" cy="165" r="9" fill="#FF007A" />
            <circle cx="315" cy="190" r="9" fill="#00F0FF" />
            <circle cx="365" cy="190" r="9" fill="#FFE600" />
            <circle cx="340" cy="215" r="9" fill="#39FF14" />

            {/* Center Touchpad & Illuminated Brand Emblem */}
            <rect
              x="215"
              y="140"
              width="70"
              height="48"
              rx="12"
              fill="#060914"
              stroke="#A855F7"
              strokeWidth="2.5"
            />
            <polygon points="244,152 260,164 244,176" fill="#00F0FF" />
          </g>
        </svg>

        {/* FLOATING INTERACTIVE CHAT BUBBLE 1: IMPOSTER */}
        <motion.div
          animate={{
            y: [-6, 8, -6],
            x: [2, -4, 2]
          }}
          transition={{
            repeat: Infinity,
            duration: 4.5,
            ease: 'easeInOut'
          }}
          className="absolute -top-3 left-2 sm:left-4 px-3.5 py-2 rounded-2xl glass-panel-neon border border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded-lg bg-red-600/40 border border-red-400 flex items-center justify-center text-xs">
            😈
          </div>
          <div className="text-left">
            <div className="text-[10px] font-black uppercase text-red-400 tracking-wider">ALERT</div>
            <div className="text-xs font-black text-white">Imposter Caught!</div>
          </div>
        </motion.div>

        {/* FLOATING CHAT BUBBLE 2: GUESS STREAK */}
        <motion.div
          animate={{
            y: [8, -8, 8],
            x: [-3, 3, -3]
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            delay: 0.6,
            ease: 'easeInOut'
          }}
          className="absolute top-12 -right-4 sm:-right-6 px-3.5 py-2 rounded-2xl glass-panel-neon border border-cyan-400/80 shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center gap-2"
        >
          <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-bounce" />
          <div className="text-left">
            <div className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">SPEED BONUS</div>
            <div className="text-xs font-black text-white">+500 PTS</div>
          </div>
        </motion.div>

        {/* FLOATING PLAY BADGE 3: 15-PLAYER SYNC */}
        <motion.div
          animate={{
            y: [-5, 6, -5]
          }}
          transition={{
            repeat: Infinity,
            duration: 3.8,
            delay: 1.2,
            ease: 'easeInOut'
          }}
          className="absolute -bottom-4 right-8 sm:right-12 px-4 py-2 rounded-2xl glass-panel-neon border border-purple-500/80 shadow-[0_0_22px_rgba(168,85,247,0.5)] flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-400 to-feto-magenta flex items-center justify-center text-black font-black text-xs shadow-md">
            <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">MATCH ACTIVE</span>
            <span className="text-xs font-black text-white">15 Players Ready</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
