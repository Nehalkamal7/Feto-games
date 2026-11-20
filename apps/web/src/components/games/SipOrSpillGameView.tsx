'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wine,
  MessageSquare,
  Clock,
  Send
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
  vibeMode,
  onAction
}: SipOrSpillGameViewProps) {
  const [confessionInput, setConfessionInput] = useState('');
  const [showConfessionModal, setShowConfessionModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMyTurn = currentPlayerId === state.targetPlayerId;
  const targetPlayer = players.find((p) => p.id === state.targetPlayerId);

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

  const handleSpillTruth = async () => {
    if (!isMyTurn || isSubmitting) return;
    setIsSubmitting(true);
    sound.playClick();
    sound.triggerHaptic(40);

    try {
      await onAction('SOS_ACTION', {
        action: 'spill',
        confession: confessionInput.trim() || 'Spilled verbally to the room!'
      });
      setShowConfessionModal(false);
    } catch (err) {
      console.error('Failed to spill truth:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReaction = (emoji: string) => {
    sound.playReaction();
    sound.triggerHaptic(20);
    onAction('SOS_REACT', { emoji });
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
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-2 sm:px-4 py-2 select-none">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFFFFF] text-[#010101] border-2 border-[#010101] flex items-center gap-1.5 shadow-[2px_2px_0px_#010101]">
            <GameIcon gameMode="sip_or_spill" size="xs" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#FEC90E] text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
            Spicy Level {state.spicyLevel} 🔥
          </span>
        </div>

        {/* TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-[#010101] text-xs font-black tracking-wider shadow-[2px_2px_0px_#010101] transition-all ${
            state.remainingSeconds <= 5
              ? 'bg-[#FD3F01] text-white animate-bounce'
              : 'bg-[#FFFFFF] text-[#0B89FD]'
          }`}
        >
          <Clock strokeWidth={2.5} className="w-3.5 h-3.5 shrink-0" />
          <span>{state.remainingSeconds}s</span>
        </div>
      </div>

      {/* 2. TARGET PLAYER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FFFFFF] p-3 sm:p-4 rounded-2xl border-2 border-[#010101] shadow-[3px_3px_0px_#010101] flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-3">
          <NeonAvatarDisplay avatarId={state.targetAvatar} size="sm" showGlow={false} />
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0B89FD] block">
              In The Hot Seat:
            </span>
            <span className="text-sm sm:text-base font-black text-[#010101]">
              {state.targetUsername} {isMyTurn && '(You!)'}
            </span>
          </div>
        </div>

        {/* Reaction Quick Bar for Audience */}
        {!isMyTurn && (
          <div className="flex items-center gap-1 sm:gap-1.5">
            {['🔥', '🥤', '😂', '💀', '😱'].map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.85 }}
                className="w-8 h-8 rounded-full bg-[#FFFFFF] hover:bg-[#FEC90E] border-2 border-[#010101] shadow-[1px_1px_0px_#010101] flex items-center justify-center text-sm font-emoji"
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* 3. THE DILEMMA CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#FFFFFF] p-5 sm:p-7 rounded-3xl border-2 border-[#010101] text-center relative overflow-hidden mb-4 shadow-[4px_4px_0px_#010101]"
      >
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-[#FD3F01] block mb-2">
          Sip Or Spill Dilemma
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#010101] tracking-tight leading-snug mb-3">
          {state.dilemma}
        </h2>
        <p className="text-xs sm:text-sm text-[#0B89FD] font-black max-w-lg mx-auto">
          Deep Dive: {state.question}
        </p>
      </motion.div>

      {/* 4. ACTIONS AREA: SPILL OR SIP */}
      {state.phase === 'dilemma' && (
        <div className="flex-1 flex flex-col justify-center items-center">
          {isMyTurn ? (
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* BUTTON 1: SPILL THE TRUTH */}
              <button
                onClick={() => setShowConfessionModal(true)}
                className="p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all"
              >
                <MessageSquare strokeWidth={2.5} className="w-8 h-8 text-white shrink-0" />
                <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Spill The Truth!
                </span>
                <span className="text-[11px] font-bold text-white/90">
                  +150 PTS • Confess to the room
                </span>
              </button>

              {/* BUTTON 2: TAKE A SIP */}
              <button
                onClick={handleTakeSip}
                className="p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 bg-[#FD3F01] hover:bg-[#e03700] text-white border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all"
              >
                <Wine strokeWidth={2.5} className="w-8 h-8 text-white shrink-0" />
                <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Take A Sip! 🥤
                </span>
                <span className="text-[11px] font-bold text-white/90">
                  Take {state.spicyLevel || 2} sips to skip question
                </span>
              </button>
            </div>
          ) : (
            <div className="text-center py-6 px-4 rounded-2xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[3px_3px_0px_#010101] max-w-md">
              <span className="text-xs font-black uppercase tracking-widest text-[#0B89FD] block mb-1">
                Awaiting Decision
              </span>
              <p className="text-sm font-bold text-[#010101]">
                Watching {state.targetUsername} sweat! Will they confess or drink?
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
          className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-[#FFFFFF] border-3 border-[#010101] shadow-[6px_6px_0px_#010101]"
        >
          {state.chosenAction === 'sip' ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#FD3F01] border-2 border-[#010101] flex items-center justify-center text-3xl mb-3 shadow-[3px_3px_0px_#010101] animate-bounce">
                🥤
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#FD3F01] mb-1">
                {state.targetUsername} Chose To Sip!
              </h3>
              <p className="text-sm font-bold text-[#010101] mb-4">
                Poured {state.spicyLevel || 2} sips into the session tally!
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-lg">
              <div className="w-16 h-16 rounded-full bg-[#0B89FD] border-2 border-[#010101] flex items-center justify-center text-3xl mb-3 shadow-[3px_3px_0px_#010101]">
                💬
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#0B89FD] mb-2">
                {state.targetUsername} Spilled The Truth!
              </h3>
              {state.confessionText && (
                <div className="p-4 rounded-2xl bg-[#F8F8F8] border-2 border-[#010101] text-sm font-bold text-[#010101] mb-4 italic shadow-[2px_2px_0px_#010101]">
                  &ldquo;{state.confessionText}&rdquo;
                </div>
              )}
            </div>
          )}

          {isHost && (
            <button
              onClick={handleNextRound}
              className="px-8 py-3 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-sm uppercase tracking-wider border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all mt-2"
            >
              Next Round →
            </button>
          )}
        </motion.div>
      )}

      {/* CONFESSION INPUT MODAL */}
      <AnimatePresence>
        {showConfessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#010101]/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#FFFFFF] border-3 border-[#010101] shadow-[8px_8px_0px_#010101] text-center"
            >
              <h3 className="text-xl font-black text-[#010101] uppercase tracking-wide mb-2">
                Spill Your Confession
              </h3>
              <p className="text-xs text-[#010101]/70 font-semibold mb-4">
                Type your answer or confess out loud to the crew:
              </p>

              <textarea
                value={confessionInput}
                onChange={(e) => setConfessionInput(e.target.value)}
                placeholder="Type your spicy confession here..."
                rows={3}
                className="w-full p-3 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] placeholder-[#010101]/40 text-sm font-bold focus:outline-none focus:border-[#0B89FD] mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfessionModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-[#010101] font-bold text-xs uppercase shadow-[2px_2px_0px_#010101]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSpillTruth}
                  className="flex-1 py-2.5 rounded-xl bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#010101]"
                >
                  <Send strokeWidth={2.5} className="w-3.5 h-3.5 shrink-0" />
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
