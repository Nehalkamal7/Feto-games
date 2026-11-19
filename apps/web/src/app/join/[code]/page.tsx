'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  Dice5,
  Play,
  Lock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { NeonAvatarId, NEON_AVATARS } from '@feto-games/shared-types';
import { getReconnectToken, socketJoinRoom } from '@/lib/socket';
import { sound } from '@/lib/sound';

const RANDOM_NAMES = [
  'NeonSpecter', 'CyberFox', 'AstroVibe', 'HyperGlitch', 'VoltStriker',
  'DebraGamer', 'ZeroByte', 'TurboRider', 'BlazeAce', 'SonicWave',
  'PulsePhantom', 'PixelChamp', 'ArcadeLegend', 'ChaosNova', 'QuantumDrift'
];

export default function FastJoinPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = ((params?.code as string) || '').toUpperCase().trim();

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<NeonAvatarId>('cyber_cat');
  const [pin, setPin] = useState('');
  const [hasPinInput, setHasPinInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-fill from localStorage or randomize
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
        const rand = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
        const num = Math.floor(10 + Math.random() * 90);
        const name = `${rand}${num}`;
        setUsername(name);
        localStorage.setItem('feto_username', name);
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

  const handleRandomizeName = () => {
    sound.playClick();
    const rand = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(10 + Math.random() * 90);
    const generated = `${rand}${num}`;
    setUsername(generated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_username', generated);
    }
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

      <div className="w-full max-w-md glass-panel-neon rounded-3xl p-6 sm:p-8 border-2 border-cyan-500/40 shadow-neon-cyan relative z-10">
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
          {/* Nickname Input with Dice Randomizer */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Your Player Nickname
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                maxLength={18}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter nickname..."
                required
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm font-bold outline-none pr-12 transition-all"
              />
              <button
                type="button"
                onClick={handleRandomizeName}
                title="Randomize Nickname"
                className="absolute right-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white transition-all"
              >
                <Dice5 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Avatar Selector Grid */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
              Choose Neon Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((id) => {
                const isSelected = avatar === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleAvatarSelect(id)}
                    className={`p-1.5 rounded-xl border flex items-center justify-center text-xl sm:text-2xl transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/60 scale-110 shadow-neon-cyan'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                    }`}
                  >
                    {NEON_AVATARS[id].emoji}
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
                placeholder="4-digit PIN..."
                className="w-full bg-slate-900 border border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-white outline-none"
              />
            </motion.div>
          )}

          {/* Instant Join Button */}
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 hover:brightness-110 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-cyan transition-all active:scale-95 disabled:opacity-50 touch-target mt-4"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Entering Room...</span>
              </div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>JOIN PARTY NOW ▶</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-500">
            No signup or download required • 100% Free instant multiplayer
          </p>
        </div>
      </div>
    </main>
  );
}
