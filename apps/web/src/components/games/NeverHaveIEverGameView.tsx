'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NeverHaveIEverPublicState,
  PlayerSummary
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-2 md:p-4 select-none">
      {/* ======================================================== */}
      {/* HEADER: ROUND, CATEGORY & INNOCENCE METER                */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FFFFFF] p-4 md:p-6 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
        <div className="flex items-center gap-3">
          <GameIcon gameMode="never_have_i_ever" size="md" showContainer />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FFFFFF] text-[#010101] text-xs font-black uppercase tracking-wider border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FEC90E] text-[#010101] text-xs font-black uppercase tracking-wider border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                {gameState.category}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#010101] mt-1">
              Never Have I Ever
            </h2>
          </div>
        </div>

        {/* Current Player Innocence Badge */}
        <div className="flex items-center gap-3 bg-[#FFFFFF] px-4 py-2 rounded-2xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
          <div className="flex items-center gap-1.5 text-[#FD3F01]">
            <Heart strokeWidth={2.5} className="w-5 h-5 fill-[#FD3F01] animate-pulse shrink-0" />
            <span className="text-lg font-black">{myInnocence}</span>
          </div>
          <span className="text-xs text-[#010101]/70 font-black uppercase tracking-wider">
            Innocence Points
          </span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 15-SECOND SYNCHRONIZED TIMER BAR                         */}
      {/* ======================================================== */}
      <div className="w-full">
        <div className="flex justify-between items-center text-xs font-black uppercase text-[#010101] mb-1.5 px-1">
          <span className="flex items-center gap-1.5">
            <Clock strokeWidth={2.5} className="w-3.5 h-3.5 text-[#FD3F01] animate-spin shrink-0" />
            {gameState.phase === 'statement' ? 'Voting Phase' : 'Group Reveal'}
          </span>
          <span>{gameState.remainingSeconds}s Remaining</span>
        </div>
        <div className="w-full h-3 bg-[#F8F8F8] rounded-full overflow-hidden border-2 border-[#010101]">
          <div
            className="h-full bg-[#0B89FD] transition-all duration-1000 ease-linear"
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN STATEMENT CARD                                      */}
      {/* ======================================================== */}
      <div className="bg-[#FFFFFF] p-8 md:p-12 rounded-3xl text-center space-y-4 border-2 border-[#010101] shadow-[4px_4px_0px_#010101] relative overflow-hidden">
        <span className="text-xs font-black uppercase tracking-widest text-[#0B89FD]">
          Statement #{gameState.round}
        </span>
        <h3 className="text-2xl md:text-4xl font-black text-[#010101] leading-relaxed">
          &ldquo;{gameState.statement}&rdquo;
        </h3>
      </div>

      {/* ======================================================== */}
      {/* ACTION BUTTONS (STATEMENT PHASE)                         */}
      {/* ======================================================== */}
      {gameState.phase === 'statement' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-xl mx-auto w-full">
          <motion.button
            whileHover={!hasVoted ? { scale: 1.02 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
            disabled={hasVoted}
            onClick={() => handleChoose('have')}
            className={`min-h-[56px] p-5 sm:p-8 rounded-3xl border-2 border-[#010101] flex flex-col items-center justify-center gap-2 font-black text-xl sm:text-2xl transition-all shadow-[4px_4px_0px_#010101] touch-target ${
              selectedChoice === 'have'
                ? 'bg-[#FD3F01] text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101]'
                : hasVoted
                ? 'opacity-40 cursor-not-allowed bg-[#F8F8F8] text-[#010101]'
                : 'bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white text-[#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101]'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-emoji">🙋‍♂️</span>
            <span>I HAVE</span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
              -1 Innocence Point
            </span>
          </motion.button>

          <motion.button
            whileHover={!hasVoted ? { scale: 1.02 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
            disabled={hasVoted}
            onClick={() => handleChoose('havenot')}
            className={`min-h-[56px] p-5 sm:p-8 rounded-3xl border-2 border-[#010101] flex flex-col items-center justify-center gap-2 font-black text-xl sm:text-2xl transition-all shadow-[4px_4px_0px_#010101] touch-target ${
              selectedChoice === 'havenot'
                ? 'bg-[#0B89FD] text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101]'
                : hasVoted
                ? 'opacity-40 cursor-not-allowed bg-[#F8F8F8] text-[#010101]'
                : 'bg-[#FFFFFF] hover:bg-[#0B89FD] hover:text-white text-[#010101] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#010101]'
            }`}
          >
            <span className="text-3xl sm:text-4xl font-emoji">😇</span>
            <span>I HAVEN&rsquo;T</span>
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
              Keep Innocence Intact
            </span>
          </motion.button>
        </div>
      ) : (
        /* ======================================================== */
        /* GROUP REVEAL & PERCENTAGE STATS                          */
        /* ======================================================== */
        <div className="bg-[#FFFFFF] p-6 md:p-8 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101] space-y-6">
          {gameState.stats && (
            <div className="text-center space-y-2">
              <span className="text-xs uppercase font-black text-[#010101]/60 tracking-wider">
                Group Confession Stats
              </span>
              <div className="text-3xl md:text-5xl font-black text-[#010101]">
                {gameState.stats.havePercentage}% of the room has done this!
              </div>

              {/* Graphical Percentage Bar */}
              <div className="w-full max-w-md mx-auto h-4 bg-[#F8F8F8] rounded-full overflow-hidden border-2 border-[#010101] flex mt-3">
                <div
                  className="h-full bg-[#FD3F01]"
                  style={{ width: `${gameState.stats.havePercentage}%` }}
                />
                <div
                  className="h-full bg-[#0B89FD]"
                  style={{ width: `${100 - gameState.stats.havePercentage}%` }}
                />
              </div>

              <div className="flex justify-between max-w-md mx-auto text-xs font-black pt-1 px-1">
                <span className="text-[#FD3F01]">
                  🙋‍♂️ {gameState.stats.haveCount} Have
                </span>
                <span className="text-[#0B89FD]">
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
                  className={`p-3 rounded-2xl border-2 border-[#010101] flex flex-col items-center gap-1.5 transition-all shadow-[2px_2px_0px_#010101] ${
                    isHave
                      ? 'bg-[#FD3F01]/10'
                      : 'bg-[#0B89FD]/10'
                  }`}
                >
                  <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                  <span className="text-[#010101] font-black text-xs truncate max-w-[90px]">
                    {p.username}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-[#010101] ${
                      isHave
                        ? 'bg-[#FD3F01] text-white'
                        : 'bg-[#0B89FD] text-white'
                    }`}
                  >
                    {isHave ? 'I HAVE' : 'I HAVEN’T'}
                  </span>
                  <span className="text-xs text-[#010101] font-black flex items-center gap-1">
                    <Heart strokeWidth={2.5} className="w-3 h-3 fill-[#FD3F01] text-[#FD3F01] shrink-0" />
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
      <div className="bg-[#FFFFFF] p-4 rounded-3xl border-2 border-[#010101] shadow-[4px_4px_0px_#010101]">
        <div className="flex items-center justify-between mb-3 px-2 border-b-2 border-[#010101]/10 pb-2">
          <span className="text-xs font-black text-[#010101] flex items-center gap-1.5 uppercase tracking-wider">
            <Users strokeWidth={2.5} className="w-4 h-4 text-[#0B89FD] shrink-0" />
            Innocence Standings
          </span>
          <span className="text-xs text-[#010101]/60 font-bold">10 Initial Points</span>
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
                  className="flex items-center justify-between p-2 rounded-xl bg-[#F8F8F8] border border-[#010101] text-xs font-black shadow-[1px_1px_0px_#010101]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[#010101]/50 font-black w-3">#{idx + 1}</span>
                    <span className="text-[#010101] font-black truncate max-w-[70px]">
                      {p.username}
                    </span>
                  </div>
                  <span
                    className={`font-black ${
                      pts <= 3 ? 'text-[#FD3F01] animate-pulse' : 'text-[#010101]'
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
