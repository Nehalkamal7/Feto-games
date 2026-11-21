'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wine,
  MessageSquare,
  Clock,
  Send,
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';
import {
  SipOrSpillPublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import { sound } from '@/lib/sound';

interface SipOrSpillGameViewProps {
  state: SipOrSpillPublicState;
  players: PlayerSummary[];
  currentPlayerId: string;
  isHost: boolean;
  vibeMode?: VibeMode;
  onAction: (actionType: string, payload: any) => Promise<void>;
}

export function SipOrSpillGameView({
  state,
  players,
  currentPlayerId,
  isHost,
  vibeMode: _vibeMode,
  onAction
}: SipOrSpillGameViewProps) {
  const [confessionInput, setConfessionInput] = useState('');
  const [showConfessionModal, setShowConfessionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMyTurn = currentPlayerId === state.targetPlayerId;
  const _targetPlayer = players.find((p) => p.id === state.targetPlayerId);

  const handleTakeSip = async () => {
    if (!isMyTurn || isSubmitting) return;
    setIsSubmitting(true);
    sound.playSipGlug();
    sound.triggerHaptic([40, 50, 40]);

    try {
      await onAction('SOS_ACTION', { action: 'sip' });
    } catch (err) {
      console.error('Failed to take sip:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpillTruth = async (text?: string) => {
    if (!isMyTurn || isSubmitting) return;
    setIsSubmitting(true);
    sound.playClick();
    sound.triggerHaptic(40);

    try {
      await onAction('SOS_ACTION', {
        action: 'spill',
        confession: text || confessionInput.trim() || 'Answered Live to the room!'
      });
      setShowConfessionModal(false);
    } catch (err) {
      console.error('Failed to spill truth:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextRound = async () => {
    sound.playClick();
    try {
      await onAction('NEXT_ROUND', {});
    } catch (err) {
      console.error('Failed to advance round:', err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto px-2 sm:px-4 py-2 overflow-x-hidden select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-800 flex items-center gap-1.5 shadow-sm">
            <GameIcon gameMode="sip_or_spill" size="xs" />
            Round {state.round} of {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            Spicy Level {state.spicyLevel || 1} 🔥
          </span>
        </div>

        {/* TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
            state.remainingSeconds <= 5
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : 'bg-white text-gray-800 border-gray-200 shadow-sm'
          }`}
        >
          <Clock className={`w-3.5 h-3.5 ${state.remainingSeconds <= 5 ? 'text-red-500' : 'text-blue-600'}`} />
          <span>{state.remainingSeconds}s</span>
        </div>
      </div>

      {/* 2. TARGET PLAYER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-3">
          <NeonAvatarDisplay avatarId={state.targetAvatar} size="sm" showGlow={false} />
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 block">
              In The Hot Seat
            </span>
            <span className="text-sm sm:text-base font-bold text-gray-900">
              {state.targetUsername} {isMyTurn && '(You!)'}
            </span>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
          {isMyTurn ? 'Your Turn' : 'Listening'}
        </div>
      </motion.div>

      {/* 3. THE DILEMMA CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 text-center relative overflow-hidden mb-5 shadow-sm"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 block mb-2">
          Dilemma
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug mb-3">
          {state.dilemma}
        </h2>
        {state.question && (
          <p className="text-xs sm:text-sm text-blue-600 font-medium max-w-lg mx-auto bg-blue-50 py-2 px-3 rounded-xl border border-blue-100">
            {state.question}
          </p>
        )}
      </motion.div>

      {/* 4. ACTIONS AREA: SPILL OR SIP */}
      {state.phase === 'dilemma' && (
        <div className="flex-1 flex flex-col justify-center items-center">
          {isMyTurn ? (
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* BUTTON 1: ANSWERED LIVE */}
              <button
                onClick={() => handleSpillTruth('Answered Live to the room!')}
                className="p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all min-h-[110px]"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-white" />
                  <span className="text-base font-bold uppercase tracking-wider">
                    Answered Live
                  </span>
                </div>
                <span className="text-xs font-medium text-blue-100">
                  +150 pts • Confess to the room
                </span>
              </button>

              {/* BUTTON 2: TAKE A SIP TO SKIP */}
              <button
                onClick={handleTakeSip}
                className="p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-rose-500 hover:bg-rose-600 text-white shadow-sm transition-all min-h-[110px]"
              >
                <div className="flex items-center gap-2">
                  <Wine className="w-5 h-5 text-white" />
                  <span className="text-base font-bold uppercase tracking-wider">
                    Take a Sip 🥤
                  </span>
                </div>
                <span className="text-xs font-medium text-rose-100">
                  Take a sip to skip question
                </span>
              </button>
            </div>
          ) : (
            <div className="text-center py-6 px-4 rounded-2xl bg-white border border-gray-200 shadow-sm max-w-md">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 block mb-1">
                Awaiting Decision
              </span>
              <p className="text-sm font-medium text-gray-700">
                Watching {state.targetUsername} make their choice! Will they confess or drink?
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. REACTION & RESULT PHASE */}
      {(state.phase === 'reaction' || state.phase === 'round_results') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm"
        >
          {state.chosenAction === 'sip' ? (
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-2xl mb-3">
                🥤
              </div>
              <h3 className="text-2xl font-extrabold text-rose-600 mb-1">
                {state.targetUsername} Chose To Sip!
              </h3>
              <p className="text-sm text-gray-600 font-medium mb-4">
                Took a sip to skip the question.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-lg">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl mb-3 text-blue-600">
                <MessageSquare className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                {state.targetUsername} Spilled The Truth!
              </h3>
              {state.confessionText && (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 mb-4 italic">
                  &ldquo;{state.confessionText}&rdquo;
                </div>
              )}
            </div>
          )}

          {isHost && (
            <button
              onClick={handleNextRound}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm transition-all mt-2"
            >
              <span>Next Round</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* CONFESSION INPUT MODAL (IF INVOKED) */}
      <AnimatePresence>
        {showConfessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-2xl bg-white border border-gray-200 shadow-xl text-center"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Spill Your Confession
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Type your answer or confess out loud to the room:
              </p>

              <textarea
                value={confessionInput}
                onChange={(e) => setConfessionInput(e.target.value)}
                placeholder="Type your confession here..."
                rows={3}
                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm font-medium focus:outline-none focus:border-blue-500 mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfessionModal(false)}
                  className="flex-1 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSpillTruth()}
                  className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>Submit</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
