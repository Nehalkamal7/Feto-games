'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Eye, EyeOff, Sparkles, X, Smartphone } from 'lucide-react';
import { sound } from '@/lib/sound';

interface RoomLobbyQRCodeProps {
  roomCode: string;
  isStreamerMode?: boolean;
}

export function RoomLobbyQRCode({ roomCode, isStreamerMode = false }: RoomLobbyQRCodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealedInStreamerMode, setRevealedInStreamerMode] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fetogames.com';
  const joinUrl = `${origin}/join/${roomCode}`;

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHidden = isStreamerMode && !revealedInStreamerMode;

  return (
    <>
      {/* Compact Lobby Pill Trigger */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            sound.playClick();
            setIsOpen(true);
          }}
          className="px-3 py-2 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-neon-cyan touch-target"
          title="Open Scannable Party QR Code"
        >
          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Scan QR</span>
        </button>
      </div>

      {/* Expandable Scannable QR Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm glass-panel-neon rounded-3xl p-6 border-2 border-cyan-400/50 shadow-neon-cyan relative text-center"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-2 text-cyan-400">
                <Smartphone className="w-5 h-5 text-cyan-400 animate-bounce" />
                <h3 className="text-lg font-black uppercase tracking-wider text-white">
                  Scan To Join Party
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Point phone camera at this QR code to jump straight into the room!
              </p>

              {/* QR Code Frame */}
              <div className="relative mx-auto w-56 h-56 p-3 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.4)]">
                {isHidden ? (
                  <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                    <EyeOff className="w-8 h-8 text-amber-400 mb-2" />
                    <span className="text-xs font-black text-amber-300 uppercase">
                      Streamer Mode Hidden
                    </span>
                    <button
                      onClick={() => setRevealedInStreamerMode(true)}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold"
                    >
                      Click To Reveal QR
                    </button>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={joinUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: '/favicon.ico',
                      x: undefined,
                      y: undefined,
                      height: 32,
                      width: 32,
                      excavate: true
                    }}
                  />
                )}
              </div>

              {/* Room Code Indicator */}
              <div className="my-4 py-2 px-3 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Room Code</span>
                <span className="text-base font-black text-cyan-300 font-mono tracking-widest">
                  {isHidden ? 'FG-••••' : roomCode}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 hover:brightness-110 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-neon-cyan transition-all active:scale-95"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Magic Link'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
