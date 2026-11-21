'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dices, Sparkles, Star, Zap, Check, ChevronDown, User, X } from 'lucide-react';
import { NeonAvatarDisplay } from './NeonAvatarDisplay';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { CREATIVE_NICKNAMES_POOL, PINNED_NICKNAMES, rollDynamicNicknames } from '@/lib/nicknames';
import { sound } from '@/lib/sound';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { isArabic, t } = useLanguage();

  // Deterministic initial slice for SSR hydration safety; randomized client-side after mount
  const [dynamicNicknames, setDynamicNicknames] = useState<string[]>(() =>
    CREATIVE_NICKNAMES_POOL.slice(0, 4)
  );

  const [isRolling, setIsRolling] = useState(false);
  const [showAvatarDrawer, setShowAvatarDrawer] = useState(showAvatarPickerInline);

  useEffect(() => {
    setDynamicNicknames(rollDynamicNicknames([], 4));
  }, []);

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
      className={`w-full bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-sm relative ${className}`}
    >
      {/* CARD HEADER */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <User className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block leading-tight">
              {isArabic ? 'الملف الشخصي' : 'Player Profile'}
            </span>
            <span className="text-sm font-semibold text-gray-900 block leading-tight">
              {isArabic ? 'اختر اسمك وصورتك الرمزية' : 'Choose Nickname & Avatar'}
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
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-xs font-medium text-gray-800 transition-all touch-manipulation shadow-xs"
          title={isArabic ? 'تغيير الصورة الرمزية' : 'Change Avatar'}
        >
          <NeonAvatarDisplay avatarId={avatar} size="sm" showGlow={false} className="w-6 h-6" />
          <span className="hidden xs:inline text-xs font-semibold text-gray-700">
            {isArabic ? 'تغيير' : 'Change'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
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
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {isArabic ? 'اختر صورتك الرمزية' : 'Select Your Mascot'}
                </span>
                <span className="text-xs font-semibold text-blue-600">
                  {NEON_AVATARS[avatar]?.name || 'Avatar'}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((avId) => (
                  <button
                    key={avId}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onAvatarChange(avId);
                    }}
                    className={`p-1.5 rounded-xl border transition-all touch-manipulation inline-flex items-center justify-center shrink-0 ${
                      avatar === avId
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 scale-105'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    title={NEON_AVATARS[avId].name}
                  >
                    <NeonAvatarDisplay avatarId={avId} size="sm" className="w-8 h-8" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INPUT BAR WITH WORKING ROLL (DICE) BUTTON */}
      <div className="relative flex items-center gap-2 mb-3.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            maxLength={18}
            placeholder={isArabic ? 'اكتب اسمك أو اختر من المقترحات...' : 'Type nickname or choose below...'}
            className={`w-full h-11 sm:h-12 bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl px-3.5 ${
              isArabic ? 'pl-8 pr-3.5 text-right' : 'pr-8 pl-3.5 text-left'
            } text-gray-900 font-semibold text-sm sm:text-base outline-none transition-all placeholder:text-gray-400`}
          />
          {username && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onUsernameChange('');
              }}
              className={`absolute top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 ${
                isArabic ? 'left-2.5' : 'right-2.5'
              }`}
              title={isArabic ? 'مسح' : 'Clear'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Working "Roll" Dice Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleRoll}
          disabled={isRolling}
          id="btn-roll-nickname"
          className="h-11 sm:h-12 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-xs transition-all flex-shrink-0"
          title={isArabic ? 'توليد أسماء عشوائية جديدة' : 'Roll fresh nicknames from pool'}
        >
          <motion.div
            animate={isRolling ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Dices className="w-4 h-4 text-blue-600" />
          </motion.div>
          <span>{isArabic ? 'عشوائي' : 'Roll'}</span>
        </motion.button>
      </div>

      {/* 8 SUGGESTED NICKNAME CHIPS (4 PINNED ALWAYS FIRST + 4 DYNAMIC) */}
      <div className="space-y-2.5">
        {/* Subheader */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>{isArabic ? 'أسماء مقترحة (اضغط للاختيار)' : 'Suggested Gamer Tags (tap to pick)'}</span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono force-ltr">
            4 VIP • 4 Party
          </span>
        </div>

        {/* 1. ROW OF 4 PERMANENT PINNED NICKNAMES */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span>{isArabic ? 'أسماء VIP مميزة' : 'Featured VIP Tags'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {PINNED_NICKNAMES.map((pinnedName, index) => {
              const selected = isChipSelected(pinnedName);
              return (
                <button
                  key={pinnedName}
                  type="button"
                  onClick={() => handleSelectChip(pinnedName)}
                  className={`h-9 px-2.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-between gap-1 transition-all touch-manipulation border ${
                    selected
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs'
                  }`}
                  id={`pinned-nickname-${index + 1}`}
                >
                  <span className="truncate flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 font-mono force-ltr">#{index + 1}</span>
                    <span>{pinnedName}</span>
                  </span>
                  {selected ? (
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  ) : (
                    <Star className="w-2.5 h-2.5 text-gray-300 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. ROW OF 4 DYNAMIC ROLLED NICKNAMES */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            <Zap className="w-3 h-3 text-blue-500 fill-blue-400" />
            <span>{isArabic ? 'أسماء بارتي سريعة' : 'Party Pool'}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {dynamicNicknames.map((dynName, index) => {
              const selected = isChipSelected(dynName);
              return (
                <button
                  key={`${dynName}-${index}`}
                  type="button"
                  onClick={() => handleSelectChip(dynName)}
                  className={`h-9 px-2.5 rounded-xl text-xs font-semibold tracking-wide flex items-center justify-between gap-1 transition-all touch-manipulation border ${
                    selected
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs'
                  }`}
                  id={`dynamic-nickname-${index + 1}`}
                >
                  <span className="truncate flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-blue-500 flex-shrink-0" />
                    <span>{dynName}</span>
                  </span>
                  {selected && (
                    <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
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
