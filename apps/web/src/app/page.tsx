'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lock,
  Globe,
  Play,
  ShieldAlert,
  ArrowRight,
  Flame,
  Radio,
  Gamepad2,
  Shield,
  Plus,
  Hash,
  X
} from 'lucide-react';
import { TopNavbar } from '@/components/TopNavbar';
import { HeroIllustration } from '@/components/HeroIllustration';
import { PlayerOnboardingCard } from '@/components/PlayerOnboardingCard';
import { PopularGamesGrid } from '@/components/PopularGamesGrid';
import { AboutModal } from '@/components/AboutModal';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { GameRulesModal } from '@/components/GameRulesModal';
import { CustomDeckModal } from '@/components/CustomDeckModal';
import { LeaderboardProfileModal } from '@/components/LeaderboardProfileModal';
import {
  GameMode,
  NeonAvatarId,
  NEON_AVATARS,
  PublicRoomDirectoryItem,
  VibeMode
} from '@feto-games/shared-types';
import { cleanRoomCode, socketCreateRoom, socketJoinRoom, socketQuickPlay } from '@/lib/socket';
import { PINNED_NICKNAMES } from '@/lib/nicknames';
import { sound } from '@/lib/sound';
import { useLanguage } from '@/hooks/useLanguage';

export default function HomePage() {
  const router = useRouter();
  const { isArabic, t } = useLanguage();
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
      // Retain fallback default stats
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
    let playerName = username.trim();
    if (!playerName) {
      playerName = PINNED_NICKNAMES[0];
      setUsername(playerName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('feto_username', playerName);
      }
    }
    setIsQuickPlaying(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const res = await socketQuickPlay({
        username: playerName,
        avatar: selectedAvatar
      });
      const targetCode = cleanRoomCode(res.roomCode);
      router.push(`/room/${targetCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick play matchmaking failed.');
      setIsQuickPlaying(false);
    }
  };

  // Create Room Submission
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    let hostName = username.trim();
    if (!hostName) {
      hostName = PINNED_NICKNAMES[0];
      setUsername(hostName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('feto_username', hostName);
      }
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
        username: hostName,
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

      const targetCode = cleanRoomCode(res.roomCode || (res as any).room?.code);
      if (!targetCode) {
        throw new Error('Room created, but room code was missing.');
      }

      router.push(`/room/${targetCode}`);
    } catch (err: any) {
      console.error('Failed to create room:', err);
      setErrorMessage(err.message || 'Failed to create room.');
      setIsLoading(false);
    }
  };

  // Join Room Submission
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    let playerName = username.trim();
    if (!playerName) {
      playerName = PINNED_NICKNAMES[0];
      setUsername(playerName);
      if (typeof window !== 'undefined') {
        localStorage.setItem('feto_username', playerName);
      }
    }

    const code = cleanRoomCode(joinCode);
    if (!code || code.length < 4) {
      setErrorMessage('Please enter a valid 6-character room code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      const res = await socketJoinRoom({
        roomCode: code,
        username: playerName,
        avatar: selectedAvatar,
        pin: joinPin.trim() || undefined
      });

      const targetCode = cleanRoomCode(res.roomCode || (res as any).room?.code || code);
      router.push(`/room/${targetCode}`);
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
    <main className="min-h-[100dvh] bg-[#F9FAFB] text-gray-900 px-3 sm:px-6 py-4 flex flex-col items-center justify-start relative max-w-7xl mx-auto safe-top safe-bottom overflow-x-hidden">
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
        <div className="w-full max-w-3xl mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-3 sm:my-6 md:my-8 relative z-10">
        {/* Left Column: Branding, Headline, Onboarding, Action Buttons */}
        <div className={`lg:col-span-7 flex flex-col items-center ${isArabic ? 'lg:items-start text-center lg:text-right' : 'lg:items-start text-center lg:text-left'}`}>
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isArabic ? 'ألعاب بارتي جماعية في المتصفح • حتى 15 لاعب' : 'Instant Browser Party Games • Up to 15 Players'}</span>
          </div>

          {/* Clean Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-3 leading-tight">
            {isArabic ? (
              <>
                منصة ألعاب البارتي{' '}
                <span className="text-blue-600">الأحدث والأمتع</span>
              </>
            ) : (
              <>
                The modern{' '}
                <span className="text-blue-600">party game hub</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mb-6 leading-relaxed">
            {isArabic
              ? 'ألعاب جماعية أونلاين في الوقت الفعلي مع صحابك وفريقك. ألعاب شك وتخمين، رسم مباشر، معلومات عامة، تحديات مضحكة بدون أي تحميل أو تطبيقات.'
              : 'Real-time multiplayer games for friends and remote teams. Social deduction, live drawing, speed trivia, word battles, and hilarious challenges with zero downloads.'}
          </p>

          {/* Player Onboarding & Nickname Selection */}
          <div className="w-full max-w-xl mb-6">
            <PlayerOnboardingCard
              username={username}
              avatar={selectedAvatar}
              onUsernameChange={handleUsernameChange}
              onAvatarChange={handleAvatarSelect}
            />
          </div>

          {/* 3 CLEAN ACTION BUTTONS */}
          <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. CREATE ROOM -> Clean Electric Blue */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sound.playClick();
                setShowCreateModal(true);
              }}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
              id="btn-create-room"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>{isArabic ? 'إنشاء غرفة' : 'Create Room'}</span>
            </motion.button>

            {/* 2. JOIN VIA CODE -> Crisp White Surface */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                sound.playClick();
                setShowJoinModal(true);
              }}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-semibold text-sm shadow-sm transition-all"
              id="btn-join-code"
            >
              <Hash className="w-4 h-4 text-gray-500" />
              <span>{isArabic ? 'انضمام بكود' : 'Join Via Code'}</span>
            </motion.button>

            {/* 3. QUICK PLAY -> Soft Tinted Blue */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleQuickPlay}
              disabled={isQuickPlaying}
              className="h-12 px-4 rounded-xl flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-sm shadow-sm transition-all disabled:opacity-60"
              id="btn-quick-play"
            >
              {isQuickPlaying ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-blue-600 text-blue-600" />
              )}
              <span>
                {isQuickPlaying
                  ? (isArabic ? 'جاري البحث...' : 'Matching...')
                  : (isArabic ? 'لعب سريع' : 'Quick Match')}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Right Column: Clean Vector Illustration */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
          <HeroIllustration />
        </div>
      </section>

      {/* 3. "POPULAR PARTY GAMES" GRID */}
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
      <section className="w-full bg-white rounded-2xl p-5 sm:p-7 relative z-10 mb-8 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {isArabic ? 'الغرف العامة المباشرة' : 'Live Public Rooms'}
              </h2>
              <p className="text-xs text-gray-500 font-normal">
                {isArabic ? 'انضم إلى غرفة مفتوحة في المجتمع بضغطة زر واحدة' : 'Join an active community room with one click'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              fetchPublicRooms();
            }}
            disabled={isFetchingRooms}
            className="px-3.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Radio className={`w-3.5 h-3.5 text-blue-600 ${isFetchingRooms ? 'animate-spin' : 'animate-pulse'}`} />
            <span>
              {isFetchingRooms
                ? (isArabic ? 'جاري التحديث...' : 'Refreshing...')
                : (isArabic ? 'تحديث الغرف' : 'Refresh Lobbies')}
            </span>
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-10 text-gray-400 space-y-2">
            <Gamepad2 className="w-8 h-8 mx-auto text-gray-300 mb-1" />
            <p className="text-sm font-semibold text-gray-700">
              {isArabic ? 'لا توجد غرف عامة مفتوحة حالياً.' : 'No public rooms are currently open.'}
            </p>
            <p className="text-xs text-gray-500">
              {isArabic
                ? 'اضغط "إنشاء غرفة" في الأعلى وشارك الرابط مع حتى 14 من أصحابك!'
                : 'Click "Create Room" above and invite up to 14 friends with your room link!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {publicRooms.map((room) => (
              <div
                key={room.code}
                className="bg-gray-50/70 border border-gray-200 rounded-2xl p-4 flex items-center justify-between transition-all group hover:bg-white hover:border-blue-300 hover:shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <NeonAvatarDisplay avatarId={room.hostAvatar as NeonAvatarId} size="sm" showGlow={false} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-gray-900 text-sm tracking-wider font-mono force-ltr" data-room-code>{room.code}</span>
                      {room.hasPin && (
                        <span title={isArabic ? 'محمية برمز PIN' : 'PIN Protected'}>
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 font-normal">
                      {isArabic ? 'المضيف:' : 'Host:'} <span className="text-gray-800 font-semibold">{room.hostUsername}</span> •{' '}
                      <span className="capitalize text-blue-600 font-semibold">{room.gameMode.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={isArabic ? 'text-left' : 'text-right'}>
                    <div className="text-xs font-bold text-gray-900 force-ltr">
                      {room.playerCount}/{room.maxPlayers}
                    </div>
                    <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{room.status}</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setJoinCode(room.code);
                      setShowJoinModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    {isArabic ? 'انضمام' : 'Join'}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-white rounded-2xl p-5 sm:p-7 relative max-h-[92dvh] overflow-y-auto border border-gray-200 shadow-xl text-gray-900"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {isArabic ? 'إنشاء غرفة جديدة' : 'Create New Room'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-4 sm:space-y-5">
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Host Nickname */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    {isArabic ? 'اسم المضيف' : 'Host Nickname'}
                  </label>
                  <input
                    type="text"
                    maxLength={20}
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder={isArabic ? 'اكتب اسمك...' : 'Enter your nickname...'}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl px-4 py-2.5 text-gray-900 text-sm font-semibold outline-none"
                  />
                </div>

                {/* Select Game Mode */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    {isArabic ? 'اختر نوع اللعبة' : 'Select Game Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'who_is_imposter', title: isArabic ? 'مين الجاسوس؟' : 'Who Is Imposter?', desc: isArabic ? 'شك وتخمين (3-15)' : 'Social deduction (3-15p)' },
                      { id: 'draw_and_guess', title: isArabic ? 'ارسم وخمّن' : 'Draw & Guess', desc: isArabic ? 'رسم مباشر (2-15)' : 'Live canvas (2-15p)' },
                      { id: 'quiz_battle', title: isArabic ? 'تحدي المعلومات' : 'Quiz Battle', desc: isArabic ? 'معلومات سريعة (2-15)' : 'Speed trivia (2-15p)' },
                      { id: 'word_battle', title: isArabic ? 'حرب الكلمات' : 'Word Battle', desc: isArabic ? 'سباق كلمات (2-15)' : 'Word race (2-15p)' },
                      { id: 'truth_or_dare', title: isArabic ? 'صراحة ولا جرأة' : 'Truth or Dare', desc: isArabic ? 'تصويت بارتي (2-15)' : 'Party voting (2-15p)' },
                      { id: 'never_have_i_ever', title: isArabic ? 'عمري ما عملت...' : 'Never Have I Ever', desc: isArabic ? 'اعترافات (2-15)' : 'Confessions (2-15p)' },
                      { id: 'most_likely_to', title: isArabic ? 'مين أكتر واحد فينا...' : 'Most Likely To...', desc: isArabic ? 'تريقة وتصويت (2-15)' : 'Roast & votes (2-15p)' },
                      { id: 'sip_or_spill', title: isArabic ? 'جاوب ولا اشرب 🥤' : 'Sip or Spill 🥤', desc: isArabic ? 'اعترافات وشرب (2-15)' : 'Party drink dilemma (2-15p)' },
                      { id: 'silly_roulette', title: isArabic ? 'عجلة الجنون' : 'Silly Roulette', desc: isArabic ? 'تحديات مضحكة (2-15)' : 'Spin the chaos (2-15p)' },
                      { id: 'hot_potato', title: isArabic ? 'القنبلة الموقوتة' : 'Hot Potato', desc: isArabic ? 'توتر وسرعة (2-15)' : 'Bomb pass panic (2-15p)' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setGameMode(mode.id as GameMode);
                        }}
                        className={`min-h-[48px] p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                          gameMode === mode.id
                            ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-xs sm:text-sm truncate">{mode.title}</div>
                        <div className="text-[11px] text-gray-500 truncate">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vibe Mode Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isArabic ? 'أجواء الحفلة' : 'Party Vibe Mode'}</span>
                    </label>
                    <span className="text-xs text-blue-600 font-semibold uppercase">{vibeMode.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'chill', label: isArabic ? 'رايق ومرح' : 'Chill & Funny', desc: isArabic ? 'أجواء خفيفة وممتعة' : 'Safe & lighthearted party fun' },
                      { id: 'chaotic', label: isArabic ? 'مجنون وتحديات' : 'Silly & Chaotic', desc: isArabic ? 'جرأة وأصوات مجنونة' : 'Absurd dares & accents' },
                      { id: 'sip_edition', label: isArabic ? 'إصدار الشرب 🥤' : 'Sip Edition 🥤', desc: isArabic ? 'عداد رشفات وتخطي' : 'Live sip counters & skips' }
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
                            ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                            : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-xs font-semibold truncate">{v.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Mode Toggle */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">
                        {isArabic ? 'وضع الفرق (3 فرق)' : 'Team Mode (3 Squads)'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isArabic ? 'تقسيم اللاعبين إلى أحمر، أزرق، وأخضر' : 'Split up to 15 players into Red, Blue, Green'}
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isTeamMode}
                    onChange={(e) => setIsTeamMode(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Max Players Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {isArabic ? 'عدد اللاعبين (2 - 15)' : 'Player Capacity (2 - 15)'}
                    </label>
                    <span className="text-blue-600 font-bold text-sm">
                      {maxPlayers} {isArabic ? 'لاعبين' : 'Players'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={15}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
                  />
                </div>

                {/* Round Duration */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    {isArabic ? 'مدة الجولة' : 'Round Timer'}
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
                        className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                          roundDuration === sec
                            ? 'border-blue-500 bg-blue-600 text-white shadow-xs'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {sec}{isArabic ? 'ث' : 's'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Privacy & PIN */}
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-gray-900">
                        {isArabic ? 'غرفة خاصة برمز سري' : 'Private Room'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {isArabic ? 'تتطلب رمز PIN مكون من 4 أرقام للانضمام' : 'Requires 4-digit PIN to join'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  {isPrivate && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder={isArabic ? 'أدخل رمز PIN من 4 أرقام...' : 'Enter 4-digit numeric PIN...'}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl px-4 py-2.5 text-gray-900 text-center font-mono font-bold tracking-widest text-base outline-none force-ltr"
                      />
                    </motion.div>
                  )}
                </div>

                {/* Create Room Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isArabic ? 'جاري إنشاء الغرفة...' : 'Creating Room...'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{isArabic ? 'ابدأ الغرفة الآن' : 'Launch Room'}</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-gray-900/50 backdrop-blur-sm safe-top safe-bottom">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-7 relative border border-gray-200 shadow-xl text-gray-900"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Hash className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    {isArabic ? 'الانضمام إلى غرفة' : 'Join Room'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <AnimatePresence>
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    {isArabic ? 'أدخل كود الغرفة المكون من 6 رموز' : 'Enter 6-character room code'}
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="e.g. K8M4P2"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl px-4 py-3 text-gray-900 text-center font-mono font-bold tracking-widest text-2xl outline-none force-ltr"
                    data-room-code
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    {isArabic ? 'رمز PIN السري (إن وجد)' : 'Room PIN (If Private)'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder={isArabic ? 'رمز PIN اختياري من 4 أرقام' : 'Optional 4-digit PIN'}
                    value={joinPin}
                    onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl px-4 py-2.5 text-gray-900 text-center font-mono font-semibold tracking-widest text-base outline-none force-ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isArabic ? 'جاري الانضمام...' : 'Joining Room...'}</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className={`w-4 h-4 text-white ${isArabic ? 'rotate-180' : ''}`} />
                      <span>{isArabic ? 'دخول اللوبي' : 'Enter Lobby'}</span>
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
