'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Check, Sparkles, X, Eye, Trophy, Wine, Flame, EyeOff, Award } from 'lucide-react';
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

  // High-Resolution 1080x1920 Canvas Exporter
  const handleDownloadPNG = async () => {
    sound.playClick();
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // 1. Background: Dark Navy Esports Theme
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, 1080, 1920);

      // Radial neon glows
      const glowCyan = ctx.createRadialGradient(250, 350, 10, 250, 350, 600);
      glowCyan.addColorStop(0, 'rgba(56, 242, 255, 0.22)');
      glowCyan.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = glowCyan;
      ctx.fillRect(0, 0, 1080, 1920);

      const glowPurple = ctx.createRadialGradient(850, 1100, 10, 850, 1100, 700);
      glowPurple.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
      glowPurple.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = glowPurple;
      ctx.fillRect(0, 0, 1080, 1920);

      // Outer Neon Cyber Border
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#38F2FF';
      ctx.shadowColor = '#38F2FF';
      ctx.shadowBlur = 35;
      ctx.strokeRect(40, 40, 1000, 1840);
      ctx.shadowBlur = 0; // reset

      // Secondary Accent Border
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
      ctx.strokeRect(55, 55, 970, 1810);

      // 2. Header Brand Logo Text
      ctx.textAlign = 'center';
      ctx.font = '900 68px "Arial Black", Montserrat, sans-serif';
      ctx.fillStyle = '#38F2FF';
      ctx.shadowColor = '#38F2FF';
      ctx.shadowBlur = 25;
      ctx.fillText('FETO GAMES', 540, 180);
      ctx.shadowBlur = 0;

      ctx.font = '700 28px Arial, sans-serif';
      ctx.fillStyle = '#A855F7';
      ctx.letterSpacing = '6px';
      ctx.fillText('OFFICIAL MATCH RECAP • 9:16 STORY', 540, 230);

      // Room & Stats pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.roundRect(300, 260, 480, 60, 30);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 242, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '800 24px monospace';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`ROOM: ${room.code}  •  ${room.players.length} PLAYERS`, 540, 300);

      // 3. MVP Crown Card
      ctx.fillStyle = 'rgba(234, 179, 8, 0.1)';
      ctx.beginPath();
      ctx.roundRect(100, 360, 880, 340, 28);
      ctx.fill();
      ctx.strokeStyle = '#EAB308';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#EAB308';
      ctx.shadowBlur = 30;
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = '900 38px Arial, sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('👑  MVP OF THE NIGHT  👑', 540, 440);

      ctx.font = '900 64px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(mvp?.username || 'Champion', 540, 530);

      ctx.font = '800 36px monospace';
      ctx.fillStyle = '#38F2FF';
      ctx.fillText(`${mvp?.score || 0} POINTS  •  1ST PLACE`, 540, 610);

      // 4. Awards Grid (Certified Liar, Sip Champion, Chaos Menace)
      const awardsToDraw = [
        {
          title: liarAward?.title || 'The Certified Liar 🕵️',
          name: liarAward?.recipientUsername || sortedPlayers[1]?.username || 'Deceiver',
          stat: liarAward?.scoreOrStat || 'Undetected',
          color: '#38F2FF',
          y: 740
        },
        {
          title: sipAward?.title || 'Sip Champion 🥤',
          name: sipAward?.recipientUsername || 'Hydrated Legend',
          stat: sipAward?.scoreOrStat || 'Top Chugger',
          color: '#EC4899',
          y: 910
        },
        {
          title: chaosAward?.title || 'Chaos Menace 🔥',
          name: chaosAward?.recipientUsername || 'Wild Agent',
          stat: chaosAward?.scoreOrStat || '100% Chaos',
          color: '#F97316',
          y: 1080
        }
      ];

      for (const a of awardsToDraw) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(100, a.y, 880, 140, 20);
        ctx.fill();
        ctx.strokeStyle = a.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '800 30px Arial, sans-serif';
        ctx.fillStyle = a.color;
        ctx.fillText(a.title, 140, a.y + 55);

        ctx.font = '900 42px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(a.name, 140, a.y + 110);

        ctx.textAlign = 'right';
        ctx.font = '700 24px monospace';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(a.stat, 940, a.y + 85);
      }

      // 5. Drawing Snapshot (Picasso From Wish 🎨) or Hall of Fame Highlight
      const picassoY = 1260;
      ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
      ctx.beginPath();
      ctx.roundRect(100, picassoY, 880, 420, 24);
      ctx.fill();
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.font = '800 32px Arial, sans-serif';
      ctx.fillStyle = '#C084FC';
      ctx.fillText(picassoAward?.title || 'Picasso From Wish 🎨', 540, picassoY + 60);

      // If a drawing thumbnail image is available, render it!
      if (picassoAward?.thumbnail) {
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = resolve; // don't crash if image format fails
            img.src = picassoAward.thumbnail!;
          });
          // Draw inside rounded rectangle
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(360, picassoY + 90, 360, 240, 16);
          ctx.clip();
          ctx.drawImage(img, 360, picassoY + 90, 360, 240);
          ctx.restore();

          ctx.strokeStyle = '#C084FC';
          ctx.lineWidth = 3;
          ctx.strokeRect(360, picassoY + 90, 360, 240);

          ctx.font = '700 26px Arial, sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(`By ${picassoAward.recipientUsername} • Masterpiece`, 540, picassoY + 375);
        } catch {
          // Fallback text
          ctx.font = '700 28px Arial, sans-serif';
          ctx.fillStyle = '#E2E8F0';
          ctx.fillText(`By: ${picassoAward.recipientUsername}`, 540, picassoY + 160);
          ctx.font = '600 24px Arial, sans-serif';
          ctx.fillStyle = '#94A3B8';
          ctx.fillText('A true party mystery that baffled the audience!', 540, picassoY + 220);
        }
      } else {
        ctx.font = '700 28px Arial, sans-serif';
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText(`By: ${picassoAward?.recipientUsername || sortedPlayers[1]?.username || 'The Squad'}`, 540, picassoY + 160);
        ctx.font = '600 24px Arial, sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('Pure comedy, chaos, and viral glory!', 540, picassoY + 220);
      }

      // 6. Footer Call to Action
      ctx.textAlign = 'center';
      ctx.font = '900 32px Arial, sans-serif';
      ctx.fillStyle = '#38F2FF';
      ctx.fillText('PLAY UP TO 15 PLAYERS FREE AT FETO GAMES', 540, 1750);

      ctx.font = '600 24px Arial, sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(`${typeof window !== 'undefined' ? window.location.origin : 'fetogames.com'}`, 540, 1800);

      // 7. Trigger Direct Download
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
            className="w-full max-w-sm sm:max-w-md bg-[#090D16] border-2 border-cyan-400/60 rounded-3xl p-5 shadow-[0_0_50px_rgba(56,242,255,0.3)] relative text-white flex flex-col items-center my-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Visual 9:16 Story Preview Container */}
            <div
              ref={cardRef}
              className="w-full aspect-[9/16] max-h-[65vh] bg-gradient-to-b from-[#060a14] via-[#091224] to-[#140b26] border border-cyan-500/40 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden shadow-neon-cyan mb-4"
            >
              {/* Neon Ambient Background */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Story Header */}
              <div className="flex flex-col items-center text-center z-10 pt-1">
                <BrandLogo size="nav" showSubtitle={false} />
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 mt-1">
                  OFFICIAL 9:16 MATCH RECAP
                </span>
                <span className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30 mt-1">
                  ROOM {room.code} • {room.players.length} PLAYERS
                </span>
              </div>

              {/* MVP Hero */}
              <div className="bg-amber-950/40 border border-yellow-500/50 rounded-xl p-3 flex flex-col items-center text-center z-10 shadow-neon-gold">
                <div className="flex items-center gap-1.5 text-xs font-black text-yellow-300 uppercase tracking-wider mb-1">
                  <Trophy className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span>MVP OF THE NIGHT</span>
                </div>
                <div className="flex items-center gap-2 my-1">
                  {mvp && <NeonAvatarDisplay avatarId={mvp.avatar} size="sm" showGlow />}
                  <span className="text-base font-black text-white truncate max-w-[150px]">
                    {mvp?.username || 'Champion'}
                  </span>
                </div>
                <span className="text-xs font-mono font-black text-cyan-300">
                  {mvp?.score || 0} PTS • 1ST PLACE
                </span>
              </div>

              {/* Superlative Awards */}
              <div className="space-y-1.5 z-10">
                {liarAward && (
                  <div className="bg-slate-900/80 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🕵️</span>
                      <span className="text-xs font-bold text-slate-200">{liarAward.recipientUsername}</span>
                    </div>
                    <span className="text-[10px] font-black text-cyan-300 font-mono">{liarAward.scoreOrStat}</span>
                  </div>
                )}

                {sipAward && (
                  <div className="bg-slate-900/80 border border-pink-500/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🥤</span>
                      <span className="text-xs font-bold text-slate-200">{sipAward.recipientUsername}</span>
                    </div>
                    <span className="text-[10px] font-black text-pink-400 font-mono">{sipAward.scoreOrStat}</span>
                  </div>
                )}

                {chaosAward && (
                  <div className="bg-slate-900/80 border border-amber-500/30 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">🔥</span>
                      <span className="text-xs font-bold text-slate-200">{chaosAward.recipientUsername}</span>
                    </div>
                    <span className="text-[10px] font-black text-amber-400 font-mono">{chaosAward.scoreOrStat}</span>
                  </div>
                )}
              </div>

              {/* Picasso From Wish or Snapshot */}
              {picassoAward?.thumbnail ? (
                <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-2 flex flex-col items-center text-center z-10">
                  <span className="text-[10px] font-black uppercase text-purple-300 mb-1">
                    🎨 Picasso From Wish (Hall of Shame)
                  </span>
                  <img
                    src={picassoAward.thumbnail}
                    alt="Drawing Masterpiece"
                    className="w-24 h-16 object-contain rounded border border-purple-400/50 bg-black/50"
                  />
                  <span className="text-[9px] text-slate-300 mt-1">
                    By {picassoAward.recipientUsername} ({picassoAward.scoreOrStat})
                  </span>
                </div>
              ) : (
                <div className="text-center z-10 py-1">
                  <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                    ✨ Pure Party Mayhem & Glory ✨
                  </span>
                </div>
              )}

              {/* Story Footer */}
              <div className="text-center z-10 border-t border-cyan-500/20 pt-1.5">
                <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider block">
                  PLAY UP TO 15 PLAYERS FREE
                </span>
                <span className="text-[9px] text-slate-400">Join instant party rooms at FETO GAMES</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={handleDownloadPNG}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-cyan transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating PNG...' : 'Download 9:16 Story (PNG)'}</span>
              </button>

              <button
                onClick={handleShareDirect}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Story Copied!' : 'Share to Instagram / TikTok / WhatsApp'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
