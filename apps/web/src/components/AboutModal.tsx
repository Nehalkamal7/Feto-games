'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Users, Zap, Shield } from 'lucide-react';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#010101]/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          className="w-full max-w-2xl bg-[#FFFFFF] border-3 border-[#010101] shadow-[8px_8px_0px_#010101] rounded-3xl p-5 sm:p-8 relative max-h-[90dvh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-xl text-[#010101] bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] transition-all font-black"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="md" showSubtitle={false} className="mb-3" />
            <h2 className="text-xl sm:text-2xl font-black text-[#010101] uppercase tracking-wider">
              The Ultimate Party Game Hub
            </h2>
            <p className="text-xs sm:text-sm text-[#0B89FD] font-black mt-1">
              Esports-grade real-time multiplayer gaming for up to 15 players per room
            </p>
          </div>

          {/* Core Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="bg-[#F8F8F8] rounded-2xl p-4 border-2 border-[#010101] shadow-[3px_3px_0px_#010101] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#0B89FD] border-2 border-[#010101] text-white flex-shrink-0 shadow-[2px_2px_0px_#010101]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#010101]">Up to 15 Players</h3>
                <p className="text-[11px] sm:text-xs text-[#010101]/70 mt-1 font-medium">
                  Connect friends instantly across mobile, tablet, or desktop with 1-click room code, QR code, or invite link.
                </p>
              </div>
            </div>

            <div className="bg-[#F8F8F8] rounded-2xl p-4 border-2 border-[#010101] shadow-[3px_3px_0px_#010101] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FEC90E] border-2 border-[#010101] text-[#010101] flex-shrink-0 shadow-[2px_2px_0px_#010101]">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#010101]">Serverless Real-Time Engine</h3>
                <p className="text-[11px] sm:text-xs text-[#010101]/70 mt-1 font-medium">
                  Powered by Ably Realtime &amp; Upstash Redis with sub-30ms synchronized clocks, live buzzers, and stroke sync.
                </p>
              </div>
            </div>

            <div className="bg-[#F8F8F8] rounded-2xl p-4 border-2 border-[#010101] shadow-[3px_3px_0px_#010101] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#FD3F01] border-2 border-[#010101] text-white flex-shrink-0 shadow-[2px_2px_0px_#010101]">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#010101]">10 High-Stakes Party Games</h3>
                <p className="text-[11px] sm:text-xs text-[#010101]/70 mt-1 font-medium">
                  Imposter deduction, Draw &amp; Guess, Quiz Battle, Word Battle, Truth or Dare, Never Have I Ever, Most Likely To, Sip or Spill, Silly Roulette &amp; Hot Potato!
                </p>
              </div>
            </div>

            <div className="bg-[#F8F8F8] rounded-2xl p-4 border-2 border-[#010101] shadow-[3px_3px_0px_#010101] flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#010101] border-2 border-[#010101] text-[#FEC90E] flex-shrink-0 shadow-[2px_2px_0px_#010101]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-[#010101]">Anti-Cheat &amp; Grace Reconnect</h3>
                <p className="text-[11px] sm:text-xs text-[#010101]/70 mt-1 font-medium">
                  Server-validated secret roles, private channel broadcasts, and automatic session reconnection so nobody drops.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack Banner */}
          <div className="bg-[#F8F8F8] rounded-2xl p-4 border-2 border-[#010101] shadow-[3px_3px_0px_#010101] mb-6 text-center">
            <span className="text-[10px] uppercase font-black text-[#010101]/60 tracking-wider block mb-2">
              Engineered with High-Performance Technologies
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-black text-[#010101]">
              <span className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-[#0B89FD] shadow-[2px_2px_0px_#010101]">Next.js 14 App Router</span>
              <span className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-[#010101] shadow-[2px_2px_0px_#010101]">Ably Realtime</span>
              <span className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-[#FD3F01] shadow-[2px_2px_0px_#010101]">Upstash Redis REST</span>
              <span className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-[#FEC90E] shadow-[2px_2px_0px_#010101]">Framer Motion</span>
              <span className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] text-[#010101] shadow-[2px_2px_0px_#010101]">Web Audio API</span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-wider text-white bg-[#0B89FD] hover:bg-[#0977db] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all"
            >
              Let&apos;s Play!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
