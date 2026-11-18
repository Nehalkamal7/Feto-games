'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, RotateCcw, Sparkles, Users, ArrowRight, Shield } from 'lucide-react';
import { GameMode, PlayerSummary, PublicRoomState } from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { socketRematch } from '@/lib/socket';
import { sound } from '@/lib/sound';

const GAME_OPTIONS: { id: GameMode; name: string }[] = [
  { id: 'who_is_imposter', name: 'Who Is The Imposter?' },
  { id: 'draw_and_guess', name: 'Draw & Guess' },
  { id: 'quiz_battle', name: 'Quiz Battle' },
  { id: 'word_battle', name: 'Word Battle' },
  { id: 'truth_or_dare', name: 'Truth or Dare' },
  { id: 'never_have_i_ever', name: 'Never Have I Ever' }
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

  const isHost = currentPlayer?.isHost ?? false;

  // Sort players by score descending
  const sortedPlayers = [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0));

  const firstPlace = sortedPlayers[0];
  const secondPlace = sortedPlayers[1];
  const thirdPlace = sortedPlayers[2];

  // Play fanfare sound upon mounting podium
  useEffect(() => {
    sound.playFanfare();
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

  // Team score aggregates if in Team Mode
  const teamScores = room.teamScores || {};
  const teamsRanked = [
    { team: 'red', name: 'Red Team', score: teamScores.red || 0, color: 'text-red-400', bg: 'bg-red-950/40 border-red-500/40' },
    { team: 'blue', name: 'Blue Team', score: teamScores.blue || 0, color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-500/40' },
    { team: 'green', name: 'Green Team', score: teamScores.green || 0, color: 'text-green-400', bg: 'bg-green-950/40 border-green-500/40' }
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-start py-6 px-3 relative z-10">
      {/* Background Celebration Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-feto-magenta/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-yellow-500/30 text-xs font-bold uppercase tracking-wider text-yellow-300 mb-3 shadow-neon-amber">
          <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
          <span>Match Concluded • Victory Ceremony</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 drop-shadow-[0_0_25px_rgba(255,230,0,0.5)]">
          FINAL PODIUM
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {room.config.isTeamMode ? 'Team & Individual Standings' : 'All 15 players ranked by arcade glory'}
        </p>
      </motion.div>

      {/* TEAM MODE SCORES (IF TEAM MODE ENABLED) */}
      {room.config.isTeamMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full mb-8 glass-panel-neon rounded-2xl p-4 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-cyan-300">
            <Shield className="w-4 h-4" />
            <span>Team Championship Leaderboard</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {teamsRanked.map((t, idx) => (
              <div
                key={t.team}
                className={`p-4 rounded-xl border flex flex-col items-center justify-between ${t.bg} ${
                  idx === 0 ? 'ring-2 ring-yellow-400 shadow-neon-gold' : ''
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm">
                  {idx === 0 && <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                  <span className={t.color}>{t.name}</span>
                </div>
                <div className="text-3xl font-extrabold text-white my-2">{t.score} pts</div>
                <div className="text-[11px] text-slate-400">
                  {room.players.filter((p) => p.team === t.team).length} players
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 3D ANIMATED PODIUM PEDESTALS */}
      <div className="w-full flex items-end justify-center gap-1.5 sm:gap-4 md:gap-6 mb-8 pt-8 min-h-[280px] sm:min-h-[320px]">
        {/* 2ND PLACE (SILVER - LEFT) */}
        {secondPlace && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 min-w-0 max-w-[95px] sm:max-w-[170px] flex flex-col items-center"
          >
            <div className="relative mb-2">
              <NeonAvatarDisplay avatarId={secondPlace.avatar} size="sm" showGlow />
              <div className="absolute -top-2.5 -left-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-300 border-2 border-white flex items-center justify-center font-black text-xs text-black shadow-lg">
                2
              </div>
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-full mb-0.5 sm:mb-1">
              {secondPlace.username}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-cyan-300 mb-1 sm:mb-2">
              {secondPlace.score || 0} pts
            </div>

            {/* Silver Pedestal */}
            <div className="w-full h-28 sm:h-36 md:h-44 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-t from-slate-900 to-slate-700/80 border-t-2 border-l border-r border-slate-400 flex flex-col items-center justify-start pt-2 sm:pt-3 shadow-[0_0_20px_rgba(148,163,184,0.3)]">
              <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-slate-300 mb-0.5 sm:mb-1" />
              <span className="text-[10px] sm:text-xs font-extrabold text-slate-300 tracking-wider">SILVER</span>
            </div>
          </motion.div>
        )}

        {/* 1ST PLACE (GOLD - CENTER - TALLEST) */}
        {firstPlace && (
          <motion.div
            initial={{ opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex-1 min-w-0 max-w-[120px] sm:max-w-[200px] flex flex-col items-center z-10"
          >
            <div className="relative mb-2 sm:mb-3">
              <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2">
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 fill-yellow-400 animate-bounce" />
              </div>
              <NeonAvatarDisplay avatarId={firstPlace.avatar} size="md" showGlow />
              <div className="absolute -bottom-1 sm:-bottom-2 right-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 border-2 border-white flex items-center justify-center font-black text-xs sm:text-sm text-black shadow-neon-gold">
                1
              </div>
            </div>
            <div className="font-black text-xs sm:text-base text-yellow-300 truncate max-w-full mb-0.5 sm:mb-1 drop-shadow-sm">
              {firstPlace.username}
            </div>
            <div className="text-xs sm:text-sm font-extrabold text-white mb-1 sm:mb-2">
              {firstPlace.score || 0} pts
            </div>

            {/* Gold Pedestal */}
            <div className="w-full h-36 sm:h-48 md:h-60 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-t from-amber-950/80 to-yellow-600/90 border-t-4 border-l-2 border-r-2 border-yellow-300 flex flex-col items-center justify-start pt-2 sm:pt-4 shadow-neon-gold">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-200 fill-yellow-200 mb-0.5 sm:mb-1" />
              <span className="text-[11px] sm:text-sm font-black text-yellow-100 tracking-widest">CHAMP</span>
            </div>
          </motion.div>
        )}

        {/* 3RD PLACE (BRONZE - RIGHT) */}
        {thirdPlace && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex-1 min-w-0 max-w-[95px] sm:max-w-[170px] flex flex-col items-center"
          >
            <div className="relative mb-2">
              <NeonAvatarDisplay avatarId={thirdPlace.avatar} size="sm" showGlow />
              <div className="absolute -top-2.5 -right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-700 border-2 border-amber-400 flex items-center justify-center font-black text-xs text-white shadow-lg">
                3
              </div>
            </div>
            <div className="font-bold text-xs sm:text-sm text-slate-300 truncate max-w-full mb-0.5 sm:mb-1">
              {thirdPlace.username}
            </div>
            <div className="text-[11px] sm:text-xs font-semibold text-amber-400 mb-1 sm:mb-2">
              {thirdPlace.score || 0} pts
            </div>

            {/* Bronze Pedestal */}
            <div className="w-full h-24 sm:h-28 md:h-36 rounded-t-xl sm:rounded-t-2xl bg-gradient-to-t from-slate-950 to-amber-900/60 border-t-2 border-l border-r border-amber-600 flex flex-col items-center justify-start pt-2 sm:pt-3 shadow-[0_0_20px_rgba(217,119,6,0.2)]">
              <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mb-0.5 sm:mb-1" />
              <span className="text-[10px] sm:text-xs font-extrabold text-amber-400 tracking-wider">BRONZE</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* FULL 15-PLAYER SCOREBOARD LIST */}
      <div className="w-full glass-panel rounded-2xl p-3 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 sm:mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Complete Room Scoreboard ({sortedPlayers.length} Players)</span>
        </h3>

        <div className="divide-y divide-slate-800">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className={`py-2 px-2.5 sm:py-2.5 sm:px-3 flex items-center justify-between rounded-xl transition-all ${
                player.id === currentPlayer?.id ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 truncate">
                <span className="w-5 text-center font-bold text-xs text-slate-400">#{idx + 1}</span>
                <NeonAvatarDisplay avatarId={player.avatar} size="sm" />
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-xs sm:text-sm text-white truncate max-w-[110px] sm:max-w-none">{player.username}</span>
                  {player.id === currentPlayer?.id && (
                    <span className="text-[9px] sm:text-[10px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded font-semibold">
                      You
                    </span>
                  )}
                  {room.config.isTeamMode && player.team && (
                    <span
                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        player.team === 'red'
                          ? 'bg-red-950 text-red-300 border border-red-500/30'
                          : player.team === 'blue'
                          ? 'bg-blue-950 text-blue-300 border border-blue-500/30'
                          : 'bg-green-950 text-green-300 border border-green-500/30'
                      }`}
                    >
                      {player.team}
                    </span>
                  )}
                </div>
              </div>
              <div className="font-mono font-black text-xs sm:text-sm text-yellow-400 flex-shrink-0 ml-2">
                {player.score || 0} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REMATCH / PLAY AGAIN CONTROLS */}
      <div className="w-full glass-panel-neon rounded-2xl p-4 sm:p-6 text-center">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-red-300 text-xs">
            {errorMessage}
          </div>
        )}

        {isHost ? (
          <div className="space-y-4 max-w-md mx-auto">
            <h4 className="text-sm sm:text-base font-extrabold text-white flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
              <span>1-Click Rematch (Keep All Players in Room)</span>
            </h4>
            <p className="text-xs text-slate-400">
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
                  className={`min-h-[48px] p-2.5 rounded-xl border text-xs font-bold transition-all touch-target flex items-center justify-start ${
                    selectedNextGame === g.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-cyan'
                      : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleRematch}
              disabled={isRematching}
              className="w-full min-h-[52px] py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 hover:brightness-110 text-black font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-magenta transition-all active:scale-95 disabled:opacity-50 touch-target"
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
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-sm">
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Waiting for Room Host to Pick the Next Game...</span>
            </div>
            <p className="text-xs text-slate-400">
              Stay in this room! All players will automatically transition to the next match together.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
