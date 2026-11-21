'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImposterPublicState,
  PlayerSummary,
  PrivateRolePayload
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import {
  Eye,
  EyeOff,
  Send,
  Vote,
  Sparkles,
  Flame,
  Zap,
  ArrowRight,
  Clock
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';
import { useVisualViewport } from '@/hooks/useVisualViewport';
import { useGameTimer } from '@/hooks/useGameTimer';

import { useLanguage } from '@/hooks/useLanguage';

interface ImposterGameViewProps {
  gameState: ImposterPublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  privateRole?: PrivateRolePayload | null;
  roomCode: string;
  onAction?: (actionType: string, payload?: any) => Promise<any>;
  isHost?: boolean;
}

export const ImposterGameView: React.FC<ImposterGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  privateRole,
  roomCode: _roomCode,
  onAction,
  isHost
}) => {
  const socket = getSocket();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { isKeyboardOpen, scaleFactor } = useVisualViewport();

  const timer = useGameTimer({
    phaseEndsAt: (gameState as any)?.phaseEndsAt,
    roomCode: _roomCode,
    phase: gameState.phase,
    round: (gameState as any)?.currentRound || 1,
    onTimeout: () => {
      if (onAction) {
        onAction('PHASE_TIMEOUT');
      }
    }
  });

  // Role card toggle
  const [showRoleSecret, setShowRoleSecret] = useState(false);

  // Clue submission input
  const [clueInput, setClueInput] = useState('');
  const [isSubmittingClue, setIsSubmittingClue] = useState(false);

  // Sudden death guess input
  const [suddenDeathInput, setSuddenDeathInput] = useState('');
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);

  // Determine role and secret word with high resilience
  const isImposter = Boolean(
    privateRole?.role === 'imposter' ||
    (privateRole as any)?.roleTitle === 'IMPOSTER' ||
    (privateRole as any)?.isImposter
  );

  const secretWord = (
    privateRole?.secretWord ||
    (gameState as any)?.secretWord ||
    (gameState as any)?.revealedWord ||
    (gameState as any)?.word ||
    'FIREFIGHTER'
  ).toUpperCase();

  const secretWordAr =
    privateRole?.secretWordAr ||
    (gameState as any)?.secretWordAr ||
    (gameState as any)?.revealedWordAr ||
    secretWord;

  const displaySecretWord = isAr ? secretWordAr : secretWord;

  const categoryName = isAr
    ? (gameState.categoryAr || privateRole?.categoryAr || gameState.category || 'فئات عامة')
    : (gameState.category || privateRole?.category || 'Professions');

  // Check if it's the current user's turn to give a clue
  const isMyTurn =
    gameState.phase === 'clue_giving' &&
    (gameState.currentTurnPlayerId === currentPlayer.id || players.length === 1);

  const isCaughtImposter =
    gameState.suddenDeathActive &&
    gameState.suddenDeathPlayerId === currentPlayer.id;

  const votedForId = gameState.votes ? gameState.votes[currentPlayer.id] : undefined;

  // Submit Clue
  const handleSendClue = async (e: React.FormEvent) => {
    e.preventDefault();
    const clue = clueInput.trim();
    if (!clue || isSubmittingClue) return;

    sound.playClick();
    setIsSubmittingClue(true);

    try {
      if (onAction) {
        await onAction('SUBMIT_CLUE', { clue });
        setClueInput('');
        sound.playReady();
      } else {
        socket.emit('imposter:submit_clue', { clue }, (res: any) => {
          if (res && res.success) {
            setClueInput('');
            sound.playReady();
          }
        });
      }
    } catch (err) {
      console.error('Error submitting clue:', err);
    } finally {
      setIsSubmittingClue(false);
    }
  };

  // Cast Vote
  const handleCastVote = async (targetPlayerId: string) => {
    if (gameState.phase !== 'voting') return;
    if (players.length > 1 && targetPlayerId === currentPlayer.id) return;
    sound.playClick();

    try {
      if (onAction) {
        await onAction('SUBMIT_VOTE', { targetPlayerId });
        sound.playReady();
      } else {
        socket.emit('imposter:cast_vote', { targetPlayerId }, (res: any) => {
          if (res && res.success) {
            sound.playReady();
          }
        });
      }
    } catch (err) {
      console.error('Error casting vote:', err);
    }
  };

  // Submit Sudden-Death Guess
  const handleSuddenDeathSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const guess = suddenDeathInput.trim();
    if (!guess || isSubmittingGuess) return;

    sound.playClick();
    setIsSubmittingGuess(true);

    try {
      if (onAction) {
        await onAction('GUESS_WORD', { guessedWord: guess });
        sound.playFanfare();
      } else {
        socket.emit('imposter:sudden_death_guess', { guessedWord: guess }, (res: any) => {
          if (res && res.correct) {
            sound.playFanfare();
          }
        });
      }
    } catch (err) {
      console.error('Error in sudden death guess:', err);
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  return (
    <div
      className="w-full max-w-md mx-auto space-y-4 px-2 sm:px-4 overflow-x-hidden text-gray-900 transition-transform duration-200"
      style={isKeyboardOpen ? { transform: `scale(${scaleFactor})`, transformOrigin: 'top center' } : undefined}
    >
      {/* 1. TOP CATEGORY & SECRET ROLE CARD */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <GameIcon gameMode="who_is_imposter" size="md" showContainer />
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                {isAr ? 'الفئة' : 'Category'}
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-gray-900 truncate">
                {categoryName}
              </div>
            </div>
          </div>

          {/* Live Timer Pill & Privacy Role Reveal Button */}
          <div className="flex items-center gap-2 shrink-0">
            {timer.remainingSeconds > 0 && gameState.phase !== 'round_result' && (
              <div
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 force-ltr ${
                  timer.isUrgent
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timer.formatted}</span>
              </div>
            )}
            <button
              onClick={() => {
                sound.playClick();
                setShowRoleSecret(!showRoleSecret);
              }}
              className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 flex items-center gap-1.5 transition-all shadow-xs shrink-0"
            >
              {showRoleSecret ? (
                <EyeOff className="w-4 h-4 text-rose-500 shrink-0" />
              ) : (
                <Eye className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span>
                {showRoleSecret
                  ? (isAr ? 'إخفاء الدور' : 'Hide Role')
                  : (isAr ? 'انقر لكشف السر 🤫' : 'Tap to View Secret')}
              </span>
            </button>
          </div>
        </div>

        {/* Revealed Secret Role Panel */}
        <AnimatePresence>
          {showRoleSecret && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3.5 pt-3.5 border-t border-gray-100 overflow-hidden"
            >
              {isImposter ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-1.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-red-600 flex items-center justify-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600" />
                    <span>{isAr ? 'أنت الجاسوس! 🕵️' : 'YOU ARE THE IMPOSTER!'}</span>
                  </div>
                  <div className="text-xl font-extrabold text-red-600">
                    {isAr ? 'أنت الجاسوس! 🕵️' : 'YOU ARE THE IMPOSTER!'}
                  </div>
                  <p className="text-sm font-semibold text-red-800">
                    {isAr ? 'اندسّ وسطهم وخمّن الكلمة السرية!' : 'Blend in and guess the secret word!'}
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    {isAr
                      ? 'أنت لا تعرف الكلمة السرية! استمع لتلميحات الباقيين بحذر، اندمج معهم ولا تدعهم يصوّتون ضدك.'
                      : 'You do NOT know the secret word. Listen closely to clues, blend in, and avoid getting voted out.'}
                  </p>
                  {privateRole?.teammateNames && privateRole.teammateNames.length > 0 && (
                    <div className="text-xs text-red-700 pt-1 font-semibold">
                      {isAr ? 'الجواسيس معك: ' : 'Fellow Imposters: '}
                      <span>{privateRole.teammateNames.join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{isAr ? 'كلمتك السرية هي:' : 'YOUR SECRET WORD:'}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wider my-1">
                    {displaySecretWord}
                  </div>
                  <p className="text-xs text-blue-800 font-medium">
                    {isAr
                      ? 'قدّم تلميحاً ذكياً من كلمة أو عبارة قصيرة يرتبط بالسر بدون ما تكشفه للجاسوس!'
                      : 'Give a subtle 1-word or short clue related to this word without making it too obvious for the imposter!'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. PHASE 1: CLUE GIVING PHASE */}
      {gameState.phase === 'clue_giving' && (
        <div className="space-y-3.5">
          {/* Turn Banner */}
          <div
            className={`p-3.5 rounded-2xl border text-center transition-all ${
              isMyTurn
                ? 'bg-blue-50 border-blue-200 text-blue-950 shadow-xs'
                : 'bg-white border-gray-200 text-gray-800 shadow-sm'
            }`}
          >
            {isMyTurn ? (
              <div className="text-sm font-bold flex items-center justify-center gap-2 text-blue-700">
                <Zap className="w-4 h-4 fill-current text-blue-600" />
                <span>{isAr ? 'دورك الآن! اكتب تلميحك بالأسفل' : 'It is your turn! Submit your clue below'}</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-medium text-gray-600">
                {isAr ? (
                  <>
                    في انتظار{' '}
                    <span className="text-blue-600 font-bold">
                      {gameState.currentTurnUsername || 'اللاعب القادم'}
                    </span>{' '}
                    ليكتب تلميحه...
                  </>
                ) : (
                  <>
                    Waiting for{' '}
                    <span className="text-blue-600 font-bold">
                      {gameState.currentTurnUsername || 'Next Player'}
                    </span>{' '}
                    to submit their clue...
                  </>
                )}
              </div>
            )}
          </div>

          {/* Active Turn Clue Input: Stacked on mobile so button never squishes */}
          {isMyTurn && (
            <motion.form
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onSubmit={handleSendClue}
              className="flex flex-col sm:flex-row gap-2 w-full"
            >
              <input
                type="text"
                maxLength={40}
                value={clueInput}
                onChange={(e) => setClueInput(e.target.value)}
                placeholder={isAr ? 'اكتب تلميحك (كلمة أو عبارة قصيرة)...' : 'Type your 1-word or short clue...'}
                autoFocus
                className="w-full h-12 bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-4 text-gray-900 text-sm font-semibold outline-none shadow-xs"
              />
              <button
                type="submit"
                disabled={isSubmittingClue || !clueInput.trim()}
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-50 shrink-0"
              >
                <Send className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
                <span>{isAr ? 'إرسال' : 'Submit'}</span>
              </button>
            </motion.form>
          )}

          {/* Submitted Clues Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 px-1">
              {isAr
                ? `التلميحات المسجلة (${Object.keys(gameState.clues || {}).length} / ${gameState.turnOrder?.length || players.length})`
                : `Submitted Clues (${Object.keys(gameState.clues || {}).length} / ${gameState.turnOrder?.length || players.length})`}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(gameState.turnOrder || players.map((p) => p.id)).map((pid, idx) => {
                const player = players.find((p) => p.id === pid);
                const clueObj = gameState.clues ? gameState.clues[pid] : undefined;
                const isCurrent = gameState.currentTurnPlayerId === pid;

                return (
                  <div
                    key={pid}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                      clueObj
                        ? 'bg-white border-gray-200 shadow-xs'
                        : isCurrent
                        ? 'bg-blue-50/70 border-blue-200'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-gray-400">#{idx + 1}</span>
                    {player && (
                      <NeonAvatarDisplay avatarId={player.avatar} size="sm" showGlow={false} />
                    )}
                    <div className="flex-1 truncate">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {player?.username || 'Player'}
                      </div>
                      {clueObj ? (
                        <div className="text-xs font-bold text-blue-600 truncate">
                          &ldquo;{clueObj.clue}&rdquo;
                        </div>
                      ) : isCurrent ? (
                        <div className="text-xs text-amber-600 font-semibold animate-pulse">
                          {isAr ? 'يفكر...' : 'Thinking...'}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-normal">
                          {isAr ? 'في الانتظار' : 'Waiting'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. PHASE 2: VOTING PHASE */}
      {gameState.phase === 'voting' && (
        <div className="space-y-3.5">
          <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm text-center">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center justify-center gap-2">
              <Vote className="w-5 h-5 text-blue-600" />
              <span>{isAr ? 'صوّت لاكتشاف الجاسوس' : 'Vote For The Imposter'}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {isAr
                ? 'مين قال تلميح مشبوه أو غريب؟ اضغط على اللاعب لتصوّت ضده.'
                : 'Who gave a suspicious or out-of-place clue? Tap a player to cast your vote.'}
            </p>
          </div>

          {/* Interactive Player Voting Cards: 2-column mobile grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {players.map((p) => {
              const clueObj = gameState.clues ? gameState.clues[p.id] : undefined;
              const votesReceived = gameState.voteTallies ? gameState.voteTallies[p.id] || 0 : 0;
              const isMyVote = votedForId === p.id;
              const isSelf = players.length > 1 && p.id === currentPlayer.id;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
                    isMyVote
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                  }`}
                >
                  <div className="relative mb-2">
                    <NeonAvatarDisplay avatarId={p.avatar} size="md" showGlow={false} />
                    {votesReceived > 0 && (
                      <div className="absolute -top-1.5 -right-1.5 px-2 py-0.5 bg-rose-500 text-white font-bold text-[10px] rounded-full shadow-xs">
                        {votesReceived}
                      </div>
                    )}
                  </div>

                  <div className="w-full truncate mb-2">
                    <div className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                      {p.username}
                    </div>
                    {clueObj && (
                      <div className="text-[11px] text-blue-600 font-semibold truncate mt-0.5">
                        &ldquo;{clueObj.clue}&rdquo;
                      </div>
                    )}
                  </div>

                  {!isSelf ? (
                    <button
                      onClick={() => handleCastVote(p.id)}
                      className={`w-full h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        isMyVote
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800'
                      }`}
                    >
                      {isMyVote
                        ? (isAr ? 'تم التصويت ✓' : 'Voted ✓')
                        : (isAr ? 'صوّت' : 'Vote')}
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium py-1.5">
                      {isAr ? '(أنت)' : '(You)'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. PHASE 3: SUDDEN DEATH MODAL */}
      <AnimatePresence>
        {gameState.suddenDeathActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-white p-6 rounded-2xl border border-gray-200 text-center space-y-4 shadow-xl"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Flame className="w-6 h-6 text-rose-600" />
              </div>

              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-rose-600">
                  {isAr ? 'تم كشف الجاسوس!' : 'Imposter Caught!'}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">
                  {isAr ? 'فرصة التخمين الأخيرة' : 'Final Guess Chance'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {isCaughtImposter
                    ? (isAr
                        ? 'خمّن الكلمة السرية الآن لتخطف الفوز لفريق الجواسيس!'
                        : 'Guess the secret word to steal victory for the imposters!')
                    : (isAr
                        ? `${gameState.suddenDeathPlayerUsername || 'الجاسوس'} انكشف وبيحاول يخمّن الكلمة السرية!`
                        : `${gameState.suddenDeathPlayerUsername || 'The imposter'} was voted out and is attempting a final guess!`)}
                </p>
              </div>

              {isCaughtImposter ? (
                <form onSubmit={handleSuddenDeathSubmit} className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={suddenDeathInput}
                    onChange={(e) => setSuddenDeathInput(e.target.value)}
                    placeholder={isAr ? 'خمّن الكلمة السرية...' : 'Guess the secret word...'}
                    autoFocus
                    required
                    className="w-full h-12 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl px-4 text-center text-lg font-bold text-gray-900 outline-none uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingGuess || !suddenDeathInput.trim()}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm tracking-wide transition-all"
                  >
                    {isAr ? 'اخطف الفوز الآن! 🏆' : 'Steal Round Win!'}
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-xs font-medium animate-pulse">
                  {isAr
                    ? 'في انتظار الجاسوس ليقدم تخمينه الأخير...'
                    : 'Waiting for imposter to submit final guess...'}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. PHASE 4: ROUND RESULT & REVEAL */}
      {gameState.phase === 'round_result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-4"
        >
          <div>
            <div className="text-xs uppercase font-bold tracking-wider text-blue-600 mb-1">
              {isAr ? 'نهاية الجولة' : 'Round Complete'}
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {gameState.impostersWon
                ? (isAr ? '😈 الجواسيس انتصروا!' : '😈 The Imposters Won!')
                : (isAr ? '🎉 المدنيين انتصروا!' : '🎉 Civilians Win!')}
            </h2>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
            <span className="text-xs uppercase text-gray-500 font-bold block mb-1">
              {isAr ? 'الكلمة السرية كانت' : 'Secret Word Was'}
            </span>
            <span className="text-2xl font-extrabold text-blue-600 tracking-wider">
              {isAr
                ? ((gameState as any).revealedWordAr || (gameState as any).secretWordAr || gameState.revealedWord || secretWord)
                : (gameState.revealedWord || secretWord)}
            </span>
          </div>

          {/* Host Next Round Button */}
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
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{isAr ? 'الجولة القادمة' : 'Next Round'}</span>
              <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
