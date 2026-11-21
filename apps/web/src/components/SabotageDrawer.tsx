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
}

const SABOTAGE_POWERUPS: SabotagePowerUpInfo[] = [
  {
    type: 'blindfold',
    name: 'Blindfold',
    badge: '5S Blur',
    icon: '🕶️',
    tagline: 'Screen Fog of War',
    description: 'Blurs your target’s entire screen for 5 seconds while they draw, guess, or type!'
  },
  {
    type: 'double_trouble',
    name: 'Double Trouble',
    badge: '2X Penalty',
    icon: '🔥',
    tagline: 'Double Points & Sips',
    description: 'Doubles points lost or Sip penalties on the target for the current round!'
  },
  {
    type: 'steal_turn',
    name: 'Steal Turn',
    badge: 'Turn Swap',
    icon: '⚡',
    tagline: 'Pass the Pressure',
    description: 'Forces target player into the hot seat or ticking bomb immediately!'
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
      {/* FLOATING TRIGGER BUTTON (BOTTOM LEFT) */}
      <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 z-40 safe-bottom safe-left">
        <button
          onClick={() => {
            sound.playClick();
            setIsOpen(true);
          }}
          disabled={hasUsedPowerUp}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-semibold text-xs tracking-wide border transition-all ${
            hasUsedPowerUp
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 shadow-sm active:scale-95'
          }`}
          aria-label="Open Sabotage Power-Ups Drawer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>{hasUsedPowerUp ? 'Sabotage Used' : 'Sabotage ⚡'}</span>
        </button>
      </div>

      {/* SABOTAGE MODAL DRAWER OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="w-full max-w-lg bg-white border border-gray-200 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl relative text-gray-900 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Tactical Sabotage
                    </h3>
                    <p className="text-xs text-gray-500">
                      1 single-use card per match • Target an opponent
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setIsOpen(false);
                    setSelectedType(null);
                  }}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              {/* STEP 1: SELECT POWER-UP CARD */}
              {!selectedType ? (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Select Your Power-Up:
                  </div>

                  {SABOTAGE_POWERUPS.map((pu) => (
                    <button
                      key={pu.type}
                      onClick={() => handleSelectPowerUp(pu.type)}
                      className="w-full text-left p-3.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 text-xl shadow-xs">
                          {pu.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900">
                              {pu.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                              {pu.badge}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {pu.description}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 shrink-0 ml-2 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                /* STEP 2: SELECT OPPONENT TARGET */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold block">Targeting:</span>
                      <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                        <span>{SABOTAGE_POWERUPS.find((p) => p.type === selectedType)?.name}</span>
                        <span>{SABOTAGE_POWERUPS.find((p) => p.type === selectedType)?.icon}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Change Power-Up
                    </button>
                  </div>

                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Choose Opponent ({opponents.length} Available):
                  </div>

                  {opponents.length === 0 ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
                      Need at least 1 other player in the room to unleash sabotage!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {opponents.map((opp) => (
                        <button
                          key={opp.id}
                          onClick={() => handleExecuteSabotage(opp.id)}
                          disabled={isSubmitting}
                          className="p-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-left flex items-center justify-between transition-all group shadow-xs"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <NeonAvatarDisplay avatarId={opp.avatar} size="sm" showGlow={false} />
                            <div className="truncate">
                              <span className="text-xs font-semibold text-gray-900 truncate block">
                                {opp.username}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {opp.score || 0} pts
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold uppercase text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg">
                            Strike ⚡
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
