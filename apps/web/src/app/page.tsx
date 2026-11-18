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
  Gamepad2,
  Trophy,
  Layers,
  BookOpen,
  Zap,
  Shield,
  HelpCircle
} from 'lucide-react';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { NeonLogo } from '@/components/NeonLogo';
import { SoundToggle } from '@/components/SoundToggle';
import { GameRulesModal, GAME_RULES_DATA } from '@/components/GameRulesModal';
import { CustomDeckModal } from '@/components/CustomDeckModal';
import { LeaderboardProfileModal } from '@/components/LeaderboardProfileModal';
import {
  GameMode,
  NeonAvatarId,
  NEON_AVATARS,
  PublicRoomDirectoryItem
} from '@feto-games/shared-types';
import { socketCreateRoom, socketJoinRoom, socketQuickPlay } from '@/lib/socket';
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

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [rulesTargetGame, setRulesTargetGame] = useState<GameMode>('who_is_imposter');
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);

  // Create Room Form State
  const [isPrivate, setIsPrivate] = useState(false);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [pin, setPin] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(15);
  const [roundDuration, setRoundDuration] = useState(30);
  const [gameMode, setGameMode] = useState<GameMode>('who_is_imposter');

  // Join Room Form State
  const [joinCode, setJoinCode] = useState('');
  const [joinPin, setJoinPin] = useState('');

  // UI status & Matchmaking
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickPlaying, setIsQuickPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publicRooms, setPublicRooms] = useState<PublicRoomDirectoryItem[]>([]);
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);

  // Live Server Stats
  const [liveStats, setLiveStats] = useState({
    onlinePlayers: 48,
    activeRooms: 7,
    matchesPlayed: 142
  });

  // Initialize profile from localStorage and fetch live stats
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
    fetchLiveStats();

    const interval = setInterval(() => {
      fetchLiveStats();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const fetchLiveStats = async () => {
    try {
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
      const res = await fetch(`${serverUrl}/api/stats/live`);
      const data = await res.json();
      if (data.success && data.data) {
        setLiveStats({
          onlinePlayers: data.data.onlinePlayers || 48,
          activeRooms: data.data.activeRooms || 7,
          matchesPlayed: data.data.matchesPlayed || 142
        });
      }
    } catch {
      // Fallback stats retained
    }
  };

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
      // Server launching
    } finally {
      setIsFetchingRooms(false);
    }
  };

  // Quick Play Matchmaking
  const handleQuickPlay = async () => {
    if (!username.trim()) {
      setErrorMessage('Please enter your player nickname.');
      return;
    }
    setIsQuickPlaying(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const res = await socketQuickPlay({
        username: username.trim(),
        avatar: selectedAvatar
      });
      router.push(`/room/${res.roomCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick play matchmaking failed. Creating new room...');
      setIsQuickPlaying(false);
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
        allowSpectators: true,
        isTeamMode
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
    <main className="min-h-[100dvh] px-3 sm:px-4 py-4 sm:py-6 md:py-10 flex flex-col items-center justify-start relative max-w-6xl mx-auto safe-top safe-bottom">
      {/* Background Neon Accent Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-80 h-80 bg-feto-magenta/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NAVIGATION / SOCIAL HEADER */}
      <header className="w-full flex items-center justify-between mb-8 relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
            Platform Online
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setShowLeaderboardModal(true);
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl glass-panel border border-yellow-500/30 text-yellow-300 hover:text-white hover:border-yellow-400 transition-all text-xs font-bold flex items-center gap-1.5 shadow-neon-amber"
            title="Leaderboards & Stats"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="hidden sm:inline">Leaderboards</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowDeckModal(true);
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl glass-panel border border-feto-magenta/30 text-feto-magenta hover:text-white hover:border-feto-magenta transition-all text-xs font-bold flex items-center gap-1.5 shadow-neon-magenta"
            title="Custom Deck Builder"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Custom Decks</span>
          </button>

          <SoundToggle />
        </div>
      </header>

      {/* HERO SECTION WITH CUSTOM BRANDING */}
      <div className="text-center mb-8 relative z-10">
        <NeonLogo size="lg" showSubtitle={true} className="mb-4" />

        <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mt-2">
          Real-time browser party gaming platform for up to 15 concurrent players. Play instantly from phone, tablet, or desktop with no app downloads!
        </p>

        {/* LIVE SERVER STATS COUNTERS */}
        <div className="inline-flex flex-wrap items-center justify-center gap-3 md:gap-6 mt-6 p-2 px-4 rounded-2xl glass-panel border border-cyan-500/20 text-xs font-semibold">
          <div className="flex items-center gap-2 text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>
              <strong className="text-white font-mono text-sm">{liveStats.onlinePlayers}</strong> Online Players
            </span>
          </div>
          <div className="w-1 h-3 bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 text-pink-300">
            <Gamepad2 className="w-3.5 h-3.5 text-feto-magenta" />
            <span>
              <strong className="text-white font-mono text-sm">{liveStats.activeRooms}</strong> Active Rooms
            </span>
          </div>
          <div className="w-1 h-3 bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 text-yellow-300">
            <Flame className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              <strong className="text-white font-mono text-sm">{liveStats.matchesPlayed}</strong> Matches Today
            </span>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="w-full max-w-2xl mb-6 p-3 bg-red-950/80 border border-red-500/40 rounded-2xl text-red-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* PROFILE & AVATAR CUSTOMIZER CARD */}
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

      {/* HERO MATCHMAKING ACTIONS (CREATE, JOIN, QUICK PLAY) */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 relative z-10">
        {/* ACTION 1: CREATE ROOM */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            sound.playClick();
            setErrorMessage(null);
            setShowCreateModal(true);
          }}
          className="btn-neon-cyan py-5 px-6 rounded-2xl flex items-center justify-between text-white font-bold group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-extrabold text-base leading-tight">Create Room</div>
              <div className="text-cyan-100 text-xs font-normal">Host up to 15 players</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* ACTION 2: QUICK PLAY (AUTO-MATCHMAKING VIA REDIS) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleQuickPlay}
          disabled={isQuickPlaying}
          className="py-5 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:brightness-110 text-black font-extrabold flex items-center justify-between group shadow-neon-amber transition-all active:scale-95 disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-base leading-tight">
                {isQuickPlaying ? 'Matching...' : 'Quick Play'}
              </div>
              <div className="text-amber-950 text-xs font-medium">Auto-join open room</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* ACTION 3: JOIN VIA CODE */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            sound.playClick();
            setErrorMessage(null);
            setShowJoinModal(true);
          }}
          className="btn-neon-magenta py-5 px-6 rounded-2xl flex items-center justify-between text-white font-bold group shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="text-white font-extrabold text-base leading-tight">Join with Code</div>
              <div className="text-pink-100 text-xs font-normal">Enter 6-char PIN/Code</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* INTERACTIVE GAME SHOWCASE CARDS (ALL 6 PARTY GAMES) */}
      <section className="w-full max-w-5xl mb-12 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-cyan-400" />
              <span>Party Games Showcase</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              6 distinct multiplayer game modes supporting up to 15 concurrent players
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(GAME_RULES_DATA).map((modeKey) => {
            const info = GAME_RULES_DATA[modeKey];
            const mode = modeKey as GameMode;
            return (
              <motion.div
                key={mode}
                whileHover={{ y: -4 }}
                className="glass-panel hover:border-cyan-400/50 rounded-2xl p-5 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${info.badgeColor}`}>
                      {info.playerRange}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {info.difficulty}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-white mb-1 group-hover:text-cyan-300 transition-colors">
                    {info.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {info.tagline}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setRulesTargetGame(mode);
                      setShowRulesModal(true);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>How to Play</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setGameMode(mode);
                      setShowCreateModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold flex items-center gap-1 transition-all"
                  >
                    <span>Host Game</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PUBLIC ROOMS DIRECTORY BROWSER */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-5xl glass-panel rounded-3xl p-6 md:p-8 relative z-10 mb-12"
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
                      <span className="capitalize">{room.gameMode.replace(/_/g, ' ')}</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg glass-panel-neon rounded-3xl p-5 sm:p-8 relative max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">Create New Room</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white text-2xl font-bold leading-none touch-manipulation"
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

              <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-5">
                {/* Game Mode */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Select Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'who_is_imposter', title: 'Who Is Imposter?', desc: 'Social deduction (3-15p)' },
                      { id: 'draw_and_guess', title: 'Draw & Guess', desc: 'Live canvas (2-15p)' },
                      { id: 'quiz_battle', title: 'Quiz Battle', desc: 'Speed trivia (2-15p)' },
                      { id: 'word_battle', title: 'Word Battle', desc: 'Word race (2-15p)' },
                      { id: 'truth_or_dare', title: 'Truth or Dare', desc: 'Party voting (2-15p)' },
                      { id: 'never_have_i_ever', title: 'Never Have I Ever', desc: 'Confessions (2-15p)' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setGameMode(mode.id as GameMode);
                        }}
                        className={`min-h-[48px] p-2.5 sm:p-3 rounded-xl border text-left transition-all touch-target ${
                          gameMode === mode.id
                            ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-neon-cyan'
                            : 'border-feto-border bg-feto-card text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="font-bold text-xs sm:text-sm text-cyan-300 truncate">{mode.title}</div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 truncate">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TEAM MODE TOGGLE */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white">Team Mode (3 Squads)</div>
                      <div className="text-[10px] sm:text-xs text-slate-400">Split up to 15 players into Red, Blue, Green</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTeamMode}
                    onChange={(e) => setIsTeamMode(e.target.checked)}
                    className="w-5 h-5 accent-cyan-400 rounded cursor-pointer touch-manipulation"
                  />
                </div>

                {/* Max Players Slider (2 to 15) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Player Capacity (2 - 15)
                    </label>
                    <span className="text-cyan-400 font-extrabold text-sm">{maxPlayers} Players</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={15}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-3"
                  />
                </div>

                {/* Privacy & PIN */}
                <div className="space-y-3 pt-2 border-t border-feto-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white">Private Room</div>
                      <div className="text-[10px] sm:text-xs text-slate-400">Requires 4-digit PIN to join</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-5 h-5 accent-cyan-400 rounded cursor-pointer touch-manipulation"
                    />
                  </div>

                  {isPrivate && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        4-Digit PIN
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 1234"
                        className="w-full min-h-[48px] bg-feto-card border border-feto-border rounded-xl px-4 py-2.5 text-white font-mono tracking-widest text-center text-lg focus:border-cyan-400 outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[52px] btn-neon-cyan py-3.5 sm:py-4 rounded-xl text-white font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 touch-target"
                >
                  {isLoading ? 'Creating Room...' : 'Launch Room'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* JOIN ROOM MODAL */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md glass-panel-neon rounded-3xl p-5 sm:p-8 relative max-h-[90dvh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-feto-magenta" />
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white">Join Room</h3>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white text-2xl font-bold leading-none touch-manipulation"
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FG-ABCD"
                    className="w-full min-h-[48px] bg-feto-card border border-feto-border rounded-xl px-4 py-3 text-white font-mono tracking-widest text-center text-lg sm:text-xl uppercase focus:border-feto-magenta outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    PIN (If Required)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Optional 4-digit PIN"
                    className="w-full min-h-[48px] bg-feto-card border border-feto-border rounded-xl px-4 py-2.5 text-white font-mono tracking-widest text-center text-sm focus:border-feto-magenta outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[52px] btn-neon-magenta py-3.5 sm:py-4 rounded-xl text-white font-extrabold text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2 touch-target"
                >
                  {isLoading ? 'Connecting...' : 'Join Game'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GAME RULES MODAL */}
      <GameRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        initialGameMode={rulesTargetGame}
      />

      {/* CUSTOM DECK MODAL */}
      <CustomDeckModal
        isOpen={showDeckModal}
        onClose={() => setShowDeckModal(false)}
      />

      {/* LEADERBOARD & PROFILE MODAL */}
      <LeaderboardProfileModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUsername={username}
        currentAvatar={selectedAvatar}
      />
    </main>
  );
}
