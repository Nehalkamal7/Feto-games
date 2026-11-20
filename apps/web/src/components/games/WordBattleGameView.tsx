'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayerSummary,
  WordBattlePublicState,
  WordBattleSubmission
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import {
  Zap,
  Flame,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Sparkles,
  Send,
  Clock,
  Hash
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface WordBattleGameViewProps {
  gameState: WordBattlePublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
}

export const WordBattleGameView: React.FC<WordBattleGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  roomCode: _roomCode
}) => {
  const socket = getSocket();
  const { isKeyboardOpen, scaleFactor } = useVisualViewport();

  const [inputWord, setInputWord] = useState('');
  const [rejectFeedback, setRejectFeedback] = useState<string | null>(null);
  const [shakeInput, setShakeInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAcceptedWord, setLastAcceptedWord] = useState<{ word: string; points: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when entering word_racing phase
  useEffect(() => {
    if (gameState.phase === 'word_racing') {
      inputRef.current?.focus();
      setRejectFeedback(null);
    }
  }, [gameState.phase, gameState.round]);

  // Listen to server socket feedback
  useEffect(() => {
    const handleRejected = (data: { word: string; reason: string }) => {
      sound.playUnready();
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);

      let msg = 'Word rejected.';
      if (data.reason === 'already_taken') {
        msg = `"${data.word}" was already claimed by another player!`;
      } else if (data.reason === 'invalid_letter') {
        msg = `Must start with "${gameState.startingLetter}"!`;
      } else if (data.reason === 'invalid_word') {
        msg = `"${data.word}" is not a recognized word!`;
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
  }, [socket, currentPlayer.username, gameState.startingLetter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputWord.trim();
    if (!clean || gameState.phase !== 'word_racing' || isSubmitting) return;

    if (!clean.toLowerCase().startsWith(gameState.startingLetter.toLowerCase())) {
      sound.playUnready();
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      setRejectFeedback(`Word must start with letter "${gameState.startingLetter}"!`);
      return;
    }

    if (gameState.claimedWords.includes(clean.toLowerCase())) {
      sound.playUnready();
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 500);
      setRejectFeedback(`"${clean}" is already claimed!`);
      return;
    }

    setRejectFeedback(null);
    setIsSubmitting(true);
    socket.emit('word_battle:submit_word', { word: clean }, (res: any) => {
      setIsSubmitting(false);
      if (res && res.success && res.data?.accepted) {
        setInputWord('');
      } else if (res && !res.success) {
        setRejectFeedback(res.error?.message || 'Submission error');
      }
    });

    setInputWord('');
  };

  const progressPercent = Math.max(0, Math.min(100, (gameState.remainingSeconds / 25) * 100));

  return (
    <div
      className="w-full max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6 p-2 md:p-4 transition-transform duration-200 select-none"
      style={isKeyboardOpen ? { transform: `scale(${scaleFactor})`, transformOrigin: 'top center' } : undefined}
    >
      {/* ======================================================== */}
      {/* HEADER: ROUND, LETTER & CATEGORY BANNER                  */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#FFFFFF] p-4 md:p-6 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              key={gameState.startingLetter}
              initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#0B89FD] border-2 border-[#010101] flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-[3px_3px_0px_#010101]"
            >
              {gameState.startingLetter}
            </motion.div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FFFFFF] text-[#010101] text-xs font-black uppercase tracking-wider border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FEC90E] text-[#010101] text-xs font-black uppercase tracking-wider border-2 border-[#010101] shadow-[2px_2px_0px_#010101] flex items-center gap-1.5">
                <GameIcon gameMode="word_battle" size="xs" />
                Word Battle
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#010101] mt-1">
              Category: <span className="text-[#0B89FD]">{gameState.category}</span>
            </h2>
            <p className="text-[#010101]/70 text-xs md:text-sm font-bold">
              Submit words starting with letter <strong className="text-[#FD3F01] font-black">{gameState.startingLetter}</strong>! First to submit claims the word!
            </p>
          </div>
        </div>

        {/* 25-Second Authoritative Timer */}
        <div className="w-full md:w-64 flex flex-col items-center md:items-end">
          <div className="flex items-center gap-2 text-sm font-black uppercase text-[#010101] mb-1.5">
            <Clock strokeWidth={2.5} className="w-4 h-4 text-[#FD3F01] animate-spin shrink-0" />
            <span>{gameState.remainingSeconds}s Remaining</span>
          </div>
          <div className="w-full h-3 bg-[#F8F8F8] rounded-full overflow-hidden border-2 border-[#010101]">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                gameState.remainingSeconds <= 5
                  ? 'bg-[#FD3F01] animate-pulse'
                  : 'bg-[#0B89FD]'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN RACING AREA & SUBMISSION BAR                        */}
      {/* ======================================================== */}
      {gameState.phase === 'starting' ? (
        <div className="bg-[#FFFFFF] p-8 md:p-12 rounded-3xl text-center space-y-4 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-[#010101] uppercase tracking-tight animate-pulse"
          >
            GET READY!
          </motion.div>
          <p className="text-[#010101]/80 text-lg font-bold">
            Letter is <strong className="text-[#0B89FD] text-2xl font-black">{gameState.startingLetter}</strong> &bull; Category:{' '}
            <strong className="text-[#FD3F01] text-xl font-black">{gameState.category}</strong>
          </p>
        </div>
      ) : gameState.phase === 'round_results' ? (
        <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-3xl text-center space-y-6 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
          <h3 className="text-2xl sm:text-3xl font-black text-[#010101] flex items-center justify-center gap-2">
            <Trophy strokeWidth={2.5} className="w-7 h-7 text-[#FEC90E] shrink-0" />
            <span>Round {gameState.round} Completed!</span>
          </h3>
          <p className="text-[#010101]/80 font-bold">
            Total unique words claimed this round:{' '}
            <strong className="text-[#0B89FD] font-black">{gameState.claimedWords.length}</strong>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {players.map((p) => {
              const wordsCount = gameState.playerWordCounts[p.id] || 0;
              const roundScore = gameState.scores[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="p-3 bg-[#F8F8F8] rounded-2xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101] flex flex-col items-center"
                >
                  <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                  <span className="text-[#010101] font-black text-xs truncate max-w-[100px] mt-1.5">
                    {p.username}
                  </span>
                  <span className="text-[#0B89FD] text-xs font-bold">{wordsCount} words</span>
                  <span className="text-[#010101] font-black text-sm">+{roundScore} pts</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Active Word Input Form */}
          <form onSubmit={handleSubmit} className="relative">
            <motion.div
              animate={shakeInput ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder={`Word starting with "${gameState.startingLetter}"...`}
                  disabled={gameState.phase !== 'word_racing'}
                  className={`w-full min-h-[48px] bg-[#FFFFFF] border-2 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-[#010101] text-base sm:text-lg font-black outline-none transition-all placeholder:text-[#010101]/40 shadow-[4px_4px_0px_#010101] ${
                    rejectFeedback
                      ? 'border-[#FD3F01]'
                      : 'border-[#010101] focus:border-[#0B89FD]'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!inputWord.trim() || gameState.phase !== 'word_racing' || isSubmitting}
                className="min-h-[48px] px-6 sm:px-8 py-3 sm:py-4 bg-[#0B89FD] hover:bg-[#0977db] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base uppercase tracking-wider rounded-2xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] transition-all flex items-center justify-center gap-2 shrink-0 touch-target"
              >
                <span>CLAIM</span>
                <Send strokeWidth={2.5} className="w-4 h-4 shrink-0" />
              </button>
            </motion.div>

            {/* Error or rejection feedback */}
            <AnimatePresence>
              {rejectFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-[#FD3F01] text-sm font-black mt-2 px-2"
                >
                  <AlertCircle strokeWidth={2.5} className="w-4 h-4 shrink-0" />
                  <span>{rejectFeedback}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success flash feedback */}
            <AnimatePresence>
              {lastAcceptedWord && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-[#10B981] text-sm font-black mt-2 px-2"
                >
                  <CheckCircle2 strokeWidth={2.5} className="w-4 h-4 shrink-0" />
                  <span>
                    Claimed &ldquo;{lastAcceptedWord.word}&rdquo;! (+{lastAcceptedWord.points} points)
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* ======================================================== */}
          {/* TWO-COLUMN GRID: CLAIMED WORDS FEED & LIVE PLAYERS       */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Left 2 Cols: Live Claimed Words Stream */}
            <div className="md:col-span-2 bg-[#FFFFFF] p-5 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-3 border-b-2 border-[#010101]/10 pb-2">
                <h3 className="text-[#010101] font-black flex items-center gap-2">
                  <Flame strokeWidth={2.5} className="w-4 h-4 text-[#FD3F01] shrink-0" />
                  <span>Claimed Words Stream</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FEC90E] text-[#010101] border border-[#010101] font-black">
                    {gameState.claimedWords.length} Words
                  </span>
                </h3>
                <span className="text-xs text-[#010101]/60 font-bold">Unique words per round</span>
              </div>

              {gameState.recentSubmissions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[#010101]/50 text-sm font-bold py-12">
                  <Sparkles strokeWidth={2.5} className="w-8 h-8 text-[#FEC90E] mb-2 animate-bounce shrink-0" />
                  <span>No words claimed yet! Be the fastest to submit!</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 overflow-y-auto max-h-[320px] p-1">
                  {gameState.recentSubmissions.map((sub, i) => {
                    const isMine = sub.playerId === currentPlayer.id;
                    return (
                      <motion.div
                        key={`${sub.word}-${sub.submittedAt}-${i}`}
                        initial={{ scale: 0.7, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border-2 border-[#010101] text-sm font-black shadow-[2px_2px_0px_#010101] ${
                          isMine
                            ? 'bg-[#0B89FD] text-white'
                            : 'bg-[#FFFFFF] text-[#010101]'
                        }`}
                      >
                        <NeonAvatarDisplay avatarId={sub.avatar} size="sm" showGlow={false} />
                        <span className="font-black capitalize">{sub.word}</span>
                        <span className="text-xs text-[#FEC90E] font-black">+{sub.points}</span>
                        <span className="text-[10px] opacity-75">({sub.username})</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: 15-Player Word Race Tally */}
            <div className="bg-[#FFFFFF] p-5 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-3 border-b-2 border-[#010101]/10 pb-2">
                <h3 className="text-[#010101] font-black flex items-center gap-2">
                  <Hash strokeWidth={2.5} className="w-4 h-4 text-[#0B89FD] shrink-0" />
                  <span>Race Leaderboard</span>
                </h3>
                <span className="text-xs text-[#010101]/60 font-bold">{players.length} Players</span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2">
                {players
                  .slice()
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((p, rank) => {
                    const wordsCount = gameState.playerWordCounts[p.id] || 0;
                    const isMe = p.id === currentPlayer.id;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-2 rounded-xl border-2 border-[#010101] text-xs font-black shadow-[1px_1px_0px_#010101] ${
                          isMe
                            ? 'bg-[#FEC90E]/30 text-[#010101]'
                            : 'bg-[#F8F8F8] text-[#010101]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#010101]/60 w-4 text-center">
                            #{rank + 1}
                          </span>
                          <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                          <span className="font-black truncate max-w-[85px]">{p.username}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#010101] text-[#0B89FD] font-black">
                            {wordsCount} w
                          </span>
                          <span className="font-black text-[#010101]">
                            {p.score || 0} pts
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
