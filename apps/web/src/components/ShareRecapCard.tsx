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
  currentPlayer,
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

  // High-Resolution 1080x1920 Bauhaus Canvas Exporter
  const handleDownloadPNG = async () => {
    sound.playClick();
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // 1. Canvas Background: Crisp Off-White (#F8F8F8)
      ctx.fillStyle = '#F8F8F8';
      ctx.fillRect(0, 0, 1080, 1920);

      // Subtle Bauhaus Dot Matrix Pattern
      ctx.fillStyle = '#010101';
      for (let x = 60; x < 1020; x += 36) {
        for (let y = 60; y < 1860; y += 36) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ========================================================
      // 2. GEOMETRIC BAUHAUS CORNER ACCENTS
      // ========================================================
      // Top-Left: Large Quarter-Circle in Electric Blue (#0B89FD)
      ctx.fillStyle = '#0B89FD';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 240, 0, Math.PI / 2, false);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      // Top-Right: Diagonal Stripes & Yellow Accent (#FEC90E)
      ctx.fillStyle = '#FEC90E';
      ctx.beginPath();
      ctx.moveTo(1080, 0);
      ctx.arc(1080, 0, 220, Math.PI / 2, Math.PI, false);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      // Bottom-Left: Clean Bauhaus Circle in Red-Orange (#FD3F01)
      ctx.fillStyle = '#FD3F01';
      ctx.beginPath();
      ctx.arc(80, 1840, 160, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      // Outer Jet Black Frame
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#010101';
      ctx.strokeRect(40, 40, 1000, 1840);

      // Inset Accent Border
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#010101';
      ctx.strokeRect(55, 55, 970, 1810);

      // ========================================================
      // 3. HEADER BRAND LOGO & TITLE
      // ========================================================
      ctx.textAlign = 'center';
      ctx.font = '900 72px "Arial Black", Impact, sans-serif';
      ctx.fillStyle = '#010101';
      ctx.fillText('FETO ', 480, 175);
      ctx.fillStyle = '#0B89FD';
      ctx.fillText('GAMES', 650, 175);

      ctx.font = '900 26px Arial, sans-serif';
      ctx.fillStyle = '#525252';
      ctx.letterSpacing = '5px';
      ctx.fillText('OFFICIAL MATCH RECAP • 9:16 STORY', 540, 225);

      // Room & Player Count Banner (Hard Shadow + Pure White Card)
      // Hard black offset shadow
      ctx.fillStyle = '#010101';
      ctx.beginPath();
      drawRoundedRect(ctx, 308, 268, 480, 56, 16);
      ctx.fill();
      // Foreground card
      ctx.fillStyle = '#FEC90E';
      ctx.beginPath();
      drawRoundedRect(ctx, 300, 260, 480, 56, 16);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      ctx.font = '900 24px monospace';
      ctx.fillStyle = '#010101';
      ctx.fillText(`ROOM: ${room.code}  •  ${room.players.length} PLAYERS`, 540, 297);

      // ========================================================
      // 4. MVP CROWN CARD
      // ========================================================
      const mvpY = 350;
      // Hard offset shadow
      ctx.fillStyle = '#010101';
      ctx.beginPath();
      drawRoundedRect(ctx, 110, mvpY + 10, 880, 330, 24);
      ctx.fill();
      // Elevated Pure White Surface
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      drawRoundedRect(ctx, 100, mvpY, 880, 330, 24);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      // Top MVP Yellow Banner
      ctx.fillStyle = '#FEC90E';
      ctx.beginPath();
      drawRoundedRect(ctx, 240, mvpY + 28, 600, 56, 14);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      ctx.font = '900 32px Arial, sans-serif';
      ctx.fillStyle = '#010101';
      ctx.fillText('👑  MVP OF THE NIGHT  👑', 540, mvpY + 67);

      // MVP Username
      ctx.font = '900 68px Arial, sans-serif';
      ctx.fillStyle = '#010101';
      ctx.fillText(mvp?.username || 'Champion', 540, mvpY + 185);

      // MVP Points Badge
      ctx.fillStyle = '#0B89FD';
      ctx.beginPath();
      drawRoundedRect(ctx, 320, mvpY + 225, 440, 54, 12);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      ctx.font = '900 30px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${mvp?.score || 0} POINTS  •  1ST PLACE`, 540, mvpY + 262);

      // ========================================================
      // 5. SUPERLATIVE AWARDS (HARD OFFSET WHITE CARDS)
      // ========================================================
      const awardsToDraw = [
        {
          title: liarAward?.title || 'The Certified Liar 🕵️',
          name: liarAward?.recipientUsername || sortedPlayers[1]?.username || 'Deceiver',
          stat: liarAward?.scoreOrStat || 'Undetected',
          accent: '#0B89FD',
          y: 720
        },
        {
          title: sipAward?.title || 'Sip Champion 🥤',
          name: sipAward?.recipientUsername || 'Hydrated Legend',
          stat: sipAward?.scoreOrStat || 'Top Chugger',
          accent: '#FD3F01',
          y: 880
        },
        {
          title: chaosAward?.title || 'Chaos Menace 🔥',
          name: chaosAward?.recipientUsername || 'Wild Agent',
          stat: chaosAward?.scoreOrStat || '100% Chaos',
          accent: '#FEC90E',
          y: 1040
        }
      ];

      for (const a of awardsToDraw) {
        // Hard black offset shadow
        ctx.fillStyle = '#010101';
        ctx.beginPath();
        drawRoundedRect(ctx, 108, a.y + 8, 880, 130, 18);
        ctx.fill();
        // Foreground Card
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        drawRoundedRect(ctx, 100, a.y, 880, 130, 18);
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#010101';
        ctx.stroke();

        // Accent Left Strip
        ctx.fillStyle = a.accent;
        ctx.beginPath();
        drawRoundedRect(ctx, 100, a.y, 22, 130, 4);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#010101';
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '900 26px Arial, sans-serif';
        ctx.fillStyle = '#525252';
        ctx.fillText(a.title, 145, a.y + 50);

        ctx.font = '900 42px Arial, sans-serif';
        ctx.fillStyle = '#010101';
        ctx.fillText(a.name, 145, a.y + 102);

        ctx.textAlign = 'right';
        ctx.font = '800 24px monospace';
        ctx.fillStyle = '#0B89FD';
        ctx.fillText(a.stat, 940, a.y + 78);
      }

      // ========================================================
      // 6. DRAWING SNAPSHOT (PICASSO FROM WISH)
      // ========================================================
      const picassoY = 1210;
      // Hard offset shadow
      ctx.fillStyle = '#010101';
      ctx.beginPath();
      drawRoundedRect(ctx, 110, picassoY + 10, 880, 440, 24);
      ctx.fill();
      // Foreground Card
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      drawRoundedRect(ctx, 100, picassoY, 880, 440, 24);
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 32px Arial, sans-serif';
      ctx.fillStyle = '#010101';
      ctx.fillText(picassoAward?.title || 'Picasso From Wish 🎨', 540, picassoY + 56);

      if (picassoAward?.thumbnail) {
        try {
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            img.src = picassoAward.thumbnail!;
          });
          ctx.save();
          ctx.beginPath();
          drawRoundedRect(ctx, 360, picassoY + 80, 360, 260, 14);
          ctx.clip();
          ctx.drawImage(img, 360, picassoY + 80, 360, 260);
          ctx.restore();

          ctx.strokeStyle = '#010101';
          ctx.lineWidth = 5;
          ctx.strokeRect(360, picassoY + 80, 360, 260);

          ctx.font = '900 26px Arial, sans-serif';
          ctx.fillStyle = '#010101';
          ctx.fillText(`By ${picassoAward.recipientUsername} • Masterpiece`, 540, picassoY + 395);
        } catch {
          ctx.font = '700 28px Arial, sans-serif';
          ctx.fillStyle = '#525252';
          ctx.fillText(`By: ${picassoAward.recipientUsername}`, 540, picassoY + 180);
        }
      } else {
        ctx.font = '800 28px Arial, sans-serif';
        ctx.fillStyle = '#0B89FD';
        ctx.fillText(`By: ${picassoAward?.recipientUsername || sortedPlayers[1]?.username || 'The Squad'}`, 540, picassoY + 180);
        ctx.font = '700 24px Arial, sans-serif';
        ctx.fillStyle = '#525252';
        ctx.fillText('Pure comedy, chaos, and viral party glory!', 540, picassoY + 240);
      }

      // ========================================================
      // 7. FOOTER CALL TO ACTION (VIBRANT GOLD BAR)
      // ========================================================
      // Hard offset shadow
      ctx.fillStyle = '#010101';
      ctx.beginPath();
      drawRoundedRect(ctx, 108, 1698, 880, 96, 20);
      ctx.fill();
      // Foreground Card
      ctx.fillStyle = '#FEC90E';
      ctx.beginPath();
      drawRoundedRect(ctx, 100, 1690, 880, 96, 20);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#010101';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '900 30px Arial, sans-serif';
      ctx.fillStyle = '#010101';
      ctx.fillText('PLAY UP TO 15 PLAYERS FREE AT FETO GAMES', 540, 1748);

      // Trigger Direct Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `feto-games-recap-${room.code}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export story card PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareDirect = async () => {
    sound.playClick();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/join/${room.code}` : '';
    const shareText = `🎮 Check out our FETO GAMES Match Recap!\n🏆 MVP: ${mvp?.username} with ${mvp?.score || 0} pts!\nJoin next round: ${url}\n#FETOGAMES #PartyGames`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FETO GAMES Match Recap',
          text: shareText,
          url
        });
        return;
      } catch {
        // clipboard fallback
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm sm:max-w-md bg-[#FFFFFF] border-3 border-[#010101] rounded-3xl p-5 shadow-[8px_8px_0px_#010101] relative text-[#010101] flex flex-col items-center my-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[#010101] transition-colors z-20 active:translate-x-[1px] active:translate-y-[1px]"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Visual 9:16 Story Preview Container */}
            <div
              ref={cardRef}
              className="w-full aspect-[9/16] max-h-[65vh] bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-[4px_4px_0px_#010101] mb-4"
            >
              {/* Subtle Geometric Corner Accent in Preview */}
              <div className="absolute -top-8 -left-8 w-20 h-20 rounded-full bg-[#0B89FD] border-2 border-[#010101] pointer-events-none" />
              <div className="absolute -bottom-8 -right-8 w-20 h-20 rounded-full bg-[#FEC90E] border-2 border-[#010101] pointer-events-none" />

              {/* Story Header */}
              <div className="flex flex-col items-center text-center z-10 pt-1">
                <BrandLogo size="nav" showSubtitle={false} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#525252] mt-1">
                  OFFICIAL 9:16 MATCH RECAP
                </span>
                <span className="text-[11px] font-mono text-[#010101] font-black bg-[#FEC90E] px-2.5 py-0.5 rounded-full border-2 border-[#010101] mt-1 shadow-[1px_1px_0px_#010101]">
                  ROOM {room.code} • {room.players.length} PLAYERS
                </span>
              </div>

              {/* MVP Hero Card */}
              <div className="bg-[#FFFFFF] border-2 border-[#010101] rounded-xl p-3 flex flex-col items-center text-center z-10 shadow-[3px_3px_0px_#010101]">
                <div className="flex items-center gap-1.5 text-xs font-black text-[#010101] uppercase tracking-wider mb-1">
                  <Trophy className="w-4 h-4 text-[#FEC90E] fill-[#FEC90E]" />
                  <span>MVP OF THE NIGHT</span>
                </div>
                <div className="flex items-center gap-2 my-1">
                  {mvp && <NeonAvatarDisplay avatarId={mvp.avatar} size="sm" showGlow={false} />}
                  <span className="text-base font-black text-[#010101] truncate max-w-[150px]">
                    {mvp?.username || 'Champion'}
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-[#0B89FD]">
                  {mvp?.score || 0} PTS • 1ST PLACE
                </span>
              </div>

              {/* Superlative Awards */}
              <div className="space-y-1.5 z-10">
                {liarAward && (
                  <div className="bg-[#FFFFFF] border-2 border-[#010101] rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-[2px_2px_0px_#010101]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🕵️</span>
                      <span className="text-xs font-black text-[#010101]">{liarAward.recipientUsername}</span>
                    </div>
                    <span className="text-[10px] font-black text-[#0B89FD] font-mono">{liarAward.scoreOrStat}</span>
                  </div>
                )}

                {sipAward && (
                  <div className="bg-[#FFFFFF] border-2 border-[#010101] rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-[2px_2px_0px_#010101]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🥤</span>
                      <span className="text-xs font-black text-[#010101]">{sipAward.recipientUsername}</span>
                    </div>
                    <span className="text-[10px] font-black text-[#FD3F01] font-mono">{sipAward.scoreOrStat}</span>
                  </div>
                )}

                {chaosAward && (
                  <div className="bg-[#FFFFFF] border-2 border-[#010101] rounded-lg px-2.5 py-1.5 flex items-center justify-between shadow-[2px_2px_0px_#010101]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🔥</span>
                      <span className="text-xs font-black text-[#010101]">{chaosAward.recipientUsername}</span>
                    </div>
                    <span className="text-[10px] font-black text-[#FEC90E] font-mono">{chaosAward.scoreOrStat}</span>
                  </div>
                )}
              </div>

              {/* Picasso From Wish or Snapshot */}
              {picassoAward?.thumbnail ? (
                <div className="bg-[#FFFFFF] border-2 border-[#010101] rounded-xl p-2 flex flex-col items-center text-center z-10 shadow-[2px_2px_0px_#010101]">
                  <span className="text-[10px] font-black uppercase text-[#010101] mb-1">
                    🎨 Picasso From Wish (Hall of Fame)
                  </span>
                  <img
                    src={picassoAward.thumbnail}
                    alt="Drawing Masterpiece"
                    className="w-24 h-16 object-contain rounded border-2 border-[#010101] bg-[#F8F8F8]"
                  />
                  <span className="text-[9px] font-bold text-[#525252] mt-1">
                    By {picassoAward.recipientUsername} ({picassoAward.scoreOrStat})
                  </span>
                </div>
              ) : (
                <div className="text-center z-10 py-1">
                  <span className="text-[10px] font-black text-[#010101] uppercase tracking-widest">
                    ✨ Pure Party Mayhem & Glory ✨
                  </span>
                </div>
              )}

              {/* Story Footer */}
              <div className="text-center z-10 border-t-2 border-[#010101] pt-1.5">
                <span className="text-[10px] font-black text-[#010101] uppercase tracking-wider block">
                  PLAY UP TO 15 PLAYERS FREE
                </span>
                <span className="text-[9px] font-bold text-[#525252]">Join instant party rooms at FETO GAMES</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleDownloadPNG}
                disabled={isExporting}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all disabled:opacity-50 touch-target"
              >
                <Download className="w-4 h-4 text-white" />
                <span>{isExporting ? 'Generating PNG...' : 'Download 9:16 Story (PNG)'}</span>
              </button>

              <button
                onClick={handleShareDirect}
                className="w-full py-3 px-4 rounded-xl bg-[#FEC90E] hover:bg-[#fed338] border-2 border-[#010101] text-[#010101] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[3px_3px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#010101] transition-all touch-target"
              >
                {copiedLink ? <Check className="w-4 h-4 text-[#010101]" /> : <Share2 className="w-4 h-4 text-[#010101]" />}
                <span>{copiedLink ? 'Story Copied!' : 'Share to Instagram / TikTok / WhatsApp'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
