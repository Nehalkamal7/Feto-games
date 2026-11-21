'use client';

import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';
import { sound } from '@/lib/sound';

export interface LanguageToggleProps {
  className?: string;
  showIcon?: boolean;
}

export function LanguageToggle({ className = '', showIcon = true }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={() => {
        sound.playClick();
        toggleLanguage();
      }}
      className={`h-9 sm:h-10 px-3 inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-blue-500 hover:bg-blue-50/50 text-gray-800 transition-all active:scale-95 text-xs font-bold ${className}`}
      title={language === 'en' ? 'عربي' : 'English'}
      aria-label="Toggle language"
    >
      {showIcon && <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
      <span className="font-semibold tracking-wide">
        {language === 'en' ? 'عربي' : 'EN'}
      </span>
    </button>
  );
}
