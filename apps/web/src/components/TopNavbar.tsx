'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Trophy, Sparkles, Menu, X, Info, Gamepad2, Volume2 } from 'lucide-react';
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
  onOpenDecks
}: TopNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-[#FFFFFF] rounded-2xl sm:rounded-3xl px-3.5 sm:px-6 py-2.5 sm:py-3.5 mb-6 sm:mb-8 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] relative z-30">
      <div className="flex items-center justify-between">
        {/* LEFT: CUSTOM NEON/BAUHAUS LOGO */}
        <div className="flex items-center">
          <BrandLogo size="nav" showSubtitle={false} />
        </div>

        {/* CENTER: DESKTOP NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={() => {
              sound.playClick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-[#010101] hover:bg-[#F8F8F8] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            Home
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onScrollToGames();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-[#010101] hover:bg-[#0B89FD]/10 hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-[#0B89FD]" />
            <span>Browse Games</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-[#010101] hover:bg-[#FEC90E]/20 hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-[#FEC90E]" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAbout();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-[#010101] hover:bg-[#FD3F01]/10 hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-[#FD3F01]" />
            <span>About</span>
          </button>
        </div>

        {/* RIGHT: LIVE PLAYERS BADGE & SOUND CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tactile Bauhaus Live Players Pill */}
          <div className="px-3 py-1.5 rounded-full bg-[#FEC90E] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD3F01] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FD3F01]" />
            </span>
            <div className="text-[11px] font-black tracking-wider text-[#010101] uppercase flex items-center gap-1">
              <span>LIVE:</span>
              <span className="text-[#010101] font-mono font-black">{onlinePlayersCount}</span>
              <span className="hidden sm:inline text-[#010101]/80 text-[10px]">PLAYERS</span>
            </div>
          </div>

          <SoundToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => {
              sound.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden p-2 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[#010101] hover:bg-[#F8F8F8] active:translate-x-[1px] active:translate-y-[1px]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#FD3F01]" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden pt-3 mt-3 border-t-2 border-[#010101] flex flex-col gap-2 overflow-hidden"
          >
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase text-[#010101] hover:bg-[#F8F8F8]"
            >
              Home
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onScrollToGames();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase text-[#010101] hover:bg-[#0B89FD]/10 flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 text-[#0B89FD]" />
              <span>Browse Games</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenLeaderboard();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase text-[#010101] hover:bg-[#FEC90E]/20 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-[#FEC90E]" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase text-[#010101] hover:bg-[#FD3F01]/10 flex items-center gap-2"
            >
              <Info className="w-4 h-4 text-[#FD3F01]" />
              <span>About FETO GAMES</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
