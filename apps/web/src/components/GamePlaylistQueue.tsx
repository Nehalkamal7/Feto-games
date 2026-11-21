'use client';

import React from 'react';
import { GameMode } from '@feto-games/shared-types';
import {
  ListOrdered,
  X,
  ChevronRight,
  Shuffle,
  PlusCircle
} from 'lucide-react';
import { GameIcon } from './GameIcon';
import { sound } from '@/lib/sound';
import { useLanguage } from '@/hooks/useLanguage';

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

export const GAME_TITLES_AR: Record<string, { title: string; tagline: string; players: string }> = {
  who_is_imposter: { title: 'مين الجاسوس؟', tagline: 'لعبة الخداع والشك والذكاء', players: '٣-١٥' },
  draw_and_guess: { title: 'ارسم وخمن', tagline: 'رسم مباشر وتخمين مضحك', players: '٢-١٥' },
  quiz_battle: { title: 'معركة الأسئلة', tagline: 'تحدي معلومات وسرعة بديهة', players: '٢-١٥' },
  word_battle: { title: 'معركة الكلمات', tagline: 'سباق كلمات وتحدي حروف', players: '٢-١٥' },
  truth_or_dare: { title: 'صراحة أم جرأة', tagline: 'روليت التحديات والاعترافات', players: '٢-١٥' },
  never_have_i_ever: { title: 'عمرك عملتها؟', tagline: 'فضايح واعترافات مضحكة', players: '٢-١٥' },
  most_likely_to: { title: 'مين أكتر واحد؟', tagline: 'تصويت الشلة وقصف جبهات', players: '٢-١٥' },
  sip_or_spill: { title: 'رشفة ولا فضيحة', tagline: 'اعترف بصراحة أو خد رشفة', players: '٢-١٥' },
  silly_roulette: { title: 'عجلة التحديات', tagline: 'تحديات جنونية ومقالب', players: '٢-١٥' },
  hot_potato: { title: 'القنبلة الموقوتة', tagline: 'مرر القنبلة قبل ما تنفجر!', players: '٢-١٥' }
};

export interface GamePlaylistQueueProps {
  selectedGames: GameMode[];
  currentGameIndex?: number;
  isHost: boolean;
  onUpdatePlaylist: (newGames: GameMode[]) => void;
  onOpenCustomCard?: () => void;
}

export function GamePlaylistQueue({
  selectedGames,
  currentGameIndex = 0,
  isHost,
  onUpdatePlaylist,
  onOpenCustomCard
}: GamePlaylistQueueProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
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
    <section className="rounded-2xl p-4 sm:p-5 bg-white border border-gray-200 space-y-4 text-[#111827]">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <ListOrdered className="w-4 h-4 text-[#2563EB] shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-[#111827] tracking-tight truncate">
            {isAr ? 'الألعاب وقائمة التشغيل' : 'Game Selector & Playlist'}
          </h2>
          <span className="text-xs text-gray-400 shrink-0" aria-hidden="true">·</span>
          <span className="text-xs font-semibold text-[#2563EB] tabular-nums whitespace-nowrap shrink-0">
            {isAr
              ? `${currentQueue.length} ${currentQueue.length === 1 ? 'لعبة' : 'ألعاب'}`
              : `${currentQueue.length} ${currentQueue.length === 1 ? 'Game' : 'Games'}`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenCustomCard && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenCustomCard();
              }}
              className="h-9 px-3 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{isAr ? 'كارت مخصص' : 'Custom Card'}</span>
            </button>
          )}

          {isHost && (
            <button
              type="button"
              onClick={handlePartyMix}
              className="h-9 px-3 rounded-xl bg-[#F9FAFB] hover:bg-gray-100 border border-gray-200 text-[#111827] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title={isAr ? 'اختر ٤ ألعاب عشوائية' : 'Pick 4 random party games'}
            >
              <Shuffle className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{isAr ? 'مكس عشوائي' : 'Party Mix'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Compact Active Playlist Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {currentQueue.map((gameId, idx) => {
          const game = ALL_PARTY_GAMES.find((g) => g.id === gameId);
          const arInfo = GAME_TITLES_AR[gameId];
          const isCurrent = idx === currentGameIndex;

          return (
            <React.Fragment key={`${gameId}-${idx}`}>
              <div
                className={`flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-colors ${
                  isCurrent
                    ? 'bg-blue-50/70 border-[#2563EB]/40 text-[#111827]'
                    : 'bg-[#F9FAFB] border-gray-200 text-gray-700'
                }`}
              >
                <span
                  className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums shrink-0 force-ltr ${
                    isCurrent ? 'bg-[#2563EB] text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {idx + 1}
                </span>
                <GameIcon gameMode={gameId} size="sm" />
                <span className="text-xs font-semibold truncate max-w-[130px]">
                  {isAr && arInfo ? arInfo.title : game?.title}
                </span>

                {isHost && currentQueue.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveAt(idx)}
                    className="w-5 h-5 inline-flex items-center justify-center shrink-0 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title={isAr ? 'إزالة من القائمة' : 'Remove from playlist'}
                    aria-label={`Remove ${game?.title}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {idx < currentQueue.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 rtl:rotate-180" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Compact 10-Game Selector Grid */}
      {isHost ? (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2.5">
            {isAr
              ? 'اضغط على أي لعبة لإضافتها أو إزالتها من قائمة التشغيل'
              : 'Tap any game to add or remove it from the playlist'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {ALL_PARTY_GAMES.map((game) => {
              const inQueue = currentQueue.includes(game.id);
              const queuePosition = currentQueue.indexOf(game.id);
              const arInfo = GAME_TITLES_AR[game.id];

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleToggleGame(game.id)}
                  className={`relative p-2.5 rounded-xl border text-start flex flex-col justify-between transition-all min-h-[76px] active:scale-[0.98] ${
                    inQueue
                      ? 'border-[#2563EB] bg-blue-50/70 text-[#111827] ring-1 ring-[#2563EB]/20'
                      : 'border-gray-200 bg-white text-gray-800 hover:bg-[#F9FAFB]'
                  }`}
                >
                  {inQueue && (
                    <span className="absolute top-2 right-2 rtl:right-auto rtl:left-2 w-5 h-5 rounded-full bg-[#2563EB] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums force-ltr">
                      {queuePosition + 1}
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <GameIcon gameMode={game.id} size="sm" />
                  </div>

                  <div className="mt-2 min-w-0">
                    <div className="text-xs font-bold text-[#111827] truncate">
                      {isAr && arInfo ? arInfo.title : game.title}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate mt-0.5">
                      {isAr && arInfo ? arInfo.tagline : game.tagline}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500 pt-1">
          {isAr
            ? 'المضيف يختار الألعاب القادمة في الجلسة.'
            : 'The host selects which games to play next.'}
        </p>
      )}
    </section>
  );
}
