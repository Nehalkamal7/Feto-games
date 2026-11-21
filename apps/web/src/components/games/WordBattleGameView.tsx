'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayerSummary,
  WordBattlePublicState
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import {
  Flame,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Sparkles,
  Send,
  Clock,
  Hash,
  ArrowRight
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { useGameTimer } from '@/hooks/useGameTimer';

import { useLanguage } from '@/hooks/useLanguage';

interface WordBattleGameViewProps {
  gameState: WordBattlePublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
  onAction?: (actionType: string, payload?: any) => Promise<any>;
  isHost?: boolean;
}

export const WordBattleGameView: React.FC<WordBattleGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  roomCode: _roomCode,
  onAction,
  isHost
}) => {
  const socket = getSocket();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { isKeyboardOpen, scaleFactor } = useVisualViewport();

  const activeCategory = isAr ? (gameState.categoryAr || gameState.category) : gameState.category;
  const activeLetter = isAr ? (gameState.startingLetterAr || gameState.startingLetter) : gameState.startingLetter;

  const timer = useGameTimer({
    phaseEndsAt: (gameState as any)?.phaseEndsAt,
    roomCode: _roomCode,
    phase: gameState.phase,
    round: gameState.round,
    onTimeout: () => {
      if (onAction) {
        onAction('PHASE_TIMEOUT');
      }
    }
  });

  const [inputWord, setInputWord] = useState('');
  const [rejectFeedback, setRejectFeedback] = useState<string | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAcceptedWord, setLastAcceptedWord] = useState<{ word: string; points: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gameState.phase === 'word_racing') {
      inputRef.current?.focus();
      setRejectFeedback(null);
    }
  }, [gameState.phase, gameState.round]);

  useEffect(() => {
    const handleRejected = (data: { word: string; reason: string }) => {
      sound.playUnready();
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);

      let msg = isAr ? 'تم رفض الكلمة.' : 'Word rejected.';
      if (data.reason === 'already_taken') {
        msg = isAr
          ? `"${data.word}" تم حجزها بالفعل من لاعب آخر!`
          : `"${data.word}" was already claimed by another player!`;
      } else if (data.reason === 'invalid_letter') {
        msg = isAr
          ? `يجب أن تبدأ بحرف "${activeLetter}"!`
          : `Must start with "${gameState.startingLetter}"!`;
      } else if (data.reason === 'invalid_word') {
        msg = isAr
          ? `"${data.word}" ليست كلمة مسجلة!`
          : `"${data.word}" is not a recognized word!`;
      }
      setRejectFeedback(msg);
      setIsSubmitting(false);
    };

    const handleAccepted = (data: { word: string; points: number; username: string }) => {
      if (data.username === currentPlayer.username) {
        sound.playReady();
        setLastAcceptedWord({ word: data.word, points: data.points });
        setTimeout(() => setLastAcceptedWord(null), 3000);
      } else {
        sound.playClick();
      }
      setIsSubmitting(false);
    };

    socket.on('word_battle:rejected', handleRejected);
    socket.on('word_battle:accepted', handleAccepted);

    return () => {
      socket.off('word_battle:rejected', handleRejected);
      socket.off('word_battle:accepted', handleAccepted);
    };
  }, [socket, currentPlayer.username, gameState.startingLetter, activeLetter, isAr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputWord.trim();
    if (!clean || gameState.phase !== 'word_racing' || isSubmitting) return;

    const startsWithEn = clean.toLowerCase().startsWith(gameState.startingLetter.toLowerCase());
    const startsWithAr = gameState.startingLetterAr && clean.startsWith(gameState.startingLetterAr);

    if (!startsWithEn && !startsWithAr) {
      sound.playUnready();
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      setRejectFeedback(
        isAr
          ? `يجب أن تبدأ الكلمة بحرف "${activeLetter}"!`
          : `Word must start with letter "${gameState.startingLetter}"!`
      );
      return;
    }

    if (gameState.claimedWords.includes(clean.toLowerCase())) {
      sound.playUnready();
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      setRejectFeedback(
        isAr ? `"${clean}" محجوزة بالفعل!` : `"${clean}" is already claimed!`
      );
      return;
    }

    setRejectFeedback(null);
    setIsSubmitting(true);
    if (onAction) {
      onAction('SUBMIT_WORD', { word: clean });
    }
    socket.emit('word_battle:submit_word', { word: clean }, (res: any) => {
      setIsSubmitting(false);
      if (res && res.success && res.data?.accepted) {
        setInputWord('');
      } else if (res && !res.success) {
        setRejectFeedback(res.error?.message || (isAr ? 'خطأ في الإرسال' : 'Submission error'));
      }
    });

    setInputWord('');
  };

  const remainingSecs = timer.remainingSeconds > 0 ? timer.remainingSeconds : gameState.remainingSeconds;
  const progressPercent = Math.max(0, Math.min(100, (remainingSecs / 25) * 100));

  return (
    <div
      className="w-full max-w-md mx-auto flex flex-col gap-3.5 px-2 sm:px-4 overflow-x-hidden transition-transform duration-200 text-gray-900"
      style={isKeyboardOpen ? { transform: `scale(${scaleFactor})`, transformOrigin: 'top center' } : undefined}
    >
      {/* 1. HEADER: ROUND, LETTER & CATEGORY BANNER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <motion.div
            key={activeLetter}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-3xl md:text-4xl font-bold text-blue-600 shadow-xs shrink-0"
          >
            {activeLetter}
          </motion.div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                {isAr
                  ? `الجولة ${gameState.round} من ${gameState.totalRounds}`
                  : `Round ${gameState.round} of ${gameState.totalRounds}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold flex items-center gap-1">
                <GameIcon gameMode="word_battle" size="xs" />
                {isAr ? 'حرب الكلمات' : 'Word Battle'}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {isAr ? 'الفئة: ' : 'Category: '}
              <span className="text-blue-600">{activeCategory}</span>
            </h2>
            <p className="text-xs text-gray-500">
              {isAr ? (
                <>
                  اكتب كلمات تبدأ بحرف <strong className="text-blue-700 font-bold">{activeLetter}</strong>!
                </>
              ) : (
                <>
                  Submit words starting with letter <strong className="text-blue-700 font-bold">{gameState.startingLetter}</strong>!
                </>
              )}
            </p>
          </div>
        </div>

        {/* 25-Second Timer */}
        <div className="w-full md:w-56 flex flex-col items-center md:items-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-gray-500 mb-1">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className={`force-ltr ${remainingSecs <= 5 ? 'text-red-600 font-bold' : ''}`}>
              {isAr ? `متبقي ${remainingSecs} ثانية` : `${remainingSecs}s Remaining`}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                remainingSecs <= 5
                  ? 'bg-red-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. RACING AREA & SUBMISSION BAR */}
      {gameState.phase === 'starting' ? (
        <div className="bg-white p-8 md:p-12 rounded-2xl text-center space-y-3 border border-gray-200 shadow-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            {isAr ? 'استعد للسباق!' : 'Get Ready!'}
          </motion.div>
          <p className="text-gray-500 text-base">
            {isAr ? (
              <>
                الحرف المختار: <strong className="text-blue-600 text-xl font-bold">{activeLetter}</strong> &bull; الفئة:{' '}
                <strong className="text-gray-800 font-bold">{activeCategory}</strong>
              </>
            ) : (
              <>
                Starting letter is <strong className="text-blue-600 text-xl font-bold">{gameState.startingLetter}</strong> &bull; Category:{' '}
                <strong className="text-gray-800 font-bold">{gameState.category}</strong>
              </>
            )}
          </p>
        </div>
      ) : gameState.phase === 'round_results' ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl text-center space-y-5 border border-gray-200 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>
              {isAr
                ? `انتهت الجولة ${gameState.round}!`
                : `Round ${gameState.round} Completed!`}
            </span>
          </h3>
          <p className="text-gray-500 text-sm">
            {isAr ? 'إجمالي الكلمات المحجوزة في الجولة: ' : 'Total unique words claimed this round: '}
            <strong className="text-blue-600 font-bold">{gameState.claimedWords.length}</strong>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {players.map((p) => {
              const wordsCount = gameState.playerWordCounts[p.id] || 0;
              const roundScore = gameState.scores[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center shadow-xs"
                >
                  <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                  <span className="text-gray-900 font-semibold text-xs truncate max-w-[100px] mt-1.5">
                    {p.username}
                  </span>
                  <span className="text-blue-600 text-xs font-medium">
                    {wordsCount} {isAr ? 'كلمات' : 'words'}
                  </span>
                  <span className="text-gray-900 font-bold text-xs mt-0.5 force-ltr">
                    +{roundScore} {isAr ? 'نقطة' : 'pts'}
                  </span>
                </div>
              );
            })}
          </div>

          {isHost && (
            <button
              onClick={() => {
                sound.playClick();
                if (onAction) {
                  onAction('NEXT_ROUND', {});
                } else {
                  socket.emit('lobby:advance-round');
                }
              }}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-4"
            >
              <span>{isAr ? 'الجولة القادمة' : 'Next Round'}</span>
              <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Active Word Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <motion.div
              animate={shakeInput ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.35 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder={
                    isAr
                      ? `اكتب كلمة تبدأ بحرف "${activeLetter}"...`
                      : `Word starting with "${gameState.startingLetter}"...`
                  }
                  disabled={gameState.phase !== 'word_racing'}
                  className={`w-full h-12 bg-white border rounded-xl px-4 text-gray-900 text-sm sm:text-base font-semibold outline-none transition-all placeholder:text-gray-400 shadow-xs ${
                    rejectFeedback
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!inputWord.trim() || gameState.phase !== 'word_racing' || isSubmitting}
                className="w-full sm:w-auto h-12 px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm uppercase tracking-wide rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <span>{isAr ? 'احجز' : 'Claim'}</span>
                <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
              </button>
            </motion.div>

            {/* Error or rejection feedback */}
            <AnimatePresence>
              {rejectFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-center gap-1.5 text-red-600 text-xs font-medium mt-1.5 px-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{rejectFeedback}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success feedback */}
            <AnimatePresence>
              {lastAcceptedWord && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mt-1.5 px-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isAr
                      ? `تم حجز "${lastAcceptedWord.word}"! (+${lastAcceptedWord.points} نقطة)`
                      : `Claimed "${lastAcceptedWord.word}"! (+${lastAcceptedWord.points} points)`}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* TWO-COLUMN GRID: CLAIMED WORDS & LEADERBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Left 2 Cols: Live Claimed Words Stream */}
            <div className="md:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h3 className="text-gray-900 font-bold text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'شريط الكلمات المحجوزة' : 'Claimed Words Stream'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                    {gameState.claimedWords.length} {isAr ? 'كلمة' : 'Words'}
                  </span>
                </h3>
                <span className="text-xs text-gray-500">{isAr ? 'فريدة بالجولة' : 'Unique per round'}</span>
              </div>

              {gameState.recentSubmissions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-xs font-medium py-10">
                  <Sparkles className="w-6 h-6 text-amber-400 mb-1" />
                  <span>
                    {isAr
                      ? 'لم تُحجز أي كلمة بعد! كن الأسرع في الإرسال!'
                      : 'No words claimed yet! Be the fastest to submit!'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[300px] p-1">
                  {gameState.recentSubmissions.map((sub, i) => {
                    const isMine = sub.playerId === currentPlayer.id;
                    return (
                      <motion.div
                        key={`${sub.word}-${sub.submittedAt}-${i}`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border text-xs font-semibold shadow-xs ${
                          isMine
                            ? 'bg-blue-50 border-blue-300 text-blue-900'
                            : 'bg-white border-gray-200 text-gray-800'
                        }`}
                      >
                        <NeonAvatarDisplay avatarId={sub.avatar} size="sm" showGlow={false} className="w-5 h-5" />
                        <span className="capitalize">{sub.word}</span>
                        <span className="text-xs text-emerald-600 font-bold">+{sub.points}</span>
                        <span className="text-[10px] text-gray-400">({sub.username})</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: Leaderboard */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col min-h-[280px]">
              <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                <h3 className="text-gray-900 font-bold text-sm flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-blue-600" />
                  <span>{isAr ? 'ترتيب الجولة' : 'Round Standings'}</span>
                </h3>
                <span className="text-xs text-gray-500">
                  {players.length} {isAr ? 'لاعبين' : 'Players'}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-1.5">
                {players
                  .slice()
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((p, rank) => {
                    const wordsCount = gameState.playerWordCounts[p.id] || 0;
                    const isMe = p.id === currentPlayer.id;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                          isMe
                            ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                            : 'bg-gray-50 border-gray-200 text-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-gray-400 w-4 text-center">
                            #{rank + 1}
                          </span>
                          <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} className="w-6 h-6" />
                          <span className="font-semibold truncate max-w-[85px]">{p.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-white border border-gray-200 text-blue-600 font-semibold text-[11px]">
                            {wordsCount} {isAr ? 'ك' : 'w'}
                          </span>
                          <span className="font-bold text-gray-900 force-ltr">
                            {p.score || 0} {isAr ? 'نقطة' : 'pts'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
