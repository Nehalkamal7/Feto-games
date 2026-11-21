'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, Users, Zap, Check } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { sound } from '@/lib/sound';
import { useLanguage } from '@/hooks/useLanguage';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl relative max-h-[90dvh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-4 right-4 rtl:right-auto rtl:left-4 sm:top-6 sm:right-6 rtl:sm:right-auto rtl:sm:left-6 w-9 h-9 inline-flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>

          {/* Modal Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <BrandLogo size="md" showSubtitle={false} className="mb-3" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {t('about.title')}
            </h2>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed max-w-md">
              {t('about.desc')}
            </p>
          </div>

          {/* 3 Clean Feature Highlights */}
          <div className="space-y-3 mb-6">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-start">
                <h3 className="text-sm font-semibold text-gray-900">{t('about.feature1Title')}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {t('about.feature1Desc')}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-start">
                <h3 className="text-sm font-semibold text-gray-900">{t('about.feature2Title')}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {t('about.feature2Desc')}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 text-start">
                <h3 className="text-sm font-semibold text-gray-900">{t('about.feature3Title')}</h3>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {t('about.feature3Desc')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{t('about.gotItBtn')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
