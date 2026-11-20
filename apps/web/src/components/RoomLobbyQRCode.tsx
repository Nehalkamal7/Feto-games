'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, EyeOff, X, Smartphone } from 'lucide-react';
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
          className="px-3 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] text-[#010101] text-xs font-black flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#010101] touch-target"
          title="Open Scannable Party QR Code"
        >
          <QrCode className="w-3.5 h-3.5 text-[#010101]" />
          <span className="hidden sm:inline">Scan QR</span>
        </button>
      </div>

      {/* Expandable Scannable QR Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm bg-[#FFFFFF] rounded-3xl p-6 border-3 border-[#010101] shadow-[8px_8px_0px_#010101] relative text-center"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[#010101] transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Smartphone className="w-5 h-5 text-[#0B89FD] animate-bounce" />
                <h3 className="text-lg font-black uppercase tracking-wider text-[#010101]">
                  Scan To Join Party
                </h3>
              </div>
              <p className="text-xs text-[#010101]/70 mb-5 font-medium">
                Point phone camera at this QR code to jump straight into the room!
              </p>

              {/* QR Code Frame */}
              <div className="relative mx-auto w-56 h-56 p-3 rounded-2xl bg-white border-2 border-[#010101] flex items-center justify-center shadow-[4px_4px_0px_#010101]">
                {isHidden ? (
                  <div className="absolute inset-0 bg-[#FFFFFF] rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                    <EyeOff className="w-8 h-8 text-[#FD3F01] mb-2" />
                    <span className="text-xs font-black text-[#010101] uppercase">
                      Streamer Mode Hidden
                    </span>
                    <button
                      onClick={() => setRevealedInStreamerMode(true)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-[#FEC90E] border-2 border-[#010101] text-[#010101] text-xs font-black shadow-[2px_2px_0px_#010101]"
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
                    fgColor="#010101"
                    bgColor="#FFFFFF"
                  />
                )}
              </div>

              {/* Join Link Copy Box */}
              <div className="mt-5 flex items-center gap-2 bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl p-2 shadow-[2px_2px_0px_#010101]">
                <span className="flex-1 text-[11px] font-mono text-[#010101] truncate pl-2 font-bold">
                  {joinUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-xs font-black flex items-center gap-1 active:translate-x-[1px] active:translate-y-[1px] transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
