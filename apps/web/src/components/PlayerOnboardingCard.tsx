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
      className={`w-full bg-[#FFFFFF] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] relative ${className}`}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#0B89FD] text-white border-2 border-[#010101] shadow-[1px_1px_0px_#010101]">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#010101] block leading-tight">
              PLAYER ONBOARDING
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#525252] block leading-tight">
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#F8F8F8] text-xs font-bold text-[#010101] transition-all touch-manipulation active:translate-x-[1px] active:translate-y-[1px]"
          title="Change Avatar"
        >
          <NeonAvatarDisplay avatarId={avatar} size="sm" showGlow={false} className="w-6 h-6 text-sm" />
          <span className="hidden xs:inline text-[11px] uppercase tracking-wider font-black text-[#010101]">
            Avatar
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#010101] transition-transform duration-200 ${
              showAvatarDrawer ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* AVATAR DRAWER */}
      <AnimatePresence>
        {showAvatarDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-3.5"
          >
            <div className="p-2.5 rounded-xl bg-[#F8F8F8] border-2 border-[#010101]">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#525252]">
                  Select Avatar
                </span>
                <span className="text-[10px] font-black text-[#0B89FD]">
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
                    className={`p-1 rounded-xl border-2 transition-all touch-manipulation ${
                      avatar === avId
                        ? 'border-[#010101] bg-[#0B89FD] shadow-[2px_2px_0px_#010101] scale-105'
                        : 'border-[#010101] bg-[#FFFFFF] hover:bg-[#F8F8F8]'
                    }`}
                    title={NEON_AVATARS[avId].name}
                  >
                    <NeonAvatarDisplay avatarId={avId} size="sm" showGlow={false} className="w-8 h-8 text-base" />
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
            className="w-full h-11 sm:h-12 bg-[#F8F8F8] border-2 border-[#010101] focus:bg-[#FFFFFF] focus:border-[#0B89FD] rounded-xl px-3.5 pr-8 text-[#010101] font-black text-sm sm:text-base outline-none transition-all placeholder:text-[#737373] placeholder:font-medium shadow-none"
          />
          {username && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onUsernameChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#737373] hover:text-[#010101]"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Prominent Working "Roll" Dice Button (Vibrant Yellow #FEC90E) */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleRoll}
          disabled={isRolling}
          id="btn-roll-nickname"
          className="h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl bg-[#FEC90E] hover:bg-[#fed338] text-[#010101] font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#010101] border-2 border-[#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#010101] touch-target transition-all flex-shrink-0"
          title="Roll fresh nicknames from 40+ pool"
        >
          <motion.div
            animate={isRolling ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Dices className="w-4 h-4 text-[#010101]" />
          </motion.div>
          <span>Roll</span>
        </motion.button>
      </div>

      {/* 8 SUGGESTED NICKNAME CHIPS (4 PINNED ALWAYS FIRST + 4 DYNAMIC) */}
      <div className="space-y-2">
        {/* Chips Subheader */}
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-black text-[#525252]">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#0B89FD]" />
            <span>Suggested Gamer Tags (Tap to Choose)</span>
          </div>
          <span className="text-[9px] text-[#737373] font-mono font-bold">
            4 Pinned • 4 Dynamic
          </span>
        </div>

        {/* 1. ROW OF 4 PERMANENT PINNED NICKNAMES */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#010101]">
            <Star className="w-2.5 h-2.5 fill-[#FEC90E] text-[#010101]" />
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
                  className={`h-9 px-2.5 rounded-xl text-xs font-black tracking-wide flex items-center justify-between gap-1 transition-all touch-manipulation border-2 border-[#010101] ${
                    selected
                      ? 'bg-[#FEC90E] text-[#010101] shadow-[3px_3px_0px_#010101] translate-x-[1px] translate-y-[1px]'
                      : 'bg-[#FFFFFF] text-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#FEC90E]/20'
                  }`}
                  id={`pinned-nickname-${index + 1}`}
                >
                  <span className="truncate flex items-center gap-1">
                    <span className="text-[10px] text-[#010101]/70 font-mono">#{index + 1}</span>
                    <span>{pinnedName}</span>
                  </span>
                  {selected ? (
                    <Check className="w-3.5 h-3.5 text-[#010101] flex-shrink-0" />
                  ) : (
                    <Star className="w-2.5 h-2.5 text-[#010101]/40 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. ROW OF 4 DYNAMIC ROLLED NICKNAMES */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-[#010101]">
            <Zap className="w-2.5 h-2.5 fill-[#0B89FD] text-[#010101]" />
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
                  className={`h-9 px-2.5 rounded-xl text-xs font-black tracking-wide flex items-center justify-between gap-1 transition-all touch-manipulation border-2 border-[#010101] ${
                    selected
                      ? 'bg-[#0B89FD] text-white shadow-[3px_3px_0px_#010101] translate-x-[1px] translate-y-[1px]'
                      : 'bg-[#FFFFFF] text-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#0B89FD]/15'
                  }`}
                  id={`dynamic-nickname-${index + 1}`}
                >
                  <span className="truncate flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-[#0B89FD] flex-shrink-0" />
                    <span>{dynName}</span>
                  </span>
                  {selected && (
                    <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />
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
