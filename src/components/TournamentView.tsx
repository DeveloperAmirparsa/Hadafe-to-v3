import React, { useState } from 'react';
import { TournamentLeaderboardItem } from '../types/index.js';
import { toPersianDigits, formatPersianTime } from '../utils/persianDate.js';
import {
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Target,
  Sparkles,
  Medal,
  Award,
  Crown,
} from 'lucide-react';

interface Props {
  tournamentData: {
    studyLeaderboard: TournamentLeaderboardItem[];
    testsLeaderboard: TournamentLeaderboardItem[];
    streakLeaderboard: TournamentLeaderboardItem[];
  };
  currentStudentId?: string;
  theme?: 'dark' | 'light';
}

type TabType = 'study' | 'tests' | 'streak';

export const TournamentView: React.FC<Props> = ({
  tournamentData,
  currentStudentId,
  theme = 'dark',
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('study');

  const getActiveList = () => {
    switch (activeTab) {
      case 'study':
        return tournamentData.studyLeaderboard;
      case 'tests':
        return tournamentData.testsLeaderboard;
      case 'streak':
        return tournamentData.streakLeaderboard;
    }
  };

  const activeList = getActiveList();
  const topThree = activeList.slice(0, 3);
  const remaining = activeList.slice(3);

  const getMetricLabel = (item: TournamentLeaderboardItem) => {
    switch (activeTab) {
      case 'study':
        return `${toPersianDigits(formatPersianTime(item.weeklyStudyMinutes))} ساعت`;
      case 'tests':
        return `${toPersianDigits(item.weeklyTestsCount)} تست`;
      case 'streak':
        return `${toPersianDigits(item.streak)} روز پیوسته`;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Tournament Header */}
      <div
        className={`p-6 sm:p-7 rounded-3xl glass-primary transition-all duration-300 border ${
          theme === 'dark' ? 'border-purple-500/25' : 'border-indigo-200/50'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <Trophy className="w-4 h-4" />
              <span>رقابت نخبگان · لیگ انگیزه و پشتکار هدف تو</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">
              جدول رده‌بندی تورنمنت
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              رتبه‌بندی بر اساس عملکرد واقعی تحصیلی. زمان مطالعه و تست‌ها شنبه‌ها بازنشانی شده و استمرار با تایید مشاور ثبت می‌گردد.
            </p>
          </div>

          {/* Privacy badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>حریم خصوصی کامل: اطلاعات تماس، شهر و یادداشت‌ها محفوظ است.</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl glass-secondary max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('study')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'study'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>مطالعه هفتگی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tests')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'tests'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>تست‌های هفتگی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('streak')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'streak'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>استمرار و اراده</span>
        </button>
      </div>

      {/* Glass Podium for Top 3 */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Rank 2 (Silver) */}
          {topThree[1] && (
            <div
              className={`order-2 md:order-1 p-5 rounded-3xl glass-secondary border border-slate-300/20 text-center flex flex-col items-center justify-between space-y-3 ${
                topThree[1].studentId === currentStudentId ? 'ring-2 ring-purple-500/50' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-900 font-black text-sm flex items-center justify-center shadow-md">
                ۲
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-bold text-sm text-slate-100">{topThree[1].nickname || topThree[1].fullName}</span>
                  {topThree[1].equippedTitle && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {topThree[1].equippedTitle}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">{topThree[1].major}</span>
              </div>
              <div className="text-sm font-black font-mono text-purple-300">
                {getMetricLabel(topThree[1])}
              </div>
            </div>
          )}

          {/* Rank 1 (Gold - Crown Center) */}
          {topThree[0] && (
            <div
              className={`order-1 md:order-2 p-6 rounded-3xl glass-secondary border border-amber-400/40 text-center flex flex-col items-center justify-between space-y-3 bg-gradient-to-b from-amber-500/10 to-transparent shadow-[0_0_40px_rgba(245,158,11,0.15)] ${
                topThree[0].studentId === currentStudentId ? 'ring-2 ring-amber-400' : ''
              }`}
            >
              <div className="relative">
                <Crown className="w-6 h-6 text-amber-400 mx-auto mb-1 animate-bounce duration-1000" />
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-black text-base flex items-center justify-center shadow-lg shadow-amber-500/40">
                  ۱
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-black text-base text-amber-200">{topThree[0].nickname || topThree[0].fullName}</span>
                  {topThree[0].equippedTitle && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                      «{topThree[0].equippedTitle}»
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 block font-mono">{topThree[0].major} · {topThree[0].grade}</span>
                {topThree[0].motto && (
                  <p className="text-[11px] text-purple-300/80 italic mt-1 line-clamp-1">
                    «{topThree[0].motto}»
                  </p>
                )}
              </div>
              <div className="text-base font-black font-mono text-amber-300">
                {getMetricLabel(topThree[0])}
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] && (
            <div
              className={`order-3 p-5 rounded-3xl glass-secondary border border-amber-700/30 text-center flex flex-col items-center justify-between space-y-3 ${
                topThree[2].studentId === currentStudentId ? 'ring-2 ring-purple-500/50' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                ۳
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-bold text-sm text-slate-100">{topThree[2].nickname || topThree[2].fullName}</span>
                  {topThree[2].equippedTitle && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      {topThree[2].equippedTitle}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 block font-mono">{topThree[2].major}</span>
              </div>
              <div className="text-sm font-black font-mono text-purple-300">
                {getMetricLabel(topThree[2])}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Remaining List */}
      <div className="space-y-2">
        {remaining.map((item, index) => {
          const rank = index + 4;
          const isCurrentStudent = item.studentId === currentStudentId;

          return (
            <div
              key={item.studentId}
              className={`p-4 rounded-2xl glass-secondary flex items-center justify-between gap-4 transition-all ${
                isCurrentStudent
                  ? 'border-purple-500/60 bg-purple-950/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                  : 'hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white/5 text-slate-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {toPersianDigits(rank)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">
                      {item.nickname || item.fullName}
                    </span>
                    {item.equippedTitle && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/20 text-[10px] font-bold">
                        {item.equippedTitle}
                      </span>
                    )}
                    {isCurrentStudent && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-bold">
                        شما
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                    {item.major} · {item.grade}
                  </span>
                </div>
              </div>

              <div className="text-left font-mono font-black text-sm text-purple-300 shrink-0">
                {getMetricLabel(item)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
