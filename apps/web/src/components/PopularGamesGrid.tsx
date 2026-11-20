'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GameMode } from '@feto-games/shared-types';
import { Users, Sparkles, ArrowRight, Zap, Flame, ShieldAlert, Palette, HelpCircle, Layers, Heart } from 'lucide-react';
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
  glowBorderColor: string;
  badgeColor: string;
  renderArtwork: () => React.ReactNode;
}

export function PopularGamesGrid({ onSelectGame, onOpenRules }: PopularGamesGridProps) {
  const games: GameCardMeta[] = [
    {
      id: 'who_is_imposter',
      title: 'Who Is Imposter?',
      category: 'Social Deduction',
      players: '3-15 Players',
      tagline: 'Bluff, give subtle clues & find the hidden imposter!',
      glowBorderColor: 'hover:border-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]',
      badgeColor: 'border-red-500/50 text-red-300 bg-red-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-red-950/40 to-[#070a18]/80">
          {/* Neon Alert Ambient Pulse */}
          <div className="absolute w-20 h-20 bg-red-600/20 rounded-full blur-xl animate-pulse" />
          {/* Astronaut Visor Silhouette */}
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]">
            {/* Astronaut Helmet */}
            <path
              d="M30 65 C 28 35, 92 35, 90 65 C 90 85, 75 95, 60 95 C 45 95, 30 85, 30 65 Z"
              fill="#181329"
              stroke="#A855F7"
              strokeWidth="3.5"
            />
            {/* Visor with Cyber Red Reflection */}
            <path
              d="M38 52 C 38 42, 82 42, 82 52 C 82 66, 75 74, 60 74 C 45 74, 38 66, 38 52 Z"
              fill="#060914"
              stroke="#EF4444"
              strokeWidth="3"
            />
            {/* Visor Glare */}
            <ellipse cx="52" cy="50" rx="6" ry="2.5" fill="#FFFFFF" fillOpacity="0.8" transform="rotate(-15 52 50)" />
            {/* Hazard Alert Badge */}
            <polygon points="60,20 74,44 46,44" fill="#EF4444" stroke="#FFE600" strokeWidth="2" strokeLinejoin="round" />
            <text x="60" y="41" fontSize="12" fontWeight="900" fill="#000000" textAnchor="middle">!</text>
          </svg>
        </div>
      )
    },
    {
      id: 'draw_and_guess',
      title: 'Draw & Guess',
      category: 'Drawing & Trivia',
      players: '2-15 Players',
      tagline: 'Rotate drawers, sketch in real-time & race to guess!',
      glowBorderColor: 'hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]',
      badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-cyan-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]">
            {/* Digital Tablet Pad */}
            <rect x="22" y="24" width="76" height="66" rx="8" fill="#0b1324" stroke="#00F0FF" strokeWidth="3" />
            {/* Screen Canvas Wave */}
            <path d="M 32 58 Q 50 40, 68 62 T 88 50" fill="none" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="88" cy="50" r="4" fill="#FF007A" />
            {/* Glowing Stylus Pen */}
            <g transform="translate(68, 20) rotate(35)">
              <rect x="0" y="0" width="8" height="42" rx="4" fill="#18223d" stroke="#00F0FF" strokeWidth="2" />
              <polygon points="4,48 0,40 8,40" fill="#00F0FF" />
              <circle cx="4" cy="50" r="2.5" fill="#FFE600" />
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
      tagline: '15-second lightning rounds with speed multipliers!',
      glowBorderColor: 'hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]',
      badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-purple-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]">
            {/* Left Cyan Card */}
            <rect x="18" y="32" width="40" height="52" rx="6" fill="#091629" stroke="#00F0FF" strokeWidth="2.5" transform="rotate(-12 38 58)" />
            <text x="36" y="62" fontSize="20" fontWeight="900" fill="#00F0FF" textAnchor="middle" transform="rotate(-12 38 58)">Q</text>
            {/* Right Magenta Card */}
            <rect x="62" y="32" width="40" height="52" rx="6" fill="#1d0d26" stroke="#FF007A" strokeWidth="2.5" transform="rotate(12 82 58)" />
            <text x="82" y="62" fontSize="20" fontWeight="900" fill="#FF007A" textAnchor="middle" transform="rotate(12 82 58)">A</text>
            {/* Center VS Lightning Shield */}
            <circle cx="60" cy="58" r="15" fill="#FFE600" stroke="#000000" strokeWidth="2" />
            <text x="60" y="64" fontSize="12" fontWeight="900" fill="#000000" textAnchor="middle">VS</text>
          </svg>
        </div>
      )
    },
    {
      id: 'word_battle',
      title: 'Word Battle',
      category: 'Fast Word Clash',
      players: '2-15 Players',
      tagline: 'Claim unique words first before your friends steal them!',
      glowBorderColor: 'hover:border-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.5)]',
      badgeColor: 'border-amber-400/50 text-amber-300 bg-amber-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-amber-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(251,191,36,0.7)]">
            {/* 4 Neon Letter Tiles Grid (W-O-R-D) */}
            <rect x="22" y="24" width="34" height="34" rx="6" fill="#1f180d" stroke="#FBBF24" strokeWidth="2.5" />
            <text x="39" y="48" fontSize="18" fontWeight="900" fill="#FBBF24" textAnchor="middle">W</text>

            <rect x="64" y="24" width="34" height="34" rx="6" fill="#0c1826" stroke="#00F0FF" strokeWidth="2.5" />
            <text x="81" y="48" fontSize="18" fontWeight="900" fill="#00F0FF" textAnchor="middle">O</text>

            <rect x="22" y="64" width="34" height="34" rx="6" fill="#1f0c22" stroke="#FF007A" strokeWidth="2.5" />
            <text x="39" y="88" fontSize="18" fontWeight="900" fill="#FF007A" textAnchor="middle">R</text>

            <rect x="64" y="64" width="34" height="34" rx="6" fill="#0f2214" stroke="#39FF14" strokeWidth="2.5" />
            <text x="81" y="88" fontSize="18" fontWeight="900" fill="#39FF14" textAnchor="middle">D</text>
          </svg>
        </div>
      )
    },
    {
      id: 'truth_or_dare',
      title: 'Truth or Dare',
      category: 'Roulette Party',
      players: '2-15 Players',
      tagline: 'Spin the neon bottle wheel and face group judgment!',
      glowBorderColor: 'hover:border-pink-500 hover:shadow-[0_0_25px_rgba(255,0,122,0.5)]',
      badgeColor: 'border-pink-500/50 text-pink-300 bg-pink-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-pink-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-pink-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(255,0,122,0.7)]">
            {/* Spinning Roulette Outer Ring */}
            <circle cx="60" cy="60" r="38" fill="#120c1e" stroke="#FF007A" strokeWidth="3" />
            <circle cx="60" cy="60" r="28" fill="#070a14" stroke="#00F0FF" strokeWidth="1.5" strokeDasharray="4 6" />
            {/* Glowing Neon Pointer Arrow */}
            <polygon points="60,26 66,42 54,42" fill="#FFE600" />
            {/* Question Mark and Flame */}
            <text x="60" y="70" fontSize="28" fontWeight="900" fill="#00F0FF" textAnchor="middle">?</text>
            <circle cx="60" cy="60" r="6" fill="#FF007A" />
          </svg>
        </div>
      )
    },
    {
      id: 'never_have_i_ever',
      title: 'Never Have I Ever',
      category: 'Party Confessions',
      players: '2-15 Players',
      tagline: 'Reveal guilty secrets and protect your innocence points!',
      glowBorderColor: 'hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(52,211,153,0.5)]',
      badgeColor: 'border-emerald-400/50 text-emerald-300 bg-emerald-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-emerald-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(52,211,153,0.7)]">
            {/* Glowing Palm Gesture */}
            <path
              d="M44 80 L44 54 C44 50, 48 50, 48 54 L48 44 C48 40, 52 40, 52 44 L52 38 C52 34, 56 34, 56 38 L56 46 C56 42, 60 42, 60 46 L60 62 L66 52 C70 48, 74 52, 72 56 L64 78 C60 88, 48 88, 44 80 Z"
              fill="#10261c"
              stroke="#34D399"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* Floating Sparkles & Heart */}
            <path d="M 78 36 C 75 32, 68 34, 72 40 C 76 46, 82 50, 82 50 C 82 50, 88 46, 92 40 C 96 34, 89 32, 86 36 L 82 40 Z" fill="#FF007A" />
            <circle cx="34" cy="38" r="3" fill="#FFE600" />
            <circle cx="86" cy="68" r="2.5" fill="#00F0FF" />
          </svg>
        </div>
      )
    },
    {
      id: 'most_likely_to',
      title: 'Most Likely To...',
      category: 'Roast & Votes',
      players: '2-15 Players',
      tagline: 'Vote on friends for crazy scenarios, roast the winner & dish penalties!',
      glowBorderColor: 'hover:border-yellow-400 hover:shadow-[0_0_25px_rgba(250,204,21,0.5)]',
      badgeColor: 'border-yellow-400/50 text-yellow-300 bg-yellow-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-yellow-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(250,204,21,0.7)]">
            {/* Megaphone / Ballot Icon */}
            <rect x="25" y="35" width="50" height="60" rx="8" fill="#1c190a" stroke="#FACC15" strokeWidth="3" />
            <line x1="35" y1="50" x2="65" y2="50" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="65" x2="65" y2="65" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="35" y1="80" x2="55" y2="80" stroke="#00F0FF" strokeWidth="2.5" strokeLinecap="round" />
            {/* Glowing Pointer Star */}
            <polygon points="85,35 90,47 103,48 93,57 96,70 85,63 74,70 77,57 67,48 80,47" fill="#FACC15" stroke="#FFE600" strokeWidth="1.5" />
          </svg>
        </div>
      )
    },
    {
      id: 'sip_or_spill',
      title: 'Sip or Spill 🥤',
      category: 'Party Dilemmas',
      players: '2-15 Players',
      tagline: 'Confess wild secrets or take a sip to skip! Dynamic live sip counter.',
      glowBorderColor: 'hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(56,242,255,0.5)]',
      badgeColor: 'border-cyan-400/50 text-cyan-300 bg-cyan-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-cyan-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]">
            {/* Neon Drink Cup */}
            <polygon points="38,40 82,40 74,95 46,95" fill="#0b1b2b" stroke="#38F2FF" strokeWidth="3" strokeLinejoin="round" />
            {/* Liquid Fill Line */}
            <polygon points="41,55 79,55 74,93 46,93" fill="#A855F7" fillOpacity="0.4" />
            {/* Diagonal Straw */}
            <line x1="60" y1="65" x2="85" y2="15" stroke="#FF007A" strokeWidth="4" strokeLinecap="round" />
            {/* Sparkles / Ice Cubes */}
            <rect x="50" y="62" width="10" height="10" rx="2" fill="#38F2FF" fillOpacity="0.6" />
            <circle cx="68" cy="72" r="3" fill="#FFE600" />
            <circle cx="75" cy="48" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      )
    },
    {
      id: 'silly_roulette',
      title: 'Silly Roulette',
      category: 'Spin the Chaos',
      players: '2-15 Players',
      tagline: 'Spin the synced neon wheel for absurd vocal impressions & physical acts!',
      glowBorderColor: 'hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]',
      badgeColor: 'border-purple-400/50 text-purple-300 bg-purple-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-purple-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(168,85,247,0.7)]">
            {/* Neon Wheel Outer Ring */}
            <circle cx="60" cy="60" r="38" fill="#130922" stroke="#A855F7" strokeWidth="3.5" />
            {/* Wheel Spokes */}
            <line x1="60" y1="22" x2="60" y2="98" stroke="#38F2FF" strokeWidth="1.5" />
            <line x1="22" y1="60" x2="98" y2="60" stroke="#38F2FF" strokeWidth="1.5" />
            <line x1="33" y1="33" x2="87" y2="87" stroke="#FF007A" strokeWidth="1.5" />
            <line x1="33" y1="87" x2="87" y2="33" stroke="#FF007A" strokeWidth="1.5" />
            {/* Hub and Top Pin */}
            <circle cx="60" cy="60" r="10" fill="#FFE600" stroke="#000000" strokeWidth="2" />
            <polygon points="60,14 66,26 54,26" fill="#38F2FF" />
          </svg>
        </div>
      )
    },
    {
      id: 'hot_potato',
      title: 'Hot Potato (Bomb Pass)',
      category: 'Speed Reflexes',
      players: '2-15 Players',
      tagline: '8 seconds to type and pass the ticking bomb before it detonates!',
      glowBorderColor: 'hover:border-orange-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]',
      badgeColor: 'border-orange-500/50 text-orange-300 bg-orange-950/60',
      renderArtwork: () => (
        <div className="relative w-full h-32 flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-orange-950/40 to-[#070a18]/80">
          <div className="absolute w-20 h-20 bg-orange-500/20 rounded-full blur-xl animate-pulse" />
          <svg viewBox="0 0 120 120" className="w-24 h-24 filter drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]">
            {/* Bomb Body */}
            <circle cx="60" cy="68" r="30" fill="#180e07" stroke="#F97316" strokeWidth="3.5" />
            {/* Bomb Cap */}
            <rect x="52" y="32" width="16" height="8" rx="2" fill="#F97316" />
            {/* Fuse Curve */}
            <path d="M 60 32 Q 72 18, 82 24" fill="none" stroke="#FFE600" strokeWidth="3" strokeLinecap="round" />
            {/* Spark at Fuse End */}
            <circle cx="82" cy="24" r="5" fill="#EF4444" className="animate-ping" />
            <circle cx="82" cy="24" r="3" fill="#FFE600" />
            {/* Countdown Badge on Bomb */}
            <text x="60" y="74" fontSize="16" fontWeight="900" fill="#F97316" textAnchor="middle" fontFamily="monospace">8s</text>
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
            <span className="w-3 h-3 rounded-full bg-[#0B89FD] border-2 border-[#010101] shadow-[1px_1px_0px_#010101]" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#010101] tracking-wider uppercase font-heading">
              POPULAR PARTY GAMES
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#525252] font-semibold mt-1">
            Pick a game to instantly launch a custom 15-player room with your crew
          </p>
        </div>

        <div className="text-xs font-black text-[#010101] px-3.5 py-1 rounded-full bg-[#FEC90E] border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
          10 Live Party Modes
        </div>
      </div>

      {/* 10-CARD RESPONSIVE GRID (2 cols mobile, 3 cols tablet, 5 cols desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {games.map((g, idx) => {
          const cornerColor =
            g.id === 'who_is_imposter' || g.id === 'hot_potato' || g.id === 'silly_roulette'
              ? '#FD3F01'
              : g.id === 'draw_and_guess' || g.id === 'word_battle' || g.id === 'quiz_battle'
              ? '#0B89FD'
              : '#FEC90E';

          return (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -4, x: -2 }}
              onClick={() => {
                sound.playClick();
                onSelectGame(g.id);
              }}
              className="cursor-pointer bg-[#FFFFFF] rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between border-2 border-[#010101] shadow-[4px_4px_0px_#010101] hover:shadow-[6px_6px_0px_#010101] transition-all relative group overflow-hidden"
            >
              {/* SUBTLE GEOMETRIC BAUHAUS CORNER ACCENT (QUARTER-CIRCLE) */}
              <div className="absolute -top-6 -right-6 w-14 h-14 rounded-full border-2 border-[#010101] pointer-events-none z-0" style={{ backgroundColor: cornerColor }} />

              {/* TOP BADGE: PLAYER COUNT */}
              <div className="flex items-center justify-between gap-1 mb-2 relative z-10">
                <span className="text-[10px] font-black uppercase text-[#525252] tracking-wider truncate">
                  {g.category}
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[#010101] bg-[#FEC90E] text-[#010101] flex-shrink-0 shadow-[1px_1px_0px_#010101]">
                  {g.players}
                </span>
              </div>

              {/* CUSTOM ARTWORK IN CRISP FRAME */}
              <div className="my-1 rounded-xl bg-[#F8F8F8] border-2 border-[#010101] p-1 overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] relative z-10">
                {g.renderArtwork()}
              </div>

              {/* TITLE & DESCRIPTION */}
              <div className="mt-2.5 flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-[#010101] group-hover:text-[#0B89FD] transition-colors line-clamp-1">
                    {g.title}
                  </h3>
                  <p className="text-[11px] text-[#525252] font-medium mt-1 leading-snug line-clamp-2">
                    {g.tagline}
                  </p>
                </div>

                {/* CARD ACTION BUTTON */}
                <div className="mt-3 pt-2.5 border-t-2 border-[#010101] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onOpenRules(g.id);
                    }}
                    className="text-[10px] font-black text-[#525252] hover:text-[#010101] flex items-center gap-1 py-1 px-1 touch-target transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#0B89FD]" />
                    <span>Rules</span>
                  </button>

                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B89FD] text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] text-[10px] font-black group-hover:bg-[#0977db] transition-colors">
                    <span>PLAY</span>
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
