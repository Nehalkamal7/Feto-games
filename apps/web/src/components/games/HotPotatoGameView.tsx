'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bomb,
  Clock,
  Send,
  ArrowRight
} from 'lucide-react';
import {
  HotPotatoPublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import { sound } from '@/lib/sound';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useLanguage } from '@/hooks/useLanguage';

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
  vibeMode: _vibeMode,
  onAction
}: HotPotatoGameViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [wordInput, setWordInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const timer = useGameTimer({
    phaseEndsAt: state.phaseEndsAt,
    durationSeconds: 8,
    enabled: state.phase === 'bomb_ticking',
    onTimeout: () => onAction('PHASE_TIMEOUT', {})
  });
  const remainingSeconds = timer.remainingSeconds;

  const isHoldingBomb = currentPlayerId === state.activeHolderId;
  const _currentHolder = players.find((p) => p.id === state.activeHolderId);

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
      const urgency = Math.max(1, 4 - remainingSeconds * 0.5);
      const intervalMs = Math.max(250, remainingSeconds * 120);

      const interval = setInterval(() => {
        sound.playBombTick(urgency);
      }, intervalMs);

      return () => clearInterval(interval);
    }
  }, [state.phase, remainingSeconds]);

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
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-2 sm:px-4 py-2 overflow-x-hidden select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-800 flex items-center gap-1.5 shadow-sm">
            <GameIcon gameMode="hot_potato" size="xs" />
            {isAr ? `الجولة ${state.round} من ${state.totalRounds}` : `Round ${state.round} of ${state.totalRounds}`}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {isAr ? `التمريرات: ${state.passCount} ⚡` : `Passes: ${state.passCount} ⚡`}
          </span>
        </div>

        {/* URGENT FUSE TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
            state.remainingSeconds <= 3
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : 'bg-white text-gray-800 border-gray-200 shadow-sm'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${state.remainingSeconds <= 3 ? 'text-red-500' : 'text-blue-600'}`} />
          <span className="force-ltr">{state.remainingSeconds}s {isAr ? 'فتيل' : 'Fuse'}</span>
        </div>
      </div>

      {/* 2. CATEGORY CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 text-center relative overflow-hidden mb-4 shadow-sm"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 block mb-1">
          {isAr ? 'فئة سريعة • اكتب ومرر في ثانية!' : 'Rapid Category • Type & Pass Quick!'}
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
          &ldquo;{isAr && state.categoryAr ? state.categoryAr : state.category}&rdquo;
        </h2>
      </motion.div>

      {/* 3. ACTIVE BOMB HOLDER SPOTLIGHT */}
      {state.phase === 'bomb_ticking' && (
        <div className="flex-1 flex flex-col items-center justify-between gap-4 py-2">
          <div className="flex flex-col items-center my-auto">
            {/* The Animated Bomb */}
            <motion.div
              animate={{
                scale: isHoldingBomb ? [1, 1.1, 1] : [1, 1.04, 1],
                rotate: isHoldingBomb ? [-2, 2, -2] : [0, 0, 0]
              }}
              transition={{ duration: 0.35, repeat: Infinity }}
              className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center border transition-all ${
                isHoldingBomb
                  ? 'bg-rose-50 border-rose-400 shadow-lg ring-4 ring-rose-200'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <Bomb
                className={`w-14 h-14 ${
                  isHoldingBomb ? 'text-rose-600 animate-pulse' : 'text-gray-700'
                }`}
              />
              {/* Sizzling Spark */}
              <div className="absolute -top-2 -right-1 text-lg animate-spin">
                💥
              </div>
            </motion.div>

            {/* Holder Identity */}
            <div className="mt-4 flex items-center gap-2.5 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
              <NeonAvatarDisplay avatarId={state.activeHolderAvatar} size="sm" showGlow={false} />
              <span className="text-sm sm:text-base font-bold text-gray-900">
                {state.activeHolderUsername} {isHoldingBomb && (isAr ? '(القنبلة معاك! تكتك بسرعة!)' : '(YOU HAVE THE BOMB!)')}
              </span>
            </div>
          </div>

          {/* INPUT FORM FOR HOLDER */}
          {isHoldingBomb ? (
            <motion.form
              onSubmit={handlePassBomb}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-md flex flex-col sm:flex-row gap-2 pb-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                placeholder={isAr ? 'اكتب كلمة تنتمي للفئة ومرر القنبلة...' : 'Type answer & tap Pass Bomb...'}
                className="w-full flex-1 h-12 px-4 rounded-xl bg-white border border-gray-300 text-gray-900 font-medium text-sm focus:outline-none focus:border-blue-600 shadow-sm placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!wordInput.trim() || isSubmitting}
                className="w-full sm:w-auto h-12 bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                <span>{isAr ? 'مرر القنبلة 💣' : 'Pass Bomb'}</span>
                <Send className={`w-3.5 h-3.5 shrink-0 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </motion.form>
          ) : (
            <div className="text-center py-2 text-xs font-medium text-gray-500">
              {isAr
                ? `⚡ في انتظار ${state.activeHolderUsername} يكتب كلمة ويمرر القنبلة...`
                : `⚡ Waiting for ${state.activeHolderUsername} to type an answer and pass the bomb...`}
            </div>
          )}

          {/* Recent Words Ticker */}
          {state.recentWords && state.recentWords.length > 0 && (
            <div className="w-full max-w-md flex flex-wrap gap-1.5 justify-center mt-1">
              {state.recentWords.slice(-5).map((w, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                >
                  ✓ {w}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. EXPLODED PHASE: SCREEN SHAKE & CONSEQUENCE */}
      {(state.phase === 'exploded' || state.phase === 'round_results') && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 bg-white rounded-2xl border border-gray-200 shadow-sm"
          >
            <div className="text-5xl mb-2">💥</div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-rose-600 mb-2 uppercase tracking-tight">
              {isAr ? '💥 بوم! القنبلة انفجرت!' : 'KABOOM! Bomb Exploded!'}
            </h3>

            {victimPlayer && (
              <div className="flex flex-col items-center my-3">
                <NeonAvatarDisplay avatarId={victimPlayer.avatar} size="md" showGlow={false} />
                <span className="text-base sm:text-lg font-bold text-gray-900 mt-2">
                  {isAr
                    ? `${victimPlayer.username} اتدبس بالقنبلة لما فرقعت!`
                    : `${victimPlayer.username} got caught holding the bomb!`}
                </span>
                <div className="mt-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                  {isAr && state.goofyConsequenceAr
                    ? state.goofyConsequenceAr
                    : (isAr ? 'العقاب: رشفة عقاب مضحكة 🥤' : (state.goofyConsequence || 'Consequence: 2 Sips Penalty 🥤'))}
                </div>
              </div>
            )}

            {isHost && (
              <button
                onClick={handleNextRound}
                className="mt-4 h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all"
              >
                <span>{isAr ? 'الجولة القادمة' : 'Next Round'}</span>
                <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
