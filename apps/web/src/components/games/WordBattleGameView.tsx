'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayerSummary,
  WordBattlePublicState,
  WordBattleSubmission
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
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
      className="w-full max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6 p-2 md:p-4 transition-transform duration-200"
      style={isKeyboardOpen ? { transform: `scale(${scaleFactor})`, transformOrigin: 'top center' } : undefined}
    >
      {/* ======================================================== */}
      {/* HEADER: ROUND, LETTER & CATEGORY BANNER                  */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 md:p-6 rounded-3xl border border-feto-border shadow-neon-cyan">
        <div className="flex items-center gap-4">
          <div className="relative">
            <motion.div
              key={gameState.startingLetter}
              initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-cyan-400 via-feto-magenta to-yellow-400 flex items-center justify-center text-4xl md:text-5xl font-black text-black shadow-neon-magenta font-display"
            >
              {gameState.startingLetter}
            </motion.div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-feto-magenta/20 text-feto-magenta text-xs font-bold uppercase tracking-wider border border-feto-magenta/30 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Word Battle
              </span>
            </div>
            <h2 className="text-xl md:text-3xl font-black text-white mt-1">
              Category: <span className="text-cyan-400">{gameState.category}</span>
            </h2>
            <p className="text-slate-400 text-xs md:text-sm">
              Submit words starting with letter <strong className="text-yellow-400 font-bold">{gameState.startingLetter}</strong>! First to submit claims the word!
            </p>
          </div>
        </div>

        {/* 25-Second Authoritative Timer */}
        <div className="w-full md:w-64 flex flex-col items-center md:items-end">
          <div className="flex items-center gap-2 text-sm font-bold uppercase text-cyan-300 mb-1">
            <Clock className="w-4 h-4 animate-spin" />
            <span>{gameState.remainingSeconds}s Remaining</span>
          </div>
          <div className="w-full h-3 bg-feto-dark rounded-full overflow-hidden border border-cyan-500/30">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                gameState.remainingSeconds <= 5
                  ? 'bg-gradient-to-r from-red-500 to-yellow-400 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-400 to-feto-magenta'
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
        <div className="glass-panel p-12 rounded-3xl text-center space-y-4 border border-cyan-500/40">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 font-display animate-pulse"
          >
            GET READY!
          </motion.div>
          <p className="text-slate-300 text-lg">
            Letter is <strong className="text-cyan-400 text-2xl">{gameState.startingLetter}</strong> &bull; Category:{' '}
            <strong className="text-yellow-400 text-xl">{gameState.category}</strong>
          </p>
        </div>
      ) : gameState.phase === 'round_results' ? (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 border border-yellow-400/40 shadow-neon-yellow">
          <h3 className="text-3xl font-black text-white flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <span>Round {gameState.round} Completed!</span>
          </h3>
          <p className="text-slate-300">
            Total unique words claimed this round:{' '}
            <strong className="text-cyan-400 font-bold">{gameState.claimedWords.length}</strong>
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {players.map((p) => {
              const wordsCount = gameState.playerWordCounts[p.id] || 0;
              const roundScore = gameState.scores[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="p-3 bg-feto-card rounded-2xl border border-feto-border flex flex-col items-center"
                >
                  <NeonAvatarDisplay avatarId={p.avatar} size="sm" isGlowing={wordsCount > 0} />
                  <span className="text-white font-bold text-xs truncate max-w-[100px] mt-1">
                    {p.username}
                  </span>
                  <span className="text-cyan-400 text-xs font-medium">{wordsCount} words</span>
                  <span className="text-yellow-400 font-black text-sm">+{roundScore} pts</span>
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
                  className={`w-full min-h-[48px] bg-feto-card border-2 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white text-base sm:text-lg md:text-xl font-bold outline-none transition-all shadow-inner placeholder:text-slate-500 placeholder:text-xs sm:placeholder:text-sm md:placeholder:text-base ${
                    rejectFeedback
                      ? 'border-red-500 shadow-neon-pink'
                      : 'border-feto-border focus:border-cyan-400 focus:shadow-neon-cyan'
                  }`}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/40 text-xl font-black pointer-events-none" />
              </div>

              <button
                type="submit"
                disabled={!inputWord.trim() || gameState.phase !== 'word_racing' || isSubmitting}
                className="min-h-[48px] px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-cyan-400 to-feto-magenta hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-black font-black text-sm sm:text-lg rounded-2xl transition-all shadow-neon-cyan flex items-center justify-center gap-1.5 sm:gap-2 touch-target"
              >
                <span>CLAIM</span>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </motion.div>

            {/* Error or rejection feedback */}
            <AnimatePresence>
              {rejectFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-red-400 text-sm font-bold mt-2 px-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
                  className="flex items-center gap-2 text-green-400 text-sm font-bold mt-2 px-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Live Claimed Words Stream */}
            <div className="md:col-span-2 glass-panel p-5 rounded-3xl border border-feto-border flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-3 border-b border-feto-border pb-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Flame className="w-4 h-4 text-feto-magenta" />
                  <span>Claimed Words Stream</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    {gameState.claimedWords.length} Words
                  </span>
                </h3>
                <span className="text-xs text-slate-400">Unique words per round</span>
              </div>

              {gameState.recentSubmissions.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm italic py-12">
                  <Sparkles className="w-8 h-8 text-cyan-400/40 mb-2 animate-bounce" />
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
                        className={`px-3 py-2 rounded-xl flex items-center gap-2 border text-sm font-bold shadow-sm ${
                          isMine
                            ? 'bg-cyan-950/60 border-cyan-400 text-cyan-200 shadow-neon-cyan'
                            : 'bg-feto-card border-feto-border text-white'
                        }`}
                      >
                        <NeonAvatarDisplay avatarId={sub.avatar} size="sm" isGlowing={isMine} />
                        <span className="font-extrabold capitalize">{sub.word}</span>
                        <span className="text-xs text-yellow-400 font-mono">+{sub.points}</span>
                        <span className="text-[10px] text-slate-400">({sub.username})</span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Col: 15-Player Word Race Tally */}
            <div className="glass-panel p-5 rounded-3xl border border-feto-border flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-3 border-b border-feto-border pb-2">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  <span>Race Leaderboard</span>
                </h3>
                <span className="text-xs text-slate-400">{players.length} Players</span>
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
                        className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                          isMe
                            ? 'bg-cyan-950/40 border-cyan-400/50 text-white'
                            : 'bg-feto-dark border-feto-border text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-500 w-4 text-center">
                            #{rank + 1}
                          </span>
                          <NeonAvatarDisplay avatarId={p.avatar} size="sm" isGlowing={wordsCount > 0} />
                          <span className="font-bold truncate max-w-[85px]">{p.username}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                            {wordsCount} w
                          </span>
                          <span className="font-bold text-yellow-400 font-mono">
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
