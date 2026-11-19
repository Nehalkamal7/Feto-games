'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Vote,
  Flame,
  Award,
  Sparkles,
  AlertTriangle,
  Clock,
  Wine
} from 'lucide-react';
import {
  MostLikelyToPublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { sound } from '@/lib/sound';

interface MostLikelyToGameViewProps {
  state: MostLikelyToPublicState;
  players: PlayerSummary[];
  currentPlayerId: string;
  isHost: boolean;
  vibeMode?: VibeMode;
  onAction: (actionType: string, payload: any) => Promise<void>;
}

export function MostLikelyToGameView({
  state,
  players,
  currentPlayerId,
  isHost,
  vibeMode,
  onAction
}: MostLikelyToGameViewProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phase = state.phase;
  const myVote = state.votes?.[currentPlayerId] || selectedTargetId;
  const hasVoted = Boolean(state.votes?.[currentPlayerId]);
  const tallies = state.voteTallies || {};
  const totalVotesCast = Object.keys(state.votes || {}).length;

  const handleCastVote = async (targetPlayerId: string) => {
    if (hasVoted || isSubmitting || phase !== 'voting') return;
    setSelectedTargetId(targetPlayerId);
    setIsSubmitting(true);
    sound.playClick();
    sound.triggerHaptic(30);

    try {
      await onAction('MLT_VOTE', { targetPlayerId });
    } catch (err) {
      console.error('Failed to submit vote:', err);
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

  const victimPlayer = state.votedOutPlayerId
    ? players.find((p) => p.id === state.votedOutPlayerId)
    : null;

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 select-none">
      {/* 1. TOP HEADER: ROUND & SYNCED TIMER */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            {state.category}
          </span>
          {vibeMode === 'sip_edition' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
              <Wine className="w-3 h-3 text-rose-400" />
              Sip Edition 🥤
            </span>
          )}
        </div>

        {/* TIME REMAINING PILL */}
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

      {/* 2. THE PROMPT CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-panel-neon p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-cyan-400/30 text-center relative overflow-hidden mb-4 shadow-[0_0_25px_rgba(0,240,255,0.15)]"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-rose-500" />
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-cyan-400/90 block mb-1.5">
          Party Question • Vote For The Culprit
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
          &ldquo;{state.prompt}&rdquo;
        </h2>
      </motion.div>

      {/* 3. VOTING PHASE: PLAYER GRID WITH LIVE BAR GRAPHS */}
      {phase === 'voting' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1 mb-2">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <Vote className="w-4 h-4" />
              Tap a player to vote:
            </span>
            <span className="text-slate-400">
              {totalVotesCast} / {players.length} Voted
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 overflow-y-auto max-h-[50dvh] pr-1 pb-2">
            {players.map((p) => {
              const isSelected = myVote === p.id;
              const voteCount = tallies[p.id] || 0;
              const votePercent =
                totalVotesCast > 0 ? Math.round((voteCount / totalVotesCast) * 100) : 0;

              return (
                <motion.button
                  key={p.id}
                  onClick={() => handleCastVote(p.id)}
                  disabled={hasVoted || isSubmitting}
                  whileHover={!hasVoted ? { scale: 1.03 } : undefined}
                  whileTap={!hasVoted ? { scale: 0.97 } : undefined}
                  className={`relative p-3 rounded-2xl flex flex-col items-center justify-between text-center border transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'bg-purple-900/40 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] ring-2 ring-purple-400'
                      : 'bg-slate-900/60 border-slate-700/60 hover:border-cyan-400/50 hover:bg-slate-800/60'
                  }`}
                >
                  {/* Background Fill Bar */}
                  {hasVoted && voteCount > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${votePercent}%` }}
                      transition={{ duration: 0.4 }}
                      className="absolute left-0 bottom-0 top-0 bg-purple-500/15 pointer-events-none -z-10"
                    />
                  )}

                  <div className="mb-2">
                    <NeonAvatarDisplay avatarId={p.avatar} size="sm" isGlowing={isSelected} />
                  </div>

                  <span className="text-xs sm:text-sm font-black text-white truncate w-full mb-1">
                    {p.username}
                  </span>

                  {/* Vote Count Indicator */}
                  {hasVoted && (
                    <span className="text-[11px] font-black text-cyan-300">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  )}

                  {isSelected && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {hasVoted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2 px-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-extrabold mt-2"
            >
              ✓ Vote submitted! Waiting for the crew to finish voting...
            </motion.div>
          )}
        </div>
      )}

      {/* 4. REVEAL & PENALTY PHASE: SPOTLIGHT & ROAST MODAL */}
      {(phase === 'reveal' || phase === 'penalty' || phase === 'round_results') && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 rounded-2xl md:rounded-3xl glass-panel-neon border-2 border-purple-500/60 shadow-[0_0_35px_rgba(168,85,247,0.35)]"
          >
            <div className="mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Voted Most Likely!
              </span>
            </div>

            {victimPlayer && (
              <div className="flex flex-col items-center mb-3">
                <div className="relative mb-2">
                  <div className="absolute inset-0 rounded-full bg-purple-500/40 blur-xl animate-pulse" />
                  <NeonAvatarDisplay avatarId={victimPlayer.avatar} size="lg" isGlowing />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-rose-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                  {victimPlayer.username}
                </h3>
              </div>
            )}

            {/* Roast Banner */}
            <p className="text-sm sm:text-base text-slate-200 font-bold max-w-lg mb-4 italic">
              &ldquo;{state.roastMessage || 'The verdict has been reached!'}&rdquo;
            </p>

            {/* Penalty Dare Box */}
            <div className="w-full max-w-md p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-rose-500/40 text-left mb-4 shadow-inner">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Penalty Challenge:</span>
              </div>
              <p className="text-sm font-extrabold text-white leading-relaxed">
                {state.penaltyDare}
              </p>
            </div>

            {/* Host Advance Button */}
            {isHost && (
              <motion.button
                onClick={handleNextRound}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-glow-start px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center gap-2"
              >
                <span>Next Round →</span>
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
