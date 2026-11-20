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
  Check
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#010101]/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#FFFFFF] border-3 border-[#010101] rounded-3xl shadow-[8px_8px_0px_#010101] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#010101] bg-[#F8F8F8]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0B89FD] text-white border-2 border-[#010101] flex items-center justify-center shadow-[2px_2px_0px_#010101]">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-[#010101] tracking-wide flex items-center gap-2">
                  <span>Room Settings</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#FEC90E] border-2 border-[#010101] text-[#010101] font-black">
                    {room.code}
                  </span>
                </h2>
                <p className="text-[11px] text-[#010101]/70 font-medium">
                  {isHost ? 'Live adjustments instantly synced to all screens' : 'View match rules set by the host'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[#010101] flex items-center justify-center transition-colors touch-manipulation font-black"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* 1. Room Name */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#010101] mb-1.5">
                Room Name
              </label>
              <input
                type="text"
                disabled={!isHost}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={30}
                placeholder="Friday Night Party Hub"
                className="w-full bg-[#F8F8F8] border-2 border-[#010101] focus:border-[#0B89FD] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold text-[#010101] outline-none transition-colors disabled:opacity-60"
              />
            </div>

            {/* 2. Vibe Mode (3 authentic choices) */}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-[#010101] mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#FD3F01]" />
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
                      className={`p-2.5 rounded-xl border-2 border-[#010101] text-left flex flex-col justify-between transition-all touch-manipulation min-h-[56px] ${
                        isSelected
                          ? 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                          : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="text-sm font-emoji">{v.icon}</span>
                      <span className="text-[11px] font-black mt-1 truncate">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Round Timer & Total Rounds */}
            <div className="grid grid-cols-2 gap-3">
              {/* Round Timer */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#010101] mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0B89FD]" />
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
                      className={`py-2 rounded-xl border-2 border-[#010101] text-xs font-mono font-black transition-all touch-manipulation ${
                        roundTimer === sec
                          ? 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                          : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds per Game */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-[#010101] mb-1.5 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-[#FEC90E]" />
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
                      className={`py-2 rounded-xl border-2 border-[#010101] text-xs font-mono font-black transition-all touch-manipulation ${
                        totalRounds === r
                          ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                          : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
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
                <label className="text-[11px] font-black uppercase tracking-wider text-[#010101] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#010101]" />
                  <span>Player Limit (2–15)</span>
                </label>
                <span className="font-mono text-xs text-[#0B89FD] font-black">
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
                    className={`py-1.5 rounded-xl border-2 border-[#010101] text-xs font-mono font-black transition-all touch-manipulation ${
                      maxPlayers === cnt
                        ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                        : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                    } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {cnt}p
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Public / Private Room & PIN Protection */}
            <div className="p-3.5 rounded-2xl bg-[#F8F8F8] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPrivate ? (
                    <Lock className="w-4 h-4 text-[#FD3F01]" />
                  ) : (
                    <Globe className="w-4 h-4 text-[#0B89FD]" />
                  )}
                  <div>
                    <div className="text-xs font-black text-[#010101]">
                      {isPrivate ? 'Private Room (PIN / Direct Link Only)' : 'Public Room (Visible in Quick Match)'}
                    </div>
                    <div className="text-[10px] text-[#010101]/70 font-medium">
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all touch-manipulation border-2 border-[#010101] ${
                      isPrivate
                        ? 'bg-[#FD3F01] text-white shadow-[2px_2px_0px_#010101]'
                        : 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                    }`}
                  >
                    {isPrivate ? 'Make Public' : 'Make Private'}
                  </button>
                )}
              </div>

              {isPrivate && isHost && (
                <div className="pt-2 border-t-2 border-[#010101]/10">
                  <label className="block text-[10px] font-black text-[#010101] uppercase mb-1">
                    Optional 4-Digit Entry PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Leave empty for no PIN"
                    className="w-full bg-[#FFFFFF] border-2 border-[#010101] focus:border-[#FEC90E] rounded-xl px-3 py-2 text-xs font-mono font-black text-[#010101] outline-none"
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
                  className="px-4 py-2.5 rounded-xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101] bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#010101] text-xs font-black transition-all touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-[#0B89FD] hover:bg-[#0977db] text-white text-xs font-black flex items-center gap-1.5 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all touch-manipulation disabled:opacity-50"
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
                <p className="text-[11px] text-[#010101]/60 italic font-medium">
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
