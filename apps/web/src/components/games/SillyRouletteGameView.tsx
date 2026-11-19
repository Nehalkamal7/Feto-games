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
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <RotateCw className="w-3.5 h-3.5 text-purple-400" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {state.challengeCategory}
          </span>
        </div>

        {/* TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wider transition-all ${
            state.remainingSeconds <= 5
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]'
              : 'bg-slate-900/80 border-cyan-500/30 text-cyan-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{state.remainingSeconds}s</span>
        </div>
      </div>

      {/* 2. SPINNING PHASE: SYNCED CINEMATIC NEON ROULETTE WHEEL */}
      {state.phase === 'spinning' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-6">
            {/* Outer Glowing Neon Rim */}
            <div className="absolute inset-0 rounded-full border-4 border-cyan-400/80 shadow-[0_0_40px_rgba(0,240,255,0.7)] animate-pulse" />

            {/* Rotating Wheel Core */}
            <motion.div
              animate={{ rotate: state.targetAngle }}
              transition={{ duration: 4.8, ease: [0.15, 0.9, 0.25, 1] }}
              className="w-full h-full rounded-full border-4 border-purple-500/60 bg-gradient-to-tr from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center relative overflow-hidden"
            >
              {/* Radial Slices */}
              {players.slice(0, 8).map((p, idx) => {
                const angle = (idx * 360) / Math.min(8, players.length);
                return (
                  <div
                    key={p.id}
                    className="absolute w-full h-0.5 bg-cyan-500/30 origin-center"
                    style={{ transform: `rotate(${angle}deg)` }}
                  />
                );
              })}

              <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-cyan-300 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.8)] z-10">
                <RotateCw className="w-10 h-10 text-cyan-400 animate-spin" />
              </div>
            </motion.div>

            {/* Top Indicator Arrow */}
            <div className="absolute -top-3 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-rose-500 filter drop-shadow-[0_0_10px_#f43f5e] z-20" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-cyan-300 uppercase tracking-widest animate-pulse">
            Spinning The Chaos Wheel...
          </h3>
          <p className="text-xs text-slate-400 font-bold mt-1">
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
            className="glass-panel-neon p-5 sm:p-7 rounded-3xl border-2 border-purple-500/50 text-center relative overflow-hidden mb-4 shadow-[0_0_35px_rgba(168,85,247,0.25)]"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <NeonAvatarDisplay avatarId={state.targetAvatar} size="md" isGlowing />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 block">
                  Chosen Challenger:
                </span>
                <span className="text-lg sm:text-2xl font-black text-white">
                  {state.targetUsername} {isMyTurn && '(You!)'}
                </span>
              </div>
            </div>

            <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 mb-3">
              {state.challengeTitle}
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug drop-shadow-md">
              &ldquo;{state.challengeText}&rdquo;
            </h2>
          </motion.div>

          {/* Voting Area */}
          {state.phase === 'voting' && (
            <div className="glass-panel p-5 rounded-2xl border border-slate-700/60 text-center mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400 block mb-2">
                Audience Verdict • Did They Pull It Off?
              </span>

              {isMyTurn ? (
                <p className="text-sm font-bold text-slate-300 italic">
                  Awaiting the crew&apos;s vote on your performance...
                </p>
              ) : (
                <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
                  <motion.button
                    onClick={() => handleVote('nailed_it')}
                    disabled={hasVoted}
                    whileHover={!hasVoted ? { scale: 1.05 } : undefined}
                    whileTap={!hasVoted ? { scale: 0.95 } : undefined}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs border transition-all ${
                      hasVoted
                        ? 'bg-slate-800 text-slate-500 border-slate-700'
                        : 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Nailed It! (+180)</span>
                  </motion.button>

                  <motion.button
                    onClick={() => handleVote('shame_penalty')}
                    disabled={hasVoted}
                    whileHover={!hasVoted ? { scale: 1.05 } : undefined}
                    whileTap={!hasVoted ? { scale: 0.95 } : undefined}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase text-xs border transition-all ${
                      hasVoted
                        ? 'bg-slate-800 text-slate-500 border-slate-700'
                        : 'bg-rose-500/20 border-rose-500/60 text-rose-300 hover:bg-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>Shame Penalty!</span>
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* Results Summary */}
          {state.phase === 'round_results' && (
            <div className="text-center py-4">
              <h3 className="text-2xl font-black text-white mb-2">
                {state.voteTallies.nailed_it >= state.voteTallies.shame_penalty
                  ? '🎉 Challenge Victorious!'
                  : '💀 The Crowd Demanded Penalty!'}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-slate-300 mb-4">
                Nailed It: {state.voteTallies.nailed_it} • Shame Penalty:{' '}
                {state.voteTallies.shame_penalty}
              </p>

              {isHost && (
                <motion.button
                  onClick={handleNextRound}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-glow-start px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-wider"
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
