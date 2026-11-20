'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[480px] lg:max-w-[540px] aspect-square mx-auto flex items-center justify-center select-none pointer-events-none">
      {/* GEOMETRIC BAUHAUS BACKGROUND ACCENT SHAPES */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        className="absolute w-72 h-72 rounded-full border-4 border-dashed border-[#FEC90E]/60 pointer-events-none -z-10"
      />
      <div className="absolute top-8 left-10 w-8 h-8 rounded-full bg-[#0B89FD] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] pointer-events-none" />
      <div className="absolute top-12 right-12 w-9 h-9 rotate-12 bg-[#FD3F01] border-2 border-[#010101] shadow-[3px_3px_0px_#010101] pointer-events-none" />
      <div className="absolute bottom-12 left-12 w-7 h-7 -rotate-12 bg-[#FEC90E] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] pointer-events-none" />

      {/* FLOATING BAUHAUS PRO CONTROLLER */}
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
          className="w-full h-full filter drop-shadow-[6px_6px_0px_#010101]"
        >
          {/* ======================================================== */}
          {/* 1. TOP SHOULDER BUMPERS & TRIGGERS                        */}
          {/* ======================================================== */}
          {/* Left Trigger (LT) */}
          <path
            d="M 125 78 C 125 58, 160 55, 185 58 L 180 78 Z"
            fill="#010101"
            stroke="#010101"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Left Bumper (LB) */}
          <path
            d="M 115 85 C 115 72, 185 70, 205 78 L 195 98 C 175 92, 125 90, 115 85 Z"
            fill="#0B89FD"
            stroke="#010101"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Right Trigger (RT) */}
          <path
            d="M 395 78 C 395 58, 360 55, 335 58 L 340 78 Z"
            fill="#010101"
            stroke="#010101"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Right Bumper (RB) */}
          <path
            d="M 405 85 C 405 72, 335 70, 315 78 L 325 98 C 345 92, 395 90, 405 85 Z"
            fill="#FD3F01"
            stroke="#010101"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* ======================================================== */}
          {/* 2. MAIN ERGONOMIC TWIN-GRIP CONTROLLER CHASSIS           */}
          {/* ======================================================== */}
          {/* Controller Body in Pure Crisp White with 5px Jet Black Outline */}
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
            fill="#FFFFFF"
            stroke="#010101"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Inner Geometric Contour Bezel */}
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
            stroke="#010101"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Left Grip Bauhaus Accents (Electric Blue Stripes) */}
          <g>
            <line x1="88" y1="210" x2="110" y2="235" stroke="#0B89FD" strokeWidth="4" strokeLinecap="round" />
            <line x1="84" y1="235" x2="108" y2="260" stroke="#0B89FD" strokeWidth="4" strokeLinecap="round" />
            <line x1="86" y1="260" x2="110" y2="285" stroke="#0B89FD" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Right Grip Bauhaus Accents (Red-Orange Stripes) */}
          <g>
            <line x1="432" y1="210" x2="410" y2="235" stroke="#FD3F01" strokeWidth="4" strokeLinecap="round" />
            <line x1="436" y1="235" x2="412" y2="260" stroke="#FD3F01" strokeWidth="4" strokeLinecap="round" />
            <line x1="434" y1="260" x2="410" y2="285" stroke="#FD3F01" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* ======================================================== */}
          {/* 3. CENTER TOUCHPAD & FETO GAMES EMBLEM                   */}
          {/* ======================================================== */}
          <rect
            x="215"
            y="112"
            width="90"
            height="55"
            rx="8"
            fill="#F8F8F8"
            stroke="#010101"
            strokeWidth="3"
          />
          {/* Electric Blue Top Lightbar on Touchpad */}
          <line x1="225" y1="117" x2="295" y2="117" stroke="#0B89FD" strokeWidth="4" strokeLinecap="round" />

          {/* Center Geometric Shield Emblem */}
          <g transform="translate(245, 126)">
            <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
              <path
                d="M50 10 L88 26 L78 68 L50 94 L22 68 L12 26 Z"
                fill="#FFFFFF"
                stroke="#010101"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <path d="M50 14 L24 28 L50 48 Z" fill="#0B89FD" stroke="#010101" strokeWidth="3" />
              <path d="M50 14 L76 28 L50 48 Z" fill="#FEC90E" stroke="#010101" strokeWidth="3" />
              <path d="M50 48 L76 28 L72 65 L50 90 Z" fill="#FD3F01" stroke="#010101" strokeWidth="3" />
              <path d="M50 48 L24 28 L28 65 L50 90 Z" fill="#010101" stroke="#010101" strokeWidth="3" />
            </svg>
          </g>

          {/* View & Menu Buttons */}
          <circle cx="198" cy="140" r="6" fill="#F8F8F8" stroke="#010101" strokeWidth="2.5" />
          <circle cx="322" cy="140" r="6" fill="#F8F8F8" stroke="#010101" strokeWidth="2.5" />

          {/* 4-Dot LED Player Status Indicators */}
          <circle cx="242" cy="195" r="3" fill="#0B89FD" stroke="#010101" strokeWidth="1" />
          <circle cx="250" cy="195" r="3" fill="#FEC90E" stroke="#010101" strokeWidth="1" />
          <circle cx="258" cy="195" r="3" fill="#FD3F01" stroke="#010101" strokeWidth="1" />
          <circle cx="266" cy="195" r="3" fill="#010101" stroke="#010101" strokeWidth="1" />

          {/* ======================================================== */}
          {/* 4. LEFT SIDE: CLEAN CROSS-SHAPED D-PAD                   */}
          {/* ======================================================== */}
          <g transform="translate(150, 160)">
            {/* D-Pad Base Cross in Jet Black */}
            <path
              d="M 12 0 H 26 V 12 H 38 V 26 H 26 V 38 H 12 V 26 H 0 V 12 H 12 Z"
              fill="#010101"
              stroke="#010101"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Center Indentation */}
            <circle cx="19" cy="19" r="4" fill="#FFFFFF" />
            {/* Directional Chevrons */}
            <polygon points="19,4 23,9 15,9" fill="#FFFFFF" />
            <polygon points="19,34 23,29 15,29" fill="#FFFFFF" />
            <polygon points="4,19 9,15 9,23" fill="#FFFFFF" />
            <polygon points="34,19 29,15 29,23" fill="#FFFFFF" />
          </g>

          {/* ======================================================== */}
          {/* 5. RIGHT SIDE: 4 BAUHAUS PRIMARY ACTION BUTTONS          */}
          {/* ======================================================== */}
          <g transform="translate(340, 140)">
            {/* Base */}
            <circle cx="20" cy="40" r="38" fill="#F8F8F8" stroke="#010101" strokeWidth="2.5" />

            {/* Y BUTTON (TOP - VIBRANT YELLOW) */}
            <g transform="translate(20, 15)">
              <circle cx="0" cy="0" r="11" fill="#FEC90E" stroke="#010101" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#010101" textAnchor="middle" fontFamily="sans-serif">Y</text>
            </g>

            {/* X BUTTON (LEFT - ELECTRIC BLUE) */}
            <g transform="translate(-5, 40)">
              <circle cx="0" cy="0" r="11" fill="#0B89FD" stroke="#010101" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">X</text>
            </g>

            {/* B BUTTON (RIGHT - RED-ORANGE) */}
            <g transform="translate(45, 40)">
              <circle cx="0" cy="0" r="11" fill="#FD3F01" stroke="#010101" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">B</text>
            </g>

            {/* A BUTTON (BOTTOM - JET BLACK) */}
            <g transform="translate(20, 65)">
              <circle cx="0" cy="0" r="11" fill="#010101" stroke="#010101" strokeWidth="2.5" />
              <text x="0" y="4.5" fontSize="12" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="sans-serif">A</text>
            </g>
          </g>

          {/* ======================================================== */}
          {/* 6. DUAL ANALOG PRO THUMBSTICKS                           */}
          {/* ======================================================== */}
          {/* Left Thumbstick */}
          <g transform="translate(200, 245)">
            <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="#010101" strokeWidth="3" />
            <circle cx="0" cy="0" r="20" fill="#F8F8F8" stroke="#010101" strokeWidth="2" />
            <circle cx="0" cy="0" r="10" fill="#0B89FD" stroke="#010101" strokeWidth="2" />
          </g>

          {/* Right Thumbstick */}
          <g transform="translate(305, 245)">
            <circle cx="0" cy="0" r="28" fill="#FFFFFF" stroke="#010101" strokeWidth="3" />
            <circle cx="0" cy="0" r="20" fill="#F8F8F8" stroke="#010101" strokeWidth="2" />
            <circle cx="0" cy="0" r="10" fill="#FEC90E" stroke="#010101" strokeWidth="2" />
          </g>
        </svg>

        {/* FLOATING ACTION PILLS AT FLANKS (BAUHAUS NEO-BRUTALIST CARDS) */}
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
          className="absolute bottom-6 -left-3 sm:-left-6 px-3 py-1.5 rounded-2xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[3px_3px_0px_#010101] flex items-center gap-2 pointer-events-auto"
        >
          <div className="w-5 h-5 rounded-lg bg-[#FD3F01] text-white flex items-center justify-center text-xs font-black">
            😈
          </div>
          <div className="text-left">
            <div className="text-[9px] font-black uppercase text-[#FD3F01] tracking-wider leading-none">PARTY MODE</div>
            <div className="text-xs font-black text-[#010101] leading-tight">Imposter Alert</div>
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
          className="absolute bottom-4 -right-3 sm:-right-6 px-3 py-1.5 rounded-2xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[3px_3px_0px_#010101] flex items-center gap-2 pointer-events-auto"
        >
          <div className="w-6 h-6 rounded-full bg-[#0B89FD] flex items-center justify-center text-white font-black text-xs border border-[#010101]">
            <Play className="w-3 h-3 fill-white ml-0.5" />
          </div>
          <div className="text-left">
            <span className="text-[9px] font-black text-[#525252] uppercase tracking-wider leading-none block">MATCH READY</span>
            <span className="text-xs font-black text-[#010101] leading-tight">15 Players Sync</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
