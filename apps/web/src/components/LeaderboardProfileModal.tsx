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
import { useLanguage } from '@/hooks/useLanguage';

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
  const { language } = useLanguage();
  const isAr = language === 'ar';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#010101]/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-[#FFFFFF] border-3 border-[#010101] shadow-[8px_8px_0px_#010101] rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto relative text-[#010101]"
        >
          {/* CLOSE BUTTON */}
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 rtl:right-auto rtl:left-5 w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center shrink-0 rounded-xl text-[#010101] bg-[#FFFFFF] hover:bg-[#FD3F01] hover:text-white border-2 border-[#010101] shadow-[2px_2px_0px_#010101] transition-all font-black"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5 shrink-0" strokeWidth={2.5} />
          </button>

          {/* TAB BUTTONS */}
          <div className="flex gap-2 mb-6 border-b-2 border-[#010101]/10 pb-4">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('leaderboard');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-2 border-[#010101] transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#0B89FD] text-white shadow-[2px_2px_0px_#010101]'
                  : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
              }`}
            >
              <Trophy className="w-4 h-4 text-[#FEC90E] fill-current" />
              <span>{isAr ? 'قائمة المتصدرين' : 'Global Leaderboard'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('profile');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border-2 border-[#010101] transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#FEC90E] text-[#010101] shadow-[2px_2px_0px_#010101]'
                  : 'bg-[#FFFFFF] text-[#010101] hover:bg-[#F8F8F8]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{isAr ? 'الملف الشخصي والأوسمة' : 'Player Profile & Badges'}</span>
            </button>
          </div>

          {/* TAB 1: GLOBAL LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#010101]/60 px-3 font-black">
                <span>{isAr ? 'الترتيب واللاعب' : 'RANK & PLAYER'}</span>
                <div className="flex gap-6">
                  <span>{isAr ? 'نسبة الفوز' : 'WIN RATE'}</span>
                  <span>{isAr ? 'مجموع النقاط' : 'TOTAL SCORE'}</span>
                </div>
              </div>

              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 bg-[#F8F8F8] border-2 border-[#010101] rounded-2xl shadow-[2px_2px_0px_#010101] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 text-center font-black text-sm force-ltr ${
                          entry.rank === 1
                            ? 'text-[#FEC90E]'
                            : entry.rank === 2
                            ? 'text-[#0B89FD]'
                            : entry.rank === 3
                            ? 'text-[#FD3F01]'
                            : 'text-[#010101]'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                      <NeonAvatarDisplay avatarId={entry.avatar} size="sm" showGlow={false} />
                      <div className="text-start">
                        <div className="font-black text-sm text-[#010101]">{entry.username}</div>
                        <div className="text-[10px] text-[#010101]/60 font-bold">
                          {isAr
                            ? `${entry.gamesWon} فوز / ${entry.gamesPlayed} مباراة`
                            : `${entry.gamesWon} wins / ${entry.gamesPlayed} games`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-xs font-black text-[#0B89FD] force-ltr">{entry.winRate}%</span>
                      <span className="font-mono font-black text-sm text-[#010101] w-20 text-end force-ltr">
                        {entry.points.toLocaleString()} {isAr ? 'نقطة' : 'pts'}
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
              <div className="bg-[#F8F8F8] border-2 border-[#010101] shadow-[4px_4px_0px_#010101] p-6 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
                <NeonAvatarDisplay avatarId={currentAvatar} size="lg" showGlow={false} />
                <div className="flex-1 text-center sm:text-start">
                  <h3 className="text-2xl font-black text-[#010101]">{currentUsername}</h3>
                  <p className="text-xs text-[#0B89FD] uppercase tracking-wider font-black mb-3">
                    {isAr ? 'محارب الحفلات المخضرم' : 'Arcade Party Veteran'}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#FFFFFF] p-2.5 rounded-xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                      <div className="text-xs text-[#010101]/60 font-black">
                        {isAr ? 'نسبة الفوز' : 'Win Rate'}
                      </div>
                      <div className="text-base font-black text-[#0B89FD] force-ltr">68%</div>
                    </div>
                    <div className="bg-[#FFFFFF] p-2.5 rounded-xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                      <div className="text-xs text-[#010101]/60 font-black">
                        {isAr ? 'المباريات' : 'Games'}
                      </div>
                      <div className="text-base font-black text-[#010101] force-ltr">24</div>
                    </div>
                    <div className="bg-[#FFFFFF] p-2.5 rounded-xl border-2 border-[#010101] shadow-[2px_2px_0px_#010101]">
                      <div className="text-xs text-[#010101]/60 font-black">
                        {isAr ? 'مجموع النقاط' : 'Total Score'}
                      </div>
                      <div className="text-base font-black text-[#FD3F01] force-ltr">4,820</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unlockable Badges */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-[#010101] mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#FEC90E]" />
                  <span>
                    {isAr
                      ? 'أوسمة الإنجازات القابلة للفتح (٣ / ٦ مفتوح)'
                      : 'Unlockable Achievement Badges (3 / 6 Unlocked)'}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {achievements.map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-2xl border-2 border-[#010101] flex items-center gap-3 transition-all ${
                        badge.unlocked
                          ? 'bg-[#FFFFFF] shadow-[3px_3px_0px_#010101]'
                          : 'bg-[#F8F8F8] opacity-60 shadow-[1px_1px_0px_#010101]'
                      }`}
                    >
                      <div
                        className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-[#FFFFFF] border-2 border-[#010101] shadow-[2px_2px_0px_#010101] inline-flex items-center justify-center shrink-0 text-2xl select-none"
                        style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                      >
                        {badge.icon}
                      </div>
                      <div className="flex-1 min-w-0 text-start">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-[#010101] truncate">{badge.title}</span>
                          {badge.unlocked ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0B89FD] flex-shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-[#010101]/40 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#010101]/70 truncate font-medium">{badge.description}</p>
                        <div className="text-[10px] text-[#0B89FD] font-black mt-1 force-ltr">
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
