'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, EyeOff, Flame, ShieldAlert, X, ChevronRight, Check } from 'lucide-react';
import { PlayerSummary, PublicRoomState } from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { sound } from '@/lib/sound';

export type SabotageType = 'blindfold' | 'double_trouble' | 'steal_turn';

interface SabotagePowerUpInfo {
  type: SabotageType;
  name: string;
  badge: string;
  icon: string;
  tagline: string;
  description: string;
  colorBorder: string;
  colorGlow: string;
  colorBg: string;
}

const SABOTAGE_POWERUPS: SabotagePowerUpInfo[] = [
  {
    type: 'blindfold',
    name: 'Blindfold',
    badge: '5S BLUR',
    icon: '🕶️',
    tagline: 'Screen Fog of War',
    description: 'Blurs your target’s entire screen for 5 seconds while they draw, guess, or type!',
    colorBorder: 'border-cyan-400',
    colorGlow: 'shadow-[0_0_20px_rgba(56,242,255,0.4)]',
    colorBg: 'from-cyan-950/60 to-slate-900/90'
  },
  {
    type: 'double_trouble',
    name: 'Double Trouble',
    badge: '2X PENALTY',
    icon: '🔥',
    tagline: 'Double Points & Sips',
    description: 'Doubles points lost or Sip penalties on the target for the current round!',
    colorBorder: 'border-amber-400',
    colorGlow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    colorBg: 'from-amber-950/60 to-slate-900/90'
  },
  {
    type: 'steal_turn',
    name: 'Steal Turn',
    badge: 'HOT SEAT PASS',
    icon: '⚡',
    tagline: 'Pass the Pressure',
    description: 'Forces target player into the hot seat or ticking bomb immediately!',
    colorBorder: 'border-feto-magenta',
    colorGlow: 'shadow-[0_0_20px_rgba(255,0,122,0.4)]',
    colorBg: 'from-fuchsia-950/60 to-slate-900/90'
  }
];

interface SabotageDrawerProps {
  room: PublicRoomState;
  currentPlayer: PlayerSummary | null;
  hasUsedPowerUp: boolean;
  onUsePowerUp: (type: SabotageType, targetId: string) => Promise<void>;
}

export function SabotageDrawer({
  room,
  currentPlayer,
  hasUsedPowerUp,
  onUsePowerUp
}: SabotageDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<SabotageType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Eligible opponents (cannot target self)
  const opponents = room.players.filter((p) => p.id !== currentPlayer?.id);

  const handleSelectPowerUp = (type: SabotageType) => {
    sound.playClick();
    setSelectedType(type);
    setErrorMsg(null);
  };

  const handleExecuteSabotage = async (targetId: string) => {
    if (!selectedType || isSubmitting || hasUsedPowerUp) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      sound.playSabotage();
      await onUsePowerUp(selectedType, targetId);
      setIsOpen(false);
      setSelectedType(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to trigger sabotage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (MOBILE-FIRST BOTTOM LEFT) */}
      <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 z-40 safe-bottom safe-left">
        <button
          onClick={() => {
            sound.playClick();
            setIsOpen(true);
          }}
          disabled={hasUsedPowerUp}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider backdrop-blur-md border transition-all touch-target ${
            hasUsedPowerUp
              ? 'bg-slate-900/70 border-slate-700/50 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:brightness-110 text-white border-cyan-400/60 shadow-[0_0_20px_rgba(168,85,247,0.5)] active:scale-95 animate-pulse'
          }`}
          aria-label="Open Sabotage Power-Ups Drawer"
        >
          <Zap className="w-4 h-4 text-yellow-300" />
          <span>{hasUsedPowerUp ? 'Sabotage Used' : 'Sabotage ⚡'}</span>
        </button>
      </div>

      {/* SABOTAGE MODAL DRAWER OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-lg bg-[#090D16] border-t-2 sm:border-2 border-purple-500/60 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.35)] relative text-white max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-purple-500/20 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-yellow-300">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300">
                      Tactical Sabotage
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      1 Single-Use Chaos Card Per Match • Unleash on any opponent
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setIsOpen(false);
                    setSelectedType(null);
                  }}
                  className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* STEP 1: SELECT POWER-UP CARD */}
              {!selectedType ? (
                <div className="space-y-3">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-2">
                    Select Your Chaos Power-Up:
                  </div>

                  {SABOTAGE_POWERUPS.map((pu) => (
                    <button
                      key={pu.type}
                      onClick={() => handleSelectPowerUp(pu.type)}
                      className={`w-full text-left p-4 rounded-2xl border bg-gradient-to-r ${pu.colorBg} ${pu.colorBorder} ${pu.colorGlow} hover:scale-[1.01] transition-all flex items-center justify-between group active:scale-95`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl filter drop-shadow-md">{pu.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white group-hover:text-cyan-300 transition-colors">
                              {pu.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-[9px] font-black text-yellow-300 uppercase tracking-widest font-mono">
                              {pu.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {pu.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-300 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              ) : (
                /* STEP 2: SELECT OPPONENT TARGET */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 uppercase font-bold block">Targeting:</span>
                      <span className="text-sm font-black text-yellow-300">
                        {SABOTAGE_POWERUPS.find((p) => p.type === selectedType)?.name}{' '}
                        {SABOTAGE_POWERUPS.find((p) => p.type === selectedType)?.icon}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-xs text-cyan-400 hover:underline font-bold"
                    >
                      Change Power-Up
                    </button>
                  </div>

                  <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                    Choose Opponent To Sabotage ({opponents.length} Available):
                  </div>

                  {opponents.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-xs text-slate-400">
                      Need at least 1 other player in the room to unleash sabotage!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {opponents.map((opp) => (
                        <button
                          key={opp.id}
                          onClick={() => handleExecuteSabotage(opp.id)}
                          disabled={isSubmitting}
                          className="p-3 rounded-xl bg-slate-900/90 hover:bg-purple-950/60 border border-purple-500/30 hover:border-cyan-400 text-left flex items-center justify-between transition-all group active:scale-95"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <NeonAvatarDisplay avatarId={opp.avatar} size="sm" showGlow={false} />
                            <div className="truncate">
                              <span className="text-xs font-bold text-white group-hover:text-cyan-300 truncate block">
                                {opp.username}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {opp.score || 0} pts
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-black uppercase text-pink-400 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-500/30">
                            STRIKE ⚡
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
