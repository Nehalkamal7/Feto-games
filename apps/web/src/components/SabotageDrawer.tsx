'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, ChevronRight } from 'lucide-react';
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
    colorBorder: 'border-2 border-[#010101]',
    colorGlow: 'shadow-[4px_4px_0px_#010101]',
    colorBg: 'bg-[#F8F8F8]'
  },
  {
    type: 'double_trouble',
    name: 'Double Trouble',
    badge: '2X PENALTY',
    icon: '🔥',
    tagline: 'Double Points & Sips',
    description: 'Doubles points lost or Sip penalties on the target for the current round!',
    colorBorder: 'border-2 border-[#010101]',
    colorGlow: 'shadow-[4px_4px_0px_#010101]',
    colorBg: 'bg-[#F8F8F8]'
  },
  {
    type: 'steal_turn',
    name: 'Steal Turn',
    badge: 'HOT SEAT PASS',
    icon: '⚡',
    tagline: 'Pass the Pressure',
    description: 'Forces target player into the hot seat or ticking bomb immediately!',
    colorBorder: 'border-2 border-[#010101]',
    colorGlow: 'shadow-[4px_4px_0px_#010101]',
    colorBg: 'bg-[#F8F8F8]'
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
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider border-2 border-[#010101] transition-all touch-target ${
            hasUsedPowerUp
              ? 'bg-[#E5E5E5] text-[#010101]/40 border-[#010101]/30 cursor-not-allowed opacity-60'
              : 'bg-[#FD3F01] hover:bg-[#e03700] text-white shadow-[3px_3px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#010101]'
          }`}
          aria-label="Open Sabotage Power-Ups Drawer"
        >
          <Zap className="w-4 h-4 text-[#FEC90E] fill-current" />
          <span>{hasUsedPowerUp ? 'Sabotage Used' : 'Sabotage ⚡'}</span>
        </button>
      </div>

      {/* SABOTAGE MODAL DRAWER OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#010101]/80 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-lg bg-[#FFFFFF] border-t-3 sm:border-3 border-[#010101] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-[8px_8px_0px_#010101] relative text-[#010101] max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#010101]/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#FD3F01] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-[#010101]">
                      Tactical Sabotage
                    </h3>
                    <p className="text-[11px] text-[#010101]/70 font-medium">
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
                  className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white text-[#010101] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-[#FD3F01]/10 border-2 border-[#FD3F01] text-[#FD3F01] text-xs font-black">
                  {errorMsg}
                </div>
              )}

              {/* STEP 1: SELECT POWER-UP CARD */}
              {!selectedType ? (
                <div className="space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-[#010101] mb-2">
                    Select Your Chaos Power-Up:
                  </div>

                  {SABOTAGE_POWERUPS.map((pu) => (
                    <button
                      key={pu.type}
                      onClick={() => handleSelectPowerUp(pu.type)}
                      className={`w-full text-left p-4 rounded-2xl ${pu.colorBorder} ${pu.colorBg} ${pu.colorGlow} hover:bg-[#FFFFFF] transition-all flex items-center justify-between group active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101]`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl font-emoji">{pu.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[#010101] transition-colors">
                              {pu.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#FD3F01] text-white border border-[#010101] text-[9px] font-black uppercase tracking-widest font-mono">
                              {pu.badge}
                            </span>
                          </div>
                          <p className="text-xs text-[#010101]/70 mt-1 leading-relaxed font-medium">
                            {pu.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-[#010101] group-hover:text-[#FD3F01] flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              ) : (
                /* STEP 2: SELECT OPPONENT TARGET */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-[#010101]/70 uppercase font-black block">Targeting:</span>
                      <span className="text-sm font-black text-[#FD3F01]">
                        {SABOTAGE_POWERUPS.find((p) => p.type === selectedType)?.name}{' '}
                        {SABOTAGE_POWERUPS.find((p) => p.type === selectedType)?.icon}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-xs text-[#0B89FD] hover:underline font-black"
                    >
                      Change Power-Up
                    </button>
                  </div>

                  <div className="text-xs font-black uppercase tracking-wider text-[#010101]">
                    Choose Opponent To Sabotage ({opponents.length} Available):
                  </div>

                  {opponents.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-[#F8F8F8] border-2 border-[#010101] text-center text-xs text-[#010101]/70 font-medium">
                      Need at least 1 other player in the room to unleash sabotage!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {opponents.map((opp) => (
                        <button
                          key={opp.id}
                          onClick={() => handleExecuteSabotage(opp.id)}
                          disabled={isSubmitting}
                          className="p-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-left flex items-center justify-between transition-all group active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_#010101]"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <NeonAvatarDisplay avatarId={opp.avatar} size="sm" showGlow={false} />
                            <div className="truncate">
                              <span className="text-xs font-black text-[#010101] truncate block">
                                {opp.username}
                              </span>
                              <span className="text-[10px] text-[#010101]/70 font-mono font-bold">
                                {opp.score || 0} pts
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-black uppercase text-white bg-[#FD3F01] px-2 py-0.5 rounded border border-[#010101]">
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
