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
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useLanguage } from '@/hooks/useLanguage';

interface TruthOrDareGameViewProps {
  gameState: TruthOrDarePublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
  onAction?: (actionType: string, payload?: any) => Promise<any>;
  isHost?: boolean;
}

export const TruthOrDareGameView: React.FC<TruthOrDareGameViewProps> = ({
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

  const isTarget = gameState.targetPlayerId === currentPlayer.id;
  const myVote = gameState.votes[currentPlayer.id];
  const [selectedVote, setSelectedVote] = useState<'completed' | 'refused' | null>(null);

  // Handle Target Choice
  const handleChooseType = (choice: 'truth' | 'dare') => {
    if (!isTarget || gameState.phase !== 'decision') return;
    sound.playClick();
    if (onAction) {
      onAction('CHOOSE_TYPE', { choice });
    }
    socket.emit('tod:choose_type', { choice });
  };

  // Handle Target Action Complete
  const handleCompleteAction = () => {
    if (!isTarget || gameState.phase !== 'performing') return;
    sound.playReady();
    if (onAction) {
      onAction('COMPLETE_ACTION');
    }
    socket.emit('tod:complete_action');
  };

  // Handle Non-Target Vote
  const handleCastVote = (vote: 'completed' | 'refused') => {
    if (isTarget || gameState.phase !== 'voting') return;
    sound.playClick();
    setSelectedVote(vote);
    if (onAction) {
      onAction('TOD_VOTE', { vote });
    }
    socket.emit('tod:vote', { vote });
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-2 sm:px-4 overflow-x-hidden text-gray-900 select-none">
      {/* 1. HEADER: ROUND & INTENSITY */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <GameIcon gameMode="truth_or_dare" size="md" showContainer />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                {isAr
                  ? `الجولة ${gameState.round} من ${gameState.totalRounds}`
                  : `Round ${gameState.round} of ${gameState.totalRounds}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold capitalize">
                {isAr
                  ? (gameState.intensity === 'spicy' ? 'وضع حامي 🔥' : gameState.intensity === 'silly' ? 'وضع مجنون 🤪' : 'وضع كلاسيك')
                  : `${gameState.intensity} Mode`}
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-0.5">
              {isAr ? 'صراحة أو جرأة' : 'Truth or Dare'}
            </h2>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold ${
          timer.isUrgent
            ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="force-ltr">
            {isAr
              ? `متبقي ${timer.remainingSeconds > 0 ? timer.remainingSeconds : gameState.remainingSeconds} ثانية`
              : `${timer.remainingSeconds > 0 ? timer.remainingSeconds : gameState.remainingSeconds}s Remaining`}
          </span>
        </div>
      </div>

      {/* 2. PHASE 1: ROULETTE WHEEL SPINNER */}
      {gameState.phase === 'roulette' && (
        <div className="bg-white p-8 sm:p-10 rounded-2xl text-center space-y-5 border border-gray-200 shadow-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-16 h-16 mx-auto rounded-full border-2 border-blue-600 border-t-transparent flex items-center justify-center bg-blue-50 text-blue-600"
          >
            <RotateCw className="w-8 h-8" />
          </motion.div>

          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              {isAr ? 'عجلة الحظ تدور...' : 'Spinning Selection Wheel...'}
            </h3>
            <p className="text-gray-500 text-xs">
              {isAr
                ? 'مين الضحية القادمة في التحدي؟'
                : 'Selecting which player faces the party challenge!'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 overflow-hidden py-3">
            {players.map((p, idx) => (
              <motion.div
                key={p.id}
                animate={{
                  scale: [1, 1.1, 1],
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
                <span className="text-xs text-gray-800 font-semibold truncate max-w-[70px] mt-1">
                  {p.username}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PHASE 2: DECISION (TARGET PICKS TRUTH OR DARE) */}
      {gameState.phase === 'decision' && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl text-center space-y-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-blue-600 font-semibold">
              {isAr ? 'العجلة اختارت الضحية:' : 'The Wheel Has Chosen'}
            </span>
            <div className="flex items-center gap-3">
              <NeonAvatarDisplay avatarId={gameState.targetAvatar} size="lg" showGlow={false} />
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {gameState.targetUsername}
              </h3>
            </div>
          </div>

          {isTarget ? (
            <div className="space-y-4">
              <p className="text-gray-700 font-semibold text-base">
                {isAr ? 'دورك الآن! اختر مصيرك:' : 'It’s your turn! Pick your choice:'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChooseType('truth')}
                  className="p-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xl shadow-sm flex flex-col items-center gap-2 transition-all"
                >
                  <HelpCircle className="w-8 h-8" />
                  <span>{isAr ? 'صراحة 💬' : 'TRUTH'}</span>
                  <span className="text-xs font-normal text-blue-100">
                    {isAr ? 'جاوب على سؤال حقيقي ومحرج' : 'Answer an honest question'}
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChooseType('dare')}
                  className="p-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xl shadow-sm flex flex-col items-center gap-2 transition-all"
                >
                  <Flame className="w-8 h-8" />
                  <span>{isAr ? 'جرأة 🔥' : 'DARE'}</span>
                  <span className="text-xs font-normal text-rose-100">
                    {isAr ? 'نفّذ تحدياً مجنوناً أمام الجميع' : 'Perform a fun party dare'}
                  </span>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-2">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-gray-600 text-sm">
                {isAr ? (
                  <>
                    في انتظار <strong className="text-gray-900 font-semibold">{gameState.targetUsername}</strong> ليختار صراحة أو جرأة...
                  </>
                ) : (
                  <>
                    Waiting for <strong className="text-gray-900 font-semibold">{gameState.targetUsername}</strong> to choose TRUTH or DARE...
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. PHASE 3: PERFORMING THE CHALLENGE */}
      {gameState.phase === 'performing' && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl text-center space-y-5 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                gameState.chosenType === 'truth'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isAr
                ? (gameState.chosenType === 'truth' ? 'تحدي صراحة' : 'تحدي جرأة')
                : `${gameState.chosenType} Challenge`}
            </span>
          </div>

          <div className="max-w-2xl mx-auto py-3">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed">
              &ldquo;{isAr && (gameState as any).currentPromptAr ? (gameState as any).currentPromptAr : gameState.currentPrompt}&rdquo;
            </h3>
          </div>

          <div className="pt-2 flex flex-col items-center">
            {isTarget ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCompleteAction}
                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isAr ? 'نفّذت التحدي بنجاح! 💪 (+100 نقطة)' : 'I Completed It! (+100 pts)'}</span>
              </motion.button>
            ) : (
              <div className="text-gray-500 text-xs italic">
                {isAr
                  ? `${gameState.targetUsername} يجاوب / ينفّذ التحدي مباشرة الآن!`
                  : `${gameState.targetUsername} is answering / performing live!`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PHASE 4: VOTING VERDICT */}
      {gameState.phase === 'voting' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl text-center space-y-5 border border-gray-200 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-blue-600 font-semibold">
              {isAr ? 'تصويت الروم' : 'Group Vote'}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mt-0.5">
              {isAr
                ? `هل نفّذ ${gameState.targetUsername} التحدي بنزاهة؟`
                : `Did ${gameState.targetUsername} complete the challenge?`}
            </h3>
          </div>

          {!isTarget ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto pt-1">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCastVote('completed')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold text-base transition-all ${
                  myVote === 'completed' || selectedVote === 'completed'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-xs'
                }`}
              >
                <ThumbsUp className="w-5 h-5 text-emerald-600" />
                <span>{isAr ? 'نفّذ وبجدعنة 👍' : 'Completed'}</span>
                <span className="text-xs text-gray-500">
                  {isAr ? '+100 نقطة' : '+100 Points'}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCastVote('refused')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 font-semibold text-base transition-all ${
                  myVote === 'refused' || selectedVote === 'refused'
                    ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                    : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50 shadow-xs'
                }`}
              >
                <ThumbsDown className="w-5 h-5 text-rose-600" />
                <span>{isAr ? 'جبن / ما نفّذش 🐔' : 'Refused / Chicken'}</span>
                <span className="text-xs text-gray-500">
                  {isAr ? '-50 نقطة عقاب' : '-50 Points Penalty'}
                </span>
              </motion.button>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 max-w-md mx-auto text-gray-600 text-xs">
              <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              {isAr
                ? 'باقي اللاعبين يصوّتون على أدائك الآن...'
                : 'The other players are voting on your performance.'}
            </div>
          )}

          {/* Live vote tallies */}
          <div className="flex justify-center gap-6 pt-2 text-xs font-semibold">
            <span className="text-emerald-600">
              👍 {isAr ? 'نفّذ: ' : 'Completed: '}{gameState.voteTallies.completed}
            </span>
            <span className="text-rose-600">
              🐔 {isAr ? 'جبن: ' : 'Chicken: '}{gameState.voteTallies.refused}
            </span>
          </div>
        </div>
      )}

      {/* 6. PHASE 5: ROUND RESULTS */}
      {gameState.phase === 'round_results' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl text-center space-y-4 border border-gray-200 shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span>{isAr ? 'حكم الجولة' : 'Round Verdict'}</span>
          </h3>

          <div className="text-base sm:text-lg">
            {gameState.voteTallies.completed >= gameState.voteTallies.refused ? (
              <span className="text-emerald-700 font-bold">
                {isAr
                  ? `🎉 عاااش! ${gameState.targetUsername} كسب +100 نقطة!`
                  : `Challenge Accepted! ${gameState.targetUsername} earned +100 points! 🎉`}
              </span>
            ) : (
              <span className="text-rose-600 font-bold">
                {isAr
                  ? `🐔 جبن في اللحظة الحاسمة! ${gameState.targetUsername} خسر 50 نقطة!`
                  : `Chicken! ${gameState.targetUsername} took a -50 point penalty! 🐔`}
              </span>
            )}
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-3">
            {players.map((p) => (
              <div
                key={p.id}
                className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col items-center"
              >
                <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                <span className="text-gray-900 font-semibold text-xs truncate max-w-[100px] mt-1">
                  {p.username}
                </span>
                <span className="text-blue-600 font-bold text-xs force-ltr">
                  {gameState.scores[p.id] || 0} {isAr ? 'نقطة' : 'pts'}
                </span>
              </div>
            ))}
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
      )}
    </div>
  );
};
