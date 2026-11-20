'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayerSummary,
  TruthOrDarePublicState
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import {
  Flame,
  Sparkles,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Clock,
  RotateCw,
  Trophy,
  ShieldAlert
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';

interface TruthOrDareGameViewProps {
  gameState: TruthOrDarePublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
}

export const TruthOrDareGameView: React.FC<TruthOrDareGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  roomCode: _roomCode
}) => {
  const socket = getSocket();

  const isTarget = gameState.targetPlayerId === currentPlayer.id;
  const myVote = gameState.votes[currentPlayer.id];
  const [selectedVote, setSelectedVote] = useState<'completed' | 'refused' | null>(null);

  // Handle Target Choice
  const handleChooseType = (choice: 'truth' | 'dare') => {
    if (!isTarget || gameState.phase !== 'decision') return;
    sound.playClick();
    socket.emit('tod:choose_type', { choice });
  };

  // Handle Target Action Complete
  const handleCompleteAction = () => {
    if (!isTarget || gameState.phase !== 'performing') return;
    sound.playReady();
    socket.emit('tod:complete_action');
  };

  // Handle Non-Target Vote
  const handleCastVote = (vote: 'completed' | 'refused') => {
    if (isTarget || gameState.phase !== 'voting') return;
    sound.playClick();
    setSelectedVote(vote);
    socket.emit('tod:vote', { vote });
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-2 md:p-4 select-none">
      {/* ======================================================== */}
      {/* HEADER: ROUND & INTENSITY MODE                           */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFFFF] p-4 md:p-6 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
        <div className="flex items-center gap-3">
          <GameIcon gameMode="truth_or_dare" size="md" showContainer />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FFFFFF] text-[#010101] text-xs font-black uppercase tracking-wider border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FEC90E] text-[#010101] text-xs font-black uppercase tracking-wider border-2 border-[#010101] shadow-[2px_2px_0px_#010101] capitalize">
                {gameState.intensity} Mode
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#010101] mt-1">
              Truth or Dare
            </h2>
          </div>
        </div>

        {/* Autorun Phase Countdown */}
        <div className="flex items-center gap-2 px-4 py-2 bg-[#FFFFFF] rounded-2xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[#010101] text-sm font-black">
          <Clock strokeWidth={2.5} className="w-4 h-4 text-[#FD3F01] animate-spin shrink-0" />
          <span>{gameState.remainingSeconds}s Remaining</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PHASE 1: ROULETTE WHEEL SPINNER                          */}
      {/* ======================================================== */}
      {gameState.phase === 'roulette' && (
        <div className="bg-[#FFFFFF] p-10 rounded-3xl text-center space-y-6 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-20 h-20 mx-auto rounded-full border-4 border-[#010101] border-t-transparent flex items-center justify-center bg-[#FEC90E] shadow-[3px_3px_0px_#010101]"
          >
            <RotateCw strokeWidth={2.5} className="w-10 h-10 text-[#010101] shrink-0" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-[#010101] uppercase tracking-tight animate-pulse">
              SPINNING ROULETTE...
            </h3>
            <p className="text-[#010101]/70 text-sm font-bold">
              The bottle is selecting who faces the challenge!
            </p>
          </div>

          {/* Carousel of Players */}
          <div className="flex items-center justify-center gap-4 overflow-hidden py-4">
            {players.map((p, idx) => (
              <motion.div
                key={p.id}
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  delay: idx * 0.1
                }}
                className="flex flex-col items-center"
              >
                <NeonAvatarDisplay avatarId={p.avatar} size="md" showGlow={false} />
                <span className="text-xs text-[#010101] font-black truncate max-w-[70px] mt-1.5">
                  {p.username}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 2: DECISION (TARGET PICKS TRUTH OR DARE)           */}
      {/* ======================================================== */}
      {gameState.phase === 'decision' && (
        <div className="bg-[#FFFFFF] p-8 md:p-12 rounded-3xl text-center space-y-8 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#0B89FD] font-black">
              The Roulette Has Chosen
            </span>
            <div className="flex items-center gap-3">
              <NeonAvatarDisplay avatarId={gameState.targetAvatar} size="lg" showGlow={false} />
              <h3 className="text-3xl md:text-4xl font-black text-[#010101]">
                {gameState.targetUsername}
              </h3>
            </div>
          </div>

          {isTarget ? (
            <div className="space-y-4">
              <p className="text-[#FD3F01] font-black text-lg animate-bounce">
                It&rsquo;s your turn! Pick your fate:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChooseType('truth')}
                  className="p-6 sm:p-8 rounded-3xl bg-[#0B89FD] hover:bg-[#0977db] border-2 border-[#010101] text-white font-black text-2xl sm:text-3xl shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] flex flex-col items-center gap-2 sm:gap-3 transition-all min-h-[56px] touch-target"
                >
                  <HelpCircle strokeWidth={2.5} className="w-10 h-10 sm:w-12 sm:h-12 text-white shrink-0" />
                  <span>TRUTH</span>
                  <span className="text-xs font-bold text-white/90">
                    Reveal an honest answer
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChooseType('dare')}
                  className="p-6 sm:p-8 rounded-3xl bg-[#FD3F01] hover:bg-[#e03700] border-2 border-[#010101] text-white font-black text-2xl sm:text-3xl shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] flex flex-col items-center gap-2 sm:gap-3 transition-all min-h-[56px] touch-target"
                >
                  <Flame strokeWidth={2.5} className="w-10 h-10 sm:w-12 sm:h-12 text-[#FEC90E] shrink-0" />
                  <span>DARE</span>
                  <span className="text-xs font-bold text-white/90">
                    Perform a bold party challenge
                  </span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-3">
              <div className="w-12 h-12 border-4 border-[#010101] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[#010101]/80 text-lg font-bold">
                Waiting for <strong className="text-[#010101] font-black">{gameState.targetUsername}</strong> to choose TRUTH or DARE...
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 3: PERFORMING THE CHALLENGE                        */}
      {/* ======================================================== */}
      {gameState.phase === 'performing' && (
        <div className="bg-[#FFFFFF] p-6 sm:p-8 md:p-12 rounded-3xl text-center space-y-6 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border-2 border-[#010101] shadow-[2px_2px_0px_#010101] ${
                gameState.chosenType === 'truth'
                  ? 'bg-[#0B89FD] text-white'
                  : 'bg-[#FD3F01] text-white'
              }`}
            >
              {gameState.chosenType} CHALLENGE
            </span>
          </div>

          <div className="max-w-2xl mx-auto py-4">
            <h3 className="text-xl sm:text-2xl md:text-4xl font-black text-[#010101] leading-relaxed">
              &ldquo;{gameState.currentPrompt}&rdquo;
            </h3>
          </div>

          <div className="pt-4 flex flex-col items-center">
            {isTarget ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCompleteAction}
                className="min-h-[52px] px-8 py-4 bg-[#10B981] hover:bg-[#059669] text-white font-black text-lg sm:text-xl rounded-2xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] flex items-center justify-center gap-2 shrink-0 touch-target"
              >
                <Sparkles strokeWidth={2.5} className="w-6 h-6 text-[#FEC90E] shrink-0" />
                <span>I COMPLETED IT!</span>
              </motion.button>
            ) : (
              <div className="text-[#010101]/60 text-sm font-bold italic">
                {gameState.targetUsername} is performing the challenge live!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 4: VOTING VERDICT                                  */}
      {/* ======================================================== */}
      {gameState.phase === 'voting' && (
        <div className="bg-[#FFFFFF] p-6 sm:p-8 md:p-10 rounded-3xl text-center space-y-6 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#0B89FD] font-black">
              Group Judgment Phase
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-[#010101] mt-1">
              Did {gameState.targetUsername} complete the challenge?
            </h3>
          </div>

          {!isTarget ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCastVote('completed')}
                className={`min-h-[52px] p-5 sm:p-6 rounded-2xl border-2 border-[#010101] flex flex-col items-center justify-center gap-2 font-black text-lg sm:text-xl transition-all shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] touch-target ${
                  myVote === 'completed' || selectedVote === 'completed'
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#10B981]/10'
                }`}
              >
                <ThumbsUp strokeWidth={2.5} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                <span>COMPLETED</span>
                <span className="text-xs font-bold opacity-80">+100 Points</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCastVote('refused')}
                className={`min-h-[52px] p-5 sm:p-6 rounded-2xl border-2 border-[#010101] flex flex-col items-center justify-center gap-2 font-black text-lg sm:text-xl transition-all shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] touch-target ${
                  myVote === 'refused' || selectedVote === 'refused'
                    ? 'bg-[#FD3F01] text-white'
                    : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#FD3F01]/10'
                }`}
              >
                <ThumbsDown strokeWidth={2.5} className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                <span>CHICKEN</span>
                <span className="text-xs font-bold opacity-80">-50 Points Penalty</span>
              </motion.button>
            </div>
          ) : (
            <div className="p-6 bg-[#F8F8F8] rounded-2xl border-2 border-[#010101] max-w-md mx-auto text-[#010101] text-sm font-bold shadow-[2px_2px_0px_#010101]">
              <ShieldAlert strokeWidth={2.5} className="w-8 h-8 text-[#FEC90E] mx-auto mb-2 animate-bounce shrink-0" />
              You are on trial! The other players are voting on your performance.
            </div>
          )}

          {/* Live vote tallies */}
          <div className="flex justify-center gap-6 pt-4 text-sm font-black">
            <span className="text-[#10B981]">
              👍 Completed: {gameState.voteTallies.completed}
            </span>
            <span className="text-[#FD3F01]">
              🐔 Chicken: {gameState.voteTallies.refused}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 5: ROUND RESULTS                                   */}
      {/* ======================================================== */}
      {gameState.phase === 'round_results' && (
        <div className="bg-[#FFFFFF] p-8 rounded-3xl text-center space-y-6 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
          <h3 className="text-3xl font-black text-[#010101] flex items-center justify-center gap-2">
            <Trophy strokeWidth={2.5} className="w-8 h-8 text-[#FEC90E] shrink-0" />
            <span>Round Verdict</span>
          </h3>

          <div className="text-lg">
            {gameState.voteTallies.completed >= gameState.voteTallies.refused ? (
              <span className="text-[#10B981] font-black text-2xl">
                CHALLENGE ACCEPTED! {gameState.targetUsername} earned +100 points! 🎉
              </span>
            ) : (
              <span className="text-[#FD3F01] font-black text-2xl">
                CHICKEN! {gameState.targetUsername} took a -50 point penalty! 🐔
              </span>
            )}
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-4">
            {players.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-[#F8F8F8] rounded-2xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101] flex flex-col items-center"
              >
                <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                <span className="text-[#010101] font-black text-xs truncate max-w-[100px] mt-1.5">
                  {p.username}
                </span>
                <span className="text-[#010101] font-black text-sm">
                  {gameState.scores[p.id] || 0} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
