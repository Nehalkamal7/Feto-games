'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NeverHaveIEverPublicState,
  PlayerSummary
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import {
  Shield,
  Heart,
  Clock,
  Sparkles,
  Trophy,
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';
import { sound } from '@/lib/sound';
import { getSocket } from '@/lib/socket';

interface NeverHaveIEverGameViewProps {
  gameState: NeverHaveIEverPublicState;
  currentPlayer: PlayerSummary;
  players: PlayerSummary[];
  roomCode: string;
}

export const NeverHaveIEverGameView: React.FC<NeverHaveIEverGameViewProps> = ({
  gameState,
  currentPlayer,
  players,
  roomCode: _roomCode
}) => {
  const socket = getSocket();

  const [selectedChoice, setSelectedChoice] = useState<'have' | 'havenot' | null>(null);

  const hasVoted = Boolean(gameState.roundChoices[currentPlayer.id]) || Boolean(selectedChoice);
  const myInnocence = gameState.innocencePoints[currentPlayer.id] ?? 10;

  const handleChoose = (choice: 'have' | 'havenot') => {
    if (hasVoted || gameState.phase !== 'statement') return;
    if (choice === 'have') sound.playFanfare();
    else sound.playReady();

    setSelectedChoice(choice);
    socket.emit('nhie:submit_choice', { choice });
  };

  const timerPercent = Math.max(0, Math.min(100, (gameState.remainingSeconds / 15) * 100));

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-2 md:p-4">
      {/* ======================================================== */}
      {/* HEADER: ROUND, CATEGORY & INNOCENCE METER                */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 md:p-6 rounded-3xl border border-feto-border shadow-neon-cyan">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-feto-magenta flex items-center justify-center text-black shadow-neon-cyan">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-wider border border-cyan-500/30">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-feto-magenta/20 text-feto-magenta text-xs font-bold uppercase tracking-wider border border-feto-magenta/30">
                {gameState.category}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">
              Never Have I Ever
            </h2>
          </div>
        </div>

        {/* Current Player Innocence Badge */}
        <div className="flex items-center gap-3 bg-feto-card px-4 py-2 rounded-2xl border border-feto-border">
          <div className="flex items-center gap-1 text-feto-magenta">
            <Heart className="w-5 h-5 fill-feto-magenta animate-pulse" />
            <span className="text-lg font-black">{myInnocence}</span>
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Innocence Points
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 15-SECOND SYNCHRONIZED TIMER BAR                         */}
      {/* ======================================================== */}
      <div className="w-full">
        <div className="flex justify-between items-center text-xs font-bold uppercase text-cyan-300 mb-1 px-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {gameState.phase === 'statement' ? 'Voting Phase' : 'Group Reveal'}
          </span>
          <span>{gameState.remainingSeconds}s Remaining</span>
        </div>
        <div className="w-full h-3 bg-feto-dark rounded-full overflow-hidden border border-cyan-500/30">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-feto-magenta to-yellow-400 transition-all duration-1000 ease-linear"
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN STATEMENT CARD                                      */}
      {/* ======================================================== */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl text-center space-y-6 border border-cyan-500/40 shadow-neon-cyan relative overflow-hidden">
        <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
          Statement #{gameState.round}
        </span>
        <h3 className="text-2xl md:text-4xl font-extrabold text-white leading-relaxed font-display">
          &ldquo;{gameState.statement}&rdquo;
        </h3>
      </div>

      {/* ======================================================== */}
      {/* ACTION BUTTONS (STATEMENT PHASE)                         */}
      {/* ======================================================== */}
      {gameState.phase === 'statement' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto w-full">
          <motion.button
            whileHover={!hasVoted ? { scale: 1.05 } : {}}
            whileTap={!hasVoted ? { scale: 0.95 } : {}}
            disabled={hasVoted}
            onClick={() => handleChoose('have')}
            className={`p-6 md:p-8 rounded-3xl border-2 flex flex-col items-center gap-2 font-black text-2xl transition-all ${
              selectedChoice === 'have'
                ? 'bg-pink-950/80 border-feto-magenta text-feto-magenta shadow-neon-magenta ring-2 ring-feto-magenta'
                : hasVoted
                ? 'opacity-40 cursor-not-allowed bg-feto-card border-feto-border text-slate-500'
                : 'bg-feto-card border-feto-border hover:border-feto-magenta text-white shadow-lg'
            }`}
          >
            <span className="text-4xl">🙋‍♂️</span>
            <span>I HAVE</span>
            <span className="text-xs text-pink-300 font-bold uppercase tracking-wider">
              -1 Innocence Point
            </span>
          </motion.button>

          <motion.button
            whileHover={!hasVoted ? { scale: 1.05 } : {}}
            whileTap={!hasVoted ? { scale: 0.95 } : {}}
            disabled={hasVoted}
            onClick={() => handleChoose('havenot')}
            className={`p-6 md:p-8 rounded-3xl border-2 flex flex-col items-center gap-2 font-black text-2xl transition-all ${
              selectedChoice === 'havenot'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-neon-cyan ring-2 ring-cyan-400'
                : hasVoted
                ? 'opacity-40 cursor-not-allowed bg-feto-card border-feto-border text-slate-500'
                : 'bg-feto-card border-feto-border hover:border-cyan-400 text-white shadow-lg'
            }`}
          >
            <span className="text-4xl">😇</span>
            <span>I HAVEN&rsquo;T</span>
            <span className="text-xs text-cyan-300 font-bold uppercase tracking-wider">
              Keep Innocence Intact
            </span>
          </motion.button>
        </div>
      ) : (
        /* ======================================================== */
        /* GROUP REVEAL & PERCENTAGE STATS                          */
        /* ======================================================== */
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-feto-border space-y-6">
          {gameState.stats && (
            <div className="text-center space-y-2">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Group Confession Stats
              </span>
              <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-feto-magenta to-yellow-400 font-display">
                {gameState.stats.havePercentage}% of the room has done this!
              </div>

              {/* Graphical Percentage Bar */}
              <div className="w-full max-w-md mx-auto h-4 bg-cyan-950/80 rounded-full overflow-hidden border border-feto-border flex mt-3">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-feto-magenta"
                  style={{ width: `${gameState.stats.havePercentage}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  style={{ width: `${100 - gameState.stats.havePercentage}%` }}
                />
              </div>

              <div className="flex justify-between max-w-md mx-auto text-xs font-bold pt-1 px-1">
                <span className="text-feto-magenta">
                  🙋‍♂️ {gameState.stats.haveCount} Have
                </span>
                <span className="text-cyan-400">
                  😇 {gameState.stats.haveNotCount} Haven&rsquo;t
                </span>
              </div>
            </div>
          )}

          {/* Grid of Players with their revealed choices */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {players.map((p) => {
              const choice = gameState.roundChoices[p.id];
              const points = gameState.innocencePoints[p.id] ?? 10;
              const isHave = choice === 'have';
              return (
                <motion.div
                  key={p.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    isHave
                      ? 'bg-pink-950/30 border-feto-magenta/60 shadow-neon-pink'
                      : 'bg-cyan-950/30 border-cyan-400/60 shadow-neon-cyan'
                  }`}
                >
                  <NeonAvatarDisplay avatarId={p.avatar} size="sm" isGlowing={isHave} />
                  <span className="text-white font-bold text-xs truncate max-w-[90px]">
                    {p.username}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isHave
                        ? 'bg-feto-magenta/30 text-feto-magenta'
                        : 'bg-cyan-500/30 text-cyan-300'
                    }`}
                  >
                    {isHave ? 'I HAVE' : 'I HAVEN’T'}
                  </span>
                  <span className="text-xs text-yellow-400 font-mono font-bold flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-yellow-400" />
                    {points}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INNOCENCE STANDINGS (UP TO 15 PLAYERS)                    */}
      {/* ======================================================== */}
      <div className="glass-panel p-4 rounded-3xl border border-feto-border">
        <div className="flex items-center justify-between mb-3 px-2 border-b border-feto-border pb-2">
          <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-4 h-4 text-cyan-400" />
            Innocence Standings
          </span>
          <span className="text-xs text-slate-400">10 Initial Points</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {players
            .slice()
            .sort((a, b) => {
              const ptsA = gameState.innocencePoints[a.id] ?? 10;
              const ptsB = gameState.innocencePoints[b.id] ?? 10;
              return ptsB - ptsA;
            })
            .map((p, idx) => {
              const pts = gameState.innocencePoints[p.id] ?? 10;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-feto-dark border border-feto-border text-xs"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-500 font-bold w-3">#{idx + 1}</span>
                    <span className="text-white font-bold truncate max-w-[70px]">
                      {p.username}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-black ${
                      pts <= 3 ? 'text-red-400 animate-pulse' : 'text-yellow-400'
                    }`}
                  >
                    {pts} pts
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
