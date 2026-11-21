'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getTranslation, Language } from '@/lib/i18n';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dir: 'ltr' | 'rtl';
  isArabic: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('feto_lang') as Language;
      if (saved === 'ar' || saved === 'en') {
        setLanguageState(saved);
        document.documentElement.lang = saved;
        document.documentElement.dir = saved === 'ar' ? 'rtl' : 'ltr';
      }
    } catch {
      // Ignore localStorage read errors in private browsing/SSR
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('feto_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    } catch {
      // Ignore localStorage write errors
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return getTranslation(language, key, params);
    },
    [language]
  );

  const dir: 'ltr' | 'rtl' = language === 'ar' ? 'rtl' : 'ltr';
  const isArabic = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        dir,
        isArabic,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      dir: 'ltr',
      isArabic: false,
      t: (key: string, params?: Record<string, string | number>) => getTranslation('en', key, params)
    };
  }
  return ctx;
}
