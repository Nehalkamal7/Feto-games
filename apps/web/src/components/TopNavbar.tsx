'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Trophy, Sparkles, Menu, X, Info, Gamepad2, Volume2 } from 'lucide-react';
import { NeonLogo } from './NeonLogo';
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
    <nav className="w-full glass-panel rounded-2xl sm:rounded-3xl px-3.5 sm:px-6 py-2.5 sm:py-3.5 mb-6 sm:mb-8 border border-cyan-500/20 shadow-neon-cyan relative z-30">
      <div className="flex items-center justify-between">
        {/* LEFT: CUSTOM NEON LOGO */}
        <div className="flex items-center">
          <NeonLogo size="nav" showSubtitle={false} />
        </div>

        {/* CENTER: DESKTOP NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
          <button
            onClick={() => {
              sound.playClick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all"
          >
            Home
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onScrollToGames();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all flex items-center gap-1.5"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Browse Games</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-300 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenAbout();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-300 hover:text-purple-300 hover:bg-purple-500/10 transition-all flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5 text-purple-400" />
            <span>About</span>
          </button>
        </div>

        {/* RIGHT: LIVE PLAYERS BADGE & SOUND CONTROLS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Glowing Live Players Pill */}
          <div className="px-3 py-1.5 rounded-full bg-slate-950/80 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.35)] flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <div className="text-[11px] font-black tracking-wider text-cyan-300 uppercase flex items-center gap-1">
              <span>LIVE:</span>
              <span className="text-white font-mono">{onlinePlayersCount}</span>
              <span className="hidden sm:inline text-slate-400 text-[10px]">PLAYERS</span>
            </div>
          </div>

          <SoundToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => {
              sound.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden pt-3 mt-3 border-t border-slate-800/80 flex flex-col gap-2 overflow-hidden"
          >
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300"
            >
              Home
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onScrollToGames();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300 flex items-center gap-2"
            >
              <Gamepad2 className="w-4 h-4 text-cyan-400" />
              <span>Browse Games</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenLeaderboard();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-300 hover:bg-yellow-500/10 hover:text-yellow-300 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold uppercase text-slate-300 hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2"
            >
              <Info className="w-4 h-4 text-purple-400" />
              <span>About FETO GAMES</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
