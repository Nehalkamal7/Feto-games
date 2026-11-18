'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Sparkles,
  Lock,
  Globe,
  Play,
  Dice5,
  ShieldAlert,
  ArrowRight,
  Flame,
  Clock,
  Radio,
  Gamepad2
} from 'lucide-react';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import {
  GameMode,
  NeonAvatarId,
  NEON_AVATARS,
  PublicRoomDirectoryItem
} from '@feto-games/shared-types';
import { socketCreateRoom, socketJoinRoom } from '@/lib/socket';
import { sound } from '@/lib/sound';

const RANDOM_NAMES = [
  'CyberViper', 'NeonPulse', 'PixelGhost', 'LaserShadow', 'GlitchSurge',
  'QuantumFox', 'SolarFlare', 'AstroNova', 'HyperDrift', 'ZeroByte',
  'RetroMatrix', 'BlazeRider', 'SonicWave', 'VoltSpecter', 'VortexAce'
];

export default function HomePage() {
  const router = useRouter();

  // Player Profile State
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<NeonAvatarId>('cyber_cat');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create Room Form State
  const [isPrivate, setIsPrivate] = useState(false);
  const [pin, setPin] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(15);
  const [roundDuration, setRoundDuration] = useState(30);
  const [gameMode, setGameMode] = useState<GameMode>('party_trivia');

  // Join Room Form State
  const [joinCode, setJoinCode] = useState('');
  const [joinPin, setJoinPin] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoomDirectoryItem[]>([]);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);

  // Initialize profile from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('feto_username');
      const savedAvatar = localStorage.getItem('feto_avatar') as NeonAvatarId;
      if (savedUser) setUsername(savedUser);
      else randomizeName();

      if (savedAvatar && NEON_AVATARS[savedAvatar]) {
        setSelectedAvatar(savedAvatar);
      }
    }
    fetchPublicRooms();
  }, []);

  const randomizeName = () => {
    sound.playClick();
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const num = Math.floor(10 + Math.random() * 90);
    const generated = `${random}${num}`;
    setUsername(generated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_username', generated);
    }
  };

  const handleAvatarSelect = (id: NeonAvatarId) => {
    sound.playClick();
    setSelectedAvatar(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_avatar', id);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 18);
    setUsername(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_username', val);
    }
  };

  // Fetch active public rooms
  const fetchPublicRooms = async () => {
    setIsFetchingRooms(true);
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
      const res = await fetch(`${serverUrl}/api/rooms/public`);
      const data = await res.json();
      if (data.success) {
        setPublicRooms(data.data);
      }
    } catch {
      // Server might be launching
    } finally {
      setIsFetchingRooms(false);
    }
  };

  // Create Room Submission
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your player nickname.');
      return;
    }
    if (isPrivate && pin.trim().length !== 4) {
      setErrorMessage('Private rooms require a 4-digit numeric PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const res = await socketCreateRoom({
        username: username.trim(),
        avatar: selectedAvatar,
        maxPlayers,
        isPrivate,
        pin: isPrivate ? pin.trim() : undefined,
        gameMode,
        roundDurationSeconds: roundDuration,
        totalRounds: 5,
        allowSpectators: true
      });

      router.push(`/room/${res.roomCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create room.');
      setIsLoading(false);
    }
  };

  // Join Room Submission
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Please enter your player nickname.');
      return;
    }

    let code = joinCode.toUpperCase().trim();
    if (!code) {
      setErrorMessage('Please enter a 6-character room code.');
      return;
    }
    if (!code.startsWith('FG-') && code.length === 4) {
      code = `FG-${code}`;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const res = await socketJoinRoom({
        roomCode: code,
        username: username.trim(),
        avatar: selectedAvatar,
        pin: joinPin.trim() || undefined
      });

      router.push(`/room/${res.roomCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to join room.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:py-12 flex flex-col items-center justify-start relative max-w-6xl mx-auto">
      {/* Background Neon Accent Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-feto-magenta/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-4 shadow-neon-cyan">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Real-Time Multiplayer • Up to 15 Players</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-3">
          <span className="text-white">FETO </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 drop-shadow-sm">
            GAMES
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
          The ultimate browser party gaming platform. Jump in instantly from phone, tablet, or desktop with no downloads.
        </p>
      </motion.div>

      {/* Profile & Avatar Customizer Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-2xl glass-panel-neon rounded-3xl p-6 md:p-8 mb-8 relative z-10"
      >
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Active Avatar Large Preview */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <NeonAvatarDisplay avatarId={selectedAvatar} size="lg" showGlow />
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              {NEON_AVATARS[selectedAvatar].name}
            </span>
          </div>

          {/* Username & Avatar Selector */}
          <div className="flex-1 w-full space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Player Nickname
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="Enter your name..."
                  className="flex-1 bg-feto-card border border-feto-border focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-base font-medium outline-none transition-all focus:ring-2 focus:ring-cyan-500/20"
                />
                <button
                  type="button"
                  onClick={randomizeName}
                  title="Randomize Nickname"
                  className="px-4 py-3 bg-feto-card hover:bg-feto-cardHover border border-feto-border hover:border-cyan-400/50 rounded-xl text-slate-300 hover:text-cyan-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Dice5 className="w-5 h-5 text-cyan-400" />
                  <span className="hidden sm:inline">Random</span>
                </button>
              </div>
            </div>

            {/* Neon Avatars Grid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Choose Neon Avatar
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {(Object.keys(NEON_AVATARS) as NeonAvatarId[]).map((avatarKey) => (
                  <button
                    key={avatarKey}
                    type="button"
                    onClick={() => handleAvatarSelect(avatarKey)}
                    className={`relative p-1.5 rounded-xl border transition-all flex items-center justify-center ${
                      selectedAvatar === avatarKey
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-neon-cyan scale-105'
                        : 'border-feto-border bg-feto-card hover:border-slate-500 hover:scale-105'
                    }`}
                  >
                    <span className="text-2xl">{NEON_AVATARS[avatarKey].emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Action Buttons */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            sound.playClick();
            setErrorMessage(null);
            setShowCreateModal(true);
          }}
          className="btn-neon-cyan py-5 px-6 rounded-2xl flex items-center justify-between text-white font-bold text-lg group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-extrabold text-lg leading-tight">Create Room</div>
              <div className="text-cyan-100 text-xs font-normal">Host up to 15 players</div>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            sound.playClick();
            setErrorMessage(null);
            setShowJoinModal(true);
          }}
          className="btn-neon-magenta py-5 px-6 rounded-2xl flex items-center justify-between text-white font-bold text-lg group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-extrabold text-lg leading-tight">Join with Code</div>
              <div className="text-pink-100 text-xs font-normal">Enter 6-char Room Code</div>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* Public Rooms Directory Browser */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-4xl glass-panel rounded-3xl p-6 md:p-8 relative z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Live Public Rooms</h2>
          </div>
          <button
            onClick={fetchPublicRooms}
            disabled={isFetchingRooms}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
          >
            {isFetchingRooms ? 'Refreshing...' : 'Refresh List'}
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-base font-medium text-slate-400">No public rooms active right now.</p>
            <p className="text-xs text-slate-500">Create the first room and invite your friends!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicRooms.map((room) => (
              <div
                key={room.code}
                className="bg-feto-card border border-feto-border hover:border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center gap-3">
                  <NeonAvatarDisplay avatarId={room.hostAvatar as NeonAvatarId} size="sm" showGlow={false} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base">{room.code}</span>
                      {room.hasPin && (
                        <span title="PIN Protected">
                          <Lock className="w-3.5 h-3.5 text-yellow-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      Host: <span className="text-slate-200">{room.hostUsername}</span> •{' '}
                      <span className="capitalize">{room.gameMode.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-bold text-cyan-400">
                      {room.playerCount}/{room.maxPlayers}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{room.status}</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setJoinCode(room.code);
                      setShowJoinModal(true);
                    }}
                    className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs font-bold transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* CREATE ROOM MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg glass-panel-neon rounded-3xl p-6 md:p-8 relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-2xl font-extrabold text-white">Create New Room</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white text-2xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-5">
                {/* Game Mode */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'party_trivia', title: 'Party Trivia', desc: 'Speed trivia chaos' },
                      { id: 'secret_imposter', title: 'Secret Imposter', desc: 'Find the traitor' },
                      { id: 'bluff_master', title: 'Bluff Master', desc: 'Fool your friends' },
                      { id: 'speed_draw', title: 'Speed Draw', desc: 'Rapid sketch battles' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setGameMode(mode.id as GameMode);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          gameMode === mode.id
                            ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-neon-cyan'
                            : 'border-feto-border bg-feto-card text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="font-bold text-sm text-cyan-300">{mode.title}</div>
                        <div className="text-[11px] text-slate-400">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Max Players Slider (2 to 15) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Player Capacity
                    </label>
                    <span className="text-sm font-bold text-cyan-400">{maxPlayers} Players</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-feto-card rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>2 (Duo)</span>
                    <span>8 (Squad)</span>
                    <span>15 (Max Party)</span>
                  </div>
                </div>

                {/* Round Duration */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Round Timer
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((seconds) => (
                      <button
                        key={seconds}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setRoundDuration(seconds);
                        }}
                        className={`py-2 rounded-xl border text-center text-xs font-bold transition-all ${
                          roundDuration === seconds
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-neon-cyan'
                            : 'border-feto-border bg-feto-card text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {seconds}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy & Optional PIN */}
                <div className="p-4 bg-feto-card rounded-2xl border border-feto-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-yellow-400" />
                        <span>Private Room</span>
                      </div>
                      <div className="text-xs text-slate-400">Hidden from public room directory</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setIsPrivate(!isPrivate);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                        isPrivate ? 'bg-cyan-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          isPrivate ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {isPrivate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2"
                    >
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        4-Digit Room PIN (Optional)
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 1234"
                        className="w-full bg-[#0a0b14] border border-feto-border focus:border-yellow-400 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-white outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-neon-cyan py-4 rounded-2xl text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>Creating Room...</span>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white" />
                      <span>Launch Lobby</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOIN ROOM MODAL */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md glass-panel-neon rounded-3xl p-6 md:p-8 relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-feto-magenta" />
                  <h3 className="text-2xl font-extrabold text-white">Join Room</h3>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-slate-400 hover:text-white text-2xl font-bold leading-none"
                >
                  &times;
                </button>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FG-8492"
                    className="w-full bg-feto-card border border-feto-border focus:border-feto-magenta rounded-xl px-4 py-3.5 text-center text-xl font-black uppercase tracking-widest text-white outline-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 text-center">
                    Enter the 6-character room code provided by the host.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    4-Digit PIN (If required)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-feto-card border border-feto-border focus:border-yellow-400 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-neon-magenta py-4 rounded-2xl text-white font-extrabold text-base tracking-wide flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? <span>Connecting...</span> : <span>Join Lobby</span>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
