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
    <main className="min-h-[100dvh] bg-[#F8F8F8] text-[#010101] px-3 sm:px-6 py-3 sm:py-5 flex flex-col items-center justify-start relative max-w-7xl mx-auto safe-top safe-bottom">
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
        <div className="w-full max-w-3xl mb-4 p-3.5 bg-[#FD3F01]/10 border-2 border-[#FD3F01] rounded-2xl text-[#FD3F01] font-black text-xs flex items-center justify-between gap-2 shadow-[3px_3px_0px_#010101]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-[#FD3F01]" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[#010101] hover:text-[#FD3F01] text-base font-black leading-none px-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* 2. HERO SECTION & BOLD BAUHAUS PRIMARY ACTION BUTTONS */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-2 sm:my-6 md:my-8 relative z-10">
        {/* Left Column: Esports Branding, Headline, Profile Bar, Action Buttons */}
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFFFFF] border-2 border-[#010101] text-[11px] font-black uppercase tracking-widest text-[#010101] mb-4 shadow-[2px_2px_0px_#010101]">
            <Sparkles className="w-3.5 h-3.5 text-[#0B89FD] animate-spin" />
            <span>Esports-Grade Party Gaming Platform</span>
          </div>

          {/* Bold Futuristic Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[1.08] font-display text-[#010101] mb-3">
            The Ultimate{' '}
            <span className="text-[#0B89FD] underline decoration-4 sm:decoration-6 decoration-[#FEC90E]">
              Party Game Hub
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#010101] text-sm sm:text-lg font-black uppercase tracking-widest mb-2">
            PLAY WITH FRIENDS, ANYTIME, ANYWHERE
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#FEC90E] border-2 border-[#010101] text-xs font-black text-[#010101] mb-4 shadow-[2px_2px_0px_#010101]">
            <Flame className="w-4 h-4 text-[#FD3F01]" />
            <span>Invite your crew for 15-player madness!</span>
            <span className="text-[#010101] ml-1 font-mono font-bold">• 10 Party Modes</span>
          </div>

          <p className="text-[#525252] font-medium text-xs sm:text-sm md:text-base max-w-xl mb-6 leading-relaxed">
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

          {/* 3 BOLD TACTILE NEO-BRUTALIST ACTION BUTTONS */}
          <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5">
            {/* 1. CREATE ROOM (+) -> VIBRANT ELECTRIC BLUE #0B89FD */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.playClick();
                setShowCreateModal(true);
              }}
              className="px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all touch-target group"
              id="btn-create-room"
            >
              <div className="p-1 rounded-lg bg-white/20 text-white border border-white/40">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-white">
                Create Room
              </span>
            </motion.button>

            {/* 2. JOIN VIA CODE -> CRISP WHITE SURFACE #FFFFFF */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.playClick();
                setShowJoinModal(true);
              }}
              className="px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#010101] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all touch-target group"
              id="btn-join-code"
            >
              <div className="p-1 rounded-lg bg-[#010101]/10 text-[#010101] border border-[#010101]/30">
                <Hash className="w-4 h-4 text-[#010101]" />
              </div>
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-[#010101]">
                Join Via Code
              </span>
            </motion.button>

            {/* 3. QUICK PLAY (▶) -> VIBRANT GOLD/YELLOW #FEC90E */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleQuickPlay}
              disabled={isQuickPlaying}
              className="px-4 py-3.5 rounded-2xl flex items-center justify-center gap-2 bg-[#FEC90E] hover:bg-[#fed338] text-[#010101] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all touch-target group disabled:opacity-60"
              id="btn-quick-play"
            >
              <div className="p-1 rounded-lg bg-[#010101]/10 text-[#010101] border border-[#010101]/30">
                {isQuickPlaying ? (
                  <div className="w-4 h-4 border-2 border-[#010101] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-[#010101] text-[#010101]" />
                )}
              </div>
              <span className="font-black text-xs sm:text-sm tracking-wider uppercase text-[#010101]">
                {isQuickPlaying ? 'Finding Party...' : 'Quick Match'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Right Column: Bauhaus Geometric Gaming Illustration */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <HeroIllustration />
        </div>
      </section>

      {/* 3. "POPULAR PARTY GAMES" INTERACTIVE GRID */}
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
      <section className="w-full bg-[#FFFFFF] rounded-3xl p-5 sm:p-7 relative z-10 mb-8 border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0B89FD]/15 border-2 border-[#010101] text-[#0B89FD]">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#010101] uppercase tracking-wider">
                Live Public Rooms
              </h2>
              <p className="text-[11px] sm:text-xs text-[#525252] font-medium">
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
            className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-xs font-black text-[#010101] flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Radio className={`w-3.5 h-3.5 text-[#0B89FD] ${isFetchingRooms ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isFetchingRooms ? 'Refreshing...' : 'Refresh Lobbies'}</span>
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-10 text-[#525252] space-y-2">
            <Gamepad2 className="w-10 h-10 mx-auto text-[#010101] mb-2 opacity-50" />
            <p className="text-sm font-black text-[#010101]">No public rooms are currently open.</p>
            <p className="text-xs text-[#525252] font-medium">
              Hit "Create Room" above and invite up to 14 friends with your room link!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {publicRooms.map((room) => (
              <div
                key={room.code}
                className="bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl p-4 flex items-center justify-between transition-all group shadow-[3px_3px_0px_#010101] hover:shadow-[5px_5px_0px_#010101] hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3">
                  <NeonAvatarDisplay avatarId={room.hostAvatar as NeonAvatarId} size="sm" showGlow={false} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#010101] text-sm sm:text-base tracking-wider">{room.code}</span>
                      {room.hasPin && (
                        <span title="PIN Protected">
                          <Lock className="w-3.5 h-3.5 text-[#FD3F01]" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#525252] font-semibold">
                      Host: <span className="text-[#010101] font-black">{room.hostUsername}</span> •{' '}
                      <span className="capitalize text-[#0B89FD] font-black">{room.gameMode.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-black text-[#010101]">
                      {room.playerCount}/{room.maxPlayers}
                    </div>
                    <div className="text-[9px] text-[#525252] font-black uppercase tracking-widest">{room.status}</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setJoinCode(room.code);
                      setShowJoinModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#0B89FD] hover:bg-[#0977db] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] rounded-xl text-xs font-black transition-all active:translate-x-[1px] active:translate-y-[1px]"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="w-full max-w-lg bg-[#FFFFFF] rounded-3xl p-5 sm:p-8 relative max-h-[92dvh] overflow-y-auto border-3 border-[#010101] shadow-[8px_8px_0px_#010101] text-[#010101]"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#0B89FD] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-[#010101] uppercase tracking-wider">
                    Create New Room
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#010101] hover:text-[#FD3F01] text-2xl font-black leading-none touch-manipulation"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-5">
                {/* Select Game Mode */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-2">
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
                        className={`min-h-[48px] p-2.5 sm:p-3 rounded-xl border-2 text-left transition-all touch-target ${
                          gameMode === mode.id
                            ? 'border-[#010101] bg-[#FEC90E] text-[#010101] shadow-[3px_3px_0px_#010101]'
                            : 'border-[#010101] bg-[#F8F8F8] text-[#010101] hover:bg-[#FFFFFF]'
                        }`}
                      >
                        <div className="font-black text-xs sm:text-sm text-[#010101] truncate">{mode.title}</div>
                        <div className="text-[10px] text-[#525252] font-semibold truncate">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vibe Mode Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-[#010101] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0B89FD]" />
                      <span>Party Vibe Mode</span>
                    </label>
                    <span className="text-[10px] text-[#0B89FD] font-black uppercase">{vibeMode.replace('_', ' ')}</span>
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
                        className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                          vibeMode === v.id
                            ? 'border-[#010101] bg-[#0B89FD] text-white shadow-[3px_3px_0px_#010101]'
                            : 'border-[#010101] bg-[#F8F8F8] text-[#010101] hover:bg-[#FFFFFF]'
                        }`}
                      >
                        <div className="text-xs font-black truncate">{v.label}</div>
                        <div className={`text-[9px] leading-tight mt-0.5 line-clamp-2 ${vibeMode === v.id ? 'text-white/80' : 'text-[#525252]'}`}>{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Mode Toggle */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8F8F8] border-2 border-[#010101] flex items-center justify-between">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Shield className="w-5 h-5 text-[#0B89FD]" />
                    <div>
                      <div className="text-xs sm:text-sm font-black text-[#010101]">Team Mode (3 Squads)</div>
                      <div className="text-[10px] sm:text-xs text-[#525252]">Split up to 15 players into Red, Blue, Green</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTeamMode}
                    onChange={(e) => setIsTeamMode(e.target.checked)}
                    className="w-5 h-5 accent-[#0B89FD] rounded cursor-pointer touch-manipulation"
                  />
                </div>

                {/* Max Players Slider (2 to 15) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-[#010101]">
                      Player Capacity (2 - 15)
                    </label>
                    <span className="text-[#0B89FD] font-black text-sm">{maxPlayers} Players</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={15}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full accent-[#0B89FD] cursor-pointer h-3"
                  />
                </div>

                {/* Round Duration */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
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
                        className={`py-2 rounded-xl border-2 text-xs font-black transition-all ${
                          roundDuration === sec
                            ? 'border-[#010101] bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                            : 'border-[#010101] bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy & PIN */}
                <div className="space-y-3 pt-2 border-t-2 border-[#010101]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-[#010101]">Private Room</div>
                      <div className="text-[10px] sm:text-xs text-[#525252]">Requires 4-digit PIN to join</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-5 h-5 accent-[#0B89FD] rounded cursor-pointer"
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
                        className="w-full bg-[#F8F8F8] border-2 border-[#010101] focus:bg-[#FFFFFF] focus:border-[#0B89FD] rounded-xl px-4 py-2.5 text-[#010101] text-center font-mono font-black tracking-widest text-lg outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Create Room Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-[#0B89FD] hover:bg-[#0977db] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all flex items-center justify-center gap-2 touch-target"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="w-full max-w-md bg-[#FFFFFF] rounded-3xl p-5 sm:p-8 relative border-3 border-[#010101] shadow-[8px_8px_0px_#010101] text-[#010101]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#0B89FD] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                    <Hash className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-[#010101] uppercase tracking-wider">
                    Join Room
                  </h3>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#010101] hover:text-[#FD3F01] text-2xl font-black leading-none touch-manipulation"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
                    Room Code
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    placeholder="FG-XXXX"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#F8F8F8] border-2 border-[#010101] focus:bg-[#FFFFFF] focus:border-[#0B89FD] rounded-xl px-4 py-3 text-[#010101] text-center font-mono font-black tracking-widest text-2xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-[#010101] mb-1.5">
                    Room PIN (If Private)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Optional 4-digit PIN"
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[#F8F8F8] border-2 border-[#010101] focus:bg-[#FFFFFF] focus:border-[#0B89FD] rounded-xl px-4 py-2.5 text-[#010101] text-center font-mono font-black tracking-widest text-base outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-[#0B89FD] hover:bg-[#0977db] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all flex items-center justify-center gap-2 touch-target"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5 text-white" />
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
