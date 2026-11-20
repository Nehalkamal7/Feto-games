'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GameMode } from '@feto-games/shared-types';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { GameIcon } from './GameIcon';
import { sound } from '@/lib/sound';

interface PopularGamesGridProps {
  onSelectGame: (gameMode: GameMode) => void;
  onOpenRules: (gameMode: GameMode) => void;
}

interface GameCardMeta {
  id: GameMode;
  title: string;
  category: string;
  players: string;
  tagline: string;
  renderArtwork: () => React.ReactNode;
}

export function PopularGamesGrid({ onSelectGame, onOpenRules }: PopularGamesGridProps) {
  const games: GameCardMeta[] = [
    {
      id: 'who_is_imposter',
      title: 'Who Is Imposter?',
      category: 'Social Deduction',
      players: '3-15 Players',
      tagline: 'Bluff, share subtle clues, and identify the hidden imposter!',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-red-50 to-orange-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <path
              d="M30 65 C 28 35, 92 35, 90 65 C 90 85, 75 95, 60 95 C 45 95, 30 85, 30 65 Z"
              fill="#FFFFFF"
              stroke="#E11D48"
              strokeWidth="2.5"
            />
            <path
              d="M38 52 C 38 42, 82 42, 82 52 C 82 66, 75 74, 60 74 C 45 74, 38 66, 38 52 Z"
              fill="#F43F5E"
            />
            <ellipse cx="52" cy="50" rx="6" ry="2.5" fill="#FFFFFF" fillOpacity="0.8" transform="rotate(-15 52 50)" />
            <polygon points="60,20 74,44 46,44" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
            <text x="60" y="41" fontSize="12" fontWeight="900" fill="#FFFFFF" textAnchor="middle">!</text>
          </svg>
        </div>
      )
    },
    {
      id: 'draw_and_guess',
      title: 'Draw & Guess',
      category: 'Drawing & Trivia',
      players: '2-15 Players',
      tagline: 'Take turns drawing in real-time while players race to guess.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-blue-50 to-indigo-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <rect x="22" y="24" width="76" height="66" rx="10" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2.5" />
            <path d="M 32 58 Q 50 40, 68 62 T 88 50" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
            <circle cx="88" cy="50" r="4" fill="#2563EB" />
            <g transform="translate(68, 20) rotate(35)">
              <rect x="0" y="0" width="8" height="42" rx="4" fill="#EFF6FF" stroke="#2563EB" strokeWidth="1.5" />
              <polygon points="4,48 0,40 8,40" fill="#2563EB" />
            </g>
          </svg>
        </div>
      )
    },
    {
      id: 'quiz_battle',
      title: 'Quiz Battle',
      category: 'Speed Trivia',
      players: '2-15 Players',
      tagline: '15-second lightning rounds with instant score reveals.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-purple-50 to-pink-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <rect x="20" y="32" width="38" height="50" rx="8" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2" transform="rotate(-10 39 57)" />
            <text x="37" y="62" fontSize="20" fontWeight="900" fill="#8B5CF6" textAnchor="middle" transform="rotate(-10 39 57)">Q</text>
            <rect x="62" y="32" width="38" height="50" rx="8" fill="#FFFFFF" stroke="#EC4899" strokeWidth="2" transform="rotate(10 81 57)" />
            <text x="81" y="62" fontSize="20" fontWeight="900" fill="#EC4899" textAnchor="middle" transform="rotate(10 81 57)">A</text>
            <circle cx="60" cy="58" r="14" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
            <text x="60" y="63" fontSize="11" fontWeight="800" fill="#FFFFFF" textAnchor="middle">VS</text>
          </svg>
        </div>
      )
    },
    {
      id: 'word_battle',
      title: 'Word Battle',
      category: 'Word Race',
      players: '2-15 Players',
      tagline: 'Claim unique words matching category and starting letter.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-amber-50 to-orange-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <rect x="24" y="24" width="32" height="32" rx="8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
            <text x="40" y="47" fontSize="18" fontWeight="800" fill="#D97706" textAnchor="middle">W</text>
            <rect x="64" y="24" width="32" height="32" rx="8" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" />
            <text x="80" y="47" fontSize="18" fontWeight="800" fill="#2563EB" textAnchor="middle">O</text>
            <rect x="24" y="64" width="32" height="32" rx="8" fill="#FFFFFF" stroke="#EC4899" strokeWidth="2" />
            <text x="40" y="87" fontSize="18" fontWeight="800" fill="#DB2777" textAnchor="middle">R</text>
            <rect x="64" y="64" width="32" height="32" rx="8" fill="#FFFFFF" stroke="#10B981" strokeWidth="2" />
            <text x="80" y="87" fontSize="18" fontWeight="800" fill="#059669" textAnchor="middle">D</text>
          </svg>
        </div>
      )
    },
    {
      id: 'truth_or_dare',
      title: 'Truth or Dare',
      category: 'Party Questions',
      players: '2-15 Players',
      tagline: 'Draw cards, complete dares, or skip by taking a sip.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-rose-50 to-pink-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <circle cx="60" cy="60" r="36" fill="#FFFFFF" stroke="#F43F5E" strokeWidth="2.5" />
            <circle cx="60" cy="60" r="26" fill="#FFF1F2" stroke="#FB7185" strokeWidth="1.5" strokeDasharray="4 4" />
            <polygon points="60,26 66,42 54,42" fill="#E11D48" />
            <text x="60" y="69" fontSize="24" fontWeight="900" fill="#E11D48" textAnchor="middle">?</text>
          </svg>
        </div>
      )
    },
    {
      id: 'never_have_i_ever',
      title: 'Never Have I Ever',
      category: 'Confessions',
      players: '2-15 Players',
      tagline: 'Reveal guilty secrets and see live group confession stats.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-emerald-50 to-teal-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <path
              d="M44 80 L44 54 C44 50, 48 50, 48 54 L48 44 C48 40, 52 40, 52 44 L52 38 C52 34, 56 34, 56 38 L56 46 C56 42, 60 42, 60 46 L60 62 L66 52 C70 48, 74 52, 72 56 L64 78 C60 88, 48 88, 44 80 Z"
              fill="#FFFFFF"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="34" cy="38" r="3" fill="#34D399" />
            <circle cx="86" cy="68" r="2.5" fill="#10B981" />
          </svg>
        </div>
      )
    },
    {
      id: 'most_likely_to',
      title: 'Most Likely To...',
      category: 'Roast & Votes',
      players: '2-15 Players',
      tagline: 'Vote on friends for crazy scenarios with instant vote bars.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-amber-50 to-yellow-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <rect x="25" y="35" width="50" height="60" rx="8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />
            <line x1="35" y1="50" x2="65" y2="50" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="65" x2="65" y2="65" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="80" x2="55" y2="80" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="85,35 90,47 103,48 93,57 96,70 85,63 74,70 77,57 67,48 80,47" fill="#F59E0B" />
          </svg>
        </div>
      )
    },
    {
      id: 'sip_or_spill',
      title: 'Sip or Spill 🥤',
      category: 'Party Dilemmas',
      players: '2-15 Players',
      tagline: 'Answer funny dilemmas live or take a sip to skip.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-cyan-50 to-blue-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <polygon points="38,40 82,40 74,95 46,95" fill="#FFFFFF" stroke="#06B6D4" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="41,55 79,55 74,93 46,93" fill="#CFFAFE" />
            <line x1="60" y1="65" x2="85" y2="15" stroke="#EC4899" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>
      )
    },
    {
      id: 'silly_roulette',
      title: 'Silly Roulette',
      category: 'Spin the Chaos',
      players: '2-15 Players',
      tagline: 'Spin the wheel to select a random player for funny party dares.',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-indigo-50 to-purple-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <circle cx="60" cy="60" r="36" fill="#FFFFFF" stroke="#6366F1" strokeWidth="2.5" />
            <line x1="60" y1="24" x2="60" y2="96" stroke="#C7D2FE" strokeWidth="1.5" />
            <line x1="24" y1="60" x2="96" y2="60" stroke="#C7D2FE" strokeWidth="1.5" />
            <circle cx="60" cy="60" r="8" fill="#4F46E5" />
            <polygon points="60,16 66,28 54,28" fill="#4F46E5" />
          </svg>
        </div>
      )
    },
    {
      id: 'hot_potato',
      title: 'Hot Potato',
      category: 'Speed Reflexes',
      players: '2-15 Players',
      tagline: 'Type an answer and pass the ticking bomb before it detonates!',
      renderArtwork: () => (
        <div className="relative w-full h-28 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-orange-50 to-red-50/40">
          <svg viewBox="0 0 120 120" className="w-20 h-20">
            <circle cx="60" cy="68" r="28" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2.5" />
            <rect x="52" y="34" width="16" height="8" rx="2" fill="#EA580C" />
            <path d="M 60 34 Q 72 20, 82 26" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="82" cy="26" r="4" fill="#EF4444" />
            <text x="60" y="74" fontSize="14" fontWeight="800" fill="#EA580C" textAnchor="middle" fontFamily="monospace">8s</text>
          </svg>
        </div>
      )
    }
  ];

  return (
    <section id="popular-games" className="w-full mb-12 relative z-10 scroll-mt-24">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Popular Party Games
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">
            Choose a game mode to instantly create a room for up to 15 friends
          </p>
        </div>

        <div className="text-xs font-semibold text-blue-700 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
          10 Multiplayer Modes
        </div>
      </div>

      {/* 10-CARD RESPONSIVE GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {games.map((g, idx) => {
          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                sound.playClick();
                onSelectGame(g.id);
              }}
              className="cursor-pointer bg-white rounded-2xl p-3.5 flex flex-col justify-between border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all relative group"
            >
              {/* TOP BADGE: PLAYER COUNT & CATEGORY */}
              <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
                <span className="text-[11px] font-semibold uppercase text-gray-500 tracking-wider truncate">
                  {g.category}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex-shrink-0">
                  {g.players}
                </span>
              </div>

              {/* ARTWORK IN CLEAN CONTAINER */}
              <div className="my-1 rounded-xl border border-gray-100 overflow-hidden transition-transform duration-200 group-hover:scale-[1.02] relative z-10">
                {g.renderArtwork()}
              </div>

              {/* TITLE & DESCRIPTION */}
              <div className="mt-2.5 flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <GameIcon gameMode={g.id} size="xs" />
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {g.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-gray-500 font-normal leading-snug line-clamp-2">
                    {g.tagline}
                  </p>
                </div>

                {/* CARD ACTION BUTTON */}
                <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onOpenRules(g.id);
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 py-1 px-1 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                    <span>Rules</span>
                  </button>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors">
                    <span>Play</span>
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
