'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, EyeOff, X, Smartphone } from 'lucide-react';
import { sound } from '@/lib/sound';
import { useLanguage } from '@/hooks/useLanguage';

interface RoomLobbyQRCodeProps {
  roomCode: string;
  isStreamerMode?: boolean;
  compact?: boolean;
}

export function RoomLobbyQRCode({ roomCode, isStreamerMode = false, compact = false }: RoomLobbyQRCodeProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
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
      {/* Compact Lobby Trigger */}
      <button
        type="button"
        onClick={() => {
          sound.playClick();
          setIsOpen(true);
        }}
        className={
          compact
            ? 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 inline-flex items-center justify-center shrink-0 transition-colors active:scale-95'
            : 'h-9 sm:h-10 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 text-xs font-semibold inline-flex items-center gap-1.5 transition-all shadow-xs shrink-0'
        }
        title={isAr ? 'رمز QR للانضمام السريع' : 'Show QR Code'}
        aria-label={isAr ? 'رمز QR للانضمام السريع' : 'Show QR Code'}
      >
        <QrCode className="w-4 h-4 text-gray-700 shrink-0" />
        {!compact && <span className="hidden sm:inline">{isAr ? 'رمز QR' : 'Scan QR'}</span>}
      </button>

      {/* Expandable Scannable QR Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-2xl p-6 border border-gray-200 shadow-xl relative text-center text-gray-900"
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-8 h-8 inline-flex items-center justify-center shrink-0 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 mb-1.5">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">
                  {isAr ? 'امسح الرمز للانضمام' : 'Scan To Join'}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-5">
                {isAr
                  ? 'وجّه كاميرا هاتفك نحو الرمز للانضمام مباشرة إلى الغرفة'
                  : 'Point phone camera at this QR code to jump straight into the room'}
              </p>

              {/* QR Code Frame */}
              <div className="relative mx-auto w-56 h-56 p-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-xs">
                {isHidden ? (
                  <div className="absolute inset-0 bg-white rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                    <EyeOff className="w-8 h-8 text-amber-500 mb-2" />
                    <span className="text-xs font-bold text-gray-800 uppercase">
                      {isAr ? 'وضع البث (مخفي)' : 'Streamer Mode Hidden'}
                    </span>
                    <button
                      onClick={() => setRevealedInStreamerMode(true)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 text-xs font-semibold"
                    >
                      {isAr ? 'إظهار الرمز' : 'Click To Reveal QR'}
                    </button>
                  </div>
                ) : (
                  <QRCodeSVG
                    value={joinUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    fgColor="#111827"
                    bgColor="#FFFFFF"
                  />
                )}
              </div>

              {/* Join Link Copy Box */}
              <div className="mt-5 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1.5 shadow-xs">
                <span className="flex-1 text-xs font-mono text-gray-700 truncate pl-2 rtl:pl-0 rtl:pr-2 force-ltr">
                  {joinUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
