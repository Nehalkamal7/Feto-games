'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  Dices,
  Play,
  Lock,
  ShieldAlert,
  ArrowRight,
  Star,
  Zap,
  Check
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { cleanRoomCode, getReconnectToken, socketJoinRoom } from '@/lib/socket';
import { CREATIVE_NICKNAMES_POOL, PINNED_NICKNAMES, rollDynamicNicknames } from '@/lib/nicknames';
import { sound } from '@/lib/sound';

export default function FastJoinPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = cleanRoomCode((params?.code as string) || '');

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<NeonAvatarId>('cyber_cat');
  const [pin, setPin] = useState('');
  const [hasPinInput, setHasPinInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Deterministic initial slice for SSR hydration safety; randomized client-side after mount
  const [dynamicChips, setDynamicChips] = useState<string[]>(() =>
    CREATIVE_NICKNAMES_POOL.slice(0, 4)
  );
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    setDynamicChips(rollDynamicNicknames([], 4));
  }, []);

  // Auto-fill from localStorage or default to pinned
  useEffect(() => {
    if (!roomCode) return;

    // If player already has active reconnect token for this room, jump straight in
    const existingToken = getReconnectToken(roomCode);
    if (existingToken) {
      router.push(`/room/${roomCode}`);
      return;
    }

    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('feto_username');
      const savedAvatar = localStorage.getItem('feto_avatar') as NeonAvatarId;

      if (savedUser) {
        setUsername(savedUser);
      } else {
        const defaultName = PINNED_NICKNAMES[0];
        setUsername(defaultName);
        localStorage.setItem('feto_username', defaultName);
      }

      if (savedAvatar && NEON_AVATARS[savedAvatar]) {
        setAvatar(savedAvatar);
      } else {
        const avatars = Object.keys(NEON_AVATARS) as NeonAvatarId[];
        const randomAv = avatars[Math.floor(Math.random() * avatars.length)];
        setAvatar(randomAv);
      }
    }
  }, [roomCode, router]);

  const handleRollNicknames = () => {
    sound.playClick();
    sound.triggerHaptic(35);
    setIsRolling(true);

    const fresh = rollDynamicNicknames(dynamicChips, 4);
    setDynamicChips(fresh);
    const chosen = fresh[0];
    setUsername(chosen);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_username', chosen);
    }

    setTimeout(() => {
      setIsRolling(false);
    }, 450);
  };

  const handleSelectChip = (name: string) => {
    sound.playClick();
    sound.triggerHaptic(25);
    setUsername(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_username', name);
    }
  };

  const isChipSelected = (name: string) => {
    return username.trim().toLowerCase() === name.toLowerCase();
  };

  const handleAvatarSelect = (id: NeonAvatarId) => {
    sound.playClick();
    setAvatar(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_avatar', id);
    }
  };

  const handleFastJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please pick or enter a nickname.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sound.playClick();
    sound.triggerHaptic(40);

    try {
      await socketJoinRoom({
        roomCode,
        username: username.trim(),
        avatar,
        pin: pin.trim() || undefined
      });

      router.push(`/room/${roomCode}`);
    } catch (err: any) {
      const msg = err.message || 'Failed to enter party room.';
      if (msg.toLowerCase().includes('pin')) {
        setHasPinInput(true);
      }
      setErrorMessage(msg);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#090D16] text-slate-100 flex flex-col items-center justify-center px-4 py-6 relative safe-top safe-bottom">
      {/* Background Neon Glows */}
      <div className="fixed top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="w-full max-w-lg glass-panel-neon rounded-3xl p-6 sm:p-8 border-2 border-cyan-500/40 shadow-neon-cyan relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <BrandLogo size="lg" showSubtitle={false} className="mb-2" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-black uppercase tracking-widest text-cyan-300 mt-2 shadow-neon-cyan">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Party Invite Detected</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Joining Room:</span>
            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-mono tracking-widest">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2 shadow-neon-magenta"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fast Entry Form */}
        <form onSubmit={handleFastJoin} className="space-y-4 sm:space-y-5">
          {/* Nickname Input with Working Roll (Dices) Button */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Your Player Nickname
            </label>
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                maxLength={18}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter nickname..."
                required
                className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none transition-all focus:shadow-[0_0_15px_rgba(56,242,255,0.3)]"
              />
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleRollNicknames}
                disabled={isRolling}
                title="Roll fresh gamer tags"
                className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-feto-purple hover:from-cyan-400 hover:to-purple-500 rounded-xl text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-neon-cyan border border-cyan-300/40 touch-target flex-shrink-0"
              >
                <motion.div
                  animate={isRolling ? { rotate: [0, 360] } : { rotate: 0 }}
                  transition={{ duration: 0.45 }}
                >
                  <Dices className="w-4 h-4 text-cyan-200" />
                </motion.div>
                <span>Roll</span>
              </motion.button>
            </div>
          </div>

          {/* 8 Nickname Suggestion Chips (4 Pinned First + 4 Dynamic) */}
          <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Suggested Gamer Tags</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono">4 Pinned • 4 Dynamic</span>
            </div>

            {/* 4 Pinned Chips (Slots 1-4) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PINNED_NICKNAMES.map((name, i) => {
                const sel = isChipSelected(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => handleSelectChip(name)}
                    className={`h-8 px-2 rounded-xl text-xs font-black flex items-center justify-between gap-1 border transition-all ${
                      sel
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-[1.02]'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-amber-400/50'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <span className="text-[10px] text-amber-400">#{i + 1}</span>
                      <span>{name}</span>
                    </span>
                    {sel ? (
                      <Check className="w-3 h-3 text-amber-300 flex-shrink-0" />
                    ) : (
                      <Star className="w-2.5 h-2.5 text-amber-400/40 fill-amber-400/20 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 4 Dynamic Chips (Slots 5-8) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {dynamicChips.map((name, i) => {
                const sel = isChipSelected(name);
                return (
                  <button
                    key={`${name}-${i}`}
                    type="button"
                    onClick={() => handleSelectChip(name)}
                    className={`h-8 px-2 rounded-xl text-xs font-black flex items-center justify-between gap-1 border transition-all ${
                      sel
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(56,242,255,0.4)] scale-[1.02]'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-cyan-400/50'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-cyan-400/60 flex-shrink-0" />
                      <span>{name}</span>
                    </span>
                    {sel && (
                      <Check className="w-3 h-3 text-cyan-300 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar Selector Grid */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Choose Neon Avatar
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((id) => {
                const isSelected = avatar === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleAvatarSelect(id)}
                    className={`p-1 rounded-xl border flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/80 scale-105 shadow-neon-cyan ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                    }`}
                    title={NEON_AVATARS[id].name}
                  >
                    <NeonAvatarDisplay avatarId={id} size="sm" showGlow={isSelected} className="w-8 h-8 text-base" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional PIN if protected */}
          {(hasPinInput || errorMessage?.toLowerCase().includes('pin')) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-2"
            >
              <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Room PIN Required</span>
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4-digit PIN"
                className="w-full bg-slate-900/90 border border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest font-mono font-bold outline-none"
              />
            </motion.div>
          )}

          {/* Submit Action */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-feto-purple hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-black text-sm uppercase tracking-widest shadow-neon-cyan flex items-center justify-center gap-2 group transition-all cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950 group-hover:scale-110 transition-transform" />
                <span>Enter Party Room</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </main>
  );
}
