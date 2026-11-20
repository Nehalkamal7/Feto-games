'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  Medal,
  RotateCcw,
  Sparkles,
  Users,
  ArrowRight,
  Shield,
  Share2,
  Check,
  Award,
  Copy
} from 'lucide-react';
import { GameMode, PartyAward, PlayerSummary, PublicRoomState } from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { GameIcon } from '@/components/GameIcon';
import { BrandLogo } from '@/components/BrandLogo';
import { ShareRecapCard } from '@/components/ShareRecapCard';
import { socketRematch } from '@/lib/socket';
import { sound } from '@/lib/sound';
import confetti from 'canvas-confetti';

const GAME_OPTIONS: { id: GameMode; name: string }[] = [
  { id: 'who_is_imposter', name: 'Who Is Imposter?' },
  { id: 'draw_and_guess', name: 'Draw & Guess' },
  { id: 'quiz_battle', name: 'Quiz Battle' },
  { id: 'word_battle', name: 'Word Battle' },
  { id: 'truth_or_dare', name: 'Truth or Dare' },
  { id: 'never_have_i_ever', name: 'Never Have I Ever' },
  { id: 'most_likely_to', name: 'Most Likely To...' },
  { id: 'sip_or_spill', name: 'Sip or Spill 🥤' },
  { id: 'silly_roulette', name: 'Silly Roulette' },
  { id: 'hot_potato', name: 'Hot Potato' }
];

interface GamePodiumViewProps {
  room: PublicRoomState;
  currentPlayer: PlayerSummary | null;
  onRematchRequested?: () => void;
}

export function GamePodiumView({ room, currentPlayer }: GamePodiumViewProps) {
  const [isRematching, setIsRematching] = useState(false);
  const [selectedNextGame, setSelectedNextGame] = useState<GameMode>(room.config.gameMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedStats, setCopiedStats] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  const isHost = currentPlayer?.isHost ?? false;

  // Sort players by score descending
  const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const firstPlace = sortedPlayers[0];
  const secondPlace = sortedPlayers[1];
  const thirdPlace = sortedPlayers[2];

  // Current player rank
  const myRank = currentPlayer ? sortedPlayers.findIndex((p) => p.id === currentPlayer.id) + 1 : 1;

  // Party Awards
  const partyAwards: PartyAward[] = room.awards && room.awards.length > 0
    ? room.awards
    : [
        {
          id: 'award_mvp',
          title: 'Player of the Match (MVP)',
          description: 'Dominated the match with top score and quick reflexes!',
          recipientId: firstPlace?.id || 'p1',
          recipientUsername: firstPlace?.username || 'Champion',
          recipientAvatar: firstPlace?.avatar || 'cyber_cat',
          badgeIcon: '👑',
          scoreOrStat: `${firstPlace?.score || 0} PTS`
        },
        {
          id: 'award_sips',
          title: 'Most Sips Taken 🥤',
          description: 'Drank through all the spicy dilemmas with unflinching cheer!',
          recipientId: sortedPlayers[1]?.id || 'p2',
          recipientUsername: sortedPlayers[1]?.username || 'Party Legend',
          recipientAvatar: sortedPlayers[1]?.avatar || 'neon_fox',
          badgeIcon: '🥤',
          scoreOrStat: `${room.sipsCount?.[sortedPlayers[1]?.id || ''] || 4} SIPS`
        },
        {
          id: 'award_chaos',
          title: 'The Chaos Agent 🔥',
          description: 'Brought the loudest laughs and unpredictable party energy!',
          recipientId: sortedPlayers[2]?.id || 'p3',
          recipientUsername: sortedPlayers[2]?.username || 'Wild Card',
          recipientAvatar: sortedPlayers[2]?.avatar || 'toxic_frog',
          badgeIcon: '⚡',
          scoreOrStat: '100% CHAOS'
        }
      ];

  // Confetti cascade on mount
  useEffect(() => {
    sound.playFanfare();
    sound.triggerHaptic(80);

    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 50,
        origin: { x: 0, y: 0.7 },
        colors: ['#2563EB', '#F59E0B', '#10B981', '#6366F1']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 50,
        origin: { x: 1, y: 0.7 },
        colors: ['#2563EB', '#F59E0B', '#10B981', '#6366F1']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleRematch = async () => {
    if (!isHost) return;
    setIsRematching(true);
    setErrorMessage(null);
    sound.playClick();

    try {
      await socketRematch(selectedNextGame);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start rematch.');
      setIsRematching(false);
    }
  };

  const handleShareVictory = async () => {
    sound.playClick();
    const shareText = `🏆 FETO GAMES MATCH RECAP 🏆\n🎮 Game: ${room.config.gameMode.replace(/_/g, ' ').toUpperCase()}\n🥇 1st Place: ${firstPlace?.username || 'Champ'} (${firstPlace?.score || 0} PTS)\n🔥 Room: ${room.code}\nPlay now at ${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FETO GAMES Match Recap',
          text: shareText,
          url: `${window.location.origin}/room/${room.code}`
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setCopiedStats(true);
    setTimeout(() => setCopiedStats(false), 2500);
  };

  const handleCopyInviteLink = () => {
    sound.playClick();
    const url = `${window.location.origin}/room/${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  };

  // Team score aggregates
  const teamScores = room.teamScores || {};
  const teamsRanked = [
    { team: 'red', name: 'Red Team', score: teamScores.red || 0, color: 'text-rose-600', bg: 'bg-rose-50 border border-rose-200' },
    { team: 'blue', name: 'Blue Team', score: teamScores.blue || 0, color: 'text-blue-600', bg: 'bg-blue-50 border border-blue-200' },
    { team: 'green', name: 'Green Team', score: teamScores.green || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-200' }
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-start py-6 px-3 relative z-10 text-gray-900">
      {/* HEADER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Match Concluded • Victory Ceremony</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Final <span className="text-blue-600">Leaderboard</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {room.config.isTeamMode ? 'Team & Individual Standings' : 'All players ranked by match points'}
        </p>
      </motion.div>

      {/* TEAM MODE SCORES (IF TEAM MODE ENABLED) */}
      {room.config.isTeamMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full mb-8 bg-white border border-gray-200 shadow-sm rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-gray-700">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Team Championship Leaderboard</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {teamsRanked.map((t, idx) => (
              <div
                key={t.team}
                className={`p-4 rounded-xl flex flex-col items-center justify-between ${t.bg}`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {idx === 0 && <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />}
                  <span className={t.color}>{t.name}</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 my-1">{t.score} pts</div>
                <div className="text-xs text-gray-500">
                  {room.players.filter((p) => p.team === t.team).length} players
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CLEAN MINIMAL PODIUM PEDESTALS */}
      <div className="w-full flex items-end justify-center gap-2 sm:gap-4 md:gap-6 mb-8 pt-8 min-h-[280px] sm:min-h-[320px]">
        {/* 2ND PLACE (SILVER - LEFT) */}
        {secondPlace && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex-1 min-w-0 max-w-[100px] sm:max-w-[170px] flex flex-col items-center"
          >
            <div className="relative mb-2">
              <NeonAvatarDisplay avatarId={secondPlace.avatar} size="sm" showGlow={false} />
              <div className="absolute -top-2 -left-1.5 w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-800 shadow-xs">
                2
              </div>
            </div>
            <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate max-w-full mb-0.5">
              {secondPlace.username}
            </div>
            <div className="text-xs font-semibold text-blue-600 mb-2">
              {secondPlace.score || 0} pts
            </div>

            {/* Silver Pedestal */}
            <div className="w-full h-28 sm:h-36 md:h-40 rounded-t-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-start pt-3 shadow-xs">
              <Medal className="w-5 h-5 text-slate-600 mb-1" />
              <span className="text-xs font-bold text-slate-600 tracking-wider">SILVER</span>
            </div>
          </motion.div>
        )}

        {/* 1ST PLACE (GOLD - CENTER - TALLEST) */}
        {firstPlace && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex-1 min-w-0 max-w-[130px] sm:max-w-[200px] flex flex-col items-center z-10"
          >
            <div className="relative mb-2 sm:mb-3">
              <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2">
                <Crown className="w-7 h-7 sm:w-8 sm:h-8 text-amber-500 fill-amber-400" />
              </div>
              <NeonAvatarDisplay avatarId={firstPlace.avatar} size="md" showGlow={false} />
              <div className="absolute -bottom-1 right-0 w-7 h-7 rounded-full bg-amber-400 border border-amber-500 flex items-center justify-center font-bold text-xs text-amber-950 shadow-xs">
                1
              </div>
            </div>
            <div className="font-bold text-xs sm:text-base text-gray-900 truncate max-w-full mb-0.5">
              {firstPlace.username}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-amber-600 mb-2">
              {firstPlace.score || 0} pts
            </div>

            {/* Gold Pedestal */}
            <div className="w-full h-36 sm:h-48 md:h-56 rounded-t-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-start pt-3 shadow-sm">
              <Trophy className="w-7 h-7 text-amber-500 fill-amber-400 mb-1" />
              <span className="text-xs sm:text-sm font-bold text-amber-800 tracking-wider">CHAMPION</span>
            </div>
          </motion.div>
        )}

        {/* 3RD PLACE (BRONZE - RIGHT) */}
        {thirdPlace && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex-1 min-w-0 max-w-[100px] sm:max-w-[170px] flex flex-col items-center"
          >
            <div className="relative mb-2">
              <NeonAvatarDisplay avatarId={thirdPlace.avatar} size="sm" showGlow={false} />
              <div className="absolute -top-2 -right-1.5 w-6 h-6 rounded-full bg-orange-200 border border-orange-300 flex items-center justify-center font-bold text-xs text-orange-800 shadow-xs">
                3
              </div>
            </div>
            <div className="font-semibold text-xs sm:text-sm text-gray-900 truncate max-w-full mb-0.5">
              {thirdPlace.username}
            </div>
            <div className="text-xs font-semibold text-orange-600 mb-2">
              {thirdPlace.score || 0} pts
            </div>

            {/* Bronze Pedestal */}
            <div className="w-full h-24 sm:h-28 md:h-32 rounded-t-2xl bg-orange-50 border border-orange-200 flex flex-col items-center justify-start pt-3 shadow-xs">
              <Medal className="w-5 h-5 text-orange-600 mb-1" />
              <span className="text-xs font-bold text-orange-700 tracking-wider">BRONZE</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* 2. PARTY AWARDS & HIGHLIGHTS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full bg-white rounded-2xl p-4 sm:p-6 mb-6 border border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm sm:text-base font-bold text-gray-900">
              Match Highlights & Awards
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-medium">Party Recap</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {partyAwards.map((award) => (
            <div
              key={award.id}
              className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{award.badgeIcon}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 font-mono">
                    {award.scoreOrStat}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                  {award.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {award.description}
                </p>
                {award.thumbnail && (
                  <div className="mt-2.5 p-1.5 rounded-lg border border-gray-200 bg-white flex flex-col items-center">
                    <img src={award.thumbnail} alt="Masterpiece" className="w-full h-24 object-contain rounded" />
                    <span className="text-[10px] text-gray-500 font-mono mt-1">Drawing Snapshot 🎨</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-200 flex items-center gap-2">
                <NeonAvatarDisplay avatarId={award.recipientAvatar} size="sm" showGlow={false} />
                <span className="text-xs font-semibold text-gray-800 truncate">
                  {award.recipientUsername}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 3. SHAREABLE RECAP CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-white rounded-2xl p-5 sm:p-6 mb-6 border border-gray-200 shadow-sm"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Card Blueprint */}
          <div className="w-full md:w-3/5 bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-200">
              <BrandLogo size="nav" showSubtitle={false} />
              <div className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-semibold text-blue-700">
                Match Recap
              </div>
            </div>

            <div className="flex items-center gap-3.5 my-2">
              <div className="relative">
                <NeonAvatarDisplay
                  avatarId={currentPlayer?.avatar || firstPlace?.avatar || 'cyber_cat'}
                  size="md"
                  showGlow={false}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  #{myRank}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Player Standings
                </div>
                <div className="text-base font-bold text-gray-900 truncate">
                  {currentPlayer?.username || firstPlace?.username}
                </div>
                <div className="text-xs font-semibold text-blue-600 font-mono">
                  Score: {currentPlayer?.score || firstPlace?.score || 0} pts
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-gray-200 text-center">
              <div className="bg-white border border-gray-200 p-2 rounded-lg">
                <div className="text-[10px] uppercase font-medium text-gray-500">Room</div>
                <div className="text-xs font-bold text-blue-600 font-mono">{room.code}</div>
              </div>
              <div className="bg-white border border-gray-200 p-2 rounded-lg">
                <div className="text-[10px] uppercase font-medium text-gray-500">Players</div>
                <div className="text-xs font-bold text-gray-800 font-mono">{room.players.length}</div>
              </div>
              <div className="bg-white border border-gray-200 p-2 rounded-lg">
                <div className="text-[10px] uppercase font-medium text-gray-500">Total Sips</div>
                <div className="text-xs font-bold text-rose-600 font-mono">
                  {Object.values(room.sipsCount || {}).reduce((a, b) => a + b, 0)} 🥤
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Share Buttons */}
          <div className="w-full md:w-2/5 flex flex-col gap-2.5">
            <div>
              <h4 className="text-base font-bold text-gray-900">Share Results</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Share your score card with friends or export as image
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowStoryModal(true);
              }}
              className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Export Story Card (PNG)</span>
            </button>

            <button
              onClick={handleShareVictory}
              className="w-full h-11 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              {copiedStats ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-gray-600" />}
              <span>{copiedStats ? 'Copied to Clipboard!' : 'Share Match Recap'}</span>
            </button>

            <button
              onClick={handleCopyInviteLink}
              className="w-full h-10 px-4 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              {copiedShareLink ? <Check className="w-4 h-4 text-blue-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
              <span>{copiedShareLink ? 'Link Copied!' : 'Copy Room Invite Link'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* COMPLETE SCOREBOARD */}
      <div className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 mb-6">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-600" />
          <span>Full Scoreboard ({sortedPlayers.length} Players)</span>
        </h3>

        <div className="space-y-1.5">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className={`py-2 px-3 flex items-center justify-between rounded-xl border transition-all ${
                player.id === currentPlayer?.id ? 'bg-blue-50/60 border-blue-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="w-5 text-center font-bold text-xs text-gray-500">#{idx + 1}</span>
                <NeonAvatarDisplay avatarId={player.avatar} size="sm" showGlow={false} />
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate max-w-[120px] sm:max-w-none">{player.username}</span>
                  {player.id === currentPlayer?.id && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">
                      You
                    </span>
                  )}
                  {room.config.isTeamMode && player.team && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                        player.team === 'red'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {player.team}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {room.sipsCount?.[player.id] !== undefined && (
                  <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    {room.sipsCount[player.id]} Sips 🥤
                  </span>
                )}
                <div className="font-mono font-bold text-xs sm:text-sm text-gray-900 flex-shrink-0">
                  {player.score || 0} pts
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REMATCH / PLAY AGAIN CONTROLS */}
      <div className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl p-4 sm:p-6 text-center">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {isHost ? (
          <div className="space-y-4 max-w-md mx-auto">
            <h4 className="text-sm sm:text-base font-bold text-gray-900 flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600" />
              <span>Next Game Selection (Keep All Players in Room)</span>
            </h4>
            <p className="text-xs text-gray-500">
              Pick the next game mode and launch instantly without having to rejoin:
            </p>

            <div className="grid grid-cols-2 gap-2 text-left">
              {GAME_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedNextGame(g.id);
                  }}
                  className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 ${
                    selectedNextGame === g.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <GameIcon gameMode={g.id} size="sm" />
                  <span className="truncate">{g.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleRematch}
              disabled={isRematching}
              className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isRematching ? (
                <span>Starting Rematch...</span>
              ) : (
                <>
                  <span>Play Rematch Now</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2 py-3">
            <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-sm">
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Waiting for Host to Choose the Next Game...</span>
            </div>
            <p className="text-xs text-gray-500">
              Stay in the room! All players will automatically transition to the next match together.
            </p>
          </div>
        )}
      </div>

      {/* 9:16 Story Recap Modal */}
      <ShareRecapCard
        room={room}
        currentPlayer={currentPlayer}
        awards={partyAwards}
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
      />
    </div>
  );
}
