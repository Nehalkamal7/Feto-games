'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  X,
  Lock,
  Globe,
  Clock,
  RotateCcw,
  Users,
  Flame,
  Check,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { PublicRoomState, VibeMode } from '@feto-games/shared-types';
import { sound } from '@/lib/sound';
import { useLanguage } from '@/hooks/useLanguage';

export interface RoomSettingsPayload {
  roomName: string;
  maxPlayers: number;
  roundDurationSeconds: number;
  totalRounds: number;
  vibeMode: VibeMode;
  isPrivate: boolean;
  pin?: string;
  isTeamMode?: boolean;
  isSoloDevMode?: boolean;
}

export interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: PublicRoomState;
  isHost: boolean;
  isStreamerMode?: boolean;
  onToggleStreamerMode?: () => void;
  onSave: (newSettings: RoomSettingsPayload) => Promise<void>;
}

export function RoomSettingsModal({
  isOpen,
  onClose,
  room,
  isHost,
  isStreamerMode = false,
  onToggleStreamerMode,
  onSave
}: RoomSettingsModalProps) {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const [roomName, setRoomName] = useState(
    room.roomName || room.config.roomName || `Room ${room.code}`
  );
  const [maxPlayers, setMaxPlayers] = useState(room.config.maxPlayers || 15);
  const [roundTimer, setRoundTimer] = useState(room.config.roundDurationSeconds || 30);
  const [totalRounds, setTotalRounds] = useState(room.config.totalRounds || 5);
  const [vibeMode, setVibeMode] = useState<VibeMode>(room.config.vibeMode || 'chill');
  const [isPrivate, setIsPrivate] = useState(Boolean(room.config.isPrivate));
  const [isTeamMode, setIsTeamMode] = useState(Boolean(room.config.isTeamMode));
  const [isSoloDevMode, setIsSoloDevMode] = useState(
    Boolean((room.config as any)?.isSoloDevMode)
  );
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  useEffect(() => {
    setRoomName(room.roomName || room.config.roomName || `Room ${room.code}`);
    setMaxPlayers(room.config.maxPlayers || 15);
    setRoundTimer(room.config.roundDurationSeconds || 30);
    setTotalRounds(room.config.totalRounds || 5);
    setVibeMode(room.config.vibeMode || 'chill');
    setIsPrivate(Boolean(room.config.isPrivate));
    setIsTeamMode(Boolean(room.config.isTeamMode));
    setIsSoloDevMode(Boolean((room.config as any)?.isSoloDevMode));
  }, [room, isOpen]);

  useEffect(() => {
    return sound.subscribe((muted) => setIsMuted(muted));
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHost || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        roomName: roomName.trim() || `Room ${room.code}`,
        maxPlayers,
        roundDurationSeconds: roundTimer,
        totalRounds,
        vibeMode,
        isPrivate,
        pin: isPrivate && pin.trim() ? pin.trim() : undefined,
        isTeamMode,
        isSoloDevMode
      });
      sound.playClick();
      onClose();
    } catch {
      // handled by parent toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            sound.playClick();
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col max-h-[85dvh] text-[#111827] overflow-hidden"
        >
          {/* Fixed Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#111827] tracking-tight truncate">
                    {isArabic ? 'إعدادات الغرفة' : 'Room Settings'}
                  </h2>
                  <span
                    dir="ltr"
                    className="font-mono text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold force-ltr shrink-0"
                  >
                    {room.code}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {isHost
                    ? (isArabic ? 'التعديلات تتزامن فوراً مع كل اللاعبين' : 'Changes sync live to everyone in the room')
                    : (isArabic ? 'قواعد الغرفة الحالية (للعرض فقط)' : 'Current room rules (read-only)')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
              aria-label={isArabic ? 'إغلاق' : 'Close settings'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Settings Body */}
          <form
            id="room-settings-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto p-5 space-y-5"
          >
            {/* 1. Room Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                {isArabic ? 'اسم الغرفة' : 'Room Name'}
              </label>
              <input
                type="text"
                disabled={!isHost}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={30}
                placeholder={isArabic ? 'سهرة صحاب رايقة' : 'Friday Night Party'}
                className="w-full h-11 bg-[#F9FAFB] border border-gray-200 focus:bg-white focus:border-[#2563EB] rounded-xl px-3.5 text-sm font-medium text-[#111827] outline-none transition-colors disabled:opacity-70 disabled:cursor-default"
              />
            </div>

            {/* 2. Max Players (2-15) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isArabic ? 'أقصى عدد لاعبين (2–15)' : 'Max Players (2–15)'}</span>
                </label>
                <span className="font-mono text-xs font-bold text-[#2563EB] tabular-nums force-ltr">
                  {maxPlayers} / 15
                </span>
              </div>

              {isHost && (
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full accent-[#2563EB] h-2 bg-gray-200 rounded-lg cursor-pointer mb-2.5"
                />
              )}

              <div className="grid grid-cols-6 gap-1.5">
                {[2, 4, 6, 8, 12, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      sound.playClick();
                      setMaxPlayers(cnt);
                    }}
                    className={`h-9 rounded-xl border text-xs font-mono font-semibold tabular-nums transition-all force-ltr ${
                      maxPlayers === cnt
                        ? 'border-[#2563EB] bg-[#2563EB] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    } ${!isHost ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Round Timer & Rounds per Game */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Round Timer */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>{isArabic ? 'مؤقت الجولة' : 'Round Timer'}</span>
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-4 gap-1.5">
                  {[15, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        sound.playClick();
                        setRoundTimer(sec);
                      }}
                      className={`h-9 rounded-xl border text-xs font-mono font-semibold tabular-nums transition-all force-ltr ${
                        roundTimer === sec
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      } ${!isHost ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds per Game */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isArabic ? 'عدد الجولات لكل لعبة' : 'Rounds per Game'}</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 3, 5, 7].map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        sound.playClick();
                        setTotalRounds(r);
                      }}
                      className={`h-9 rounded-xl border text-xs font-mono font-semibold tabular-nums transition-all force-ltr ${
                        totalRounds === r
                          ? 'border-[#2563EB] bg-[#2563EB] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      } ${!isHost ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Vibe Mode */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{isArabic ? 'مود القعدة' : 'Vibe Mode'}</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'chill', label: isArabic ? 'رايق وضحك' : 'Chill', icon: '😄' },
                  { id: 'chaotic', label: isArabic ? 'جنون وحماس' : 'Chaotic', icon: '⚡' },
                  { id: 'sip_edition', label: isArabic ? 'رشفات' : 'Sip Edition', icon: '🥤' }
                ].map((v) => {
                  const isSelected = vibeMode === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        sound.playClick();
                        setVibeMode(v.id as VibeMode);
                      }}
                      className={`p-3 rounded-xl border text-start flex flex-col justify-between transition-all min-h-[60px] ${
                        isSelected
                          ? 'border-[#2563EB] bg-blue-50 text-blue-900 ring-1 ring-[#2563EB]/20'
                          : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                      } ${!isHost ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                    >
                      <span className="text-base leading-none">{v.icon}</span>
                      <span className="text-xs font-semibold mt-1.5 truncate">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Public / Private Visibility & PIN */}
            <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-gray-200 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isPrivate ? (
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <Globe className="w-4 h-4 text-[#2563EB] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#111827] truncate">
                      {isPrivate
                        ? (isArabic ? 'غرفة خاصة' : 'Private Room')
                        : (isArabic ? 'غرفة عامة' : 'Public Room')}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {isPrivate
                        ? (isArabic ? 'الدخول بالرابط أو الكود فقط' : 'Direct code or invite link only')
                        : (isArabic ? 'ظاهرة في قائمة الغرف العامة' : 'Visible in public lobby directory')}
                    </div>
                  </div>
                </div>

                {isHost ? (
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-gray-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsPrivate(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        !isPrivate ? 'bg-[#2563EB] text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {isArabic ? 'عامة' : 'Public'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsPrivate(true);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        isPrivate ? 'bg-[#2563EB] text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {isArabic ? 'خاصة' : 'Private'}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-gray-600 shrink-0">
                    {isPrivate
                      ? (isArabic ? 'خاصة' : 'Private')
                      : (isArabic ? 'عامة' : 'Public')}
                  </span>
                )}
              </div>

              {isPrivate && isHost && (
                <div className="pt-2.5 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {isArabic ? 'رمز PIN اختياري (4 أرقام)' : 'Optional 4-Digit PIN'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={
                      room.config.hasPin
                        ? (isArabic ? 'مفعل — اكتب رمزاً جديداً للتغيير' : 'PIN active — type new 4 digits to change')
                        : (isArabic ? 'اتركه فارغاً بدون PIN' : 'Leave empty for no PIN')
                    }
                    className="w-full h-10 bg-white border border-gray-200 focus:border-[#2563EB] rounded-xl px-3 text-xs font-mono font-bold text-[#111827] outline-none force-ltr"
                  />
                </div>
              )}
            </div>

            {/* 6. Match Mode (Solo vs Teams) & Extra Options */}
            <div className="space-y-2.5">
              {/* Solo vs Teams */}
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Shield className="w-4 h-4 text-gray-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#111827]">
                      {isArabic ? 'نظام اللعب' : 'Match Mode'}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {isTeamMode
                        ? (isArabic ? 'الفريق الأزرق ضد الأحمر' : 'Blue Squad vs Red Squad')
                        : (isArabic ? 'كل لاعب لنفسه (فردي)' : 'Free-for-All individual points')}
                    </div>
                  </div>
                </div>
                {isHost ? (
                  <div className="flex items-center bg-white p-0.5 rounded-lg border border-gray-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsTeamMode(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        !isTeamMode ? 'bg-[#2563EB] text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {isArabic ? 'فردي' : 'Solo'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsTeamMode(true);
                      }}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                        isTeamMode ? 'bg-[#2563EB] text-white' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {isArabic ? 'فرق' : 'Teams'}
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-gray-600 shrink-0">
                    {isTeamMode ? (isArabic ? 'فرق' : 'Teams') : (isArabic ? 'فردي' : 'Solo')}
                  </span>
                )}
              </div>

              {/* Solo Test Mode (Host Only) */}
              {isHost && (
                <label className="p-3.5 rounded-xl bg-[#F9FAFB] border border-gray-200 flex items-center justify-between gap-3 cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#111827]">
                        {isArabic ? 'وضع التجربة الفردية' : 'Solo Test Mode'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isArabic ? 'السماح ببدء اللعبة بلاعب واحد للتجربة' : 'Allow starting a game with 1 player'}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSoloDevMode}
                    onChange={(e) => {
                      sound.playClick();
                      setIsSoloDevMode(e.target.checked);
                    }}
                    className="w-4 h-4 accent-[#2563EB] rounded cursor-pointer shrink-0"
                  />
                </label>
              )}

              {/* Local Preferences: Sound & Streamer Mode */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = sound.toggleMute();
                    setIsMuted(next);
                  }}
                  className="h-10 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#2563EB]" />
                  )}
                  <span>
                    {isMuted
                      ? (isArabic ? 'الصوت: مكتوم' : 'Sound: Off')
                      : (isArabic ? 'الصوت: مفعل' : 'Sound: On')}
                  </span>
                </button>

                {onToggleStreamerMode && (
                  <button
                    type="button"
                    onClick={onToggleStreamerMode}
                    className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      isStreamerMode
                        ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {isStreamerMode ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                    <span className="truncate">
                      {isStreamerMode
                        ? (isArabic ? 'إخفاء الكود: مفعل' : 'Hide Code: On')
                        : (isArabic ? 'وضع البث' : 'Streamer Mode')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Fixed Modal Footer */}
          <div className="px-5 py-3.5 border-t border-gray-100 bg-white shrink-0 flex items-center justify-end gap-2.5">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  form="room-settings-form"
                  disabled={isSaving}
                  className="h-10 px-5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>{isArabic ? 'جاري الحفظ...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{isArabic ? 'حفظ التغييرات' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  {isArabic
                    ? 'المضيف فقط يستطيع تعديل الإعدادات'
                    : 'Only the host can edit room settings'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  className="h-10 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-semibold transition-colors shrink-0"
                >
                  {isArabic ? 'إغلاق' : 'Close'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
