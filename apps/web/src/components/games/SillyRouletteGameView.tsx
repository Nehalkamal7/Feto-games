'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCw,
  Sparkles,
  Flame,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Award,
  AlertCircle
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

interface SillyRouletteGameViewProps {
  state: SillyRoulettePublicState;
  players: PlayerSummary[];
  currentPlayerId: string;
  isHost: boolean;
  vibeMode?: VibeMode;
  onAction: (actionType: string, payload: any) => Promise<void>;
}

export function SillyRouletteGameView({
  state,
  players,
  currentPlayerId,
  isHost,
  vibeMode,
  onAction
}: SillyRouletteGameViewProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const isMyTurn = currentPlayerId === state.targetPlayerId;
  const targetPlayer = players.find((p) => p.id === state.targetPlayerId);

  // Trigger wheel clicks during spinning phase
  useEffect(() => {
    if (state.phase === 'spinning') {
      const interval = setInterval(() => {
        sound.playWheelSpinTick();
      }, 140);
      return () => clearInterval(interval);
    }
  }, [state.phase]);

  // Trigger victory fanfare or screen shake when voting ends
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

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFFFFF] text-[#010101] border-2 border-[#010101] flex items-center gap-1.5 shadow-[2px_2px_0px_#010101]">
            <GameIcon gameMode="silly_roulette" size="xs" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FEC90E] text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
            {state.challengeCategory}
          </span>
        </div>

        {/* TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#010101] text-xs font-black tracking-wider shadow-[2px_2px_0px_#010101] transition-all ${
            state.remainingSeconds <= 5
              ? 'bg-[#FD3F01] text-white animate-bounce'
              : 'bg-[#FFFFFF] text-[#010101]'
          }`}
        >
          <Clock strokeWidth={2.5} className="w-3.5 h-3.5 text-[#FD3F01] shrink-0" />
          <span>{state.remainingSeconds}s</span>
        </div>
      </div>

      {/* 2. SPINNING PHASE: SYNCED BAUHAUS ROULETTE WHEEL */}
      {state.phase === 'spinning' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-6">
            {/* Outer Rim */}
            <div className="absolute inset-0 rounded-full border-4 border-[#010101] shadow-[6px_6px_0px_#010101]" />

            {/* Rotating Wheel Core */}
            <motion.div
              animate={{ rotate: state.targetAngle }}
              transition={{ duration: 4.8, ease: [0.15, 0.9, 0.25, 1] }}
              className="w-full h-full rounded-full border-4 border-[#010101] bg-[#FFFFFF] flex items-center justify-center relative overflow-hidden"
            >
              {/* Radial 4-Color Bauhaus Slices */}
              {players.slice(0, 8).map((p, idx) => {
                const angle = (idx * 360) / Math.min(8, players.length);
                const colors = ['#0B89FD', '#FEC90E', '#FD3F01', '#F8F8F8'];
                return (
                  <div
                    key={p.id}
                    className="absolute w-full h-0.5 bg-[#010101] origin-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                  />
                );
              })}

              <div className="w-24 h-24 rounded-full bg-[#FEC90E] border-2 border-[#010101] flex items-center justify-center shadow-[2px_2px_0px_#010101] z-10">
                <RotateCw strokeWidth={2.5} className="w-10 h-10 text-[#010101] animate-spin shrink-0" />
              </div>
            </motion.div>

            {/* Top Indicator Arrow */}
            <div className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-[#010101] z-20" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-[#010101] uppercase tracking-tight animate-pulse">
            Spinning The Chaos Wheel...
          </h3>
          <p className="text-xs text-[#010101]/70 font-black mt-1">
            Who will be chosen for the challenge?
          </p>
        </div>
      )}

      {/* 3. CHALLENGE & PERFORMING PHASE */}
      {(state.phase === 'challenge' || state.phase === 'voting' || state.phase === 'round_results') && (
        <div className="flex-1 flex flex-col justify-between">
          {/* Active Player Focus Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#FFFFFF] p-5 sm:p-7 rounded-3xl border-2 border-[#010101] text-center relative overflow-hidden mb-4 shadow-[4px_4px_0px_#010101]"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <NeonAvatarDisplay avatarId={state.targetAvatar} size="md" showGlow={false} />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0B89FD] block">
                  Chosen Challenger:
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#010101]">
                  {state.targetUsername} {isMyTurn && '(You!)'}
                </span>
              </div>
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FEC90E] text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] mb-3">
              {state.challengeTitle}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#010101] leading-snug">
              &ldquo;{state.challengeText}&rdquo;
            </h2>
          </motion.div>

          {/* Voting Area */}
          {state.phase === 'voting' && (
            <div className="bg-[#FFFFFF] p-5 rounded-2xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] text-center mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-[#0B89FD] block mb-2">
                Audience Verdict • Did They Pull It Off?
              </span>

              {isMyTurn ? (
                <p className="text-sm font-bold text-[#010101]/70 italic">
                  Awaiting the crew&apos;s vote on your performance...
                </p>
              ) : (
                <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                  <motion.button
                    onClick={() => handleVote('nailed_it')}
                    disabled={hasVoted}
                    whileHover={!hasVoted ? { scale: 1.02 } : undefined}
                    whileTap={!hasVoted ? { scale: 0.98 } : undefined}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs border-2 border-[#010101] transition-all shadow-[2px_2px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      hasVoted
                        ? 'bg-[#F8F8F8] text-[#010101]/40'
                        : 'bg-[#10B981] hover:bg-[#059669] text-white'
                    }`}
                  >
                    <ThumbsUp strokeWidth={2.5} className="w-4 h-4 shrink-0" />
                    <span>Nailed It! (+180)</span>
                  </motion.button>

                  <motion.button
                    onClick={() => handleVote('shame_penalty')}
                    disabled={hasVoted}
                    whileHover={!hasVoted ? { scale: 1.02 } : undefined}
                    whileTap={!hasVoted ? { scale: 0.98 } : undefined}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs border-2 border-[#010101] transition-all shadow-[2px_2px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                      hasVoted
                        ? 'bg-[#F8F8F8] text-[#010101]/40'
                        : 'bg-[#FD3F01] hover:bg-[#e03700] text-white'
                    }`}
                  >
                    <ThumbsDown strokeWidth={2.5} className="w-4 h-4 shrink-0" />
                    <span>Shame Penalty!</span>
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          {state.phase === 'round_results' && (
            <div className="text-center py-4 bg-[#FFFFFF] p-6 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
              <h3 className="text-2xl font-black text-[#010101] mb-2">
                {state.voteTallies.nailed_it >= state.voteTallies.shame_penalty
                  ? '🎉 Challenge Victorious!'
                  : '💀 The Crowd Demanded Penalty!'}
              </h3>
              <p className="text-xs sm:text-sm font-black text-[#010101]/80 mb-4">
                Nailed It: {state.voteTallies.nailed_it} • Shame Penalty:{' '}
                {state.voteTallies.shame_penalty}
              </p>

              {isHost && (
                <motion.button
                  onClick={handleNextRound}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] text-sm font-black uppercase tracking-wider transition-all"
                >
                  Next Round →
                </motion.button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
