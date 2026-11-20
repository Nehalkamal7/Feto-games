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
    sm: { width: 34, height: 34 },
    nav: { width: 42, height: 42 },
    md: { width: 52, height: 52 },
    lg: { width: 72, height: 72 },
    xl: { width: 96, height: 96 }
  }[size];

  // Text sizes for "FETO GAMES" wordmark
  const wordmarkStyles = {
    xs: 'text-base tracking-tight',
    sm: 'text-xl tracking-tight',
    nav: 'text-2xl sm:text-[25px] tracking-tight font-black',
    md: 'text-3xl sm:text-4xl tracking-tight font-black',
    lg: 'text-5xl sm:text-6xl tracking-tight font-black',
    xl: 'text-6xl sm:text-7xl tracking-tight font-black'
  }[size];

  const content = (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none group cursor-pointer ${className}`}
    >
      {/* ============================================================== */}
      {/* 1. BOLD BAUHAUS GEOMETRIC PRIMARY-COLOR EMBLEM                */}
      {/* ============================================================== */}
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
        whileHover={animated ? { scale: 1.05, rotate: -2 } : undefined}
        whileTap={animated ? { scale: 0.95 } : undefined}
        transition={{ type: 'spring', stiffness: 450, damping: 20 }}
      >
        <svg
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[3px_3px_0px_#010101]"
        >
          {/* HARD OFFSET BASE SHADOW (BAUHAUS HARD EDGE) */}
          <path
            d="M80 14 L142 42 C146 72 138 112 104 142 L80 156 L56 142 C22 112 14 72 18 42 Z"
            fill="#010101"
            transform="translate(4, 4)"
          />

          {/* MAIN WHITE EMBLEM SHIELD BODY */}
          <path
            d="M80 14 L142 42 C146 72 138 112 104 142 L80 156 L56 142 C22 112 14 72 18 42 Z"
            fill="#FFFFFF"
            stroke="#010101"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* TOP CHEVRON: VIBRANT GOLD/YELLOW (#FEC90E) */}
          <path
            d="M80 20 L134 46 L120 62 L80 42 L40 62 L26 46 Z"
            fill="#FEC90E"
            stroke="#010101"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* LEFT WING / FACET: ELECTRIC BLUE (#0B89FD) */}
          <path
            d="M34 56 L76 72 L76 112 L44 98 C36 84 34 70 34 56 Z"
            fill="#0B89FD"
            stroke="#010101"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* RIGHT WING / FACET: ARCADE RED-ORANGE (#FD3F01) */}
          <path
            d="M126 56 L84 72 L84 112 L116 98 C124 84 126 70 126 56 Z"
            fill="#FD3F01"
            stroke="#010101"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* CENTER CONTROLLER / MONOGRAM GEOMETRIC APEX */}
          <circle cx="80" cy="84" r="16" fill="#FFFFFF" stroke="#010101" strokeWidth="4" />
          {/* D-Pad Center Cross */}
          <rect x="76" y="74" width="8" height="20" rx="2" fill="#010101" />
          <rect x="70" y="80" width="20" height="8" rx="2" fill="#010101" />

          {/* BOTTOM V-TIP: ELECTRIC BLUE (#0B89FD) WITH JET BLACK BORDER */}
          <path
            d="M60 112 L80 146 L100 112 L80 124 Z"
            fill="#0B89FD"
            stroke="#010101"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>

      {/* ============================================================== */}
      {/* 2. BOLD UPPERCASE "FETO GAMES" BAUHAUS WORDMARK                */}
      {/* ============================================================== */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`font-black uppercase select-none flex items-center gap-1.5 ${wordmarkStyles}`}>
            <span className="text-[#010101] tracking-tight">FETO</span>
            <span className="text-[#0B89FD] tracking-tight">GAMES</span>
            {/* Geometric Bauhaus Yellow Dot Accent */}
            <span className="w-2.5 h-2.5 rounded-full bg-[#FEC90E] border-2 border-[#010101] inline-block ml-0.5 shadow-[1px_1px_0px_#010101]" />
          </div>

          {showSubtitle && size !== 'xs' && size !== 'sm' && (
            <div className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#010101]/70 mt-1 pl-0.5 flex items-center gap-1.5">
              <span>PARTY ARCADE</span>
              <span className="text-[#FD3F01]">•</span>
              <span className="text-[#0B89FD]">15 PLAYERS</span>
            </div>
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
