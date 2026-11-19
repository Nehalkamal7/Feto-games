'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { NeonAvatarDisplay } from './NeonAvatarDisplay';
import { User, Dices, Edit3, Check, Sparkles, X, Star, Zap } from 'lucide-react';
import { PINNED_NICKNAMES, rollDynamicNicknames } from '@/lib/nicknames';
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
  const [dynamicChips, setDynamicChips] = useState<string[]>(() =>
    rollDynamicNicknames([], 4)
  );
  const [isRolling, setIsRolling] = useState(false);

  const handleOpen = () => {
    sound.playClick();
    setTempName(username);
    setIsOpen(true);
  };

  const handleSave = () => {
    sound.playClick();
    if (tempName.trim()) {
      onUsernameChange(tempName.trim());
    }
    setIsOpen(false);
  };

  const handleRollChips = () => {
    sound.playClick();
    sound.triggerHaptic(35);
    setIsRolling(true);

    const fresh = rollDynamicNicknames(dynamicChips, 4);
    setDynamicChips(fresh);
    setTempName(fresh[0]);

    setTimeout(() => {
      setIsRolling(false);
    }, 450);
  };

  const handleSelectChip = (name: string) => {
    sound.playClick();
    sound.triggerHaptic(25);
    setTempName(name);
  };

  const isSelected = (name: string) => {
    return tempName.trim().toLowerCase() === name.toLowerCase();
  };

  return (
    <>
      {/* SLEEK COMPACT PROFILE BAR */}
      <div className="inline-flex items-center gap-2.5 p-1.5 pr-3.5 rounded-2xl glass-panel border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] group">
        <button
          type="button"
          onClick={handleOpen}
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
              className="w-full max-w-lg glass-panel-neon rounded-3xl p-5 sm:p-6 border border-cyan-400 shadow-neon-cyan relative max-h-[90dvh] overflow-y-auto"
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
              <div className="space-y-2 mb-3">
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
                    className="flex-1 min-h-[46px] bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 text-white font-bold text-sm outline-none"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleRollChips}
                    disabled={isRolling}
                    className="min-h-[46px] px-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl text-white flex items-center justify-center gap-1.5 text-xs font-bold touch-target shadow-neon-cyan"
                  >
                    <motion.div
                      animate={isRolling ? { rotate: [0, 360] } : { rotate: 0 }}
                      transition={{ duration: 0.45 }}
                    >
                      <Dices className="w-4 h-4 text-cyan-200" />
                    </motion.div>
                    <span>Roll</span>
                  </motion.button>
                </div>
              </div>

              {/* 8 Nickname Suggestion Chips */}
              <div className="mb-4 space-y-2 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>Suggested Gamer Tags (4 Pinned + 4 Dynamic)</span>
                  </div>
                </div>

                {/* 4 Pinned Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {PINNED_NICKNAMES.map((name, i) => {
                    const sel = isSelected(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSelectChip(name)}
                        className={`h-8 px-2 rounded-xl text-xs font-black flex items-center justify-between gap-1 border transition-all ${
                          sel
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.4)]'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400/50'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <span className="text-[10px] text-amber-400">#{i + 1}</span>
                          <span>{name}</span>
                        </span>
                        {sel ? (
                          <Check className="w-3 h-3 text-amber-300 flex-shrink-0" />
                        ) : (
                          <Star className="w-2.5 h-2.5 text-amber-400/40 fill-amber-400/20 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 4 Dynamic Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {dynamicChips.map((name, i) => {
                    const sel = isSelected(name);
                    return (
                      <button
                        key={`${name}-${i}`}
                        type="button"
                        onClick={() => handleSelectChip(name)}
                        className={`h-8 px-2 rounded-xl text-xs font-black flex items-center justify-between gap-1 border transition-all ${
                          sel
                            ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(56,242,255,0.4)]'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400/50'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-cyan-400/60 flex-shrink-0" />
                          <span>{name}</span>
                        </span>
                        {sel && (
                          <Check className="w-3 h-3 text-cyan-300 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
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
