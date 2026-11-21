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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] text-gray-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <span>Room Settings</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold">
                    {room.code}
                  </span>
                </h2>
                <p className="text-xs text-gray-500">
                  {isHost ? 'Live adjustments instantly synced to all screens' : 'View match rules set by the host'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* 1. Room Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Room Name
              </label>
              <input
                type="text"
                disabled={!isHost}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={30}
                placeholder="Friday Night Party Hub"
                className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-gray-900 outline-none transition-colors disabled:opacity-60"
              />
            </div>

            {/* 2. Vibe Mode */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
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
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[56px] ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                          : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className="text-sm">{v.icon}</span>
                      <span className="text-xs font-semibold mt-1 truncate">{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Round Timer & Total Rounds */}
            <div className="grid grid-cols-2 gap-3">
              {/* Round Timer */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
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
                      className={`py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                        roundTimer === sec
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Rounds per Game */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
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
                      className={`py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                        totalRounds === r
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
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
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-gray-600" />
                  <span>Player Limit (2–15)</span>
                </label>
                <span className="font-mono text-xs text-blue-600 font-bold">
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
                    className={`py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all ${
                      maxPlayers === cnt
                        ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    } ${!isHost ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {cnt}p
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Public / Private Room & PIN Protection */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPrivate ? (
                    <Lock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Globe className="w-4 h-4 text-blue-600" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-gray-900">
                      {isPrivate ? 'Private Room (PIN / Direct Link Only)' : 'Public Room (Visible in Directory)'}
                    </div>
                    <div className="text-[11px] text-gray-500 font-normal">
                      {isPrivate
                        ? 'Players require 4-digit PIN to enter'
                        : 'Open to quick matching players'}
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isPrivate
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {isPrivate ? 'Make Public' : 'Make Private'}
                  </button>
                )}
              </div>

              {isPrivate && isHost && (
                <div className="pt-2 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Optional 4-Digit Entry PIN
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Leave empty for no PIN"
                    className="w-full bg-white border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-gray-900 outline-none"
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
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Sync</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-1">
                <p className="text-xs text-gray-400 italic font-medium">
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
