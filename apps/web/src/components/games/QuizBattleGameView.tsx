'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayerSummary,
  QuizPublicState
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Zap,
  Clock
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
    <div className="w-full max-w-md mx-auto space-y-4 px-2 sm:px-4 overflow-x-hidden text-gray-900">
      {/* 1. TOP HEADER: QUESTION PROGRESS & TIMER */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <GameIcon gameMode="quiz_battle" size="md" showContainer />
            <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-blue-700">
              Question {gameState.questionNumber} / {gameState.totalQuestions}
            </span>
            {currentQ && (
              <span className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                {currentQ.category} • <span className="capitalize">{currentQ.difficulty}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Timer</span>
              <span className={`text-xl font-bold font-mono ${remainingSeconds <= 3 ? 'text-red-600' : 'text-blue-600'}`}>
                {remainingSeconds}s
              </span>
            </div>
            <div className="text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 font-semibold">
              {gameState.answeredPlayerIds.length} / {gameState.totalActivePlayers} Answered
            </div>
          </div>
        </div>

        {/* Timer Bar */}
        {gameState.phase === 'question' && (
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ease-linear rounded-full ${
                remainingSeconds <= 3
                  ? 'bg-red-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${timerPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. QUESTION PROMPT CARD */}
      {currentQ && (
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 shadow-sm text-center space-y-2"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Answer Faster For Higher Speed Bonus!</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug pt-1">
            {currentQ.question}
          </h2>
        </motion.div>
      )}

      {/* 3. 4 CLEAN ANSWER OPTIONS */}
      {currentQ && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((optText, idx) => {
            const letter = OPTION_LETTERS[idx];
            const isSelected = selectedOption === idx;
            const isCorrect = gameState.correctAnswerIndex === idx;
            const isWrongSelection =
              gameState.phase === 'reveal' && isSelected && !isCorrect;

            let cardStyle = 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-xs';

            if (gameState.phase === 'reveal') {
              if (isCorrect) {
                cardStyle = 'bg-emerald-50 text-emerald-950 border border-emerald-500 shadow-xs ring-2 ring-emerald-500/20';
              } else if (isWrongSelection) {
                cardStyle = 'bg-rose-50 text-rose-950 border border-rose-300 opacity-90';
              } else {
                cardStyle = 'bg-gray-50 text-gray-400 border border-gray-200 opacity-60';
              }
            } else if (isSelected) {
              cardStyle = 'bg-blue-50 text-blue-900 border-blue-500 ring-2 ring-blue-500/20 shadow-xs';
            }

            return (
              <motion.button
                key={`${currentQ.id}-${idx}`}
                whileHover={gameState.phase === 'question' && !hasAnswered ? { scale: 1.01 } : {}}
                whileTap={gameState.phase === 'question' && !hasAnswered ? { scale: 0.99 } : {}}
                onClick={() => handleSelectOption(idx)}
                disabled={gameState.phase !== 'question' || hasAnswered}
                className={`min-h-[56px] p-4 rounded-xl text-left transition-all flex items-center justify-between group ${cardStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSelected || isCorrect || isWrongSelection
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {letter}
                  </div>
                  <span className="text-sm sm:text-base font-semibold leading-tight">
                    {optText}
                  </span>
                </div>

                {/* Status Indicator */}
                {gameState.phase === 'reveal' ? (
                  isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : isWrongSelection ? (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : null
                ) : isSelected ? (
                  <span className="text-xs font-semibold text-blue-700 px-2.5 py-1 bg-blue-100/60 rounded-md shrink-0">
                    Locked In
                  </span>
                ) : null}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* 4. LEADERBOARD VIEW (Between Rounds) */}
      {gameState.phase === 'leaderboard' && gameState.roundScoreUpdates && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4"
        >
          <div className="text-center mb-4">
            <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-1.5" />
            <h3 className="text-xl font-bold text-gray-900">Round Leaderboard</h3>
            <p className="text-xs text-gray-500">Scores after Question {gameState.questionNumber}</p>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {gameState.roundScoreUpdates.map((scoreItem, idx) => (
              <div
                key={scoreItem.playerId}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  idx === 0
                    ? 'bg-amber-50/60 border-amber-200'
                    : idx === 1
                    ? 'bg-slate-50 border-slate-200'
                    : idx === 2
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 text-center font-bold text-sm text-gray-500">
                    #{idx + 1}
                  </div>
                  <NeonAvatarDisplay avatarId={scoreItem.avatar} size="sm" showGlow={false} />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {scoreItem.username}
                      {scoreItem.playerId === currentPlayer.id && (
                        <span className="ml-1 text-xs text-blue-600 font-semibold">(You)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 font-mono">
                    {scoreItem.totalScore} pts
                  </div>
                  {scoreItem.roundScoreDelta > 0 && (
                    <div className="text-xs font-semibold text-emerald-600">
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
