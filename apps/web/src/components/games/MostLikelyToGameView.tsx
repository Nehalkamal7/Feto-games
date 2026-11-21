'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vote,
  Sparkles,
  AlertTriangle,
  Clock,
  Wine,
  ArrowRight
} from 'lucide-react';
import {
  MostLikelyToPublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
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
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-2 sm:px-4 py-2 overflow-x-hidden select-none">
      {/* 1. TOP HEADER: ROUND & SYNCED TIMER */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-800 flex items-center gap-1.5 shadow-sm">
            <GameIcon gameMode="most_likely_to" size="xs" />
            Round {state.round} of {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {state.category}
          </span>
          {vibeMode === 'sip_edition' && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
              <Wine className="w-3 h-3 text-rose-600 shrink-0" />
              Sip Edition 🥤
            </span>
          )}
        </div>

        {/* TIME REMAINING PILL */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
            state.remainingSeconds <= 5
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : 'bg-white text-gray-800 border-gray-200 shadow-sm'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${state.remainingSeconds <= 5 ? 'text-red-500' : 'text-blue-600'}`} />
          <span>{state.remainingSeconds}s</span>
        </div>
      </div>

      {/* 2. THE PROMPT CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 text-center relative overflow-hidden mb-5 shadow-sm"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 block mb-2">
          Who Is Most Likely To...
        </span>
        <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
          &ldquo;{state.prompt}&rdquo;
        </h2>
      </motion.div>

      {/* 3. VOTING PHASE: PLAYER GRID WITH PROGRESS BARS */}
      {phase === 'voting' && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-600 px-1 mb-3">
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              <Vote className="w-4 h-4 shrink-0" />
              Tap a player to vote:
            </span>
            <span className="text-gray-500">
              {totalVotesCast} of {players.length} voted
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[52dvh] overflow-y-auto pr-1 pb-2">
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
                  whileHover={!hasVoted ? { scale: 1.01 } : undefined}
                  whileTap={!hasVoted ? { scale: 0.98 } : undefined}
                  className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-between text-center border transition-all duration-200 overflow-hidden min-h-[110px] ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                      : 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm'
                  }`}
                >
                  {/* Background Fill Bar for Votes */}
                  {hasVoted && voteCount > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${votePercent}%` }}
                      transition={{ duration: 0.4 }}
                      className="absolute left-0 bottom-0 top-0 bg-blue-100/60 pointer-events-none -z-10"
                    />
                  )}

                  <div className="mb-2">
                    <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-gray-900 truncate w-full mb-1">
                    {p.username}
                  </span>

                  {/* Vote Count Indicator */}
                  {hasVoted && (
                    <span className="text-[11px] font-semibold text-blue-600">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {hasVoted && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2.5 px-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mt-3"
            >
              ✓ Vote submitted! Waiting for the others to vote...
            </motion.div>
          )}
        </div>
      )}

      {/* 4. REVEAL & PENALTY PHASE: SPOTLIGHT MODAL */}
      {(phase === 'reveal' || phase === 'penalty' || phase === 'round_results') && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm"
          >
            <div className="mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                Voted Most Likely!
              </span>
            </div>

            {victimPlayer && (
              <div className="flex flex-col items-center mb-3">
                <div className="relative mb-2">
                  <NeonAvatarDisplay avatarId={victimPlayer.avatar} size="lg" showGlow={false} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {victimPlayer.username}
                </h3>
              </div>
            )}

            {/* Roast / Verdict Banner */}
            <p className="text-sm sm:text-base text-gray-600 font-medium max-w-md mb-4 italic">
              &ldquo;{state.roastMessage || 'The verdict has been reached!'}&rdquo;
            </p>

            {/* Penalty Dare Box */}
            {state.penaltyDare && (
              <div className="w-full max-w-md p-4 rounded-xl bg-gray-50 border border-gray-200 text-left mb-5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Penalty Challenge:</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 leading-relaxed">
                  {state.penaltyDare}
                </p>
              </div>
            )}

            {/* Host Advance Button */}
            {isHost && (
              <motion.button
                onClick={handleNextRound}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <span>Next Round</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
