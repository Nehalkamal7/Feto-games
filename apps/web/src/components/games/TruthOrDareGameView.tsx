'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayerSummary,
  TruthOrDarePublicState
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-2 md:p-4">
      {/* ======================================================== */}
      {/* HEADER: ROUND & INTENSITY MODE                           */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 md:p-6 rounded-3xl border border-feto-border shadow-neon-magenta">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-feto-magenta to-yellow-400 flex items-center justify-center text-black shadow-neon-magenta">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-feto-magenta/20 text-feto-magenta text-xs font-bold uppercase tracking-wider border border-feto-magenta/30">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold uppercase tracking-wider border border-yellow-400/30 capitalize">
                {gameState.intensity} Mode
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              Truth or Dare
            </h2>
          </div>
        </div>

        {/* Autorun Phase Countdown */}
        <div className="flex items-center gap-2 px-4 py-2 bg-feto-card rounded-2xl border border-feto-border text-cyan-300 text-sm font-bold">
          <Clock className="w-4 h-4 animate-spin text-cyan-400" />
          <span>{gameState.remainingSeconds}s Remaining</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PHASE 1: ROULETTE WHEEL SPINNER                          */}
      {/* ======================================================== */}
      {gameState.phase === 'roulette' && (
        <div className="glass-panel p-10 rounded-3xl text-center space-y-6 border border-cyan-400/40 shadow-neon-cyan">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-20 h-20 mx-auto rounded-full border-4 border-cyan-400 border-t-transparent flex items-center justify-center shadow-neon-cyan"
          >
            <RotateCw className="w-10 h-10 text-cyan-400" />
          </motion.div>

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 animate-pulse font-display">
              SPINNING ROULETTE...
            </h3>
            <p className="text-slate-300 text-sm">
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
                <NeonAvatarDisplay avatarId={p.avatar} size="md" />
                <span className="text-xs text-white font-bold truncate max-w-[70px] mt-1">
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
        <div className="glass-panel p-8 md:p-12 rounded-3xl text-center space-y-8 border border-feto-border">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
              The Roulette Has Chosen
            </span>
            <div className="flex items-center gap-3">
              <NeonAvatarDisplay avatarId={gameState.targetAvatar} size="lg" isGlowing />
              <h3 className="text-3xl md:text-4xl font-black text-white">
                {gameState.targetUsername}
              </h3>
            </div>
          </div>

          {isTarget ? (
            <div className="space-y-4">
              <p className="text-yellow-400 font-bold text-lg animate-bounce">
                It&rsquo;s your turn! Pick your fate:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChooseType('truth')}
                  className="p-6 sm:p-8 rounded-3xl bg-cyan-950/60 hover:bg-cyan-900/80 border-2 border-cyan-400 text-cyan-300 font-black text-2xl sm:text-3xl shadow-neon-cyan flex flex-col items-center gap-2 sm:gap-3 transition-all min-h-[56px] touch-target"
                >
                  <HelpCircle className="w-10 h-10 sm:w-12 sm:h-12 text-cyan-400" />
                  <span>TRUTH</span>
                  <span className="text-xs font-normal text-cyan-200">
                    Reveal an honest answer
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChooseType('dare')}
                  className="p-6 sm:p-8 rounded-3xl bg-pink-950/60 hover:bg-pink-900/80 border-2 border-feto-magenta text-feto-magenta font-black text-2xl sm:text-3xl shadow-neon-magenta flex flex-col items-center gap-2 sm:gap-3 transition-all min-h-[56px] touch-target"
                >
                  <Flame className="w-10 h-10 sm:w-12 sm:h-12 text-feto-magenta" />
                  <span>DARE</span>
                  <span className="text-xs font-normal text-pink-200">
                    Perform a bold party challenge
                  </span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-3">
              <div className="w-12 h-12 border-4 border-feto-magenta border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-300 text-lg">
                Waiting for <strong className="text-white">{gameState.targetUsername}</strong> to choose TRUTH or DARE...
              </p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 3: PERFORMING THE CHALLENGE                        */}
      {/* ======================================================== */}
      {gameState.phase === 'performing' && (
        <div className="glass-panel p-6 sm:p-8 md:p-12 rounded-3xl text-center space-y-6 border border-cyan-500/40 shadow-neon-cyan">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                gameState.chosenType === 'truth'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-feto-magenta/20 text-feto-magenta border border-feto-magenta/40'
              }`}
            >
              {gameState.chosenType} CHALLENGE
            </span>
          </div>

          <div className="max-w-2xl mx-auto py-4">
            <h3 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-white leading-relaxed">
              &ldquo;{gameState.currentPrompt}&rdquo;
            </h3>
          </div>

          <div className="pt-4 flex flex-col items-center">
            {isTarget ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCompleteAction}
                className="min-h-[52px] px-8 py-4 bg-gradient-to-r from-green-400 to-cyan-400 text-black font-black text-lg sm:text-xl rounded-2xl shadow-neon-green flex items-center justify-center gap-2 touch-target"
              >
                <Sparkles className="w-6 h-6" />
                <span>I COMPLETED IT!</span>
              </motion.button>
            ) : (
              <div className="text-slate-400 text-sm italic">
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
        <div className="glass-panel p-6 sm:p-8 md:p-10 rounded-3xl text-center space-y-6 border border-yellow-400/40 shadow-neon-yellow">
          <div>
            <span className="text-xs uppercase tracking-widest text-yellow-400 font-bold">
              Group Judgment Phase
            </span>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white mt-1">
              Did {gameState.targetUsername} complete the challenge?
            </h3>
          </div>

          {!isTarget ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCastVote('completed')}
                className={`min-h-[52px] p-5 sm:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-black text-lg sm:text-xl transition-all touch-target ${
                  myVote === 'completed' || selectedVote === 'completed'
                    ? 'bg-green-950/80 border-green-400 text-green-300 shadow-neon-green'
                    : 'bg-feto-card border-feto-border text-white hover:border-green-400'
                }`}
              >
                <ThumbsUp className="w-7 h-7 sm:w-8 sm:h-8 text-green-400" />
                <span>COMPLETED</span>
                <span className="text-xs text-green-300 font-normal">+100 Points</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCastVote('refused')}
                className={`min-h-[52px] p-5 sm:p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 font-black text-lg sm:text-xl transition-all touch-target ${
                  myVote === 'refused' || selectedVote === 'refused'
                    ? 'bg-red-950/80 border-red-500 text-red-300 shadow-neon-pink'
                    : 'bg-feto-card border-feto-border text-white hover:border-red-500'
                }`}
              >
                <ThumbsDown className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
                <span>CHICKEN</span>
                <span className="text-xs text-red-300 font-normal">-50 Points Penalty</span>
              </motion.button>
            </div>
          ) : (
            <div className="p-6 bg-feto-card rounded-2xl border border-feto-border max-w-md mx-auto text-slate-300 text-sm">
              <ShieldAlert className="w-8 h-8 text-yellow-400 mx-auto mb-2 animate-bounce" />
              You are on trial! The other players are voting on your performance.
            </div>
          )}

          {/* Live vote tallies */}
          <div className="flex justify-center gap-6 pt-4 text-sm font-bold">
            <span className="text-green-400">
              👍 Completed: {gameState.voteTallies.completed}
            </span>
            <span className="text-red-400">
              🐔 Chicken: {gameState.voteTallies.refused}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 5: ROUND RESULTS                                   */}
      {/* ======================================================== */}
      {gameState.phase === 'round_results' && (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 border border-feto-border">
          <h3 className="text-3xl font-black text-white flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span>Round Verdict</span>
          </h3>

          <div className="text-lg">
            {gameState.voteTallies.completed >= gameState.voteTallies.refused ? (
              <span className="text-green-400 font-extrabold text-2xl">
                CHALLENGE ACCEPTED! {gameState.targetUsername} earned +100 points! 🎉
              </span>
            ) : (
              <span className="text-red-400 font-extrabold text-2xl">
                CHICKEN! {gameState.targetUsername} took a -50 point penalty! 🐔
              </span>
            )}
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-4">
            {players.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-feto-card rounded-2xl border border-feto-border flex flex-col items-center"
              >
                <NeonAvatarDisplay avatarId={p.avatar} size="sm" isGlowing={p.id === gameState.targetPlayerId} />
                <span className="text-white font-bold text-xs truncate max-w-[100px] mt-1">
                  {p.username}
                </span>
                <span className="text-yellow-400 font-mono font-black text-sm">
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
