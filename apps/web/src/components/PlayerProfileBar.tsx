'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { NeonAvatarDisplay } from './NeonAvatarDisplay';
import { User, Dices, Edit3, Check, Sparkles, X } from 'lucide-react';
import { sound } from '@/lib/sound';

interface PlayerProfileBarProps {
  username: string;
  avatar: NeonAvatarId;
  onUsernameChange: (name: string) => void;
  onAvatarChange: (avatar: NeonAvatarId) => void;
  onRandomize: () => void;
}

export function PlayerProfileBar({
  username,
  avatar,
  onUsernameChange,
  onAvatarChange,
  onRandomize
}: PlayerProfileBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempName, setTempName] = useState(username);

  const handleSave = () => {
    sound.playClick();
    if (tempName.trim()) {
      onUsernameChange(tempName.trim());
    }
    setIsOpen(false);
  };

  return (
    <>
      {/* SLEEK COMPACT PROFILE BAR */}
      <div className="inline-flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl glass-panel border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] group">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setTempName(username);
            setIsOpen(true);
          }}
          className="flex items-center gap-2.5 touch-target text-left"
        >
          <NeonAvatarDisplay avatarId={avatar} size="sm" showGlow={false} />
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <span>PLAYER PROFILE</span>
              <Edit3 className="w-2.5 h-2.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xs sm:text-sm font-black text-white truncate max-w-[130px] sm:max-w-[180px]">
              {username || 'Player'}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onRandomize();
          }}
          className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-300 transition-all touch-manipulation"
          title="Randomize Nickname"
          aria-label="Randomize Nickname"
        >
          <Dices className="w-4 h-4" />
        </button>
      </div>

      {/* QUICK CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-panel-neon rounded-3xl p-5 sm:p-6 border border-cyan-400 shadow-neon-cyan relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xl font-black text-white">Customize Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white text-2xl font-bold min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  &times;
                </button>
              </div>

              {/* Username Input & Randomizer */}
              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Player Nickname
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={18}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter nickname..."
                    className="flex-1 min-h-[48px] bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 text-white font-bold text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onRandomize();
                    }}
                    className="min-h-[48px] px-3.5 bg-slate-900 border border-slate-700 hover:border-cyan-400 rounded-xl text-cyan-400 flex items-center justify-center gap-1 text-xs font-bold touch-target"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll</span>
                  </button>
                </div>
              </div>

              {/* Avatar Picker (10 Neon Avatars) */}
              <div className="mb-5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
                  Choose Neon Avatar
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((avId) => (
                    <button
                      key={avId}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onAvatarChange(avId);
                      }}
                      className={`p-1.5 rounded-xl border-2 flex items-center justify-center transition-all touch-target ${
                        avatar === avId
                          ? 'border-cyan-400 bg-cyan-950/60 scale-105 shadow-neon-cyan'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      <NeonAvatarDisplay avatarId={avId} size="sm" showGlow={avatar === avId} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleSave}
                className="w-full min-h-[48px] btn-neon-cyan py-3 rounded-xl text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg touch-target"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Save</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
