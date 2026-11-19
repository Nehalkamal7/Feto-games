'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bomb,
  Flame,
  Clock,
  Send,
  AlertTriangle,
  Sparkles,
  Zap
} from 'lucide-react';
import {
  HotPotatoPublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { sound } from '@/lib/sound';

interface HotPotatoGameViewProps {
  state: HotPotatoPublicState;
  players: PlayerSummary[];
  currentPlayerId: string;
  isHost: boolean;
  vibeMode?: VibeMode;
  onAction: (actionType: string, payload: any) => Promise<void>;
}

export function HotPotatoGameView({
  state,
  players,
  currentPlayerId,
  isHost,
  vibeMode,
  onAction
}: HotPotatoGameViewProps) {
  const [wordInput, setWordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isHoldingBomb = currentPlayerId === state.activeHolderId;
  const currentHolder = players.find((p) => p.id === state.activeHolderId);

  // Auto-focus input when bomb passes to current player
  useEffect(() => {
    if (isHoldingBomb && state.phase === 'bomb_ticking') {
      sound.triggerHaptic(60);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isHoldingBomb, state.phase]);

  // Periodic bomb tick sound with urgency multiplier based on remaining time
  useEffect(() => {
    if (state.phase === 'bomb_ticking') {
      const urgency = Math.max(1, 4 - state.remainingSeconds * 0.5);
      const intervalMs = Math.max(250, state.remainingSeconds * 120);

      const interval = setInterval(() => {
        sound.playBombTick(urgency);
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [state.phase, state.remainingSeconds]);

  // Handle explosion effects
  useEffect(() => {
    if (state.phase === 'exploded') {
      sound.playBombExplode();
    }
  }, [state.phase]);

  const handlePassBomb = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const word = wordInput.trim();
    if (!word || !isHoldingBomb || isSubmitting) return;

    setIsSubmitting(true);
    sound.playClick();
    sound.triggerHaptic(40);

    try {
      await onAction('POTATO_PASS', { word });
      setWordInput('');
    } catch (err) {
      console.error('Failed to pass bomb:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextRound = async () => {
    sound.playClick();
    try {
      await onAction('NEXT_ROUND', {});
    } catch (err) {
      console.error('Failed to advance round:', err);
    }
  };

  const victimPlayer = state.explodedPlayerId
    ? players.find((p) => p.id === state.explodedPlayerId)
    : null;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <Bomb className="w-3.5 h-3.5 text-rose-400" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Passes: {state.passCount} ⚡
          </span>
        </div>

        {/* URGENT FUSE TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-xs font-black tracking-wider transition-all ${
            state.remainingSeconds <= 3
              ? 'bg-rose-600/30 border-rose-500 text-rose-300 animate-ping shadow-[0_0_20px_#f43f5e]'
              : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{state.remainingSeconds}s FUSE</span>
        </div>
      </div>

      {/* 2. CATEGORY CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel-neon p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-amber-500/40 text-center relative overflow-hidden mb-3 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
      >
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-amber-400 block mb-1">
          Rapid Category • Type &amp; Pass Quick!
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
          &ldquo;{state.category}&rdquo;
        </h2>
      </motion.div>

      {/* 3. ACTIVE BOMB HOLDER SPOTLIGHT */}
      {state.phase === 'bomb_ticking' && (
        <div className="flex-1 flex flex-col items-center justify-between">
          <div className="flex flex-col items-center my-auto">
            {/* The Animated Neon Bomb */}
            <motion.div
              animate={{
                scale: isHoldingBomb ? [1, 1.14, 1] : [1, 1.05, 1],
                rotate: isHoldingBomb ? [-3, 3, -3] : [0, 0, 0]
              }}
              transition={{ duration: 0.35, repeat: Infinity }}
              className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center border-4 transition-all ${
                isHoldingBomb
                  ? 'bg-rose-950/80 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.8)]'
                  : 'bg-slate-950/80 border-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
              }`}
            >
              <Bomb
                className={`w-14 h-14 sm:w-18 sm:h-18 ${
                  isHoldingBomb ? 'text-rose-400 animate-bounce' : 'text-amber-400'
                }`}
              />
              {/* Sizzling Fuse Spark */}
              <div className="absolute -top-3 -right-2 text-xl animate-spin">
                💥
              </div>
            </motion.div>

            {/* Holder Identity */}
            <div className="mt-4 flex items-center gap-2.5">
              <NeonAvatarDisplay avatarId={state.activeHolderAvatar} size="sm" isGlowing />
              <span className="text-base sm:text-lg font-black text-white">
                {state.activeHolderUsername} {isHoldingBomb && '(YOU HAVE THE BOMB!)'}
              </span>
            </div>
          </div>

          {/* INPUT FORM FOR HOLDER */}
          {isHoldingBomb ? (
            <motion.form
              onSubmit={handlePassBomb}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg flex gap-2 pb-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder="Type category item & hit PASS!..."
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-950/90 border-2 border-rose-500 text-white font-bold text-sm sm:text-base focus:outline-none shadow-[0_0_20px_rgba(244,63,94,0.4)] placeholder-slate-500"
              />
              <motion.button
                type="submit"
                disabled={!wordInput.trim() || isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-glow-start px-6 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_25px_rgba(244,63,94,0.6)]"
              >
                <span>PASS</span>
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            </motion.form>
          ) : (
            <div className="text-center py-3 text-xs font-bold text-slate-400">
              ⚡ Waiting for {state.activeHolderUsername} to pass the ticking bomb...
            </div>
          )}

          {/* Recent Words Ticker */}
          {state.recentWords && state.recentWords.length > 0 && (
            <div className="w-full max-w-lg flex flex-wrap gap-1.5 justify-center mt-2">
              {state.recentWords.slice(-5).map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800/80 border border-slate-700 text-slate-300"
                >
                  ✓ {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. EXPLODED PHASE: SCREEN SHAKE & ROAST CONSEQUENCE */}
      {(state.phase === 'exploded' || state.phase === 'round_results') && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl glass-panel-neon border-2 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.5)]"
          >
            <div className="w-20 h-20 rounded-full bg-rose-500/30 border-2 border-rose-400 flex items-center justify-center text-4xl mb-3 shadow-[0_0_30px_#f43f5e] animate-bounce">
              💥
            </div>

            <h3 className="text-3xl sm:text-4xl font-black text-rose-400 uppercase tracking-wider mb-1 drop-shadow-[0_0_15px_#f43f5e]">
              BOOM! Bomb Exploded!
            </h3>

            {victimPlayer && (
              <div className="flex items-center gap-2.5 my-3">
                <NeonAvatarDisplay avatarId={victimPlayer.avatar} size="md" isGlowing />
                <span className="text-xl sm:text-2xl font-black text-white">
                  Caught: {victimPlayer.username}
                </span>
              </div>
            )}

            {/* Goofy Consequence Card */}
            <div className="w-full max-w-md p-4 rounded-2xl bg-slate-900/90 border border-amber-400/50 text-left my-3 shadow-inner">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                Goofy Consequence Penalty:
              </span>
              <p className="text-sm font-extrabold text-white leading-relaxed">
                {state.goofyConsequence}
              </p>
            </div>

            {isHost && (
              <motion.button
                onClick={handleNextRound}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-glow-start px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-wider mt-2"
              >
                Next Round →
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
