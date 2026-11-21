'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RotateCw,
  Clock,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from 'lucide-react';
import {
  SillyRoulettePublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useLanguage } from '@/hooks/useLanguage';

interface SillyRouletteGameViewProps {
  state: SillyRoulettePublicState;
  players: PlayerSummary[];
  currentPlayerId: string;
  isHost: boolean;
  vibeMode?: VibeMode;
  roomCode?: string;
  onAction: (actionType: string, payload: any) => Promise<void>;
}

export function SillyRouletteGameView({
  state,
  players,
  currentPlayerId,
  isHost,
  vibeMode: _vibeMode,
  roomCode,
  onAction
}: SillyRouletteGameViewProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [hasVoted, setHasVoted] = useState(false);
  const isMyTurn = currentPlayerId === state.targetPlayerId;

  const timer = useGameTimer({
    phaseEndsAt: (state as any)?.phaseEndsAt,
    roomCode: roomCode || '',
    phase: state.phase,
    round: state.round,
    onTimeout: () => {
      onAction('PHASE_TIMEOUT', {});
    }
  });

  const remainingSecs = timer.remainingSeconds > 0 ? timer.remainingSeconds : state.remainingSeconds;

  // Trigger wheel clicks during spinning phase
  useEffect(() => {
    if (state.phase === 'spinning') {
      const interval = setInterval(() => {
        sound.playWheelSpinTick();
      }, 140);
      return () => clearInterval(interval);
    }
  }, [state.phase]);

  // Trigger victory fanfare or wrong sound when voting ends
  useEffect(() => {
    if (state.phase === 'round_results') {
      if (state.voteTallies.nailed_it >= state.voteTallies.shame_penalty) {
        sound.playFanfare();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } else {
        sound.playWrong();
        sound.triggerScreenShake(500);
      }
    }
  }, [state.phase, state.voteTallies.nailed_it, state.voteTallies.shame_penalty]);

  const handleVote = async (vote: 'nailed_it' | 'shame_penalty') => {
    if (hasVoted || isMyTurn || state.phase !== 'voting') return;
    setHasVoted(true);
    sound.playClick();
    sound.triggerHaptic(30);

    try {
      await onAction('ROULETTE_VOTE', { vote });
    } catch (err) {
      console.error('Failed to vote on challenge:', err);
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

  const categoryMap: Record<string, { en: string; ar: string }> = {
    physical: { en: 'Physical Dare', ar: 'تحدي حركي' },
    vocal: { en: 'Vocal Dare', ar: 'تحدي صوتي' },
    acting: { en: 'Acting Dare', ar: 'تحدي تمثيل' },
    absurd: { en: 'Absurd Dare', ar: 'تحدي مجنون' },
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-2 sm:px-4 py-2 overflow-x-hidden select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-800 flex items-center gap-1.5 shadow-sm">
            <GameIcon gameMode="silly_roulette" size="xs" />
            {isAr ? `الجولة ${state.round} من ${state.totalRounds}` : `Round ${state.round} of ${state.totalRounds}`}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {isAr
              ? (categoryMap[state.challengeCategory]?.ar || state.challengeCategory)
              : (categoryMap[state.challengeCategory]?.en || state.challengeCategory)}
          </span>
        </div>

        {/* TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
            remainingSecs <= 5
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : 'bg-white text-gray-800 border-gray-200 shadow-sm'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${remainingSecs <= 5 ? 'text-red-500' : 'text-blue-600'}`} />
          <span className="force-ltr">{remainingSecs}s</span>
        </div>
      </div>

      {/* 2. SPINNING PHASE: MINIMAL MODERN ROULETTE WHEEL */}
      {state.phase === 'spinning' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <div className="relative w-60 h-60 sm:w-72 sm:h-72 flex items-center justify-center mb-6">
            {/* Outer Rim */}
            <div className="absolute inset-0 rounded-full border-2 border-gray-200 shadow-lg" />

            {/* Rotating Wheel Core */}
            <motion.div
              animate={{ rotate: state.targetAngle }}
              transition={{ duration: 4.8, ease: [0.15, 0.9, 0.25, 1] }}
              className="w-full h-full rounded-full border border-gray-200 bg-white flex items-center justify-center relative overflow-hidden"
            >
              {/* Radial Slices */}
              {players.slice(0, 8).map((p, idx) => {
                const angle = (idx * 360) / Math.min(8, players.length);
                return (
                  <div
                    key={p.id}
                    className="absolute w-full h-[1px] bg-gray-200 origin-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                  />
                );
              })}

              <div className="w-20 h-20 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-sm z-10">
                <RotateCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </motion.div>

            {/* Top Indicator Arrow */}
            <div className="absolute -top-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-blue-600 z-20" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
            {isAr ? 'عجلة الروليت تدور...' : 'Spinning Roulette...'}
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            {isAr ? 'نختار لاعباً عشوائياً لتنفيذ التحدي الجريء!' : 'Selecting a random player for the party dare!'}
          </p>
        </div>
      )}

      {/* 3. CHALLENGE & PERFORMING PHASE */}
      {(state.phase === 'challenge' || state.phase === 'voting' || state.phase === 'round_results') && (
        <div className="flex-1 flex flex-col justify-between">
          {/* Active Player Focus Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 text-center relative overflow-hidden mb-4 shadow-sm"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <NeonAvatarDisplay avatarId={state.targetAvatar} size="md" showGlow={false} />
              <div className="text-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 block">
                  {isAr ? 'اللاعب المختار:' : 'Selected Player:'}
                </span>
                <span className="text-lg sm:text-2xl font-bold text-gray-900">
                  {state.targetUsername} {isMyTurn && (isAr ? '(أنت!)' : '(You!)')}
                </span>
              </div>
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
              {isAr && state.challengeTitleAr ? state.challengeTitleAr : state.challengeTitle}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug">
              &ldquo;{isAr && state.challengeTextAr ? state.challengeTextAr : state.challengeText}&rdquo;
            </h2>
          </motion.div>

          {/* Voting Area */}
          {state.phase === 'voting' && (
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-3">
                {isAr ? 'هل نفّذ التحدي ببراعة؟' : 'Did they complete the dare?'}
              </span>

              {isMyTurn ? (
                <p className="text-sm font-medium text-gray-500 italic">
                  {isAr
                    ? 'في انتظار تصويت الروم على أدائك...'
                    : 'Awaiting the crew\'s vote on your performance...'}
                </p>
              ) : (
                <div className="flex items-center justify-center gap-3 max-w-sm mx-auto">
                  <button
                    onClick={() => handleVote('nailed_it')}
                    disabled={hasVoted}
                    className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all shadow-sm ${
                      hasVoted
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'بدّع فيها! (+180)' : 'Nailed It! (+180)'}</span>
                  </button>

                  <button
                    onClick={() => handleVote('shame_penalty')}
                    disabled={hasVoted}
                    className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase transition-all shadow-sm ${
                      hasVoted
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-rose-500 hover:bg-rose-600 text-white'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4 shrink-0" />
                    <span>{isAr ? 'عقاب وكسوف' : 'Penalty'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          {state.phase === 'round_results' && (
            <div className="text-center py-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                {state.voteTallies.nailed_it >= state.voteTallies.shame_penalty
                  ? (isAr ? '🎉 بدّع وانتصر بالتحدي!' : '🎉 Challenge Victorious!')
                  : (isAr ? '💀 الجمهور قرر العقاب!' : '💀 The Crowd Demanded Penalty!')}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-4">
                {isAr
                  ? `بدّع: ${state.voteTallies.nailed_it} • عقاب: ${state.voteTallies.shame_penalty}`
                  : `Nailed It: ${state.voteTallies.nailed_it} • Penalty: ${state.voteTallies.shame_penalty}`}
              </p>

              {isHost && (
                <button
                  onClick={handleNextRound}
                  className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm font-bold flex items-center gap-2 mx-auto transition-all"
                >
                  <span>{isAr ? 'الدور القادم' : 'Next Turn'}</span>
                  <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
