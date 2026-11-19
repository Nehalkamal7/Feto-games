'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Sparkles, Star, Zap, Check, ChevronDown, User, RefreshCw, X } from 'lucide-react';
import { NeonAvatarDisplay } from './NeonAvatarDisplay';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { PINNED_NICKNAMES, rollDynamicNicknames } from '@/lib/nicknames';
import { sound } from '@/lib/sound';

interface PlayerOnboardingCardProps {
  username: string;
  avatar: NeonAvatarId;
  onUsernameChange: (name: string) => void;
  onAvatarChange: (avatar: NeonAvatarId) => void;
  className?: string;
  showAvatarPickerInline?: boolean;
}

export function PlayerOnboardingCard({
  username,
  avatar,
  onUsernameChange,
  onAvatarChange,
  className = '',
  showAvatarPickerInline = false
}: PlayerOnboardingCardProps) {
  // 4 dynamic rolled nicknames (initialized with 4 random names from the pool)
  const [dynamicNicknames, setDynamicNicknames] = useState<string[]>(() =>
    rollDynamicNicknames([], 4)
  );

  const [isRolling, setIsRolling] = useState(false);
  const [showAvatarDrawer, setShowAvatarDrawer] = useState(showAvatarPickerInline);

  // Keep dynamic nicknames populated on initial mount if empty
  useEffect(() => {
    if (dynamicNicknames.length < 4) {
      setDynamicNicknames(rollDynamicNicknames([], 4));
    }
  }, [dynamicNicknames.length]);

  // Roll fresh dynamic nicknames (never touches the 4 pinned ones)
  const handleRoll = () => {
    sound.playClick();
    sound.triggerHaptic(35);
    setIsRolling(true);

    const freshDynamic = rollDynamicNicknames(dynamicNicknames, 4);
    setDynamicNicknames(freshDynamic);

    // Automatically set the username to the first rolled name and save
    const chosenName = freshDynamic[0];
    onUsernameChange(chosenName);

    setTimeout(() => {
      setIsRolling(false);
    }, 450);
  };

  // Click any chip (pinned or dynamic)
  const handleSelectChip = (name: string) => {
    sound.playClick();
    sound.triggerHaptic(25);
    onUsernameChange(name);
  };

  // Check if chip is currently selected (case-insensitive)
  const isChipSelected = (name: string) => {
    return username.trim().toLowerCase() === name.toLowerCase();
  };

  return (
    <div
      className={`w-full glass-panel-neon rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-cyan-500/40 shadow-neon-cyan relative backdrop-blur-xl ${className}`}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-cyan-300 block leading-tight">
              PLAYER ONBOARDING
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-300 block leading-tight">
              Pick Your Gamer Tag
            </span>
          </div>
        </div>

        {/* Avatar Toggle Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            setShowAvatarDrawer((prev) => !prev);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-xs font-bold text-slate-300 hover:text-white transition-all touch-manipulation"
          title="Change Avatar"
        >
          <NeonAvatarDisplay avatarId={avatar} size="sm" showGlow={false} className="w-6 h-6 text-sm" />
          <span className="hidden xs:inline text-[11px] uppercase tracking-wider font-extrabold text-cyan-300">
            Avatar
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-cyan-400 transition-transform duration-200 ${
              showAvatarDrawer ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* AVATAR DRAWER (ACCORDION / DRAWER) */}
      <AnimatePresence>
        {showAvatarDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3.5"
          >
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Neon Avatar
                </span>
                <span className="text-[10px] font-bold text-cyan-400">
                  {NEON_AVATARS[avatar]?.name || 'Avatar'}
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((avId) => (
                  <button
                    key={avId}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onAvatarChange(avId);
                    }}
                    className={`p-1 rounded-xl border flex items-center justify-center transition-all touch-manipulation ${
                      avatar === avId
                        ? 'border-cyan-400 bg-cyan-950/80 scale-105 shadow-neon-cyan ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                    }`}
                    title={NEON_AVATARS[avId].name}
                  >
                    <NeonAvatarDisplay avatarId={avId} size="sm" showGlow={avatar === avId} className="w-8 h-8 text-base" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT BAR WITH WORKING ROLL (DICE) BUTTON */}
      <div className="relative flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            maxLength={18}
            placeholder="Type nickname or pick below..."
            className="w-full h-11 sm:h-12 bg-slate-950/90 border-2 border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 pr-8 text-white font-extrabold text-sm sm:text-base outline-none transition-all placeholder:text-slate-500 placeholder:font-normal focus:shadow-[0_0_15px_rgba(56,242,255,0.25)]"
          />
          {username && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onUsernameChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Prominent Working "Roll" Dice Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleRoll}
          disabled={isRolling}
          id="btn-roll-nickname"
          className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-feto-purple hover:from-cyan-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(56,242,255,0.4)] border border-cyan-300/40 touch-target transition-all flex-shrink-0"
          title="Roll fresh nicknames from 40+ pool"
        >
          <motion.div
            animate={isRolling ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Dices className="w-4 h-4 text-cyan-100" />
          </motion.div>
          <span>Roll</span>
        </motion.button>
      </div>

      {/* 8 SUGGESTED NICKNAME CHIPS (4 PINNED ALWAYS FIRST + 4 DYNAMIC) */}
      <div className="space-y-2">
        {/* Chips Subheader */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Suggested Gamer Tags (Tap to Choose)</span>
          </div>
          <span className="text-[9px] text-slate-500 font-mono">
            4 Pinned • 4 Dynamic
          </span>
        </div>

        {/* 1. ROW OF 4 PERMANENT PINNED NICKNAMES */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-400/90">
            <Star className="w-2.5 h-2.5 fill-amber-400" />
            <span>Featured VIP Tags (Pinned)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PINNED_NICKNAMES.map((pinnedName, index) => {
              const selected = isChipSelected(pinnedName);
              return (
                <button
                  key={pinnedName}
                  type="button"
                  onClick={() => handleSelectChip(pinnedName)}
                  className={`h-9 px-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-between gap-1 transition-all touch-manipulation border ${
                    selected
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-[1.02]'
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-amber-400/60 hover:text-white hover:bg-slate-800'
                  }`}
                  id={`pinned-nickname-${index + 1}`}
                >
                  <span className="truncate flex items-center gap-1">
                    <span className="text-[10px] text-amber-400 font-mono">#{index + 1}</span>
                    <span>{pinnedName}</span>
                  </span>
                  {selected ? (
                    <Check className="w-3 h-3 text-amber-300 flex-shrink-0" />
                  ) : (
                    <Star className="w-2.5 h-2.5 text-amber-400/50 flex-shrink-0 fill-amber-400/30" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. ROW OF 4 DYNAMIC ROLLED NICKNAMES */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-cyan-400/90">
            <Zap className="w-2.5 h-2.5 fill-cyan-400" />
            <span>Randomized Party Pool (Roll for More)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {dynamicNicknames.map((dynName, index) => {
              const selected = isChipSelected(dynName);
              return (
                <button
                  key={`${dynName}-${index}`}
                  type="button"
                  onClick={() => handleSelectChip(dynName)}
                  className={`h-9 px-2 rounded-xl text-xs font-black tracking-wide flex items-center justify-between gap-1 transition-all touch-manipulation border ${
                    selected
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(56,242,255,0.5)] scale-[1.02]'
                      : 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-cyan-400/60 hover:text-white hover:bg-slate-800'
                  }`}
                  id={`dynamic-nickname-${index + 1}`}
                >
                  <span className="truncate flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-cyan-400/60 flex-shrink-0" />
                    <span>{dynName}</span>
                  </span>
                  {selected && (
                    <Check className="w-3 h-3 text-cyan-300 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
