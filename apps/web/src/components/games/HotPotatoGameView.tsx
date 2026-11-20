'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bomb,
  Clock,
  Send,
  Sparkles
} from 'lucide-react';
import {
  HotPotatoPublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
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
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFFFFF] text-[#010101] border-2 border-[#010101] flex items-center gap-1.5 shadow-[2px_2px_0px_#010101]">
            <GameIcon gameMode="hot_potato" size="xs" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FEC90E] text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
            Passes: {state.passCount} ⚡
          </span>
        </div>

        {/* URGENT FUSE TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full border-2 border-[#010101] text-xs font-black tracking-wider shadow-[2px_2px_0px_#010101] transition-all ${
            state.remainingSeconds <= 3
              ? 'bg-[#FD3F01] text-white animate-bounce'
              : 'bg-[#FFFFFF] text-[#FD3F01]'
          }`}
        >
          <Clock strokeWidth={2.5} className="w-3.5 h-3.5 shrink-0" />
          <span>{state.remainingSeconds}s FUSE</span>
        </div>
      </div>

      {/* 2. CATEGORY CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#FFFFFF] p-4 sm:p-6 rounded-2xl md:rounded-3xl border-2 border-[#010101] text-center relative overflow-hidden mb-3 shadow-[4px_4px_0px_#010101]"
      >
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#FD3F01] block mb-1">
          Rapid Category • Type &amp; Pass Quick!
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#010101] tracking-tight leading-snug">
          &ldquo;{state.category}&rdquo;
        </h2>
      </motion.div>

      {/* 3. ACTIVE BOMB HOLDER SPOTLIGHT */}
      {state.phase === 'bomb_ticking' && (
        <div className="flex-1 flex flex-col items-center justify-between">
          <div className="flex flex-col items-center my-auto">
            {/* The Animated Bomb */}
            <motion.div
              animate={{
                scale: isHoldingBomb ? [1, 1.14, 1] : [1, 1.05, 1],
                rotate: isHoldingBomb ? [-3, 3, -3] : [0, 0, 0]
              }}
              transition={{ duration: 0.35, repeat: Infinity }}
              className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center border-4 border-[#010101] transition-all ${
                isHoldingBomb
                  ? 'bg-[#FD3F01] shadow-[6px_6px_0px_#010101]'
                  : 'bg-[#FFFFFF] shadow-[4px_4px_0px_#010101]'
              }`}
            >
              <Bomb
                className={`w-14 h-14 sm:w-18 sm:h-18 ${
                  isHoldingBomb ? 'text-white' : 'text-[#FD3F01]'
                }`}
              />
              {/* Sizzling Fuse Spark */}
              <div className="absolute -top-3 -right-2 text-xl animate-spin">
                💥
              </div>
            </motion.div>

            {/* Holder Identity */}
            <div className="mt-4 flex items-center gap-2.5 bg-[#FFFFFF] px-4 py-2 rounded-2xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
              <NeonAvatarDisplay avatarId={state.activeHolderAvatar} size="sm" showGlow={false} />
              <span className="text-base sm:text-lg font-black text-[#010101]">
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
                className="flex-1 px-4 py-3 rounded-2xl bg-[#FFFFFF] border-2 border-[#010101] text-[#010101] font-bold text-sm sm:text-base focus:outline-none shadow-[4px_4px_0px_#010101] placeholder-[#010101]/40"
              />
              <button
                type="submit"
                disabled={!wordInput.trim() || isSubmitting}
                className="bg-[#0B89FD] hover:bg-[#0977db] text-white px-6 py-3 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all disabled:opacity-50"
              >
                <span>PASS</span>
                <Send strokeWidth={2.5} className="w-3.5 h-3.5 shrink-0" />
              </button>
            </motion.form>
          ) : (
            <div className="text-center py-3 text-xs font-black text-[#010101]/70">
              ⚡ Waiting for {state.activeHolderUsername} to pass the ticking bomb...
            </div>
          )}

          {/* Recent Words Ticker */}
          {state.recentWords && state.recentWords.length > 0 && (
            <div className="w-full max-w-lg flex flex-wrap gap-1.5 justify-center mt-2">
              {state.recentWords.slice(-5).map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#FFFFFF] border border-[#010101] text-[#010101] shadow-[1px_1px_0px_#010101]"
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
            className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#FFFFFF] rounded-3xl border-3 border-[#010101] shadow-[8px_8px_0px_#010101]"
          >
            <div className="text-6xl mb-2 animate-bounce">💥</div>
            <h3 className="text-2xl sm:text-3xl font-black text-[#FD3F01] mb-2 uppercase tracking-tight">
              KABOOM! Bomb Exploded!
            </h3>

            {victimPlayer && (
              <div className="flex flex-col items-center my-3">
                <NeonAvatarDisplay avatarId={victimPlayer.avatar} size="md" showGlow={false} />
                <span className="text-lg font-black text-[#010101] mt-2">
                  {victimPlayer.username} got caught holding the potato!
                </span>
                <div className="mt-2 px-3 py-1 rounded-full bg-[#FD3F01] text-white border-2 border-[#010101] text-xs font-black shadow-[2px_2px_0px_#010101]">
                  Consequence: 2 Sips Penalty 🥤
                </div>
              </div>
            )}

            {isHost && (
              <button
                onClick={handleNextRound}
                className="mt-4 px-8 py-3.5 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-sm uppercase tracking-wider flex items-center gap-2 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all"
              >
                <Sparkles strokeWidth={2.5} className="w-4 h-4 text-[#FEC90E] shrink-0" />
                <span>Next Round →</span>
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
