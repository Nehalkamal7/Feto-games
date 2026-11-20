'use client';

import React from 'react';
import { GameMode } from '@feto-games/shared-types';
import {
  ListOrdered,
  Trash2,
  ChevronRight,
  Shuffle
} from 'lucide-react';
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
  // Ensure there is at least 1 game in the queue
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
    <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-[#FFFFFF] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] space-y-4 text-[#010101]">
      {/* Header and Quick Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#010101]/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0B89FD] border-2 border-[#010101] text-white flex items-center justify-center shadow-[2px_2px_0px_#010101]">
            <ListOrdered className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#010101] uppercase tracking-wider flex items-center gap-2">
              <span>Game Playlist Queue</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#FEC90E] border-2 border-[#010101] text-[#010101] font-black">
                {currentQueue.length} {currentQueue.length === 1 ? 'Game' : 'Games Back-to-Back'}
              </span>
            </h3>
            <p className="text-[10px] text-[#010101]/70 font-medium">
              {isHost
                ? 'Queue multiple games to play in series with cumulative match scores'
                : 'Upcoming games in this party session'}
            </p>
          </div>
        </div>

        {/* Quick Host Actions: Party Mix (Random 4) */}
        {isHost && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePartyMix}
              className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-[#FEC90E] hover:bg-[#fed338] border-2 border-[#010101] text-[#010101] text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-[2px_2px_0px_#010101] touch-manipulation active:translate-x-[1px] active:translate-y-[1px]"
              title="Pick 4 random party games for a chaotic mix"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#010101]" />
              <span>Party Mix (Random 4)</span>
            </button>
          </div>
        )}
      </div>

      {/* Live Playlist Queue Horizontal Strip */}
      <div className="space-y-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#010101]/60">
          Play Order ({currentQueue.length})
        </span>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {currentQueue.map((gameId, idx) => {
            const game = ALL_PARTY_GAMES.find((g) => g.id === gameId);
            const isCurrent = idx === currentGameIndex;

            return (
              <React.Fragment key={`${gameId}-${idx}`}>
                <div
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-[#010101] transition-all ${
                    isCurrent
                      ? 'bg-[#0B89FD] text-white shadow-[3px_3px_0px_#010101]'
                      : 'bg-[#F8F8F8] text-[#010101] shadow-[2px_2px_0px_#010101]'
                  }`}
                >
                  <span className={`font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md border border-[#010101] ${
                    isCurrent ? 'bg-[#FEC90E] text-[#010101]' : 'bg-[#FFFFFF] text-[#010101]'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="text-base font-emoji">{game?.emoji || '🎮'}</span>
                  <div className="text-left">
                    <div className="text-xs font-black truncate max-w-[120px]">{game?.title}</div>
                    <div className={`text-[9px] font-bold ${isCurrent ? 'text-white/80' : 'text-[#010101]/60'}`}>
                      {game?.players}
                    </div>
                  </div>

                  {isHost && currentQueue.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAt(idx)}
                      className={`ml-1 p-1 rounded-lg border border-[#010101] transition-colors touch-manipulation ${
                        isCurrent
                          ? 'bg-[#FD3F01] text-white'
                          : 'bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white text-[#010101]'
                      }`}
                      title="Remove from queue"
                      aria-label={`Remove ${game?.title} from playlist`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {idx < currentQueue.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#010101]/40 flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Host Game Selector Grid */}
      {isHost && (
        <div className="pt-2 border-t-2 border-[#010101]/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#010101]">
              Select or Queue Games (Click to Add / Remove)
            </span>
            <span className="text-[10px] text-[#0B89FD] font-black">
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
                  className={`relative p-2.5 rounded-xl border-2 border-[#010101] text-left flex flex-col justify-between transition-all min-h-[72px] touch-manipulation ${
                    inQueue
                      ? 'bg-[#0B89FD] text-white shadow-[3px_3px_0px_#010101]'
                      : 'bg-[#FFFFFF] text-[#010101] shadow-[2px_2px_0px_#010101] hover:bg-[#F8F8F8]'
                  }`}
                >
                  {inQueue && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#FEC90E] text-[#010101] border border-[#010101] font-mono text-[10px] font-black flex items-center justify-center">
                      #{queuePosition + 1}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-emoji">{game.emoji}</span>
                    <span className={`text-[9px] font-mono font-bold ${inQueue ? 'text-white/80' : 'text-[#010101]/60'}`}>
                      {game.players}
                    </span>
                  </div>

                  <div className="mt-1">
                    <div className={`text-[11px] font-black truncate ${inQueue ? 'text-white' : 'text-[#010101]'}`}>
                      {game.title}
                    </div>
                    <div className={`text-[9px] truncate ${inQueue ? 'text-white/80' : 'text-[#010101]/60'} font-medium`}>
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
