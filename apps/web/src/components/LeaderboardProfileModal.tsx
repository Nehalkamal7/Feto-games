'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  User,
  Award,
  Flame,
  Zap,
  Shield,
  Star,
  Sparkles,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { NeonAvatarDisplay } from '@/components/NeonAvatarDisplay';
import { NeonAvatarId } from '@feto-games/shared-types';
import { sound } from '@/lib/sound';
import { BACKEND_URL } from '@/lib/socket';

interface LeaderboardProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
  currentAvatar?: NeonAvatarId;
}

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: NeonAvatarId;
  points: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
}

interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: string;
}

export function LeaderboardProfileModal({
  isOpen,
  onClose,
  currentUsername = 'Player',
  currentAvatar = 'cyber_cat'
}: LeaderboardProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'profile'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/leaderboard`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch {
      // API fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Mock unlockable badges based on user session
  const achievements: AchievementBadge[] = [
    {
      id: 'party_animal',
      title: 'Party Animal',
      description: 'Play 10 multiplayer matches with friends',
      icon: '🎉',
      unlocked: true,
      progress: '10/10 Complete'
    },
    {
      id: 'ghost_imposter',
      title: 'Ghost in the Shell',
      description: 'Win as Imposter without receiving a single vote',
      icon: '🕵️',
      unlocked: true,
      progress: 'Unlocked'
    },
    {
      id: 'picasso_reborn',
      title: 'Picasso Reborn',
      description: 'Guess 5 drawings in under 5 seconds',
      icon: '🎨',
      unlocked: true,
      progress: '5/5 Complete'
    },
    {
      id: 'lightning_brain',
      title: 'Lightning Brain',
      description: 'Answer 5 quiz questions correctly with maximum speed streak',
      icon: '⚡',
      unlocked: false,
      progress: '3/5 Answered'
    },
    {
      id: 'trivia_overlord',
      title: 'Trivia Overlord',
      description: 'Reach 1st place in a full 15-player lobby',
      icon: '👑',
      unlocked: false,
      progress: '12/15 Max Lobby'
    },
    {
      id: 'squad_leader',
      title: 'Squad Leader',
      description: 'Lead your team to victory in Team Mode 3 times',
      icon: '🤝',
      unlocked: false,
      progress: '1/3 Team Wins'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
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

          {/* TAB BUTTONS */}
          <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('leaderboard');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Global Leaderboard</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('profile');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeTab === 'profile'
                  ? 'bg-feto-magenta/20 text-feto-magenta border border-feto-magenta shadow-neon-magenta'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Player Profile & Badges</span>
            </button>
          </div>

          {/* TAB 1: GLOBAL LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 px-3 font-semibold">
                <span>RANK & PLAYER</span>
                <div className="flex gap-6">
                  <span>WIN RATE</span>
                  <span>TOTAL SCORE</span>
                </div>
              </div>

              <div className="divide-y divide-slate-800 glass-panel rounded-2xl overflow-hidden">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-800/40 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-black text-sm ${
                          entry.rank === 1
                            ? 'text-yellow-400'
                            : entry.rank === 2
                            ? 'text-slate-300'
                            : entry.rank === 3
                            ? 'text-amber-500'
                            : 'text-slate-500'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                      <NeonAvatarDisplay avatarId={entry.avatar} size="sm" />
                      <div>
                        <div className="font-bold text-sm text-white">{entry.username}</div>
                        <div className="text-[10px] text-slate-400">
                          {entry.gamesWon} wins / {entry.gamesPlayed} games
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-xs font-bold text-cyan-300">{entry.winRate}%</span>
                      <span className="font-mono font-black text-sm text-yellow-400 w-20 text-right">
                        {entry.points.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE STATS & UNLOCKABLE BADGES */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                <NeonAvatarDisplay avatarId={currentAvatar} size="lg" showGlow />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-2xl font-black text-white">{currentUsername}</h3>
                  <p className="text-xs text-cyan-300 uppercase tracking-wider font-semibold mb-3">
                    Arcade Party Veteran
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Win Rate</div>
                      <div className="text-base font-extrabold text-cyan-400">68%</div>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Games</div>
                      <div className="text-base font-extrabold text-white">24</div>
                    </div>
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">Total Score</div>
                      <div className="text-base font-extrabold text-yellow-400">4,820</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unlockable Badges */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span>Unlockable Achievement Badges (3 / 6 Unlocked)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                        badge.unlocked
                          ? 'bg-slate-900/80 border-cyan-500/40 shadow-neon-cyan'
                          : 'bg-slate-950/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="text-3xl p-2 rounded-xl bg-slate-800/80 border border-slate-700 flex-shrink-0">
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate">{badge.title}</span>
                          {badge.unlocked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{badge.description}</p>
                        <div className="text-[10px] text-cyan-300 font-semibold mt-1">
                          {badge.progress}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
