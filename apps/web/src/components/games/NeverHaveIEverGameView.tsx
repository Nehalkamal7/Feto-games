'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  NeverHaveIEverPublicState,
  PlayerSummary
} from '@feto-games/shared-types';
import { NeonAvatarDisplay } from '../NeonAvatarDisplay';
import { GameIcon } from '../GameIcon';
import {
  Heart,
  Clock,
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
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 px-2 sm:px-4 overflow-x-hidden select-none">
      {/* HEADER: ROUND, CATEGORY & INNOCENCE METER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <GameIcon gameMode="never_have_i_ever" size="md" showContainer />
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                Round {gameState.round} of {gameState.totalRounds}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                {gameState.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
              Never Have I Ever
            </h2>
          </div>
        </div>

        {/* Current Player Innocence Badge */}
        <div className="flex items-center gap-2.5 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
          <div className="flex items-center gap-1.5 text-rose-500">
            <Heart strokeWidth={2.5} className="w-4 h-4 fill-rose-500 shrink-0" />
            <span className="text-base font-bold">{myInnocence}</span>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Innocence Points
          </span>
        </div>
      </div>

      {/* SYNCHRONIZED TIMER BAR */}
      <div className="w-full">
        <div className="flex justify-between items-center text-xs font-semibold text-gray-600 mb-1.5 px-1">
          <span className="flex items-center gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${gameState.remainingSeconds <= 3 ? 'text-red-500 animate-spin' : 'text-blue-600'}`} />
            {gameState.phase === 'statement' ? 'Cast Your Confession' : 'Group Reveal'}
          </span>
          <span className={gameState.remainingSeconds <= 3 ? 'text-red-500 font-bold' : ''}>
            {gameState.remainingSeconds}s remaining
          </span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              gameState.remainingSeconds <= 3 ? 'bg-red-500' : 'bg-blue-600'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
      </div>

      {/* MAIN STATEMENT CARD */}
      <div className="bg-white p-7 sm:p-10 rounded-2xl text-center space-y-3 border border-gray-200 shadow-sm relative overflow-hidden">
        <span className="text-xs font-semibold tracking-wider uppercase text-blue-600">
          Statement #{gameState.round}
        </span>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-relaxed max-w-xl mx-auto">
          &ldquo;{gameState.statement}&rdquo;
        </h3>
      </div>

      {/* ACTION BUTTONS (STATEMENT PHASE) */}
      {gameState.phase === 'statement' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto w-full">
          <motion.button
            whileHover={!hasVoted ? { scale: 1.01 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
            disabled={hasVoted}
            onClick={() => handleChoose('have')}
            className={`min-h-[72px] p-4 sm:p-5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 font-bold ${
              selectedChoice === 'have'
                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                : hasVoted
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : 'bg-white hover:bg-rose-50 border-gray-200 hover:border-rose-300 text-gray-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 text-lg">
              <span>🥤</span>
              <span>I Have (Take a Sip)</span>
            </div>
            <span className={`text-xs font-medium ${selectedChoice === 'have' ? 'text-rose-100' : 'text-gray-500'}`}>
              -1 Innocence Point
            </span>
          </motion.button>

          <motion.button
            whileHover={!hasVoted ? { scale: 1.01 } : {}}
            whileTap={!hasVoted ? { scale: 0.98 } : {}}
            disabled={hasVoted}
            onClick={() => handleChoose('havenot')}
            className={`min-h-[72px] p-4 sm:p-5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-1.5 font-bold ${
              selectedChoice === 'havenot'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : hasVoted
                ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 text-gray-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 text-lg">
              <span>😇</span>
              <span>Never</span>
            </div>
            <span className={`text-xs font-medium ${selectedChoice === 'havenot' ? 'text-blue-100' : 'text-gray-500'}`}>
              Keep Innocence Intact
            </span>
          </motion.button>
        </div>
      ) : (
        /* GROUP REVEAL & PERCENTAGE STATS */
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          {gameState.stats && (
            <div className="text-center space-y-2">
              <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Group Results
              </span>
              <div className="text-2xl sm:text-4xl font-extrabold text-gray-900">
                {gameState.stats.havePercentage}% of the room has done this!
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md mx-auto h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200 flex mt-3">
                <div
                  className="h-full bg-rose-500 transition-all duration-700"
                  style={{ width: `${gameState.stats.havePercentage}%` }}
                />
                <div
                  className="h-full bg-blue-600 transition-all duration-700"
                  style={{ width: `${100 - gameState.stats.havePercentage}%` }}
                />
              </div>

              <div className="flex justify-between max-w-md mx-auto text-xs font-semibold pt-1 px-1">
                <span className="text-rose-600">
                  🥤 {gameState.stats.haveCount} Have (Took a Sip)
                </span>
                <span className="text-blue-600">
                  😇 {gameState.stats.haveNotCount} Never
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
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    isHave
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <NeonAvatarDisplay avatarId={p.avatar} size="sm" showGlow={false} />
                  <span className="text-gray-900 font-bold text-xs truncate max-w-[90px]">
                    {p.username}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isHave
                        ? 'bg-rose-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isHave ? 'I Have 🥤' : 'Never'}
                  </span>
                  <span className="text-xs text-gray-700 font-medium flex items-center gap-1">
                    <Heart strokeWidth={2.5} className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0" />
                    {points} pts
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* INNOCENCE STANDINGS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-gray-100 pb-2">
          <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            Innocence Standings
          </span>
          <span className="text-xs text-gray-500 font-medium">10 Initial Points</span>
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
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-gray-400 font-bold w-4">#{idx + 1}</span>
                    <span className="text-gray-800 font-medium truncate max-w-[70px]">
                      {p.username}
                    </span>
                  </div>
                  <span
                    className={`font-bold ${
                      pts <= 3 ? 'text-rose-600' : 'text-gray-900'
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
