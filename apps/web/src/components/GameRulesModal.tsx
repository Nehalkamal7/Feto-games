'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Sparkles, BookOpen, Clock, ShieldCheck, Flame } from 'lucide-react';
import { GameMode } from '@feto-games/shared-types';
import { sound } from '@/lib/sound';

export interface GameRuleDetails {
  id: GameMode;
  name: string;
  tagline: string;
  playerRange: string;
  difficulty: 'Casual' | 'Fast-Paced' | 'Mind Games' | 'Creative';
  roundDuration: string;
  badgeColor: string;
  overview: string;
  howToPlay: string[];
  scoringTips: string[];
}

export const GAME_RULES_DATA: Record<string, GameRuleDetails> = {
  who_is_imposter: {
    id: 'who_is_imposter',
    name: 'Who Is The Imposter?',
    tagline: 'Social deduction party game of deception and hidden roles',
    playerRange: '3-15 Players',
    difficulty: 'Mind Games',
    roundDuration: '30-45s per phase',
    badgeColor: 'border-feto-magenta/40 text-feto-magenta bg-feto-magenta/10',
    overview:
      'Civilians receive the secret word and category. Imposters are kept in the dark and must blend in without blowing their cover!',
    howToPlay: [
      'Roles are dealt secretly: 1 imposter for 3-6 players, 2 for 7-11 players, 3 for 12-15 players.',
      'Each player submits a single-word or short clue relating to the secret word.',
      'All players review clues and cast their vote for who they believe is the imposter.',
      'If caught, the imposter gets a 10-second sudden-death chance to guess the secret word to steal bonus points!'
    ],
    scoringTips: [
      'Civilians earn +100 points for voting out all imposters.',
      'Imposters earn +200 points for surviving unnoticed.',
      'Imposters earn +150 bonus points if they correctly guess the secret word during sudden death.'
    ]
  },
  draw_and_guess: {
    id: 'draw_and_guess',
    name: 'Draw & Guess',
    tagline: 'Fast-paced multiplayer drawing and rapid-fire word guessing',
    playerRange: '2-15 Players',
    difficulty: 'Creative',
    roundDuration: '60s per turn',
    badgeColor: 'border-cyan-400/40 text-cyan-400 bg-cyan-400/10',
    overview:
      'Players take turns drawing secret prompt words on a live responsive canvas while everyone else races to guess the word first.',
    howToPlay: [
      'The designated drawer picks 1 of 3 secret words and draws using color and brush controls.',
      'All other players type guesses into the instant guess bar.',
      'Drawings stream live stroke-by-stroke across all phones and desktops with zero lag.',
      'Once guessed correctly, the player receives a hidden confirmation and waits for round end.'
    ],
    scoringTips: [
      'Guessers earn up to +150 points based on speed (earlier guesses score more points).',
      'The drawer earns +50 bonus points for every player who correctly identifies the drawing.'
    ]
  },
  quiz_battle: {
    id: 'quiz_battle',
    name: 'Quiz Battle',
    tagline: 'Rapid-fire trivia showdown with streak multipliers',
    playerRange: '2-15 Players',
    difficulty: 'Fast-Paced',
    roundDuration: '15-20s per question',
    badgeColor: 'border-yellow-400/40 text-yellow-300 bg-yellow-400/10',
    overview:
      'Race against 14 friends to answer challenging trivia questions across gaming, science, pop culture, and history.',
    howToPlay: [
      'A question with 4 multiple-choice options appears simultaneously on everyone’s device.',
      'Tap your chosen answer before the 15-second countdown expires.',
      'Answers lock in immediately to prevent changing your mind.',
      'Leaderboard updates in real-time after each question.'
    ],
    scoringTips: [
      'Base correct answer: +100 points.',
      'Speed bonus: Up to +50 extra points depending on how fast you submit.',
      'Streak multipliers: Maintain a streak of correct answers for up to 2.5x point bonuses!'
    ]
  },
  word_battle: {
    id: 'word_battle',
    name: 'Word Battle',
    tagline: 'High-speed vocabulary dash with round word locking',
    playerRange: '2-15 Players',
    difficulty: 'Fast-Paced',
    roundDuration: '25s per round',
    badgeColor: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
    overview:
      'Every round a starting letter and category is revealed. Race against all 15 players to submit valid, unique words before time runs out!',
    howToPlay: [
      'Server generates a random starting letter and category (e.g. "Animals starting with T").',
      'Type and submit valid words as fast as you can.',
      'Enforces strict uniqueness: if Player A submits "Tiger", Player B receives an instant "Already taken!" alert and must think of another word.',
      'Built-in dictionary validates words in real time.'
    ],
    scoringTips: [
      'Each valid word grants +50 points.',
      'Longer words (7+ letters) grant +25 bonus vocabulary points.',
      'Fastest player to submit 3 unique words gets the +100 speed runner bonus.'
    ]
  },
  truth_or_dare: {
    id: 'truth_or_dare',
    name: 'Truth or Dare',
    tagline: 'Synced 3D roulette spinner with party intensity modes',
    playerRange: '2-15 Players',
    difficulty: 'Casual',
    roundDuration: '45s per turn',
    badgeColor: 'border-purple-400/40 text-purple-300 bg-purple-400/10',
    overview:
      'Spin the party roulette wheel to pick a target player who must choose TRUTH or DARE under room scrutiny.',
    howToPlay: [
      'Wheel rotates synchronously on all players’ screens with physics easing.',
      'Target player selects Truth or Dare from tiered intensity packs: Chill, Party, or Wild.',
      'Target executes the prompt on camera or in person with friends.',
      'All other room players vote "Completed" (+100 pts) or "Chicken/Refused" (0 pts).'
    ],
    scoringTips: [
      'Dares reward +150 points upon group approval.',
      'Truths reward +100 points upon group approval.',
      'Community consensus determines whether points are awarded.'
    ]
  },
  never_have_i_ever: {
    id: 'never_have_i_ever',
    name: 'Never Have I Ever',
    tagline: 'Life elimination party classic with confession voting',
    playerRange: '2-15 Players',
    difficulty: 'Casual',
    roundDuration: '20s per prompt',
    badgeColor: 'border-rose-400/40 text-rose-300 bg-rose-400/10',
    overview:
      'Everyone starts with 5 hearts. Prompts appear on screen—if you’ve done it, you lose a heart. Last player alive wins!',
    howToPlay: [
      'Every player starts with 5 animated neon heart lives.',
      'A juicy confession prompt is displayed to the entire room.',
      'All players press "I HAVE" or "NEVER".',
      'Players who confess lose a heart life with dramatic fracture animation.',
      'Survive until other players run out of lives!'
    ],
    scoringTips: [
      'Surviving each round without losing a heart awards +50 survival points.',
      'Last remaining player with hearts intact wins +300 champion points.'
    ]
  },
  most_likely_to: {
    id: 'most_likely_to',
    name: 'Most Likely To...',
    tagline: 'Social roast and consensus voting game',
    playerRange: '2-15 Players',
    difficulty: 'Casual',
    roundDuration: '30s per round',
    badgeColor: 'border-yellow-400/40 text-yellow-300 bg-yellow-950/20',
    overview:
      'A wild scenario appears on screen. Everyone secretly votes on which player in the room is most likely to do it!',
    howToPlay: [
      'A prompt card appears (e.g., "Who is most likely to order takeout 3 times in one day?").',
      'All players cast a secret vote on any player in the room.',
      'Live animated bar charts reveal the vote tallies.',
      'The top-voted player takes the hot seat, gets roasted, and faces a goofy penalty!'
    ],
    scoringTips: [
      'Guessing the majority consensus awards +100 alignment points.',
      'Receiving the most votes awards +150 crowd-favorite points.'
    ]
  },
  sip_or_spill: {
    id: 'sip_or_spill',
    name: 'Sip or Spill 🥤',
    tagline: 'High-energy party confessions and drink dilemmas',
    playerRange: '2-15 Players',
    difficulty: 'Casual',
    roundDuration: '35s per turn',
    badgeColor: 'border-cyan-400/40 text-cyan-300 bg-cyan-950/20',
    overview:
      'Face spicy dilemmas and deep confessions. Answer truthfully to score points, or tap "Take a Sip! 🥤" to safely skip!',
    howToPlay: [
      'One active player takes the center stage each turn with a spicy dilemma card.',
      'Player must either type their confession on-screen OR tap "Take a Sip! 🥤" to skip.',
      'Other players react in real time with floating emojis and cheers.',
      'Active Sip Counter Leaderboard tracks drinks across the entire room!'
    ],
    scoringTips: [
      'Spilling a confession awards +120 bravery points.',
      'Taking a sip counts toward the legendary "Most Sips Taken 🥤" award.'
    ]
  },
  silly_roulette: {
    id: 'silly_roulette',
    name: 'Silly Roulette',
    tagline: 'Spin the neon wheel for absurd vocal impressions and physical chaos',
    playerRange: '2-15 Players',
    difficulty: 'Fast-Paced',
    roundDuration: '30s per spin',
    badgeColor: 'border-purple-400/40 text-purple-300 bg-purple-950/20',
    overview:
      'A synced neon roulette wheel spins and picks a random player to perform an absurd challenge or hilarious dare!',
    howToPlay: [
      'The host or system spins the wheel; all players watch it decelerate in real-time.',
      'The wheel locks onto a player and reveals a goofy physical/vocal dare.',
      'The selected player performs the challenge live on voice or camera.',
      'Room votes "CRUSHED IT! 🎉" or "FAILED! 💀" to evaluate performance.'
    ],
    scoringTips: [
      'Passing group review awards +150 chaos mastery points.',
      'Unanimous praise triggers double bonus points!'
    ]
  },
  hot_potato: {
    id: 'hot_potato',
    name: 'Hot Potato (Bomb Pass)',
    tagline: 'Ticking bomb adrenaline word challenge',
    playerRange: '2-15 Players',
    difficulty: 'Fast-Paced',
    roundDuration: '8s per pass',
    badgeColor: 'border-orange-500/40 text-orange-300 bg-orange-950/20',
    overview:
      'A ticking neon bomb is passed from player to player. You have 8 seconds to type a word matching the category and hit PASS before detonation!',
    howToPlay: [
      'A category is announced (e.g. "Things found in a messy room", "Superheroes").',
      'The player holding the bomb has 8 seconds to type a valid word and click PASS.',
      'The bomb passes instantly to the next player as the ticking gets faster and louder.',
      'Whoever holds the bomb when it explodes gets roasted with dynamic screen shake and a penalty consequence!'
    ],
    scoringTips: [
      'Each successful pass awards +50 speed reflex points.',
      'Exploding player loses 100 points and performs the consequence.'
    ]
  }
};

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode?: GameMode;
  initialGameMode?: GameMode;
}

export function GameRulesModal({
  isOpen,
  onClose,
  gameMode,
  initialGameMode = 'who_is_imposter'
}: GameRulesModalProps) {
  const [activeMode, setActiveMode] = useState<GameMode>(gameMode || initialGameMode);

  React.useEffect(() => {
    if (gameMode) setActiveMode(gameMode);
  }, [gameMode]);

  if (!isOpen) return null;

  const rule = GAME_RULES_DATA[activeMode] || GAME_RULES_DATA['who_is_imposter'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl glass-panel-neon rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* TITLE */}
          <div className="flex items-center gap-2 mb-6 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Party Game Rulebooks</span>
          </div>

          {/* GAME SELECTION TABS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {(Object.keys(GAME_RULES_DATA) as GameMode[]).map((mode) => {
              const item = GAME_RULES_DATA[mode];
              const isSelected = activeMode === mode;
              return (
                <button
                  key={mode}
                  onClick={() => {
                    sound.playClick();
                    setActiveMode(mode);
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-neon-cyan'
                      : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                  }`}
                >
                  <div className="truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-normal">{item.playerRange}</div>
                </button>
              );
            })}
          </div>

          {/* ACTIVE GAME DETAILS */}
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-2xl font-black text-white">{rule.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${rule.badgeColor}`}>
                  {rule.playerRange}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {rule.difficulty}
                </span>
              </div>
              <p className="text-slate-300 text-sm">{rule.overview}</p>
            </div>

            {/* HOW TO PLAY */}
            <div className="glass-panel p-4 rounded-2xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>How to Play</span>
              </h3>
              <ul className="space-y-2">
                {rule.howToPlay.map((step, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* SCORING & STRATEGY */}
            <div className="glass-panel p-4 rounded-2xl border-feto-magenta/30">
              <h3 className="text-xs font-bold uppercase tracking-wider text-feto-magenta mb-3 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-feto-magenta" />
                <span>Scoring & Strategy</span>
              </h3>
              <ul className="space-y-1.5">
                {rule.scoringTips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-feto-magenta font-black">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
