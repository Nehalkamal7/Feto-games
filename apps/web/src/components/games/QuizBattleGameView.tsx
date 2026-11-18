'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayerSummary,
  QuizPublicState
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Flame,
  Award,
  Crown
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';

interface QuizBattleGameViewProps {
  gameState: QuizPublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = [
  { border: 'border-cyan-400', bg: 'hover:bg-cyan-950/40', active: 'bg-cyan-950/80 shadow-neon-cyan' },
  { border: 'border-feto-magenta', bg: 'hover:bg-pink-950/40', active: 'bg-pink-950/80 shadow-neon-magenta' },
  { border: 'border-yellow-400', bg: 'hover:bg-yellow-950/40', active: 'bg-yellow-950/80 shadow-neon-yellow' },
  { border: 'border-green-400', bg: 'hover:bg-green-950/40', active: 'bg-green-950/80 shadow-neon-green' }
];

export const QuizBattleGameView: React.FC<QuizBattleGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  roomCode: _roomCode
}) => {
  const socket = getSocket();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const currentQ = gameState.currentQuestion;
  const hasAnswered = gameState.answeredPlayerIds.includes(currentPlayer.id);

  // Synchronized question timer
  useEffect(() => {
    if (!currentQ || gameState.phase !== 'question') return;

    // Reset selection for new question
    setSelectedOption(null);

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((currentQ.phaseEndsAt - now) / 1000));
      setRemainingSeconds(diff);
      if (diff === 0) clearInterval(interval);
    }, 250);

    return () => clearInterval(interval);
  }, [currentQ, gameState.phase]);

  // Handle Option Click
  const handleSelectOption = (idx: number) => {
    if (gameState.phase !== 'question' || hasAnswered || selectedOption !== null) {
      return;
    }

    sound.playClick();
    setSelectedOption(idx);

    socket.emit('quiz:submit_answer', { optionIndex: idx }, (res: any) => {
      if (res && res.success) {
        sound.playReady();
      }
    });
  };

  const timerPercentage = currentQ
    ? (remainingSeconds / currentQ.durationSeconds) * 100
    : 100;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* ======================================================== */}
      {/* TOP HEADER: QUESTION PROGRESS & TIMER                    */}
      {/* ======================================================== */}
      <div className="glass-panel-neon rounded-3xl p-5 md:p-6 border border-cyan-500/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-full text-xs font-black text-cyan-300 uppercase tracking-widest">
              Question {gameState.questionNumber} / {gameState.totalQuestions}
            </span>
            {currentQ && (
              <span className="px-3 py-1 bg-feto-card border border-feto-border rounded-full text-xs font-bold text-slate-300">
                {currentQ.category} • <span className="capitalize">{currentQ.difficulty}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-bold block uppercase">Speed Timer</span>
              <span className="text-xl font-black text-cyan-300">{remainingSeconds}s</span>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-full bg-feto-card border border-feto-border text-slate-300 font-bold">
              {gameState.answeredPlayerIds.length} / {gameState.totalActivePlayers} Answered
            </div>
          </div>
        </div>

        {/* Animated Timer Bar */}
        {gameState.phase === 'question' && (
          <div className="w-full h-3 bg-feto-dark rounded-full overflow-hidden border border-cyan-500/30">
            <div
              className={`h-full transition-all duration-300 ease-linear ${
                remainingSeconds <= 3
                  ? 'bg-red-500 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* QUESTION PROMPT CARD                                     */}
      {/* ======================================================== */}
      {currentQ && (
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-6 md:p-8 border border-feto-border text-center space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-yellow-400">
            <Zap className="w-4 h-4 fill-yellow-400" />
            <span>Answer Faster For Higher Speed Bonus!</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-snug">
            {currentQ.question}
          </h2>
        </motion.div>
      )}

      {/* ======================================================== */}
      {/* 4 INTERACTIVE NEON OPTIONS                                */}
      {/* ======================================================== */}
      {currentQ && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {currentQ.options.map((optText, idx) => {
            const letter = OPTION_LETTERS[idx];
            const colorMeta = OPTION_COLORS[idx] || OPTION_COLORS[0];
            const isSelected = selectedOption === idx;
            const isCorrect = gameState.correctAnswerIndex === idx;
            const isWrongSelection =
              gameState.phase === 'reveal' && isSelected && !isCorrect;

            let cardStyle = `${colorMeta.border} ${colorMeta.bg} bg-feto-card`;

            if (gameState.phase === 'reveal') {
              if (isCorrect) {
                cardStyle = 'border-green-400 bg-green-950/80 shadow-neon-green scale-102';
              } else if (isWrongSelection) {
                cardStyle = 'border-red-500 bg-red-950/80 opacity-70';
              } else {
                cardStyle = 'border-slate-800 bg-feto-dark/50 opacity-50';
              }
            } else if (isSelected) {
              cardStyle = `${colorMeta.border} ${colorMeta.active} scale-102`;
            }

            return (
              <motion.button
                key={`${currentQ.id}-${idx}`}
                whileHover={gameState.phase === 'question' && !hasAnswered ? { scale: 1.02 } : {}}
                whileTap={gameState.phase === 'question' && !hasAnswered ? { scale: 0.98 } : {}}
                onClick={() => handleSelectOption(idx)}
                disabled={gameState.phase !== 'question' || hasAnswered}
                className={`min-h-[56px] p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group touch-target ${cardStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base border ${
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'bg-feto-dark text-slate-300 border-slate-700'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-base font-bold text-white leading-tight">
                    {optText}
                  </span>
                </div>

                {/* Status Indicator */}
                {gameState.phase === 'reveal' ? (
                  isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  ) : isWrongSelection ? (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  ) : null
                ) : isSelected ? (
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300 px-2 py-1 bg-cyan-950/60 rounded-lg">
                    LOCKED IN
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* LEADERBOARD VIEW (Between Rounds)                        */}
      {/* ======================================================== */}
      {gameState.phase === 'leaderboard' && gameState.roundScoreUpdates && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel-neon p-6 md:p-8 rounded-3xl border border-cyan-400/50 space-y-4"
        >
          <div className="text-center mb-6">
            <Trophy className="w-10 h-10 text-yellow-400 mx-auto mb-2 animate-bounce" />
            <h3 className="text-2xl font-black text-white">Live Leaderboard</h3>
            <p className="text-xs text-slate-400">Scores after Question {gameState.questionNumber}</p>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {gameState.roundScoreUpdates.map((scoreItem, idx) => (
              <div
                key={scoreItem.playerId}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                  idx === 0
                    ? 'bg-yellow-950/40 border-yellow-400/80 shadow-neon-yellow'
                    : idx === 1
                    ? 'bg-slate-800/80 border-slate-400'
                    : idx === 2
                    ? 'bg-amber-950/40 border-amber-600'
                    : 'bg-feto-card border-feto-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-black text-sm">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </div>
                  <NeonAvatarDisplay avatarId={scoreItem.avatar} size="sm" showGlow={false} />
                  <div>
                    <div className="font-bold text-sm text-white">
                      {scoreItem.username}
                      {scoreItem.playerId === currentPlayer.id && (
                        <span className="ml-1 text-[10px] text-cyan-400 font-normal">(You)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-cyan-300">
                    {scoreItem.totalScore} pts
                  </div>
                  {scoreItem.roundScoreDelta > 0 && (
                    <div className="text-[11px] font-bold text-green-400">
                      +{scoreItem.roundScoreDelta} pts
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
