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
  Send,
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
      <div className="bg-[#FFFFFF] rounded-3xl p-5 md:p-6 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0B89FD] rounded-2xl border-2 border-[#010101] text-white shadow-[2px_2px_0px_#010101]">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-[#010101]/60 font-black">
                Category
              </div>
              <div className="text-xl md:text-2xl font-black text-[#010101]">
                {gameState.category || privateRole?.category || 'Classified'}
              </div>
            </div>
          </div>

          {/* Privacy Role Reveal Button / Badge */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowRoleSecret(!showRoleSecret)}
              className="px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] active:translate-x-[1px] active:translate-y-[1px] rounded-xl text-xs font-black text-[#010101] flex items-center gap-1.5 transition-all"
            >
              {showRoleSecret ? <EyeOff className="w-4 h-4 text-[#FD3F01]" /> : <Eye className="w-4 h-4 text-[#0B89FD]" />}
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
              className="mt-4 pt-4 border-t-2 border-[#010101]/10"
            >
              {privateRole.role === 'imposter' ? (
                <div className="p-4 bg-[#FD3F01] border-2 border-[#010101] rounded-2xl text-center space-y-1 shadow-[4px_4px_0px_#010101] text-white">
                  <div className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 text-[#FEC90E]" /> YOU ARE THE IMPOSTER!
                  </div>
                  <p className="text-sm font-bold text-white/95">
                    You do NOT know the secret word! Listen carefully to other players&apos; clues, blend in, and don&apos;t get voted out.
                  </p>
                  {privateRole.teammateNames && privateRole.teammateNames.length > 0 && (
                    <div className="text-xs text-[#FEC90E] pt-1 font-black">
                      Fellow Imposters: <span className="underline">{privateRole.teammateNames.join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#0B89FD] border-2 border-[#010101] rounded-2xl text-center space-y-1 shadow-[4px_4px_0px_#010101] text-white">
                  <div className="text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4 text-[#FEC90E]" /> CIVILIAN • SECRET WORD
                  </div>
                  <div className="text-3xl font-black text-white tracking-wider my-1">
                    {privateRole.secretWord}
                  </div>
                  <p className="text-xs text-white/90 font-medium">
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
            className={`p-4 rounded-2xl border-2 border-[#010101] text-center transition-all ${
              isMyTurn
                ? 'bg-[#FEC90E] text-[#010101] shadow-[4px_4px_0px_#010101]'
                : 'bg-[#FFFFFF] text-[#010101] shadow-[2px_2px_0px_#010101]'
            }`}
          >
            {isMyTurn ? (
              <div className="text-base font-black flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-[#010101]" />
                <span>IT IS YOUR TURN! SUBMIT YOUR CLUE NOW</span>
              </div>
            ) : (
              <div className="text-sm font-bold text-[#010101]">
                Waiting for{' '}
                <span className="text-[#0B89FD] font-black">
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
                className="flex-1 min-h-[48px] bg-[#FFFFFF] border-2 border-[#010101] focus:border-[#0B89FD] rounded-2xl px-5 py-3 text-[#010101] text-base font-bold outline-none shadow-[4px_4px_0px_#010101]"
              />
              <button
                type="submit"
                disabled={isSubmittingClue || !clueInput.trim()}
                className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-base flex items-center justify-center gap-1.5 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all touch-target disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Submit</span>
              </button>
            </motion.form>
          )}

          {/* Submitted Clues Timeline */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#010101] mb-3">
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
                    className={`p-3.5 rounded-2xl border-2 border-[#010101] flex items-center gap-3 transition-all ${
                      clueObj
                        ? 'bg-[#FFFFFF] shadow-[3px_3px_0px_#010101]'
                        : isCurrent
                        ? 'bg-[#FEC90E]/30 shadow-[3px_3px_0px_#010101]'
                        : 'bg-[#F8F8F8] opacity-60 shadow-[1px_1px_0px_#010101]'
                    }`}
                  >
                    <span className="text-xs font-black text-[#010101]/60">#{idx + 1}</span>
                    {player && (
                      <NeonAvatarDisplay avatarId={player.avatar} size="sm" showGlow={false} />
                    )}
                    <div className="flex-1 truncate">
                      <div className="text-xs font-black text-[#010101] truncate">
                        {player?.username || 'Player'}
                      </div>
                      {clueObj ? (
                        <div className="text-sm font-black text-[#0B89FD] truncate">
                          &ldquo;{clueObj.clue}&rdquo;
                        </div>
                      ) : isCurrent ? (
                        <div className="text-xs text-[#FD3F01] animate-pulse font-black">
                          Thinking...
                        </div>
                      ) : (
                        <div className="text-xs text-[#010101]/40 font-medium">Waiting</div>
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
          <div className="p-4 bg-[#FFFFFF] rounded-2xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] text-center">
            <h3 className="text-xl font-black text-[#010101] flex items-center justify-center gap-2">
              <Vote className="w-5 h-5 text-[#FD3F01]" />
              <span>VOTE FOR THE IMPOSTER!</span>
            </h3>
            <p className="text-xs text-[#010101]/70 mt-1 font-medium">
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
                  className={`p-4 rounded-2xl border-2 border-[#010101] flex flex-col items-center justify-between text-center transition-all ${
                    isMyVote
                      ? 'bg-[#FEC90E]/30 shadow-[4px_4px_0px_#010101]'
                      : 'bg-[#FFFFFF] shadow-[3px_3px_0px_#010101] hover:bg-[#F8F8F8]'
                  }`}
                >
                  <div className="relative mb-2">
                    <NeonAvatarDisplay avatarId={p.avatar} size="md" showGlow={false} />
                    {votesReceived > 0 && (
                      <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#FD3F01] text-white font-black text-xs rounded-full border border-[#010101] shadow-[1px_1px_0px_#010101]">
                        {votesReceived} {votesReceived === 1 ? 'vote' : 'votes'}
                      </div>
                    )}
                  </div>

                  <div className="w-full truncate mb-2">
                    <div className="font-black text-sm text-[#010101] truncate">{p.username}</div>
                    {clueObj && (
                      <div className="text-xs text-[#0B89FD] font-black truncate mt-0.5">
                        Clue: &ldquo;{clueObj.clue}&rdquo;
                      </div>
                    )}
                  </div>

                  {!isSelf && (
                    <button
                      onClick={() => handleCastVote(p.id)}
                      className={`w-full min-h-[48px] py-2.5 rounded-xl text-xs sm:text-sm font-black border-2 border-[#010101] transition-all touch-target flex items-center justify-center ${
                        isMyVote
                          ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                          : 'bg-[#0B89FD] hover:bg-[#0977db] text-white shadow-[2px_2px_0px_#010101]'
                      }`}
                    >
                      {isMyVote ? 'VOTED ✓' : 'VOTE'}
                    </button>
                  )}
                  {isSelf && (
                    <span className="text-[10px] text-[#010101]/60 uppercase font-black py-3">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-lg bg-[#FFFFFF] p-5 sm:p-8 rounded-3xl border-3 border-[#010101] text-center space-y-4 shadow-[8px_8px_0px_#010101]"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FD3F01] border-2 border-[#010101] flex items-center justify-center mx-auto text-white shadow-[3px_3px_0px_#010101] animate-bounce">
                <Flame className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>

              <div>
                <span className="text-xs uppercase font-black tracking-widest text-[#FD3F01]">
                  IMPOSTER CAUGHT!
                </span>
                <h3 className="text-xl sm:text-3xl font-black text-[#010101]">
                  10-Second Sudden Death
                </h3>
                <p className="text-xs text-[#010101]/70 mt-1 font-medium">
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
                    className="w-full min-h-[48px] bg-[#F8F8F8] border-2 border-[#010101] focus:border-[#0B89FD] rounded-2xl px-4 py-3 sm:py-4 text-center text-lg sm:text-xl font-black text-[#010101] outline-none uppercase shadow-[4px_4px_0px_#010101]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingGuess || !suddenDeathInput.trim()}
                    className="w-full min-h-[52px] py-3.5 sm:py-4 bg-[#FEC90E] hover:bg-[#fed338] text-[#010101] font-black text-base sm:text-lg rounded-2xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] tracking-wider touch-target active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101]"
                  >
                    STEAL THE ROUND WIN!
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-[#F8F8F8] rounded-2xl border-2 border-[#010101] text-[#010101]/70 text-xs font-bold animate-pulse">
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
          className="bg-[#FFFFFF] p-6 md:p-8 rounded-3xl border-3 border-[#010101] shadow-[8px_8px_0px_#010101] text-center space-y-6"
        >
          <div>
            <div className="text-xs uppercase font-black tracking-widest text-[#0B89FD] mb-1">
              Round Complete
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#010101]">
              {gameState.impostersWon ? '😈 THE IMPOSTERS WON!' : '🎉 CIVILIANS WIN!'}
            </h2>
          </div>

          {gameState.revealedWord && (
            <div className="p-4 bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl inline-block px-8 shadow-[3px_3px_0px_#010101]">
              <span className="text-xs uppercase text-[#010101]/60 font-black block">Secret Word Was</span>
              <span className="text-3xl font-black text-[#0B89FD]">{gameState.revealedWord}</span>
            </div>
          )}

          {gameState.imposterList && (
            <div>
              <h4 className="text-xs uppercase font-black text-[#010101]/70 mb-2">Imposter Identities</h4>
              <div className="flex flex-wrap justify-center gap-2">
                {gameState.imposterList
                  .filter((p) => p.role === 'imposter')
                  .map((imp) => (
                    <span
                      key={imp.id}
                      className="px-3 py-1.5 bg-[#FD3F01] border-2 border-[#010101] rounded-xl text-white font-black text-xs shadow-[2px_2px_0px_#010101]"
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
