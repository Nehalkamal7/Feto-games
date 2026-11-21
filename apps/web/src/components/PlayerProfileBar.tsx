'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { NeonAvatarDisplay } from './NeonAvatarDisplay';
import { Dices, Edit3, Check, Sparkles, Star, Zap } from 'lucide-react';
import { CREATIVE_NICKNAMES_POOL, PINNED_NICKNAMES, rollDynamicNicknames } from '@/lib/nicknames';
import { sound } from '@/lib/sound';
import { useLanguage } from '@/hooks/useLanguage';

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
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [tempName, setTempName] = useState(username);
  const [dynamicChips, setDynamicChips] = useState<string[]>(() =>
    CREATIVE_NICKNAMES_POOL.slice(0, 4)
  );
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    setDynamicChips(rollDynamicNicknames([], 4));
  }, []);

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
      <div className="inline-flex items-center gap-2.5 p-1.5 pr-3.5 rtl:pr-1.5 rtl:pl-3.5 rounded-2xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] hover:shadow-[3px_3px_0px_#010101] transition-all group">
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-2.5 touch-target text-start"
        >
          <NeonAvatarDisplay avatarId={avatar} size="sm" showGlow={false} />
          <div>
            <div className="text-[10px] font-black text-[#010101]/60 uppercase tracking-widest flex items-center gap-1">
              <span>{isAr ? 'الملف الشخصي' : 'PLAYER PROFILE'}</span>
              <Edit3 className="w-2.5 h-2.5 text-[#0B89FD] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xs sm:text-sm font-black text-[#010101] truncate max-w-[130px] sm:max-w-[180px]">
              {username || (isAr ? 'لاعب' : 'Player')}
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onRandomize();
          }}
          className="p-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#FEC90E] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[#010101] transition-all touch-manipulation"
          title={isAr ? 'اسم عشوائي' : 'Randomize Nickname'}
          aria-label={isAr ? 'اسم عشوائي' : 'Randomize Nickname'}
        >
          <Dices className="w-4 h-4" />
        </button>
      </div>

      {/* QUICK CUSTOMIZATION MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#FFFFFF] rounded-3xl p-5 sm:p-6 border-3 border-[#010101] shadow-[8px_8px_0px_#010101] relative max-h-[90dvh] overflow-y-auto text-[#010101]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FEC90E]" />
                  <h3 className="text-xl font-black text-[#010101]">
                    {isAr ? 'تخصيص الملف الشخصي' : 'Customize Profile'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-[#010101] hover:text-[#FD3F01] text-2xl font-black min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  &times;
                </button>
              </div>

              {/* Username Input & Randomizer */}
              <div className="space-y-2 mb-3">
                <label className="text-xs font-black uppercase tracking-wider text-[#010101] block">
                  {isAr ? 'اسم اللاعب' : 'Player Nickname'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={18}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder={isAr ? 'اكتب اسمك المستعار...' : 'Enter nickname...'}
                    className="flex-1 min-h-[46px] bg-[#F8F8F8] border-2 border-[#010101] focus:border-[#0B89FD] rounded-xl px-4 text-[#010101] font-bold text-sm outline-none"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleRollChips}
                    disabled={isRolling}
                    className="min-h-[46px] px-3.5 bg-[#FEC90E] hover:bg-[#fed338] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] rounded-xl text-[#010101] flex items-center justify-center gap-1.5 text-xs font-black touch-target"
                  >
                    <motion.div
                      animate={isRolling ? { rotate: [0, 360] } : { rotate: 0 }}
                      transition={{ duration: 0.45 }}
                    >
                      <Dices className="w-4 h-4 text-[#010101]" />
                    </motion.div>
                    <span>{isAr ? 'تدوير' : 'Roll'}</span>
                  </motion.button>
                </div>
              </div>

              {/* 8 Nickname Suggestion Chips */}
              <div className="mb-4 space-y-2 p-3 bg-[#F8F8F8] rounded-2xl border-2 border-[#010101]">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#010101]/70">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#0B89FD]" />
                    <span>
                      {isAr
                        ? 'ألقاب مقترحة (٤ مميزة + ٤ متغيرة)'
                        : 'Suggested Gamer Tags (4 Pinned + 4 Dynamic)'}
                    </span>
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
                        className={`h-8 px-2 rounded-xl text-xs font-black flex items-center justify-between gap-1 border-2 border-[#010101] transition-all ${
                          sel
                            ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                            : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <span className="text-[10px] text-[#010101]/60">#{i + 1}</span>
                          <span>{name}</span>
                        </span>
                        {sel ? (
                          <Check className="w-3 h-3 text-[#010101] flex-shrink-0" />
                        ) : (
                          <Star className="w-2.5 h-2.5 text-[#FEC90E] fill-[#FEC90E] flex-shrink-0" />
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
                        className={`h-8 px-2 rounded-xl text-xs font-black flex items-center justify-between gap-1 border-2 border-[#010101] transition-all ${
                          sel
                            ? 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                            : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-[#FEC90E] flex-shrink-0" />
                          <span>{name}</span>
                        </span>
                        {sel && (
                          <Check className="w-3 h-3 text-white flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Avatar Picker (16 Characters) */}
              <div className="mb-5">
                <label className="text-xs font-black uppercase tracking-wider text-[#010101] block mb-2">
                  {isAr ? 'اختر شخصيتك (١٦ شخصية)' : 'Choose Avatar (16 Characters)'}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((avId) => (
                    <button
                      key={avId}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onAvatarChange(avId);
                      }}
                      className={`p-1.5 rounded-xl border-2 border-[#010101] flex items-center justify-center transition-all touch-target ${
                        avatar === avId
                          ? 'bg-[#0B89FD] scale-105 shadow-[2px_2px_0px_#010101]'
                          : 'bg-[#FFFFFF] hover:bg-[#F8F8F8]'
                      }`}
                      title={NEON_AVATARS[avId].name}
                    >
                      <NeonAvatarDisplay avatarId={avId} size="sm" className="w-8 h-8" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleSave}
                className="w-full min-h-[48px] bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] py-3 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all touch-target"
              >
                <Check className="w-4 h-4" />
                <span>{isAr ? 'حفظ وتأكيد' : 'Confirm & Save'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
