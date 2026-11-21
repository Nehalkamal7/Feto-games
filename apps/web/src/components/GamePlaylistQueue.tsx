'use client';

import React from 'react';
import { GameMode } from '@feto-games/shared-types';
import {
  ListOrdered,
  Trash2,
  ChevronRight,
  Shuffle
} from 'lucide-react';
import { GameIcon } from './GameIcon';
import { sound } from '@/lib/sound';

export interface GameInfo {
  id: GameMode;
  title: string;
  emoji: string;
  players: string;
  tagline: string;
}

export const ALL_PARTY_GAMES: GameInfo[] = [
  { id: 'who_is_imposter', title: 'Who Is The Imposter?', emoji: '🎭', players: '3-15p', tagline: 'Social deduction & bluffing' },
  { id: 'draw_and_guess', title: 'Draw & Guess', emoji: '🎨', players: '2-15p', tagline: 'Hilarious live sketching' },
  { id: 'quiz_battle', title: 'Quiz Battle', emoji: '🧠', players: '2-15p', tagline: 'High-speed trivia showdown' },
  { id: 'word_battle', title: 'Word Battle', emoji: '🔤', players: '2-15p', tagline: 'Rapid-fire vocabulary race' },
  { id: 'truth_or_dare', title: 'Truth or Dare', emoji: '🔥', players: '2-15p', tagline: 'Spicy roulette & confessions' },
  { id: 'never_have_i_ever', title: 'Never Have I Ever', emoji: '🤫', players: '2-15p', tagline: 'Guilty confessions & laughs' },
  { id: 'most_likely_to', title: 'Most Likely To...', emoji: '👑', players: '2-15p', tagline: 'Crew superlatives & roasts' },
  { id: 'sip_or_spill', title: 'Sip or Spill', emoji: '🥤', players: '2-15p', tagline: 'Answer truthfully or drink' },
  { id: 'silly_roulette', title: 'Silly Roulette', emoji: '🎯', players: '2-15p', tagline: 'Absurd party mini-dares' },
  { id: 'hot_potato', title: 'Hot Potato', emoji: '🥔', players: '2-15p', tagline: 'Pass the ticking bomb!' }
];

export interface GamePlaylistQueueProps {
  selectedGames: GameMode[];
  currentGameIndex?: number;
  isHost: boolean;
  onUpdatePlaylist: (newGames: GameMode[]) => void;
}

export function GamePlaylistQueue({
  selectedGames,
  currentGameIndex = 0,
  isHost,
  onUpdatePlaylist
}: GamePlaylistQueueProps) {
  const currentQueue = selectedGames && selectedGames.length > 0
    ? selectedGames
    : ['who_is_imposter' as GameMode];

  const handleToggleGame = (gameId: GameMode) => {
    if (!isHost) return;
    sound.playClick();

    if (currentQueue.includes(gameId)) {
      if (currentQueue.length > 1) {
        const next = currentQueue.filter((id) => id !== gameId);
        onUpdatePlaylist(next);
      }
    } else {
      if (currentQueue.length < 8) {
        onUpdatePlaylist([...currentQueue, gameId]);
      }
    }
  };

  const handleRemoveAt = (index: number) => {
    if (!isHost || currentQueue.length <= 1) return;
    sound.playClick();
    const next = [...currentQueue];
    next.splice(index, 1);
    onUpdatePlaylist(next);
  };

  const handlePartyMix = () => {
    if (!isHost) return;
    sound.playClick();
    const shuffled = [...ALL_PARTY_GAMES].sort(() => 0.5 - Math.random());
    const four = shuffled.slice(0, 4).map((g) => g.id);
    onUpdatePlaylist(four);
  };

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-200 shadow-sm space-y-4 text-gray-900">
      {/* Header and Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span>Game Playlist Queue</span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                {currentQueue.length} {currentQueue.length === 1 ? 'Game' : 'Games Back-to-Back'}
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-normal">
              {isHost
                ? 'Queue multiple games to play in series with cumulative match scores'
                : 'Upcoming games in this party session'}
            </p>
          </div>
        </div>

        {/* Quick Host Actions: Party Mix */}
        {isHost && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePartyMix}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              title="Pick 4 random party games for a chaotic mix"
            >
              <Shuffle className="w-3.5 h-3.5 text-blue-600" />
              <span>Party Mix (Random 4)</span>
            </button>
          </div>
        )}
      </div>

      {/* Live Playlist Queue Horizontal Strip */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Play Order ({currentQueue.length})
        </span>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {currentQueue.map((gameId, idx) => {
            const game = ALL_PARTY_GAMES.find((g) => g.id === gameId);
            const isCurrent = idx === currentGameIndex;

            return (
              <React.Fragment key={`${gameId}-${idx}`}>
                <div
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    #{idx + 1}
                  </span>
                  <GameIcon gameMode={gameId} size="sm" />
                  <div className="text-left">
                    <div className="text-xs font-bold truncate max-w-[120px]">{game?.title}</div>
                    <div className="text-[10px] text-gray-500">
                      {game?.players}
                    </div>
                  </div>

                  {isHost && currentQueue.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAt(idx)}
                      className="ml-1 w-6 h-6 inline-flex items-center justify-center shrink-0 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove from queue"
                      aria-label={`Remove ${game?.title} from playlist`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {idx < currentQueue.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Host Game Selector Grid */}
      {isHost && (
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Select or Queue Games (Click to Add / Remove)
            </span>
            <span className="text-xs text-blue-600 font-bold">
              {currentQueue.length} Selected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ALL_PARTY_GAMES.map((game) => {
              const inQueue = currentQueue.includes(game.id);
              const queuePosition = currentQueue.indexOf(game.id);

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleToggleGame(game.id)}
                  className={`relative p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[72px] ${
                    inQueue
                      ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50 shadow-xs'
                  }`}
                >
                  {inQueue && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                      #{queuePosition + 1}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <GameIcon gameMode={game.id} size="sm" />
                    <span className="text-[10px] font-mono text-gray-500">
                      {game.players}
                    </span>
                  </div>

                  <div className="mt-1">
                    <div className="text-xs font-bold truncate">
                      {game.title}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {game.tagline}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
