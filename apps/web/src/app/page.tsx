'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Hash,
  Share2
} from 'lucide-react';
import { TopNavbar } from '@/components/TopNavbar';
import { HeroIllustration } from '@/components/HeroIllustration';
import { PlayerOnboardingCard } from '@/components/PlayerOnboardingCard';
import { PopularGamesGrid } from '@/components/PopularGamesGrid';
import { AboutModal } from '@/components/AboutModal';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { GameRulesModal, GAME_RULES_DATA } from '@/components/GameRulesModal';
import { CustomDeckModal } from '@/components/CustomDeckModal';
import { LeaderboardProfileModal } from '@/components/LeaderboardProfileModal';
import {
  GameMode,
  NeonAvatarId,
  NEON_AVATARS,
  PublicRoomDirectoryItem,
  VibeMode
} from '@feto-games/shared-types';
import { socketCreateRoom, socketJoinRoom, socketQuickPlay, BACKEND_URL } from '@/lib/socket';
import { PINNED_NICKNAMES, rollDynamicNicknames } from '@/lib/nicknames';
import { sound } from '@/lib/sound';

export default function HomePage() {
  const router = useRouter();
  const gamesGridRef = useRef<HTMLDivElement>(null);

  // Player Profile State
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<NeonAvatarId>('cyber_cat');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [rulesTargetGame, setRulesTargetGame] = useState<GameMode>('who_is_imposter');

  // Create Room Form State
  const [isPrivate, setIsPrivate] = useState(false);
  const [isTeamMode, setIsTeamMode] = useState(false);
  const [pin, setPin] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(15);
  const [roundDuration, setRoundDuration] = useState(30);
  const [gameMode, setGameMode] = useState<GameMode>('who_is_imposter');
  const [vibeMode, setVibeMode] = useState<VibeMode>('chill');

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
    onlinePlayers: 54,
    activeRooms: 9,
    matchesPlayed: 168
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

      const kickToast = sessionStorage.getItem('feto_kick_toast');
      if (kickToast) {
        setErrorMessage(kickToast);
        sessionStorage.removeItem('feto_kick_toast');
      }
    }
    fetchPublicRooms();
    fetchLiveStats();

    const interval = setInterval(() => {
      fetchLiveStats();
      fetchPublicRooms();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const fetchLiveStats = async () => {
    try {
      const res = await fetch('/api/stats/live');
      const data = await res.json();
      if (data.success && data.data) {
        setLiveStats({
          onlinePlayers: data.data.onlinePlayers || 54,
          activeRooms: data.data.activeRooms || 9,
          matchesPlayed: data.data.matchesPlayed || 168
        });
      }
    } catch {
      // Fallback default stats retained
    }
  };

  const randomizeName = () => {
    sound.playClick();
    const defaultName = PINNED_NICKNAMES[0];
    setUsername(defaultName);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_username', defaultName);
    }
  };

  const handleAvatarSelect = (id: NeonAvatarId) => {
    sound.playClick();
    setSelectedAvatar(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_avatar', id);
    }
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feto_username', val);
    }
  };

  // Fetch active public rooms (auto-prunes stale / finished rooms)
  const fetchPublicRooms = async () => {
    setIsFetchingRooms(true);
    try {
      const res = await fetch('/api/rooms/public');
      const data = await res.json();
      if (data.success) {
        setPublicRooms(data.data?.rooms || (Array.isArray(data.data) ? data.data : []));
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
        vibeMode,
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

  const scrollToGames = () => {
    if (gamesGridRef.current) {
      gamesGridRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-[100dvh] bg-feto-dark text-slate-100 px-3 sm:px-6 py-3 sm:py-5 flex flex-col items-center justify-start relative max-w-7xl mx-auto safe-top safe-bottom">
      {/* Background Neon Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[550px] h-[550px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-[450px] h-[450px] bg-feto-magenta/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* 1. TOP NAVIGATION BAR */}
      <TopNavbar
        onlinePlayersCount={liveStats.onlinePlayers}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onOpenAbout={() => setShowAboutModal(true)}
        onScrollToGames={scrollToGames}
        onOpenDecks={() => setShowDeckModal(true)}
      />

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="w-full max-w-3xl mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-300 text-xs flex items-center justify-between gap-2 shadow-neon-magenta">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-slate-400 hover:text-white text-base font-bold leading-none px-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. HERO SECTION & GLOWING OUTLINE ACTION BUTTONS */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-2 sm:my-6 md:my-8 relative z-10">
        {/* Left Column: Esports Branding, Headline, Profile Bar, Action Buttons */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-[11px] font-black uppercase tracking-widest text-cyan-300 mb-4 shadow-neon-cyan">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>Esports-Grade Party Gaming Platform</span>
          </div>

          {/* Futuristic Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.08] font-display text-white mb-3">
            The Ultimate{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-feto-purple text-glow-cyan">
              Party Game Hub
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-cyan-300/90 text-sm sm:text-lg font-extrabold uppercase tracking-widest mb-2">
            PLAY WITH FRIENDS, ANYTIME, ANYWHERE
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/40 text-xs font-black text-purple-200 mb-4 shadow-neon-purple">
            <Flame className="w-4 h-4 text-pink-400 animate-pulse" />
            <span>Invite your crew for 15-player madness!</span>
            <span className="text-cyan-300 ml-1 font-mono font-bold">• 10 Party Modes</span>
          </div>

          <p className="text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mb-6 leading-relaxed">
            Instant real-time browser party gaming supporting up to 15 concurrent players.
            Social deduction, drawing, speed trivia, word battles, and hilarious party challenges with zero downloads.
          </p>

          {/* Player Onboarding & Nickname Selection (8 Chips: 4 Pinned Always First + 4 Dynamic, Working Roll) */}
          <div className="w-full max-w-xl mb-6">
            <PlayerOnboardingCard
              username={username}
              avatar={selectedAvatar}
              onUsernameChange={handleUsernameChange}
              onAvatarChange={handleAvatarSelect}
            />
          </div>

          {/* 3 SLEEK DARK GLASSMORPHIC BUTTONS WITH THICK GLOWING NEON BORDERS */}
          <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
            {/* 1. CREATE ROOM (+) -> NEON PURPLE GLOW */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sound.playClick();
                setShowCreateModal(true);
              }}
              className="btn-glow-purple px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 touch-target group"
              id="btn-create-room"
            >
              <div className="p-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/40 group-hover:bg-purple-500/30">
                <Plus className="w-4 h-4" />
              </div>
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-purple-200 group-hover:text-white">
                Create Room
              </span>
            </motion.button>

            {/* 2. JOIN VIA CODE -> NEON CYAN GLOW */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sound.playClick();
                setShowJoinModal(true);
              }}
              className="btn-glow-cyan px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 touch-target group"
              id="btn-join-code"
            >
              <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 group-hover:bg-cyan-500/30">
                <Hash className="w-4 h-4" />
              </div>
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-cyan-200 group-hover:text-white">
                Join Via Code
              </span>
            </motion.button>

            {/* 3. QUICK PLAY (▶) -> NEON AMBER/ORANGE GLOW */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickPlay}
              disabled={isQuickPlaying}
              className="btn-glow-amber px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 touch-target group disabled:opacity-60"
              id="btn-quick-play"
            >
              <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 group-hover:bg-amber-500/30">
                {isQuickPlaying ? (
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-amber-300" />
                )}
              </div>
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-amber-200 group-hover:text-white">
                {isQuickPlaying ? 'Finding Party...' : 'Play With Strangers (Public Match)'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Right Column: 3D-Style Neon Gaming Illustration (Desktop / Stacks on Mobile) */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <HeroIllustration />
        </div>
      </section>

      {/* 3. "POPULAR PARTY GAMES" INTERACTIVE 6-CARD GRID */}
      <div ref={gamesGridRef} className="w-full my-6 sm:my-10">
        <PopularGamesGrid
          onSelectGame={(mode) => {
            sound.playClick();
            setGameMode(mode);
            setShowCreateModal(true);
          }}
          onOpenRules={(mode) => {
            sound.playClick();
            setRulesTargetGame(mode);
            setShowRulesModal(true);
          }}
        />
      </div>

      {/* 4. ACTIVE PUBLIC ROOMS DIRECTORY */}
      <section className="w-full glass-panel rounded-3xl p-5 sm:p-7 relative z-10 mb-8 border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                Live Public Rooms
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Jump straight into open community lobbies
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              fetchPublicRooms();
            }}
            disabled={isFetchingRooms}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 transition-all"
          >
            <Radio className={`w-3.5 h-3.5 text-cyan-400 ${isFetchingRooms ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isFetchingRooms ? 'Refreshing...' : 'Refresh Lobbies'}</span>
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-10 text-slate-500 space-y-2">
            <Gamepad2 className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-60" />
            <p className="text-sm font-bold text-slate-300">No public rooms are currently open.</p>
            <p className="text-xs text-slate-500">
              Hit "Create Room" above and invite up to 14 friends with your room link!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {publicRooms.map((room) => (
              <div
                key={room.code}
                className="bg-feto-card border border-feto-border hover:border-cyan-500/50 rounded-2xl p-4 flex items-center justify-between transition-all group hover:shadow-neon-cyan"
              >
                <div className="flex items-center gap-3">
                  <NeonAvatarDisplay avatarId={room.hostAvatar as NeonAvatarId} size="sm" showGlow={false} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm sm:text-base tracking-wider">{room.code}</span>
                      {room.hasPin && (
                        <span title="PIN Protected">
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Host: <span className="text-slate-200 font-semibold">{room.hostUsername}</span> •{' '}
                      <span className="capitalize text-cyan-300">{room.gameMode.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-black text-cyan-400">
                      {room.playerCount}/{room.maxPlayers}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-widest">{room.status}</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setJoinCode(room.code);
                      setShowJoinModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-xl text-cyan-300 text-xs font-extrabold transition-all"
                  >
                    Join
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* CREATE ROOM MODAL                                         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="w-full max-w-lg glass-panel-neon rounded-3xl p-5 sm:p-8 relative max-h-[92dvh] overflow-y-auto border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wider">
                    Create New Room
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white text-2xl font-bold leading-none touch-manipulation"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-5">
                {/* Select Game Mode */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-2">
                    Select Game Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'who_is_imposter', title: 'Who Is Imposter?', desc: 'Social deduction (3-15p)' },
                      { id: 'draw_and_guess', title: 'Draw & Guess', desc: 'Live canvas (2-15p)' },
                      { id: 'quiz_battle', title: 'Quiz Battle', desc: 'Speed trivia (2-15p)' },
                      { id: 'word_battle', title: 'Word Battle', desc: 'Word race (2-15p)' },
                      { id: 'truth_or_dare', title: 'Truth or Dare', desc: 'Party voting (2-15p)' },
                      { id: 'never_have_i_ever', title: 'Never Have I Ever', desc: 'Confessions (2-15p)' },
                      { id: 'most_likely_to', title: 'Most Likely To...', desc: 'Roast & votes (2-15p)' },
                      { id: 'sip_or_spill', title: 'Sip or Spill 🥤', desc: 'Party drink dilemma (2-15p)' },
                      { id: 'silly_roulette', title: 'Silly Roulette', desc: 'Spin the chaos (2-15p)' },
                      { id: 'hot_potato', title: 'Hot Potato', desc: 'Bomb pass panic (2-15p)' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setGameMode(mode.id as GameMode);
                        }}
                        className={`min-h-[48px] p-2.5 sm:p-3 rounded-xl border text-left transition-all touch-target ${gameMode === mode.id
                            ? 'border-purple-400 bg-purple-950/40 text-white shadow-neon-purple'
                            : 'border-feto-border bg-feto-card text-slate-300 hover:border-slate-500'
                          }`}
                      >
                        <div className="font-extrabold text-xs sm:text-sm text-purple-300 truncate">{mode.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vibe Mode Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Party Vibe Mode</span>
                    </label>
                    <span className="text-[10px] text-cyan-300 font-bold uppercase">{vibeMode.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'chill', label: 'Chill & Funny', desc: 'Safe & lighthearted party fun' },
                      { id: 'chaotic', label: 'Silly & Chaotic', desc: 'Absurd dares & accents' },
                      { id: 'sip_edition', label: 'Sip Edition 🥤', desc: 'Live sip counters & skips' }
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setVibeMode(v.id as VibeMode);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          vibeMode === v.id
                            ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-neon-cyan'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-cyan-300 truncate">{v.label}</div>
                        <div className="text-[9px] text-slate-400 leading-tight mt-0.5 line-clamp-2">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Mode Toggle */}
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
                    <label className="text-xs font-black uppercase tracking-wider text-slate-300">
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

                {/* Round Duration */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Round Timer
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[20, 30, 45, 60].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setRoundDuration(sec);
                        }}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${roundDuration === sec
                            ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-neon-cyan'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
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
                      className="w-5 h-5 accent-purple-400 rounded cursor-pointer"
                    />
                  </div>

                  {isPrivate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Enter 4-digit numeric PIN..."
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl px-4 py-2.5 text-white text-center font-mono tracking-widest text-lg outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Create Room Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 via-feto-purple to-cyan-500 hover:brightness-110 shadow-neon-purple transition-all flex items-center justify-center gap-2 touch-target"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Launch Room Now</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* JOIN VIA CODE MODAL                                      */}
      {/* ======================================================== */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="w-full max-w-md glass-panel-neon rounded-3xl p-5 sm:p-8 relative border border-cyan-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    <Hash className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-wider">
                    Join Room
                  </h3>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-white text-2xl font-bold leading-none touch-manipulation"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="FG-XXXX"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-center font-mono tracking-widest text-2xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-300 mb-1.5">
                    Room PIN (If Private)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Optional 4-digit PIN"
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-white text-center font-mono tracking-widest text-base outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 to-cyan-300 hover:brightness-110 shadow-neon-cyan transition-all flex items-center justify-center gap-2 touch-target"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      <span>Enter Game Lobby</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* OTHER MODALS: ABOUT, RULES, DECKS, LEADERBOARDS           */}
      {/* ======================================================== */}
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />

      <GameRulesModal
        isOpen={showRulesModal}
        gameMode={rulesTargetGame}
        onClose={() => setShowRulesModal(false)}
      />

      <CustomDeckModal
        isOpen={showDeckModal}
        onClose={() => setShowDeckModal(false)}
        gameMode={gameMode}
      />

      <LeaderboardProfileModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUsername={username}
        currentAvatar={selectedAvatar}
      />
    </main>
  );
}
