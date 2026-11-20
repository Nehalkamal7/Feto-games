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
  Shield,
  Check,
  Sparkles
} from 'lucide-react';
import { PublicRoomState, VibeMode } from '@feto-games/shared-types';
import { sound } from '@/lib/sound';

export interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: PublicRoomState;
  isHost: boolean;
  onSave: (newSettings: {
    roomName: string;
    maxPlayers: number;
    roundDurationSeconds: number;
    totalRounds: number;
    vibeMode: VibeMode;
    isPrivate: boolean;
    pin?: string;
  }) => Promise<void>;
}

export function RoomSettingsModal({
  isOpen,
  onClose,
  room,
  isHost,
  onSave
}: RoomSettingsModalProps) {
  const [roomName, setRoomName] = useState(room.roomName || `Room ${room.code}`);
  const [maxPlayers, setMaxPlayers] = useState(room.config.maxPlayers || 15);
  const [roundTimer, setRoundTimer] = useState(room.config.roundDurationSeconds || 30);
  const [totalRounds, setTotalRounds] = useState(room.config.totalRounds || 3);
  const [vibeMode, setVibeMode] = useState<VibeMode>(room.config.vibeMode || 'chill');
  const [isPrivate, setIsPrivate] = useState(Boolean(room.config.isPrivate));
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when room config changes
  useEffect(() => {
    setRoomName(room.roomName || `Room ${room.code}`);
    setMaxPlayers(room.config.maxPlayers || 15);
    setRoundTimer(room.config.roundDurationSeconds || 30);
    setTotalRounds(room.config.totalRounds || 3);
    setVibeMode(room.config.vibeMode || 'chill');
    setIsPrivate(Boolean(room.config.isPrivate));
  }, [room]);

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
        pin: isPrivate && pin.trim() ? pin.trim() : undefined
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#131822] border border-[rgba(255,255,255,0.08)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0E131C]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                  <span>Room Settings</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 font-bold">
                    {room.code}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isHost ? 'Live adjustments instantly synced to all screens' : 'View match rules set by the host'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center transition-colors touch-manipulation"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* 1. Room Name */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                Room Name
              </label>
              <input
                type="text"
                disabled={!isHost}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={30}
                placeholder="Friday Night Party Hub"
                className="w-full bg-[#0B0E14] border border-[rgba(255,255,255,0.08)] focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-white outline-none transition-colors disabled:opacity-60"
              />
            </div>

            {/* 2. Vibe Mode (3 authentic choices) */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Vibe Mode</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'chill', label: 'Chill & Funny', icon: '😄' },
                  { id: 'chaotic', label: 'Silly & Chaotic', icon: '⚡' },
                  { id: 'sip_edition', label: 'Sip Edition 🥤', icon: '🥤' }
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
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all touch-manipulation min-h-[56px] ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-md ring-1 ring-cyan-400/50'
                          : 'border-[rgba(255,255,255,0.06)] bg-[#0B0E14] text-slate-400 hover:text-white hover:border-[rgba(255,255,255,0.14)]'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="text-sm font-emoji">{v.icon}</span>
                      <span className="text-[11px] font-bold mt-1 truncate">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Round Timer & Total Rounds */}
            <div className="grid grid-cols-2 gap-3">
              {/* Round Timer */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Timer (Seconds)</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[15, 30, 45, 60].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        sound.playClick();
                        setRoundTimer(sec);
                      }}
                      className={`py-2 rounded-lg border text-xs font-mono font-bold transition-all touch-manipulation ${
                        roundTimer === sec
                          ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-sm'
                          : 'border-[rgba(255,255,255,0.06)] bg-[#0B0E14] text-slate-400 hover:text-white'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds per Game */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  <span>Rounds per Game</span>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[1, 2, 3, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      disabled={!isHost}
                      onClick={() => {
                        sound.playClick();
                        setTotalRounds(r);
                      }}
                      className={`py-2 rounded-lg border text-xs font-mono font-bold transition-all touch-manipulation ${
                        totalRounds === r
                          ? 'border-purple-400 bg-purple-950/60 text-purple-300 shadow-sm'
                          : 'border-[rgba(255,255,255,0.06)] bg-[#0B0E14] text-slate-400 hover:text-white'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Max Players Capacity */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Player Limit (2–15)</span>
                </label>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {maxPlayers} Players Max
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[4, 6, 8, 12, 15].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    disabled={!isHost}
                    onClick={() => {
                      sound.playClick();
                      setMaxPlayers(cnt);
                    }}
                    className={`py-1.5 rounded-lg border text-xs font-mono font-bold transition-all touch-manipulation ${
                      maxPlayers === cnt
                        ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-sm'
                        : 'border-[rgba(255,255,255,0.06)] bg-[#0B0E14] text-slate-400 hover:text-white'
                    } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {cnt}p
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Public / Private Room & PIN Protection */}
            <div className="p-3.5 rounded-2xl bg-[#0B0E14] border border-[rgba(255,255,255,0.06)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPrivate ? (
                    <Lock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Globe className="w-4 h-4 text-cyan-400" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-white">
                      {isPrivate ? 'Private Room (PIN / Direct Link Only)' : 'Public Room (Visible in Quick Match)'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isPrivate
                        ? 'Strangers cannot auto-join via Quick Play'
                        : 'Open to quick matching party gamers'}
                    </div>
                  </div>
                </div>

                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setIsPrivate(!isPrivate);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all touch-manipulation ${
                      isPrivate
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {isPrivate ? 'Make Public' : 'Make Private'}
                  </button>
                )}
              </div>

              {isPrivate && isHost && (
                <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">
                    Optional 4-Digit Entry PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Leave empty for no PIN"
                    className="w-full bg-[#131822] border border-[rgba(255,255,255,0.08)] focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Host Action Buttons */}
            {isHost ? (
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md touch-manipulation disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save & Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-1">
                <p className="text-[11px] text-slate-500 italic">
                  Only the room host can modify these settings.
                </p>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
