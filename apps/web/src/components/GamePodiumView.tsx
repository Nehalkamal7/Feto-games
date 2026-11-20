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
          title: 'Player of the Night (MVP)',
          description: 'Dominated the matches with supreme arcade brilliance!',
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

  // Play fanfare sound and launch confetti cascade on mount
  useEffect(() => {
    sound.playFanfare();
    sound.triggerHaptic(80);

    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#0B89FD', '#FEC90E', '#FD3F01', '#010101']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#0B89FD', '#FEC90E', '#FD3F01', '#010101']
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

  // Viral Share Handler (Instagram / TikTok / WhatsApp / Direct Link)
  const handleShareVictory = async () => {
    sound.playClick();
    const shareText = `🏆 FETO GAMES CHAMPIONSHIP 🏆\n🎮 Game: ${room.config.gameMode.replace(/_/g, ' ').toUpperCase()}\n🥇 1st Place: ${firstPlace?.username || 'Champ'} (${firstPlace?.score || 0} PTS)\n🔥 Room: ${room.code}\nPlay now at ${window.location.origin}`;

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

  // Team score aggregates if in Team Mode
  const teamScores = room.teamScores || {};
  const teamsRanked = [
    { team: 'red', name: 'Red Team', score: teamScores.red || 0, color: 'text-[#FD3F01]', bg: 'bg-[#FD3F01]/10 border-2 border-[#010101]' },
    { team: 'blue', name: 'Blue Team', score: teamScores.blue || 0, color: 'text-[#0B89FD]', bg: 'bg-[#0B89FD]/10 border-2 border-[#010101]' },
    { team: 'green', name: 'Green Team', score: teamScores.green || 0, color: 'text-[#010101]', bg: 'bg-[#FEC90E]/20 border-2 border-[#010101]' }
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-start py-6 px-3 relative z-10">
      {/* HEADER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] border-2 border-[#010101] text-xs font-black uppercase tracking-wider text-[#010101] mb-3 shadow-[2px_2px_0px_#010101]">
          <Sparkles className="w-4 h-4 text-[#FEC90E]" />
          <span>Match Concluded • Victory Ceremony</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-[#010101] tracking-tight">
          FINAL <span className="text-[#0B89FD]">PODIUM</span>
        </h1>
        <p className="text-[#010101]/70 text-sm mt-1 font-medium">
          {room.config.isTeamMode ? 'Team & Individual Standings' : 'All players ranked by arcade party glory'}
        </p>
      </motion.div>

      {/* TEAM MODE SCORES (IF TEAM MODE ENABLED) */}
      {room.config.isTeamMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full mb-8 bg-[#FFFFFF] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-xs font-black uppercase tracking-wider text-[#010101]">
            <Shield className="w-4 h-4 text-[#0B89FD]" />
            <span>Team Championship Leaderboard</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {teamsRanked.map((t, idx) => (
              <div
                key={t.team}
                className={`p-4 rounded-xl flex flex-col items-center justify-between ${t.bg} ${
                  idx === 0 ? 'shadow-[4px_4px_0px_#010101]' : 'shadow-[2px_2px_0px_#010101]'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm">
                  {idx === 0 && <Crown className="w-4 h-4 text-[#FEC90E] fill-[#FEC90E]" />}
                  <span className={t.color}>{t.name}</span>
                </div>
                <div className="text-3xl font-black text-[#010101] my-2">{t.score} pts</div>
                <div className="text-[11px] text-[#010101]/70 font-bold">
                  {room.players.filter((p) => p.team === t.team).length} players
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3D ANIMATED PODIUM PEDESTALS */}
      <div className="w-full flex items-end justify-center gap-2 sm:gap-4 md:gap-6 mb-8 pt-8 min-h-[280px] sm:min-h-[320px]">
        {/* 2ND PLACE (SILVER / BLUE - LEFT) */}
        {secondPlace && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 min-w-0 max-w-[100px] sm:max-w-[170px] flex flex-col items-center"
          >
            <div className="relative mb-2">
              <NeonAvatarDisplay avatarId={secondPlace.avatar} size="sm" showGlow={false} />
              <div className="absolute -top-2.5 -left-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#0B89FD] border-2 border-[#010101] flex items-center justify-center font-black text-xs text-white shadow-[2px_2px_0px_#010101]">
                2
              </div>
            </div>
            <div className="font-black text-xs sm:text-sm text-[#010101] truncate max-w-full mb-0.5 sm:mb-1">
              {secondPlace.username}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-[#0B89FD] mb-1 sm:mb-2">
              {secondPlace.score || 0} pts
            </div>

            {/* Silver Pedestal */}
            <div className="w-full h-28 sm:h-36 md:h-44 rounded-t-2xl bg-[#FFFFFF] border-2 border-[#010101] flex flex-col items-center justify-start pt-2 sm:pt-3 shadow-[4px_4px_0px_#010101]">
              <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-[#010101] mb-0.5 sm:mb-1" />
              <span className="text-[10px] sm:text-xs font-black text-[#010101] tracking-wider">SILVER</span>
            </div>
          </motion.div>
        )}

        {/* 1ST PLACE (GOLD - CENTER - TALLEST) */}
        {firstPlace && (
          <motion.div
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex-1 min-w-0 max-w-[130px] sm:max-w-[200px] flex flex-col items-center z-10"
          >
            <div className="relative mb-2 sm:mb-3">
              <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2">
                <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-[#FEC90E] fill-[#FEC90E] drop-shadow-[2px_2px_0px_#010101]" />
              </div>
              <NeonAvatarDisplay avatarId={firstPlace.avatar} size="md" showGlow={false} />
              <div className="absolute -bottom-1 sm:-bottom-2 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FEC90E] border-2 border-[#010101] flex items-center justify-center font-black text-xs sm:text-sm text-[#010101] shadow-[2px_2px_0px_#010101]">
                1
              </div>
            </div>
            <div className="font-black text-xs sm:text-base text-[#010101] truncate max-w-full mb-0.5 sm:mb-1">
              {firstPlace.username}
            </div>
            <div className="text-xs sm:text-sm font-black text-[#010101] mb-1 sm:mb-2">
              {firstPlace.score || 0} pts
            </div>

            {/* Gold Pedestal */}
            <div className="w-full h-36 sm:h-48 md:h-60 rounded-t-2xl bg-[#FEC90E] border-4 border-[#010101] flex flex-col items-center justify-start pt-2 sm:pt-4 shadow-[6px_6px_0px_#010101]">
              <Trophy className="w-7 h-7 sm:w-9 sm:h-9 text-[#010101] fill-[#010101] mb-0.5 sm:mb-1" />
              <span className="text-[11px] sm:text-sm font-black text-[#010101] tracking-widest">CHAMP</span>
            </div>
          </motion.div>
        )}

        {/* 3RD PLACE (BRONZE / RED - RIGHT) */}
        {thirdPlace && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 min-w-0 max-w-[100px] sm:max-w-[170px] flex flex-col items-center"
          >
            <div className="relative mb-2">
              <NeonAvatarDisplay avatarId={thirdPlace.avatar} size="sm" showGlow={false} />
              <div className="absolute -top-2.5 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FD3F01] border-2 border-[#010101] flex items-center justify-center font-black text-xs text-white shadow-[2px_2px_0px_#010101]">
                3
              </div>
            </div>
            <div className="font-black text-xs sm:text-sm text-[#010101] truncate max-w-full mb-0.5 sm:mb-1">
              {thirdPlace.username}
            </div>
            <div className="text-[11px] sm:text-xs font-black text-[#FD3F01] mb-1 sm:mb-2">
              {thirdPlace.score || 0} pts
            </div>

            {/* Bronze Pedestal */}
            <div className="w-full h-24 sm:h-28 md:h-36 rounded-t-2xl bg-[#F8F8F8] border-2 border-[#010101] flex flex-col items-center justify-start pt-2 sm:pt-3 shadow-[4px_4px_0px_#010101]">
              <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-[#FD3F01] mb-0.5 sm:mb-1" />
              <span className="text-[10px] sm:text-xs font-black text-[#FD3F01] tracking-wider">BRONZE</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. SPECIALIZED FUNNY PARTY AWARDS & MVP                   */}
      {/* ======================================================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-[#FFFFFF] rounded-3xl p-4 sm:p-6 mb-8 border-2 border-[#010101] shadow-[6px_6px_0px_#010101]"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#FEC90E]" />
            <h3 className="text-sm sm:text-base font-black text-[#010101] uppercase tracking-wider">
              Party Awards & MVP Ceremony
            </h3>
          </div>
          <span className="text-[11px] text-[#010101]/70 font-black">Hall of Fame</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {partyAwards.map((award) => (
            <div
              key={award.id}
              className="bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl p-4 flex flex-col justify-between shadow-[2px_2px_0px_#010101]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-emoji">{award.badgeIcon}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEC90E] border border-[#010101] text-[10px] font-black text-[#010101] font-mono">
                    {award.scoreOrStat}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-[#010101]">
                  {award.title}
                </h4>
                <p className="text-[11px] text-[#010101]/70 mt-1 leading-relaxed font-medium">
                  {award.description}
                </p>
                {award.thumbnail && (
                  <div className="mt-2.5 p-1.5 rounded-xl border-2 border-[#010101] bg-[#FFFFFF] flex flex-col items-center">
                    <img src={award.thumbnail} alt="Masterpiece" className="w-full h-24 object-contain rounded" />
                    <span className="text-[9px] text-[#010101] font-mono mt-1 font-bold">Hall of Shame Snapshot 🎨</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 border-t-2 border-[#010101]/10 flex items-center gap-2">
                <NeonAvatarDisplay avatarId={award.recipientAvatar} size="sm" showGlow={false} />
                <span className="text-xs font-black text-[#010101] truncate">
                  {award.recipientUsername}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ======================================================== */}
      {/* 3. SHAREABLE VICTORY CARD (VIRAL MARKETING READY)        */}
      {/* ======================================================== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full bg-[#FFFFFF] rounded-3xl p-5 sm:p-7 mb-8 border-2 border-[#010101] shadow-[6px_6px_0px_#010101] relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: The Card Blueprint */}
          <div className="w-full md:w-3/5 bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl p-5 shadow-[4px_4px_0px_#010101] relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#010101]/10">
              <BrandLogo size="nav" showSubtitle={false} />
              <div className="px-2.5 py-0.5 rounded-full bg-[#FEC90E] border-2 border-[#010101] text-[10px] font-black uppercase text-[#010101] tracking-wider">
                Official Match Card
              </div>
            </div>

            <div className="flex items-center gap-4 my-3">
              <div className="relative">
                <NeonAvatarDisplay
                  avatarId={currentPlayer?.avatar || firstPlace?.avatar || 'cyber_cat'}
                  size="md"
                  showGlow={false}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FEC90E] border-2 border-[#010101] text-[#010101] font-black text-xs flex items-center justify-center">
                  #{myRank}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-wider text-[#010101]/60 font-black">
                  Party Contestant
                </div>
                <div className="text-lg font-black text-[#010101] truncate">
                  {currentPlayer?.username || firstPlace?.username}
                </div>
                <div className="text-xs font-black text-[#0B89FD] font-mono">
                  Score: {currentPlayer?.score || firstPlace?.score || 0} PTS
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t-2 border-[#010101]/10 text-center">
              <div className="bg-[#FFFFFF] border-2 border-[#010101] p-2 rounded-xl">
                <div className="text-[9px] uppercase font-black text-[#010101]/60">Room</div>
                <div className="text-xs font-black text-[#0B89FD] font-mono">{room.code}</div>
              </div>
              <div className="bg-[#FFFFFF] border-2 border-[#010101] p-2 rounded-xl">
                <div className="text-[9px] uppercase font-black text-[#010101]/60">Players</div>
                <div className="text-xs font-black text-[#010101] font-mono">{room.players.length}</div>
              </div>
              <div className="bg-[#FFFFFF] border-2 border-[#010101] p-2 rounded-xl">
                <div className="text-[9px] uppercase font-black text-[#010101]/60">Total Sips</div>
                <div className="text-xs font-black text-[#FD3F01] font-mono">
                  {Object.values(room.sipsCount || {}).reduce((a, b) => a + b, 0)} 🥤
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Viral Share Buttons */}
          <div className="w-full md:w-2/5 flex flex-col gap-3">
            <div>
              <h4 className="text-base font-black text-[#010101]">Share Your Victory</h4>
              <p className="text-xs text-[#010101]/70 font-medium mt-0.5">
                Post your match stats directly to Instagram, TikTok or WhatsApp and challenge your crew!
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowStoryModal(true);
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all"
            >
              <Sparkles className="w-4 h-4 text-[#FEC90E]" />
              <span>Export 9:16 Story Card (PNG)</span>
            </button>

            <button
              onClick={handleShareVictory}
              className="w-full py-3 px-4 rounded-xl bg-[#FEC90E] hover:bg-[#fed338] text-[#010101] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all"
            >
              {copiedStats ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copiedStats ? 'Victory Copied!' : 'Share Match Recap'}</span>
            </button>

            <button
              onClick={handleCopyInviteLink}
              className="w-full py-2.5 px-4 rounded-xl bg-[#FFFFFF] hover:bg-[#F8F8F8] text-[#010101] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#010101] shadow-[2px_2px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_#010101] transition-all"
            >
              {copiedShareLink ? <Check className="w-4 h-4 text-[#0B89FD]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedShareLink ? 'Invite Link Copied!' : 'Copy Room Invite Link'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* FULL 15-PLAYER SCOREBOARD LIST */}
      <div className="w-full bg-[#FFFFFF] border-2 border-[#010101] shadow-[6px_6px_0px_#010101] rounded-2xl p-3 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#010101] mb-3 sm:mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#0B89FD]" />
          <span>Complete Room Scoreboard ({sortedPlayers.length} Players)</span>
        </h3>

        <div className="space-y-1.5">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className={`py-2 px-2.5 sm:py-2.5 sm:px-3 flex items-center justify-between rounded-xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101] transition-all ${
                player.id === currentPlayer?.id ? 'bg-[#0B89FD]/10' : 'bg-[#F8F8F8]'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 truncate">
                <span className="w-5 text-center font-black text-xs text-[#010101]">#{idx + 1}</span>
                <NeonAvatarDisplay avatarId={player.avatar} size="sm" showGlow={false} />
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-black text-xs sm:text-sm text-[#010101] truncate max-w-[110px] sm:max-w-none">{player.username}</span>
                  {player.id === currentPlayer?.id && (
                    <span className="text-[9px] sm:text-[10px] bg-[#0B89FD] text-white px-1.5 py-0.5 rounded font-black border border-[#010101]">
                      You
                    </span>
                  )}
                  {room.config.isTeamMode && player.team && (
                    <span
                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-black uppercase border border-[#010101] ${
                        player.team === 'red'
                          ? 'bg-[#FD3F01] text-white'
                          : player.team === 'blue'
                          ? 'bg-[#0B89FD] text-white'
                          : 'bg-[#FEC90E] text-[#010101]'
                      }`}
                    >
                      {player.team}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {room.sipsCount?.[player.id] !== undefined && (
                  <span className="text-[10px] font-black text-[#FD3F01] bg-[#FD3F01]/10 px-2 py-0.5 rounded-full border border-[#FD3F01]">
                    {room.sipsCount[player.id]} Sips 🥤
                  </span>
                )}
                <div className="font-mono font-black text-xs sm:text-sm text-[#010101] flex-shrink-0">
                  {player.score || 0} pts
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REMATCH / PLAY AGAIN CONTROLS */}
      <div className="w-full bg-[#FFFFFF] border-2 border-[#010101] shadow-[6px_6px_0px_#010101] rounded-2xl p-4 sm:p-6 text-center">
        {errorMessage && (
          <div className="mb-4 p-3 bg-[#FD3F01]/10 border-2 border-[#FD3F01] rounded-xl text-[#FD3F01] text-xs font-bold">
            {errorMessage}
          </div>
        )}

        {isHost ? (
          <div className="space-y-4 max-w-md mx-auto">
            <h4 className="text-sm sm:text-base font-black text-[#010101] flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-[#0B89FD]" />
              <span>1-Click Rematch (Keep All Players in Room)</span>
            </h4>
            <p className="text-xs text-[#010101]/70 font-medium">
              Pick the next game mode and launch instantly without anyone having to rejoin:
            </p>

            <div className="grid grid-cols-2 gap-2 text-left">
              {GAME_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    sound.playClick();
                    setSelectedNextGame(g.id);
                  }}
                  className={`min-h-[48px] p-2.5 rounded-xl border-2 border-[#010101] text-xs font-black transition-all touch-target flex items-center gap-2 ${
                    selectedNextGame === g.id
                      ? 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                      : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
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
              className="w-full min-h-[52px] py-3.5 sm:py-4 rounded-2xl bg-[#0B89FD] hover:bg-[#0977db] text-white font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101] transition-all disabled:opacity-50 touch-target"
            >
              {isRematching ? (
                <span>Starting Rematch...</span>
              ) : (
                <>
                  <span>Play Rematch Now</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-center gap-2 text-[#0B89FD] font-black text-sm">
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Waiting for Room Host to Pick the Next Game...</span>
            </div>
            <p className="text-xs text-[#010101]/70 font-medium">
              Stay in this room! All players will automatically transition to the next match together.
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
