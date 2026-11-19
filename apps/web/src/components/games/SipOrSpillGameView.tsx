'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wine,
  MessageSquare,
  Sparkles,
  Flame,
  Clock,
  Heart,
  Laugh,
  Skull,
  Send
} from 'lucide-react';
import {
  SipOrSpillPublicState,
  PlayerSummary,
  VibeMode
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
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
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <Wine className="w-3.5 h-3.5 text-rose-400" />
            Round {state.round} / {state.totalRounds}
          </span>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Spicy Level {state.spicyLevel} 🔥
          </span>
        </div>

        {/* TIMER */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black tracking-wider transition-all ${
            state.remainingSeconds <= 5
              ? 'bg-rose-500/20 border-rose-500/60 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]'
              : 'bg-slate-900/80 border-cyan-500/30 text-cyan-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{state.remainingSeconds}s</span>
        </div>
      </div>

      {/* 2. TARGET PLAYER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-3 sm:p-4 rounded-2xl border border-cyan-500/20 flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-3">
          <NeonAvatarDisplay avatarId={state.targetAvatar} size="sm" isGlowing />
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 block">
              In The Hot Seat:
            </span>
            <span className="text-sm sm:text-base font-black text-white">
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
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-purple-900/40 border border-slate-700/60 flex items-center justify-center text-sm"
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
        className="glass-panel-neon p-5 sm:p-7 rounded-3xl border-2 border-rose-500/30 text-center relative overflow-hidden mb-4 shadow-[0_0_30px_rgba(244,63,94,0.18)]"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-400" />
        <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.25em] text-rose-400 block mb-2">
          Sip Or Spill Dilemma
        </span>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight leading-snug mb-3">
          {state.dilemma}
        </h2>
        <p className="text-xs sm:text-sm text-cyan-300 font-bold max-w-lg mx-auto">
          Deep Dive: {state.question}
        </p>
      </motion.div>

      {/* 4. ACTIONS AREA: SPILL OR SIP */}
      {state.phase === 'dilemma' && (
        <div className="flex-1 flex flex-col justify-center items-center">
          {isMyTurn ? (
            <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* BUTTON 1: SPILL THE TRUTH */}
              <motion.button
                onClick={() => setShowConfessionModal(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-glow-cyan p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2"
              >
                <MessageSquare className="w-8 h-8 text-cyan-400 animate-bounce" />
                <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Spill The Truth!
                </span>
                <span className="text-[11px] font-bold text-cyan-300/80">
                  +150 PTS • Confess to the room
                </span>
              </motion.button>

              {/* BUTTON 2: TAKE A SIP */}
              <motion.button
                onClick={handleTakeSip}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-glow-purple p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2"
              >
                <Wine className="w-8 h-8 text-purple-400" />
                <span className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Take A Sip! 🥤
                </span>
                <span className="text-[11px] font-bold text-purple-300/80">
                  Take {state.spicyLevel || 2} sips to skip question
                </span>
              </motion.button>
            </div>
          ) : (
            <div className="text-center py-6 px-4 rounded-2xl glass-panel border border-slate-700/60 max-w-md">
              <span className="text-xs font-black uppercase tracking-widest text-cyan-400 block mb-1">
                Awaiting Decision
              </span>
              <p className="text-sm font-bold text-slate-300">
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
          className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-3xl glass-panel-neon border border-purple-500/40"
        >
          {state.chosenAction === 'sip' ? (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-bounce">
                🥤
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-400 mb-1">
                {state.targetUsername} Chose To Sip!
              </h3>
              <p className="text-sm font-bold text-slate-300 mb-4">
                Poured {state.spicyLevel || 2} sips into the session tally!
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-lg">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(0,240,255,0.6)]">
                💬
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-cyan-300 mb-2">
                {state.targetUsername} Spilled The Truth!
              </h3>
              {state.confessionText && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-400/40 text-sm font-bold text-white mb-4 italic">
                  &ldquo;{state.confessionText}&rdquo;
                </div>
              )}
            </div>
          )}

          {isHost && (
            <motion.button
              onClick={handleNextRound}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-glow-start px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-wider mt-2"
            >
              Next Round →
            </motion.button>
          )}
        </motion.div>
      )}

      {/* CONFESSION INPUT MODAL */}
      <AnimatePresence>
        {showConfessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl glass-panel-neon border-2 border-cyan-400 text-center"
            >
              <h3 className="text-xl font-black text-cyan-300 uppercase tracking-wide mb-2">
                Spill Your Confession
              </h3>
              <p className="text-xs text-slate-300 font-semibold mb-4">
                Type your answer or confess out loud to the crew:
              </p>

              <textarea
                value={confessionInput}
                onChange={(e) => setConfessionInput(e.target.value)}
                placeholder="Type your spicy confession here..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-950/80 border border-cyan-500/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 mb-4"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfessionModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSpillTruth}
                  className="flex-1 py-2.5 rounded-xl btn-glow-start text-white font-black text-xs uppercase flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
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
