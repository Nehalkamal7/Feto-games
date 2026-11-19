'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Zap, Flame } from 'lucide-react';

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[480px] lg:max-w-[540px] aspect-square mx-auto flex items-center justify-center select-none pointer-events-none">
      {/* BACKGROUND AMBIENT RADIAL NEON GLOWS */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-cyan-500/20 to-pink-500/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute w-72 h-72 bg-cyan-400/20 rounded-full blur-2xl top-10 right-8" />
      <div className="absolute w-64 h-64 bg-feto-magenta/15 rounded-full blur-2xl bottom-10 left-8" />

      {/* FLOATING SLEEK PRO CONTROLLER ILLUSTRATION (NO ARC / NO SHAPES ABOVE) */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          rotate: [-1.5, 1.5, -1.5],
          scale: [0.99, 1.01, 0.99]
        }}
        transition={{
          repeat: Infinity,
          duration: 5.5,
          ease: 'easeInOut'
        }}
        className="relative z-10 w-full h-full flex items-center justify-center"
      >
        <svg
          viewBox="0 0 520 380"
          className="w-full h-full filter drop-shadow-[0_0_35px_rgba(56,242,255,0.45)]"
        >
          <defs>
            {/* Controller Metallic Chassis Gradients */}
            <linearGradient id="proBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#151b2e" />
              <stop offset="45%" stopColor="#0d1222" />
              <stop offset="100%" stopColor="#060914" />
            </linearGradient>

            <linearGradient id="proNeonContour" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38F2FF" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#FF007A" />
            </linearGradient>

            <linearGradient id="proGripTexture" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38F2FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38F2FF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="dpadCrossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e2742" />
              <stop offset="100%" stopColor="#0a0f1d" />
            </linearGradient>

            <linearGradient id="thumbstickDish" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a2035" />
              <stop offset="100%" stopColor="#070a14" />
            </linearGradient>

            {/* Glowing Drop Filter */}
            <filter id="proGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ======================================================== */}
          {/* 1. TOP SHOULDER BUMPERS & TRIGGERS (SLEEK HORIZONTAL)    */}
          {/* ======================================================== */}
          {/* Left Trigger (LT) */}
          <path
            d="M 125 78 C 125 58, 160 55, 185 58 L 180 78 Z"
            fill="#090d1a"
            stroke="#38F2FF"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Left Bumper (LB) */}
          <path
            d="M 115 85 C 115 72, 185 70, 205 78 L 195 98 C 175 92, 125 90, 115 85 Z"
            fill="#12182c"
            stroke="#38F2FF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Right Trigger (RT) */}
          <path
            d="M 395 78 C 395 58, 360 55, 335 58 L 340 78 Z"
            fill="#090d1a"
            stroke="#FF007A"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Right Bumper (RB) */}
          <path
            d="M 405 85 C 405 72, 335 70, 315 78 L 325 98 C 345 92, 395 90, 405 85 Z"
            fill="#12182c"
            stroke="#FF007A"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* ======================================================== */}
          {/* 2. MAIN ERGONOMIC TWIN-GRIP CONTROLLER CHASSIS           */}
          {/* ======================================================== */}
          <path
            d="M 195 98 
               C 220 90, 300 90, 325 98
               C 365 92, 420 105, 435 175
               C 455 240, 435 320, 395 345
               C 365 365, 335 330, 315 280
               C 295 240, 225 240, 205 280
               C 185 330, 155 365, 125 345
               C 85 320, 65 240, 85 175
               C 100 105, 155 92, 195 98 Z"
            fill="url(#proBodyGrad)"
            stroke="url(#proNeonContour)"
            strokeWidth="5"
            strokeLinejoin="round"
            filter="url(#proGlow)"
          />

          {/* Inner Accent Body Bezel */}
          <path
            d="M 205 108 
               C 225 102, 295 102, 315 108
               C 345 104, 395 118, 415 175
               C 430 225, 415 295, 385 325
               C 365 345, 345 320, 325 275
               C 305 228, 215 228, 195 275
               C 175 320, 155 345, 135 325
               C 105 295, 90 225, 105 175
               C 125 118, 175 104, 205 108 Z"
            fill="none"
            stroke="rgba(56, 242, 255, 0.25)"
            strokeWidth="1.5"
          />

          {/* Ergonomic Textured Side Grip Grooves (Left Grip) */}
          <g opacity="0.6">
            <line x1="88" y1="210" x2="108" y2="235" stroke="#38F2FF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="84" y1="235" x2="106" y2="260" stroke="#38F2FF" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="86" y1="260" x2="108" y2="285" stroke="#38F2FF" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Ergonomic Textured Side Grip Grooves (Right Grip) */}
          <g opacity="0.6">
            <line x1="432" y1="210" x2="412" y2="235" stroke="#FF007A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="436" y1="235" x2="414" y2="260" stroke="#FF007A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="434" y1="260" x2="412" y2="285" stroke="#FF007A" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* ======================================================== */}
          {/* 3. CENTER TOUCHPAD & FETO GAMES EMBLEM                   */}
          {/* ======================================================== */}
          <rect
            x="215"
            y="112"
            width="90"
            height="55"
            rx="10"
            fill="#090d1a"
            stroke="#A855F7"
            strokeWidth="2"
          />
          {/* Glowing Top Lightbar on Touchpad */}
          <line x1="225" y1="116" x2="295" y2="116" stroke="#38F2FF" strokeWidth="3" strokeLinecap="round" />

          {/* Center FETO GAMES Shield Icon */}
          <g transform="translate(245, 126)">
            <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
              <path
                d="M50 10 L88 26 L78 68 L50 94 L22 68 L12 26 Z"
                fill="none"
                stroke="#38F2FF"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <path
                d="M50 48 L64 36 L50 78 L36 36 Z"
                fill="#A855F7"
              />
            </svg>
          </g>

          {/* Center View & Menu Buttons */}
          <circle cx="198" cy="140" r="6" fill="#0c1224" stroke="#38F2FF" strokeWidth="1.5" />
          <circle cx="322" cy="140" r="6" fill="#0c1224" stroke="#A855F7" strokeWidth="1.5" />

          {/* 4-Dot LED Player Status Indicators */}
          <circle cx="242" cy="195" r="2.5" fill="#38F2FF" />
          <circle cx="250" cy="195" r="2.5" fill="#38F2FF" />
          <circle cx="258" cy="195" r="2.5" fill="#38F2FF" />
          <circle cx="266" cy="195" r="2.5" fill="#38F2FF" />

          {/* ======================================================== */}
          {/* 4. LEFT SIDE: CLEAN CROSS-SHAPED D-PAD                   */}
          {/* ======================================================== */}
          <g transform="translate(150, 160)">
            {/* D-Pad Base Cross */}
            <path
              d="M 12 0 H 26 V 12 H 38 V 26 H 26 V 38 H 12 V 26 H 0 V 12 H 12 Z"
              fill="url(#dpadCrossGrad)"
              stroke="#38F2FF"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Center Indentation */}
            <circle cx="19" cy="19" r="4" fill="#080c16" />
            {/* Directional Chevrons */}
            <polygon points="19,4 23,9 15,9" fill="#38F2FF" />
            <polygon points="19,34 23,29 15,29" fill="#38F2FF" />
            <polygon points="4,19 9,15 9,23" fill="#38F2FF" />
            <polygon points="34,19 29,15 29,23" fill="#38F2FF" />
          </g>

          {/* ======================================================== */}
          {/* 5. RIGHT SIDE: 4 DISTINCT GLOWING NEON ACTION BUTTONS    */}
          {/* ======================================================== */}
          <g transform="translate(340, 140)">
            {/* Diamond Background Base */}
            <circle cx="20" cy="40" r="38" fill="#090e1c" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />

            {/* Y BUTTON (TOP - NEON YELLOW/AMBER) */}
            <g transform="translate(20, 15)">
              <circle cx="0" cy="0" r="11" fill="#151b0a" stroke="#FFE600" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#FFE600" textAnchor="middle" fontFamily="sans-serif">Y</text>
            </g>

            {/* X BUTTON (LEFT - ELECTRIC CYAN) */}
            <g transform="translate(-5, 40)">
              <circle cx="0" cy="0" r="11" fill="#081822" stroke="#38F2FF" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#38F2FF" textAnchor="middle" fontFamily="sans-serif">X</text>
            </g>

            {/* B BUTTON (RIGHT - NEON MAGENTA/RED) */}
            <g transform="translate(45, 40)">
              <circle cx="0" cy="0" r="11" fill="#200816" stroke="#FF007A" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#FF007A" textAnchor="middle" fontFamily="sans-serif">B</text>
            </g>

            {/* A BUTTON (BOTTOM - TOXIC NEON GREEN) */}
            <g transform="translate(20, 65)">
              <circle cx="0" cy="0" r="11" fill="#081f0e" stroke="#39FF14" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#39FF14" textAnchor="middle" fontFamily="sans-serif">A</text>
            </g>
          </g>

          {/* ======================================================== */}
          {/* 6. DUAL ANALOG PRO THUMBSTICKS (SUBTLE ERGONOMIC)        */}
          {/* ======================================================== */}
          {/* Left Thumbstick (Ergonomic position below D-Pad) */}
          <g transform="translate(200, 245)">
            {/* Outer Glowing Base Ring */}
            <circle cx="0" cy="0" r="28" fill="#070a16" stroke="#38F2FF" strokeWidth="2.5" />
            {/* Concaved Rubber Dish */}
            <circle cx="0" cy="0" r="20" fill="url(#thumbstickDish)" stroke="#1a2744" strokeWidth="2" />
            <circle cx="0" cy="0" r="10" fill="#0b1020" stroke="#38F2FF" strokeWidth="1.5" strokeOpacity="0.8" />
            {/* Grip Directional Notches */}
            <circle cx="0" cy="-15" r="1.5" fill="#38F2FF" />
            <circle cx="0" cy="15" r="1.5" fill="#38F2FF" />
            <circle cx="-15" cy="0" r="1.5" fill="#38F2FF" />
            <circle cx="15" cy="0" r="1.5" fill="#38F2FF" />
          </g>

          {/* Right Thumbstick (Ergonomic position below Action Buttons) */}
          <g transform="translate(305, 245)">
            {/* Outer Glowing Base Ring */}
            <circle cx="0" cy="0" r="28" fill="#070a16" stroke="#A855F7" strokeWidth="2.5" />
            {/* Concaved Rubber Dish */}
            <circle cx="0" cy="0" r="20" fill="url(#thumbstickDish)" stroke="#271842" strokeWidth="2" />
            <circle cx="0" cy="0" r="10" fill="#0b1020" stroke="#A855F7" strokeWidth="1.5" strokeOpacity="0.8" />
            {/* Grip Directional Notches */}
            <circle cx="0" cy="-15" r="1.5" fill="#A855F7" />
            <circle cx="0" cy="15" r="1.5" fill="#A855F7" />
            <circle cx="-15" cy="0" r="1.5" fill="#A855F7" />
            <circle cx="15" cy="0" r="1.5" fill="#A855F7" />
          </g>
        </svg>

        {/* FLOATING ACTION PILLS AT FLANKS (CLEAN, ZERO SHAPES ON TOP) */}
        {/* Floating Pill: Imposter Mode (Left Flank) */}
        <motion.div
          animate={{
            y: [-4, 6, -4],
            x: [2, -2, 2]
          }}
          transition={{
            repeat: Infinity,
            duration: 4.5,
            ease: 'easeInOut'
          }}
          className="absolute bottom-6 -left-3 sm:-left-6 px-3 py-1.5 rounded-2xl glass-panel-neon border border-red-500/60 shadow-[0_0_18px_rgba(239,68,68,0.4)] flex items-center gap-2"
        >
          <div className="w-5 h-5 rounded-lg bg-red-600/30 border border-red-400 flex items-center justify-center text-xs">
            😈
          </div>
          <div className="text-left">
            <div className="text-[9px] font-black uppercase text-red-400 tracking-wider leading-none">PARTY MODE</div>
            <div className="text-xs font-black text-white leading-tight">Imposter Alert</div>
          </div>
        </motion.div>

        {/* Floating Pill: 15 Players (Right Flank) */}
        <motion.div
          animate={{
            y: [5, -5, 5],
            x: [-2, 2, -2]
          }}
          transition={{
            repeat: Infinity,
            duration: 5,
            delay: 0.8,
            ease: 'easeInOut'
          }}
          className="absolute bottom-4 -right-3 sm:-right-6 px-3 py-1.5 rounded-2xl glass-panel-neon border border-cyan-400/70 shadow-[0_0_18px_rgba(0,240,255,0.4)] flex items-center gap-2"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-feto-magenta flex items-center justify-center text-black font-black text-xs shadow-md">
            <Play className="w-3 h-3 fill-black ml-0.5" />
          </div>
          <div className="text-left">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none block">MATCH READY</span>
            <span className="text-xs font-black text-cyan-300 leading-tight">15 Players Sync</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
