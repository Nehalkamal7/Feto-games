'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Check, X, Trophy } from 'lucide-react';
import { PartyAward, PlayerSummary, PublicRoomState } from '@feto-games/shared-types';
import { BrandLogo } from '@/components/BrandLogo';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { sound } from '@/lib/sound';

interface ShareRecapCardProps {
  room: PublicRoomState;
  currentPlayer: PlayerSummary | null;
  awards: PartyAward[];
  isOpen: boolean;
  onClose: () => void;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export function ShareRecapCard({
  room,
  currentPlayer: _currentPlayer,
  awards,
  isOpen,
  onClose
}: ShareRecapCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const mvp = sortedPlayers[0];
  const picassoAward = awards.find((a) => a.title.includes('Picasso') || a.thumbnail);
  const liarAward = awards.find((a) => a.title.includes('Liar'));
  const sipAward = awards.find((a) => a.title.includes('Sip'));
  const chaosAward = awards.find((a) => a.title.includes('Chaos'));

  // High-Resolution 1080x1920 Clean Modern Canvas Exporter
  const handleDownloadPNG = async () => {
    sound.playClick();
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // 1. Background: Clean Soft Gray (#F9FAFB)
      ctx.fillStyle = '#F9FAFB';
      ctx.fillRect(0, 0, 1080, 1920);

      // Subtle Top Accent
      const grad = ctx.createLinearGradient(0, 0, 1080, 0);
      grad.addColorStop(0, '#2563EB');
      grad.addColorStop(1, '#4F46E5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 24);

      // 2. Header Branding
      ctx.fillStyle = '#111827';
      ctx.font = '900 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FETO GAMES', 540, 180);

      ctx.fillStyle = '#6B7280';
      ctx.font = '700 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('OFFICIAL MATCH RECAP', 540, 230);

      // Room & Date Pill
      ctx.fillStyle = '#EFF6FF';
      drawRoundedRect(ctx, 360, 270, 360, 60, 30);
      ctx.fill();
      ctx.strokeStyle = '#BFDBFE';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#1D4ED8';
      ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`ROOM ${room.code} • ${room.players.length} PLAYERS`, 540, 308);

      // 3. MVP Card
      ctx.fillStyle = '#FFFFFF';
      drawRoundedRect(ctx, 120, 380, 840, 420, 36);
      ctx.fill();
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('👑 MVP OF THE MATCH', 540, 460);

      ctx.fillStyle = '#111827';
      ctx.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(mvp?.username || 'Champion', 540, 570);

      ctx.fillStyle = '#2563EB';
      ctx.font = '800 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${mvp?.score || 0} PTS • 1ST PLACE`, 540, 660);

      // 4. Awards Section
      let awardY = 860;

      const drawAwardRow = (title: string, user: string, stat: string, emoji: string) => {
        ctx.fillStyle = '#FFFFFF';
        drawRoundedRect(ctx, 120, awardY, 840, 110, 24);
        ctx.fill();
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '42px sans-serif';
        ctx.fillText(emoji, 180, awardY + 70);

        ctx.fillStyle = '#111827';
        ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${title}: ${user}`, 240, awardY + 68);

        ctx.fillStyle = '#2563EB';
        ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(stat, 900, awardY + 68);

        ctx.textAlign = 'center';
        awardY += 130;
      };

      if (liarAward) drawAwardRow('Master of Deception', liarAward.recipientUsername, liarAward.scoreOrStat, '🕵️');
      if (sipAward) drawAwardRow('Most Hydrated', sipAward.recipientUsername, sipAward.scoreOrStat, '🥤');
      if (chaosAward) drawAwardRow('Pure Chaos', chaosAward.recipientUsername, chaosAward.scoreOrStat, '🔥');

      // 5. Picasso Thumbnail (if available)
      if (picassoAward?.thumbnail) {
        awardY += 20;
        ctx.fillStyle = '#FFFFFF';
        drawRoundedRect(ctx, 120, awardY, 840, 320, 28);
        ctx.fill();
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#6B7280';
        ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(`🎨 DRAWING HIGHLIGHT BY ${picassoAward.recipientUsername.toUpperCase()}`, 540, awardY + 50);

        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = picassoAward.thumbnail!;
          });
          ctx.drawImage(img, 360, awardY + 75, 360, 210);
        } catch {
          // ignore if image fails to render
        }
      }

      // 6. Footer
      ctx.fillStyle = '#111827';
      ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('PLAY UP TO 15 PLAYERS FREE', 540, 1800);

      ctx.fillStyle = '#9CA3AF';
      ctx.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Create instant party game rooms at FETO GAMES', 540, 1845);

      // Download Trigger
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `feto-games-recap-${room.code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export story PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareDirect = async () => {
    sound.playClick();
    const shareText = `Check out our match recap on FETO GAMES! MVP: ${mvp?.username || 'Champion'} with ${mvp?.score || 0} pts!`;
    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${room.code}` : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FETO GAMES Match Results',
          text: shareText,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-sm sm:max-w-md bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-gray-900 flex flex-col items-center my-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="absolute top-4 right-4 w-9 h-9 inline-flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors z-20"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Visual 9:16 Story Preview Container */}
            <div
              ref={cardRef}
              className="w-full aspect-[9/16] max-h-[60vh] bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden mb-4 shadow-sm"
            >
              {/* Header */}
              <div className="flex flex-col items-center text-center z-10 pt-1">
                <BrandLogo size="nav" showSubtitle={false} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1">
                  Official Match Recap
                </span>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 mt-1">
                  Room {room.code} • {room.players.length} Players
                </span>
              </div>

              {/* MVP Hero Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col items-center text-center z-10 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                  <Trophy className="w-3.5 h-3.5 fill-amber-500" />
                  <span>MVP of the Match</span>
                </div>
                <div className="flex items-center gap-2 my-1">
                  {mvp && <NeonAvatarDisplay avatarId={mvp.avatar} size="sm" showGlow={false} />}
                  <span className="text-base font-extrabold text-gray-900 truncate max-w-[150px]">
                    {mvp?.username || 'Champion'}
                  </span>
                </div>
                <span className="text-xs font-bold text-blue-600">
                  {mvp?.score || 0} pts • 1st Place
                </span>
              </div>

              {/* Superlative Awards */}
              <div className="space-y-1.5 z-10">
                {liarAward && (
                  <div className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>🕵️</span>
                      <span className="font-bold text-gray-800">{liarAward.recipientUsername}</span>
                    </div>
                    <span className="text-blue-600 font-semibold text-[11px]">{liarAward.scoreOrStat}</span>
                  </div>
                )}

                {sipAward && (
                  <div className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>🥤</span>
                      <span className="font-bold text-gray-800">{sipAward.recipientUsername}</span>
                    </div>
                    <span className="text-rose-600 font-semibold text-[11px]">{sipAward.scoreOrStat}</span>
                  </div>
                )}

                {chaosAward && (
                  <div className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>🔥</span>
                      <span className="font-bold text-gray-800">{chaosAward.recipientUsername}</span>
                    </div>
                    <span className="text-amber-600 font-semibold text-[11px]">{chaosAward.scoreOrStat}</span>
                  </div>
                )}
              </div>

              {/* Drawing highlight if available */}
              {picassoAward?.thumbnail ? (
                <div className="bg-white border border-gray-200 rounded-xl p-2 flex flex-col items-center text-center z-10 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-gray-500 mb-1">
                    🎨 Drawing Highlight
                  </span>
                  <img
                    src={picassoAward.thumbnail}
                    alt="Drawing Highlight"
                    className="w-20 h-14 object-contain rounded border border-gray-200 bg-white"
                  />
                  <span className="text-[9px] font-medium text-gray-500 mt-1">
                    By {picassoAward.recipientUsername}
                  </span>
                </div>
              ) : (
                <div className="text-center z-10 py-1">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    FETO GAMES Party Mode
                  </span>
                </div>
              )}

              {/* Story Footer */}
              <div className="text-center z-10 border-t border-gray-200 pt-1.5">
                <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider block">
                  Play Up To 15 Players Free
                </span>
                <span className="text-[9px] text-gray-400">Join instant party rooms at FETO GAMES</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2">
              <button
                onClick={handleDownloadPNG}
                disabled={isExporting}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-white" />
                <span>{isExporting ? 'Generating PNG...' : 'Download 9:16 Story (PNG)'}</span>
              </button>

              <button
                onClick={handleShareDirect}
                className="w-full h-11 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4 text-gray-600" />
                )}
                <span>{copiedLink ? 'Link Copied!' : 'Share Results'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
