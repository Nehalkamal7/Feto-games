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
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 select-none">
      {/* 1. TOP HEADER: ROUND & SYNCED TIMER */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFFFFF] text-[#010101] border-2 border-[#010101] flex items-center gap-1.5 shadow-[2px_2px_0px_#010101]">
            <GameIcon gameMode="most_likely_to" size="xs" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FEC90E] text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
            {state.category}
          </span>
          {vibeMode === 'sip_edition' && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FD3F01] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] flex items-center gap-1">
              <Wine strokeWidth={2.5} className="w-3 h-3 text-white shrink-0" />
              Sip Edition 🥤
            </span>
          )}
        </div>

        {/* TIME REMAINING PILL */}
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

      {/* 2. THE PROMPT CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#FFFFFF] p-4 sm:p-6 rounded-2xl md:rounded-3xl border-2 border-[#010101] text-center relative overflow-hidden mb-4 shadow-[4px_4px_0px_#010101]"
      >
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#0B89FD] block mb-1.5">
          Party Question • Vote For The Culprit
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#010101] tracking-tight leading-snug">
          &ldquo;{state.prompt}&rdquo;
        </h2>
      </motion.div>

      {/* 3. VOTING PHASE: PLAYER GRID WITH LIVE BAR GRAPHS */}
      {phase === 'voting' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between text-xs font-black text-[#010101] px-1 mb-2">
            <span className="flex items-center gap-1.5 text-[#0B89FD]">
              <Vote strokeWidth={2.5} className="w-4 h-4 shrink-0" />
              Tap a player to vote:
            </span>
            <span className="text-[#010101]/60">
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
                  whileHover={!hasVoted ? { scale: 1.02 } : undefined}
                  whileTap={!hasVoted ? { scale: 0.98 } : undefined}
                  className={`relative p-3 rounded-2xl flex flex-col items-center justify-between text-center border-2 border-[#010101] transition-all duration-200 overflow-hidden shadow-[2px_2px_0px_#010101] ${
                    isSelected
                      ? 'bg-[#FEC90E] ring-2 ring-[#010101]'
                      : 'bg-[#FFFFFF] hover:bg-[#F8F8F8]'
                  }`}
                >
                  {/* Background Fill Bar */}
                  {hasVoted && voteCount > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${votePercent}%` }}
                      transition={{ duration: 0.4 }}
                      className="absolute left-0 bottom-0 top-0 bg-[#0B89FD]/15 pointer-events-none -z-10"
                    />
                  )}

                  <div className="mb-2">
                    <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                  </div>

                  <span className="text-xs sm:text-sm font-black text-[#010101] truncate w-full mb-1">
                    {p.username}
                  </span>

                  {/* Vote Count Indicator */}
                  {hasVoted && (
                    <span className="text-[11px] font-black text-[#0B89FD]">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {hasVoted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-2 px-3 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-[#010101] text-xs font-black shadow-[2px_2px_0px_#010101] mt-2"
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
            className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-6 rounded-2xl md:rounded-3xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[4px_4px_0px_#010101]"
          >
            <div className="mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-[#FD3F01] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] inline-flex items-center gap-1.5">
                <AlertTriangle strokeWidth={2.5} className="w-3.5 h-3.5 text-white shrink-0" />
                Voted Most Likely!
              </span>
            </div>

            {victimPlayer && (
              <div className="flex flex-col items-center mb-3">
                <div className="relative mb-2">
                  <NeonAvatarDisplay avatarId={victimPlayer.avatar} size="lg" showGlow={false} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#010101]">
                  {victimPlayer.username}
                </h3>
              </div>
            )}

            {/* Roast Banner */}
            <p className="text-sm sm:text-base text-[#010101]/80 font-bold max-w-lg mb-4 italic">
              &ldquo;{state.roastMessage || 'The verdict has been reached!'}&rdquo;
            </p>

            {/* Penalty Dare Box */}
            <div className="w-full max-w-md p-3.5 sm:p-4 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-left mb-4 shadow-[2px_2px_0px_#010101]">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#FD3F01] mb-1">
                <Sparkles strokeWidth={2.5} className="w-3.5 h-3.5 text-[#FEC90E] shrink-0" />
                <span>Penalty Challenge:</span>
              </div>
              <p className="text-sm font-black text-[#010101] leading-relaxed">
                {state.penaltyDare}
              </p>
            </div>

            {/* Host Advance Button */}
            {isHost && (
              <motion.button
                onClick={handleNextRound}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all"
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
