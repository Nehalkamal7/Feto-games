'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-[420px] lg:max-w-[480px] aspect-square mx-auto flex items-center justify-center select-none pointer-events-none">
      {/* Soft Blurred Ambient Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-blue-100/60 blur-3xl -z-10" />
      <div className="absolute w-48 h-48 rounded-full bg-amber-100/40 blur-2xl top-10 right-10 -z-10" />

      {/* Floating Modern Controller Device */}
      <motion.div
        animate={{
          y: [-6, 6, -6],
          rotate: [-1, 1, -1]
        }}
        transition={{
          repeat: Infinity,
          duration: 6,
          ease: 'easeInOut'
        }}
        className="relative z-10 w-full h-full flex items-center justify-center p-4"
      >
        <svg
          viewBox="0 0 500 360"
          className="w-full h-full filter drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Outer Soft Glow */}
          <rect x="90" y="80" width="320" height="200" rx="36" fill="#FFFFFF" fillOpacity="0.4" />

          {/* Controller Body */}
          <path
            d="M 170 85 
               C 210 92, 290 92, 330 85
               C 385 75, 435 125, 425 210
               C 415 285, 365 315, 320 280
               C 285 250, 215 250, 180 280
               C 135 315, 85 285, 75 210
               C 65 125, 115 75, 170 85 Z"
            fill="#FFFFFF"
            stroke="#E5E7EB"
            strokeWidth="2"
          />

          {/* Left Grip Accent */}
          <path
            d="M 100 170 C 95 215, 120 260, 150 270 C 130 250, 110 215, 110 170 Z"
            fill="#EFF6FF"
          />

          {/* Right Grip Accent */}
          <path
            d="M 400 170 C 405 215, 380 260, 350 270 C 370 250, 390 215, 390 170 Z"
            fill="#EFF6FF"
          />

          {/* Left D-Pad */}
          <rect x="145" y="145" width="40" height="40" rx="10" fill="#F3F4F6" />
          <rect x="160" y="135" width="10" height="60" rx="3" fill="#D1D5DB" />
          <rect x="135" y="160" width="60" height="10" rx="3" fill="#D1D5DB" />

          {/* Right Action Buttons */}
          <circle cx="345" cy="140" r="11" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <text x="345" y="144" textAnchor="middle" fill="#2563EB" fontSize="11" fontWeight="800" fontFamily="sans-serif">Y</text>

          <circle cx="370" cy="165" r="11" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1.5" />
          <text x="370" y="169" textAnchor="middle" fill="#EF4444" fontSize="11" fontWeight="800" fontFamily="sans-serif">B</text>

          <circle cx="345" cy="190" r="11" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />
          <text x="345" y="194" textAnchor="middle" fill="#10B981" fontSize="11" fontWeight="800" fontFamily="sans-serif">A</text>

          <circle cx="320" cy="165" r="11" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1.5" />
          <text x="320" y="169" textAnchor="middle" fill="#2563EB" fontSize="11" fontWeight="800" fontFamily="sans-serif">X</text>

          {/* Center Brand Badge Display */}
          <rect x="215" y="130" width="70" height="44" rx="12" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="1.5" />
          <circle cx="250" cy="152" r="12" fill="#2563EB" />
          <polygon points="247,146 257,152 247,158" fill="#FFFFFF" />

          {/* Thumbsticks */}
          <circle cx="205" cy="205" r="22" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
          <circle cx="205" cy="205" r="14" fill="#E5E7EB" />

          <circle cx="295" cy="205" r="22" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="2" />
          <circle cx="295" cy="205" r="14" fill="#E5E7EB" />
        </svg>
      </motion.div>
    </div>
  );
}
