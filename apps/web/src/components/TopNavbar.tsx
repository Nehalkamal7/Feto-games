'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Info, Gamepad2, Trophy } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { SoundToggle } from './SoundToggle';
import { sound } from '@/lib/sound';

interface TopNavbarProps {
  onlinePlayersCount: number;
  onOpenLeaderboard: () => void;
  onOpenAbout: () => void;
  onScrollToGames: () => void;
  onOpenDecks?: () => void;
}

export function TopNavbar({
  onlinePlayersCount,
  onOpenLeaderboard,
  onOpenAbout,
  onScrollToGames,
  onOpenDecks: _onOpenDecks
}: TopNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-white/90 backdrop-blur-md rounded-2xl px-4 sm:px-6 py-3 mb-6 sm:mb-8 border border-gray-200/80 shadow-sm relative z-30">
      <div className="flex items-center justify-between">
        {/* LEFT: CLEAN LOGO */}
        <div className="flex items-center">
          <BrandLogo size="nav" showSubtitle={false} />
        </div>

        {/* CENTER: DESKTOP NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => {
              sound.playClick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100/70 transition-all"
          >
            Home
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onScrollToGames();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50/70 transition-all flex items-center gap-1.5"
          >
            <Gamepad2 className="w-4 h-4 text-blue-600" />
            <span>Party Games</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-amber-600 hover:bg-amber-50/70 transition-all flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAbout();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100/70 transition-all flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-gray-500" />
            <span>About</span>
          </button>
        </div>

        {/* RIGHT: LIVE PLAYERS BADGE & SOUND CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clean Live Players Pill */}
          <div className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <div className="text-xs font-medium text-emerald-800 flex items-center gap-1">
              <span className="font-bold">{onlinePlayersCount}</span>
              <span className="hidden sm:inline text-emerald-600">online</span>
            </div>
          </div>

          <SoundToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => {
              sound.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden w-9 h-9 inline-flex items-center justify-center shrink-0 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-900 shrink-0" strokeWidth={2} />
            ) : (
              <Menu className="w-5 h-5 text-gray-900 shrink-0" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-3 mt-3 border-t border-gray-100 flex flex-col gap-1 overflow-hidden"
          >
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onScrollToGames();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 text-blue-600" />
              <span>Party Games</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenLeaderboard();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Info className="w-4 h-4 text-gray-500" />
              <span>About FETO GAMES</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
