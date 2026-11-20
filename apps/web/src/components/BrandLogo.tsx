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
  const iconDimensions = {
    xs: { width: 24, height: 24 },
    sm: { width: 28, height: 28 },
    nav: { width: 34, height: 34 },
    md: { width: 42, height: 42 },
    lg: { width: 56, height: 56 },
    xl: { width: 72, height: 72 }
  }[size];

  const wordmarkStyles = {
    xs: 'text-sm font-bold tracking-tight',
    sm: 'text-base font-bold tracking-tight',
    nav: 'text-xl font-extrabold tracking-tight',
    md: 'text-2xl font-extrabold tracking-tight',
    lg: 'text-4xl font-black tracking-tight',
    xl: 'text-5xl font-black tracking-tight'
  }[size];

  const content = (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 sm:gap-2.5 select-none cursor-pointer ${className}`}
    >
      {/* Sleek Modern Emblem */}
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: iconDimensions.width, height: iconDimensions.height }}
        whileHover={animated ? { scale: 1.05 } : undefined}
        whileTap={animated ? { scale: 0.95 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Background Rounded Shield / Tile */}
          <rect
            x="2"
            y="2"
            width="44"
            height="44"
            rx="12"
            fill="url(#logo_grad)"
          />
          {/* Sleek Inner Controller / Play Geometry */}
          <path
            d="M17 18C17 15.7909 18.7909 14 21 14H27C29.2091 14 31 15.7909 31 18V30C31 32.2091 29.2091 34 27 34H21C18.7909 34 17 32.2091 17 30V18Z"
            fill="#FFFFFF"
            fillOpacity="0.15"
          />
          {/* Modern D-pad / Geometric Spark */}
          <rect x="22" y="15" width="4" height="18" rx="2" fill="#FFFFFF" />
          <rect x="15" y="22" width="18" height="4" rx="2" fill="#FFFFFF" />
          {/* Subtle Dot Accent */}
          <circle cx="33" cy="15" r="2.5" fill="#FBBF24" />

          <defs>
            <linearGradient id="logo_grad" x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563EB" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Modern Wordmark */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`select-none flex items-center gap-1 ${wordmarkStyles}`}>
            <span className="text-gray-900 font-extrabold tracking-tight">FETO</span>
            <span className="text-blue-600 font-extrabold tracking-tight">GAMES</span>
          </div>

          {showSubtitle && size !== 'xs' && size !== 'sm' && (
            <div className="text-[10px] font-semibold tracking-wider text-gray-500 mt-0.5">
              PARTY ARCADE
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
