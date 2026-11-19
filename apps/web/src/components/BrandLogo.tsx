'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'nav' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showSubtitle?: boolean;
  animated?: boolean;
  href?: string;
  className?: string;
  onClick?: () => void;
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  showSubtitle = false,
  animated = true,
  href,
  className = '',
  onClick
}: BrandLogoProps) {
  // Dimensions for emblem
  const iconDimensions = {
    xs: { width: 28, height: 28 },
    sm: { width: 36, height: 36 },
    nav: { width: 44, height: 44 },
    md: { width: 56, height: 56 },
    lg: { width: 76, height: 76 },
    xl: { width: 104, height: 104 }
  }[size];

  // Text sizes for "FETO GAMES" wordmark
  const wordmarkStyles = {
    xs: 'text-base tracking-wider',
    sm: 'text-xl tracking-wider',
    nav: 'text-2xl sm:text-[26px] tracking-wide font-extrabold',
    md: 'text-3xl sm:text-4xl tracking-wider font-black',
    lg: 'text-5xl sm:text-6xl tracking-wider font-black',
    xl: 'text-6xl sm:text-7xl tracking-wider font-black'
  }[size];

  const content = (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 md:gap-4 select-none group cursor-pointer ${className}`}
    >
      {/* ============================================================== */}
      {/* 1. HIGH-PRECISION RECREATED FETO GAMES ESPORTS SHIELD EMBLEM  */}
      {/* ============================================================== */}
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
        whileHover={animated ? { scale: 1.05 } : undefined}
        whileTap={animated ? { scale: 0.96 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
      >
        <svg
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_14px_rgba(56,242,255,0.65)] group-hover:drop-shadow-[0_0_24px_rgba(168,85,247,0.85)] transition-all duration-300"
        >
          <defs>
            {/* Cyan-to-Electric-Purple Neon Wing Gradient */}
            <linearGradient id="fetoCyanPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38F2FF" />
              <stop offset="50%" stopColor="#00D2FF" />
              <stop offset="85%" stopColor="#8A2BE2" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>

            {/* Sharp Cyan Highlight Gradient */}
            <linearGradient id="fetoCyanGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#38F2FF" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#00B8D9" stopOpacity="0.4" />
            </linearGradient>

            {/* Deep Electric Purple Rim Gradient */}
            <linearGradient id="fetoPurpleRim" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="45%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>

            {/* Inner Dark Navy Shield Void */}
            <linearGradient id="fetoNavyPlate" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#0D1526" />
              <stop offset="100%" stopColor="#050811" />
            </linearGradient>

            {/* Subtle Neon Glow Filter */}
            <filter id="fetoNeonEmblemGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* LAYER 1: OUTER SHIELD CONTOUR & PURPLE GLOW RIM */}
          <path
            d="M80 18 L136 42 C140 68 135 106 102 136 L80 152 L58 136 C25 106 20 68 24 42 Z"
            fill="url(#fetoNavyPlate)"
            stroke="url(#fetoPurpleRim)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter="url(#fetoNeonEmblemGlow)"
            opacity="0.85"
          />

          {/* LAYER 2: SHARP TOP FLARING ESPORTS WINGS (CYAN TO PURPLE) */}
          {/* Left Wing Shoulder */}
          <path
            d="M20 44 L58 56 L54 68 L16 54 Z"
            fill="url(#fetoCyanPurple)"
            filter="drop-shadow(0 0 6px rgba(56,242,255,0.7))"
          />
          {/* Right Wing Shoulder */}
          <path
            d="M140 44 L102 56 L106 68 L144 54 Z"
            fill="url(#fetoCyanPurple)"
            filter="drop-shadow(0 0 6px rgba(56,242,255,0.7))"
          />

          {/* LAYER 3: TOP CHEVRON / APEX SHIELD CREST */}
          <path
            d="M80 26 L124 50 L114 62 L80 44 L46 62 L36 50 Z"
            fill="url(#fetoCyanPurple)"
          />
          <path
            d="M80 28 L122 51 L116 57 L80 43 L44 57 L38 51 Z"
            fill="url(#fetoCyanGloss)"
            opacity="0.75"
          />

          {/* LAYER 4: GEOMETRIC "F" MONOGRAM (LEFT WING) */}
          {/* Upper F Arm */}
          <path
            d="M44 68 L74 68 L70 80 L52 80 L50 90 L68 90 L64 102 L44 102 Z"
            fill="url(#fetoCyanPurple)"
          />
          {/* F Tech Slant Cut Accent */}
          <polygon points="56,72 70,72 68,77 54,77" fill="#FFFFFF" opacity="0.65" />

          {/* LAYER 5: GEOMETRIC "G" MONOGRAM (RIGHT WING) */}
          {/* Outer G Hook & Inward Bar */}
          <path
            d="M116 68 L86 68 L88 80 L108 80 L106 102 L92 102 L92 92 L102 92 L102 85 L84 85 L80 114 L116 114 Z"
            fill="url(#fetoCyanPurple)"
          />
          {/* G Tech Slant Cut Accent */}
          <polygon points="90,72 112,72 110,77 88,77" fill="#FFFFFF" opacity="0.65" />

          {/* LAYER 6: SHARP CENTER-BOTTOM NESTED V-TIP */}
          {/* Outer V Chevron */}
          <path
            d="M58 108 L80 144 L102 108 L92 108 L80 128 L68 108 Z"
            fill="url(#fetoCyanPurple)"
            filter="drop-shadow(0 0 8px rgba(168,85,247,0.9))"
          />

          {/* Inner Glowing Sharp V Apex */}
          <path
            d="M66 108 L80 133 L94 108 L86 108 L80 120 L74 108 Z"
            fill="#38F2FF"
            filter="drop-shadow(0 0 6px #38F2FF)"
          />
        </svg>

        {/* Ambient Subtle Pulsing Neon Aura */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl pointer-events-none -z-10"
            animate={{
              opacity: [0.35, 0.75, 0.35],
              scale: [0.95, 1.08, 0.95]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.div>

      {/* ============================================================== */}
      {/* 2. BOLD GEOMETRIC UPPERCASE "FETO GAMES" WORDMARK              */}
      {/* ============================================================== */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <motion.div
            className={`font-black tracking-[0.06em] text-[#38F2FF] uppercase select-none transition-all duration-300 ${wordmarkStyles}`}
            style={{
              textShadow:
                '0 0 10px rgba(56, 242, 255, 0.85), 0 0 24px rgba(56, 242, 255, 0.45), 0 0 45px rgba(0, 210, 255, 0.25)',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            whileHover={animated ? { scale: 1.02 } : undefined}
          >
            FETO GAMES
          </motion.div>

          {showSubtitle && size !== 'xs' && size !== 'sm' && size !== 'nav' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[10px] md:text-xs font-black uppercase tracking-[0.32em] text-cyan-300/80 mt-1 pl-0.5"
            >
              Esports Multiplayer Arcade
            </motion.div>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block outline-none focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
