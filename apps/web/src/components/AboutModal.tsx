'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Users, Zap, Shield, Sparkles, Cpu, Award } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { sound } from '@/lib/sound';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          className="w-full max-w-2xl glass-panel-neon rounded-3xl p-5 sm:p-8 relative border border-cyan-500/30 max-h-[90dvh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="md" showSubtitle={false} className="mb-3" />
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
              The Ultimate Party Game Hub
            </h2>
            <p className="text-xs sm:text-sm text-cyan-300/90 font-medium mt-1">
              Esports-grade real-time multiplayer gaming for up to 15 players per room
            </p>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white">Up to 15 Players</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  Connect friends instantly across mobile, tablet, or desktop with 1-click room code, QR code, or invite link.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-purple-500/20 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex-shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white">Serverless Real-Time Engine</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  Powered by Ably Realtime & Upstash Redis with sub-30ms synchronized clocks, live buzzers, and stroke sync.
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-feto-amber/20 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white">10 High-Stakes Party Games</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  Imposter deduction, Draw & Guess, Quiz Battle, Word Battle, Truth or Dare, Never Have I Ever, Most Likely To, Sip or Spill, Silly Roulette & Hot Potato!
                </p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-white">Anti-Cheat & Grace Reconnect</h3>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                  Server-validated secret roles, private channel broadcasts, and automatic session reconnection so nobody drops.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack Banner */}
          <div className="glass-panel rounded-2xl p-4 border border-cyan-500/15 mb-6 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
              Engineered with High-Performance Technologies
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-200">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">Next.js 14 App Router</span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300">Ably Realtime</span>
              <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300">Upstash Redis REST</span>
              <span className="px-2.5 py-1 rounded-lg bg-pink-950/60 border border-pink-500/30 text-pink-300">Framer Motion</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">Web Audio API</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 to-feto-purple hover:brightness-110 shadow-neon-cyan transition-all"
            >
              Let's Play!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
