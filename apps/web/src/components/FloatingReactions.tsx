'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, socketSendReaction } from '@/lib/socket';
import { sound } from '@/lib/sound';
import { Sparkles } from 'lucide-react';

const REACTION_EMOJIS = ['🍅', '😂', '🔥', '💀', '🥤'];

interface FloatingParticle {
  id: string;
  emoji: string;
  username: string;
  leftPercent: number;
}

interface TomatoSplatItem {
  id: string;
  x: number; // percentage
  y: number; // percentage
  scale: number;
  rotation: number;
}

export function FloatingReactions() {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [splats, setSplats] = useState<TomatoSplatItem[]>([]);
  const [cooldown, setCooldown] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const s = getSocket();

    const handleReactionBroadcast = (payload: {
      id: string;
      playerId: string;
      username: string;
      emoji: string;
      x: number;
    }) => {
      const id = payload.id || `${Date.now()}_${Math.random()}`;
      const leftPercent = payload.x || (15 + Math.random() * 70);

      if (payload.emoji === '🍅') {
        sound.playTomatoSplat();
        // Add tomato splatter onto screen
        const splatItem: TomatoSplatItem = {
          id: `splat_${id}`,
          x: 20 + Math.random() * 60,
          y: 25 + Math.random() * 50,
          scale: 0.85 + Math.random() * 0.4,
          rotation: Math.floor(Math.random() * 360)
        };
        setSplats((prev) => [...prev.slice(-6), splatItem]);

        setTimeout(() => {
          setSplats((prev) => prev.filter((sp) => sp.id !== splatItem.id));
        }, 2200);
      } else {
        sound.playReaction();
      }

      setParticles((prev) => [
        ...prev.slice(-20),
        { id, emoji: payload.emoji, username: payload.username, leftPercent }
      ]);

      // Remove particle after animation completes (3 seconds)
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 3000);
    };

    s.on('reaction:broadcast', handleReactionBroadcast);

    return () => {
      s.off('reaction:broadcast', handleReactionBroadcast);
    };
  }, []);

  const handleSendReaction = useCallback(
    (emoji: string) => {
      if (cooldown) return;
      setCooldown(true);
      socketSendReaction(emoji);

      // 1-second cooldown per user
      setTimeout(() => {
        setCooldown(false);
      }, 1000);
    },
    [cooldown]
  );

  return (
    <>
      {/* 1. TOMATO SPLAT SCREEN IMPACT OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {splats.map((splat) => (
            <motion.div
              key={splat.id}
              initial={{ scale: 0.1, opacity: 0 }}
              animate={{
                scale: [0.1, splat.scale * 1.3, splat.scale],
                opacity: [0, 1, 0.9, 0]
              }}
              exit={{ opacity: 0, scale: splat.scale * 0.8 }}
              transition={{ duration: 2.2, times: [0, 0.15, 0.75, 1], ease: 'easeOut' }}
              style={{
                left: `${splat.x}%`,
                top: `${splat.y}%`,
                transform: `translate(-50%, -50%) rotate(${splat.rotation}deg)`
              }}
              className="absolute select-none pointer-events-none"
            >
              <div className="relative flex items-center justify-center">
                {/* Wet Splatter SVG */}
                <svg
                  width="180"
                  height="180"
                  viewBox="0 0 100 100"
                  fill="none"
                  className="filter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                >
                  <circle cx="50" cy="50" r="28" fill="#DC2626" />
                  <path
                    d="M50 20 C52 5, 48 5, 50 20 M50 80 C48 95, 52 95, 50 80 M20 50 C5 48, 5 52, 20 50 M80 50 C95 52, 95 48, 80 50"
                    stroke="#EF4444"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M26 26 C15 15, 18 12, 26 26 M74 74 C85 85, 82 88, 74 74 M26 74 C15 85, 18 88, 26 74 M74 26 C85 15, 82 12, 74 26"
                    stroke="#DC2626"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <circle cx="35" cy="38" r="8" fill="#EF4444" />
                  <circle cx="62" cy="42" r="10" fill="#B91C1C" />
                  <circle cx="48" cy="65" r="9" fill="#EF4444" />
                  <circle cx="50" cy="98" r="4" fill="#DC2626" />
                  <circle cx="98" cy="48" r="3.5" fill="#EF4444" />
                </svg>

                {/* Crushed Center Tomato with juicy splatter */}
                <span className="absolute text-3xl filter drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
                  🍅
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. FLOATING RISING EMOJI PARTICLES OVERLAY */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: '95vh', scale: 0.6, rotate: -15 + Math.random() * 30 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: '-10vh',
                scale: [0.6, 1.4, 1.1, 0.8],
                rotate: [-15 + Math.random() * 30, 20 - Math.random() * 40]
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.8, ease: 'easeOut' }}
              style={{ left: `${p.leftPercent}%` }}
              className="absolute flex flex-col items-center select-none"
            >
              <span className="text-4xl md:text-5xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] animate-bounce">
                {p.emoji}
              </span>
              <span className="text-[10px] font-bold text-white/80 bg-black/60 px-2 py-0.5 rounded-full mt-1 border border-white/20 backdrop-blur-sm shadow-sm truncate max-w-[90px]">
                {p.username}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 3. REACTION BAR ON SCREEN (MOBILE & DESKTOP FRIENDLY) */}
      <div className="fixed bottom-3 sm:bottom-4 right-3 sm:right-4 z-40 flex items-center gap-1.5 safe-bottom safe-right">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-neon-cyan"
            >
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  disabled={cooldown}
                  className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center text-xl md:text-2xl rounded-xl transition-all touch-target ${
                    cooldown
                      ? 'opacity-40 cursor-not-allowed scale-90'
                      : 'hover:scale-125 hover:bg-white/10 active:scale-95'
                  }`}
                  title={cooldown ? '1s Cooldown' : `Send ${emoji}`}
                  aria-label={`Send reaction ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`min-h-[44px] min-w-[44px] p-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-cyan-400 hover:text-white hover:border-cyan-400 transition-all shadow-neon-cyan flex items-center justify-center touch-target ${
            cooldown ? 'animate-pulse' : ''
          }`}
          title={isExpanded ? 'Hide Reactions' : 'Show Reactions'}
          aria-label="Toggle reactions bar"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
