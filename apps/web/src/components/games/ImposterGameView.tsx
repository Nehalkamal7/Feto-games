'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImposterPublicState,
  PlayerSummary,
  PrivateRolePayload
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import {
  Eye,
  EyeOff,
  UserCheck,
  Send,
  HelpCircle,
  Vote,
  Sparkles,
  Flame,
  Shield,
  Zap
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';
import { useVisualViewport } from '@/hooks/useVisualViewport';

interface ImposterGameViewProps {
  gameState: ImposterPublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  privateRole?: PrivateRolePayload | null;
  roomCode: string;
}

export const ImposterGameView: React.FC<ImposterGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  privateRole,
  roomCode: _roomCode
}) => {
  const socket = getSocket();
  const { isKeyboardOpen, scaleFactor } = useVisualViewport();

  // Role card toggle
  const [showRoleSecret, setShowRoleSecret] = useState(false);

  // Clue submission input
  const [clueInput, setClueInput] = useState('');
  const [isSubmittingClue, setIsSubmittingClue] = useState(false);

  // Sudden death guess input
  const [suddenDeathInput, setSuddenDeathInput] = useState('');
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);

  // Check if it's the current user's turn to give a clue
  const isMyTurn =
    gameState.phase === 'clue_giving' &&
    gameState.currentTurnPlayerId === currentPlayer.id;

  const isCaughtImposter =
    gameState.suddenDeathActive &&
    gameState.suddenDeathPlayerId === currentPlayer.id;

  const hasVoted = Boolean(gameState.votes[currentPlayer.id]);
  const votedForId = gameState.votes[currentPlayer.id];

  // Submit Clue
  const handleSendClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput.trim() || isSubmittingClue) return;

    sound.playClick();
    setIsSubmittingClue(true);

    socket.emit(
      'imposter:submit_clue',
      { clue: clueInput.trim() },
      (res: any) => {
        setIsSubmittingClue(false);
        if (res && res.success) {
          setClueInput('');
          sound.playReady();
        }
      }
    );
  };

  // Cast Vote
  const handleCastVote = (targetPlayerId: string) => {
    if (gameState.phase !== 'voting' || targetPlayerId === currentPlayer.id) return;
    sound.playClick();

    socket.emit('imposter:cast_vote', { targetPlayerId }, (res: any) => {
      if (res && res.success) {
        sound.playReady();
      }
    });
  };

  // Submit Sudden-Death Guess
  const handleSuddenDeathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suddenDeathInput.trim() || isSubmittingGuess) return;

    sound.playClick();
    setIsSubmittingGuess(true);

    socket.emit(
      'imposter:sudden_death_guess',
      { guessedWord: suddenDeathInput.trim() },
      (res: any) => {
        setIsSubmittingGuess(false);
        if (res && res.correct) {
          sound.playFanfare();
        }
      }
    );
  };

  return (
    <div
      className="w-full max-w-4xl mx-auto space-y-6 transition-transform duration-200"
      style={isKeyboardOpen ? { transform: `scale(${scaleFactor})`, transformOrigin: 'top center' } : undefined}
    >
      {/* ======================================================== */}
      {/* TOP PRIVATE ROLE & CATEGORY BANNER                       */}
      {/* ======================================================== */}
      <div className="glass-panel-neon rounded-3xl p-5 md:p-6 border border-cyan-500/40 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-950/60 rounded-2xl border border-cyan-500/30">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Category
              </div>
              <div className="text-xl md:text-2xl font-black text-white">
                {gameState.category || privateRole?.category || 'Classified'}
              </div>
            </div>
          </div>

          {/* Privacy Role Reveal Button / Badge */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowRoleSecret(!showRoleSecret)}
              className="px-4 py-2 bg-feto-card hover:bg-feto-cardHover border border-feto-border hover:border-cyan-400 rounded-xl text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-all"
            >
              {showRoleSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showRoleSecret ? 'Hide Role' : 'Tap to View Secret'}</span>
            </button>
          </div>
        </div>

        {/* Revealed Secret Role Panel */}
        <AnimatePresence>
          {showRoleSecret && privateRole && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-feto-border"
            >
              {privateRole.role === 'imposter' ? (
                <div className="p-4 bg-red-950/60 border border-red-500/60 rounded-2xl text-center space-y-1 shadow-neon-magenta">
                  <div className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4" /> YOU ARE THE IMPOSTER!
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    You do NOT know the secret word! Listen carefully to other players&apos; clues, blend in, and don&apos;t get voted out.
                  </p>
                  {privateRole.teammateNames && privateRole.teammateNames.length > 0 && (
                    <div className="text-xs text-yellow-300 pt-1">
                      Fellow Imposters: <span className="font-bold">{privateRole.teammateNames.join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-cyan-950/60 border border-cyan-400/60 rounded-2xl text-center space-y-1 shadow-neon-cyan">
                  <div className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" /> CIVILIAN • SECRET WORD
                  </div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-white tracking-wider">
                    {privateRole.secretWord}
                  </div>
                  <p className="text-xs text-slate-400">
                    Give a subtle 1-word or short clue related to this word without making it too obvious for the imposter!
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ======================================================== */}
      {/* PHASE 1: CLUE GIVING PHASE                               */}
      {/* ======================================================== */}
      {gameState.phase === 'clue_giving' && (
        <div className="space-y-4">
          {/* Turn Banner */}
          <div
            className={`p-4 rounded-2xl border text-center transition-all ${
              isMyTurn
                ? 'bg-cyan-950/80 border-cyan-400 shadow-neon-cyan animate-pulse'
                : 'bg-feto-card border-feto-border'
            }`}
          >
            {isMyTurn ? (
              <div className="text-base font-black text-cyan-300 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>IT IS YOUR TURN! SUBMIT YOUR CLUE NOW</span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-300">
                Waiting for{' '}
                <span className="text-cyan-400 font-bold">
                  {gameState.currentTurnUsername || 'Next Player'}
                </span>{' '}
                to submit their clue...
              </div>
            )}
          </div>

          {/* Active Turn Clue Input */}
          {isMyTurn && (
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onSubmit={handleSendClue}
              className="flex gap-2"
            >
              <input
                type="text"
                maxLength={40}
                value={clueInput}
                onChange={(e) => setClueInput(e.target.value)}
                placeholder="Type your 1-word or short clue..."
                autoFocus
                className="flex-1 min-h-[48px] bg-feto-dark border border-cyan-400 focus:ring-2 focus:ring-cyan-500/40 rounded-2xl px-5 py-3 text-white text-base font-bold outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingClue || !clueInput.trim()}
                className="btn-neon-cyan min-h-[48px] px-6 py-3 rounded-2xl text-white font-black text-base flex items-center justify-center gap-1.5 touch-target"
              >
                <Send className="w-4 h-4" />
                <span>Submit</span>
              </button>
            </motion.form>
          )}

          {/* Submitted Clues Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Submitted Clues ({Object.keys(gameState.clues).length} / {gameState.turnOrder.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {gameState.turnOrder.map((pid, idx) => {
                const player = players.find((p) => p.id === pid);
                const clueObj = gameState.clues[pid];
                const isCurrent = gameState.currentTurnPlayerId === pid;

                return (
                  <div
                    key={pid}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                      clueObj
                        ? 'bg-feto-card border-feto-border'
                        : isCurrent
                        ? 'bg-cyan-950/40 border-cyan-500/50 shadow-neon-cyan'
                        : 'bg-feto-dark/50 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-500">#{idx + 1}</span>
                    {player && (
                      <NeonAvatarDisplay avatarId={player.avatar} size="sm" showGlow={false} />
                    )}
                    <div className="flex-1 truncate">
                      <div className="text-xs font-bold text-white truncate">
                        {player?.username || 'Player'}
                      </div>
                      {clueObj ? (
                        <div className="text-sm font-black text-cyan-300 truncate">
                          &ldquo;{clueObj.clue}&rdquo;
                        </div>
                      ) : isCurrent ? (
                        <div className="text-xs text-yellow-400 animate-pulse font-medium">
                          Thinking...
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600">Waiting</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 2: VOTING PHASE                                    */}
      {/* ======================================================== */}
      {gameState.phase === 'voting' && (
        <div className="space-y-4">
          <div className="p-4 bg-feto-card rounded-2xl border border-yellow-500/40 text-center">
            <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
              <Vote className="w-5 h-5 text-yellow-400" />
              <span>VOTE FOR THE IMPOSTER!</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Who gave a suspicious or out-of-place clue? Cast your vote before the timer expires!
            </p>
          </div>

          {/* Interactive Player Voting Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {players.map((p) => {
              const clueObj = gameState.clues[p.id];
              const votesReceived = gameState.voteTallies[p.id] || 0;
              const isMyVote = votedForId === p.id;
              const isSelf = p.id === currentPlayer.id;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-between text-center transition-all ${
                    isMyVote
                      ? 'bg-yellow-950/40 border-yellow-400 shadow-neon-yellow scale-102'
                      : 'bg-feto-card border-feto-border hover:border-slate-500'
                  }`}
                >
                  <div className="relative mb-2">
                    <NeonAvatarDisplay avatarId={p.avatar} size="md" showGlow={isMyVote} />
                    {votesReceived > 0 && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-600 text-white font-black text-xs rounded-full shadow-md">
                        {votesReceived} {votesReceived === 1 ? 'vote' : 'votes'}
                      </div>
                    )}
                  </div>

                  <div className="w-full truncate mb-2">
                    <div className="font-bold text-sm text-white truncate">{p.username}</div>
                    {clueObj && (
                      <div className="text-xs text-cyan-300 font-semibold truncate mt-0.5">
                        Clue: &ldquo;{clueObj.clue}&rdquo;
                      </div>
                    )}
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => handleCastVote(p.id)}
                      className={`w-full min-h-[48px] py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all touch-target flex items-center justify-center ${
                        isMyVote
                          ? 'bg-yellow-400 text-black shadow-neon-yellow'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {isMyVote ? 'VOTED' : 'VOTE'}
                    </button>
                  )}
                  {isSelf && (
                    <span className="text-[10px] text-slate-500 uppercase font-bold py-3">
                      (You)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PHASE 3: 10-SECOND SUDDEN DEATH MODAL                    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {gameState.suddenDeathActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-lg glass-panel-neon p-5 sm:p-8 rounded-3xl border-2 border-red-500 text-center space-y-4 shadow-neon-magenta"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-950/80 border border-red-500/60 flex items-center justify-center mx-auto text-red-400 animate-bounce">
                <Flame className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div>
                <span className="text-xs uppercase font-black tracking-widest text-red-400">
                  IMPOSTER CAUGHT!
                </span>
                <h3 className="text-xl sm:text-3xl font-black text-white">
                  10-Second Sudden Death
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {isCaughtImposter
                    ? 'You have 10 seconds to guess the secret word and steal +500 points for the imposters!'
                    : `${gameState.suddenDeathPlayerUsername} was voted out and is attempting a final guess!`}
                </p>
              </div>

              {isCaughtImposter ? (
                <form onSubmit={handleSuddenDeathSubmit} className="space-y-3 pt-2">
                  <input
                    type="text"
                    value={suddenDeathInput}
                    onChange={(e) => setSuddenDeathInput(e.target.value)}
                    placeholder="Guess the secret word..."
                    autoFocus
                    required
                    className="w-full min-h-[48px] bg-feto-dark border-2 border-yellow-400 focus:ring-4 focus:ring-yellow-500/30 rounded-2xl px-4 py-3 sm:py-4 text-center text-lg sm:text-xl font-black text-white outline-none uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingGuess || !suddenDeathInput.trim()}
                    className="w-full min-h-[52px] py-3.5 sm:py-4 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-black text-base sm:text-lg rounded-2xl shadow-neon-yellow tracking-wider touch-target"
                  >
                    STEAL THE ROUND WIN!
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-feto-card rounded-2xl border border-feto-border text-slate-400 text-xs animate-pulse">
                  Waiting for imposter to submit their final guess...
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* PHASE 4: ROUND RESULT & REVEAL                           */}
      {/* ======================================================== */}
      {gameState.phase === 'round_result' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 md:p-8 rounded-3xl border border-cyan-500/40 text-center space-y-6"
        >
          <div>
            <div className="text-xs uppercase font-black tracking-widest text-cyan-400 mb-1">
              Round Complete
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              {gameState.impostersWon ? '😈 THE IMPOSTERS WON!' : '🎉 CIVILIANS WIN!'}
            </h2>
          </div>

          {gameState.revealedWord && (
            <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl inline-block px-8">
              <span className="text-xs uppercase text-slate-400 font-bold block">Secret Word Was</span>
              <span className="text-3xl font-black text-cyan-300">{gameState.revealedWord}</span>
            </div>
          )}

          {gameState.imposterList && (
            <div>
              <h4 className="text-xs uppercase font-bold text-slate-400 mb-2">Imposter Identities</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {gameState.imposterList
                  .filter((p) => p.role === 'imposter')
                  .map((imp) => (
                    <span
                      key={imp.id}
                      className="px-3 py-1.5 bg-red-950/80 border border-red-500/60 rounded-xl text-red-300 font-bold text-xs"
                    >
                      {imp.username} (Imposter)
                    </span>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
