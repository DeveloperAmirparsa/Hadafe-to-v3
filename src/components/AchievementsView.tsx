import React, { useState, useEffect } from 'react';
import {
  Award,
  Trophy,
  Flame,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
  ChevronRight,
  Shield,
  Star,
  Activity,
  HeartPulse,
  Compass,
  Zap,
  Target,
  Sunrise,
  X,
  Crown,
} from 'lucide-react';
import { AchievementItem, BadgeItem, Student, RarityType, InventoryItem } from '../types/index.js';
import { toPersianDigits } from '../utils/persianDate.js';
import { soundManager } from '../utils/audio.js';

interface Props {
  student: Student;
  onUpdateStudent: (freshStudent: Student) => void;
  theme?: 'dark' | 'light';
}

const RARITY_CONFIG: Record<
  RarityType,
  { label: string; border: string; bg: string; text: string; glow: string }
> = {
  معمولی: {
    label: 'معمولی',
    border: 'border-slate-500/40',
    bg: 'bg-slate-500/10',
    text: 'text-slate-300',
    glow: '',
  },
  کمیاب: {
    label: 'کمیاب',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/15',
    text: 'text-blue-300',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
  },
  حماسی: {
    label: 'حماسی',
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
  },
  'افسانه‌ای': {
    label: 'افسانه‌ای',
    border: 'border-amber-500/50',
    bg: 'bg-amber-500/20',
    text: 'text-amber-300',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
  },
  'اسطوره‌ای': {
    label: 'اسطوره‌ای',
    border: 'border-rose-500/60 ring-1 ring-rose-500/30',
    bg: 'bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-amber-500/20',
    text: 'text-rose-300',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
  },
};

export const AchievementsView: React.FC<Props> = ({
  student,
  onUpdateStudent,
  theme = 'dark',
}) => {
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Claim State & Modal
  const [claimingCode, setClaimingCode] = useState<string | null>(null);
  const [unlockedCelebration, setUnlockedCelebration] = useState<{
    achievement: AchievementItem;
    badgeItem?: InventoryItem;
  } | null>(null);

  // Fetch Achievements and Badges
  const loadData = async () => {
    try {
      const [achRes, badgeRes] = await Promise.all([
        fetch(`/api/achievements?studentId=${student.id}`),
        fetch('/api/badges'),
      ]);

      if (achRes.ok) setAchievements(await achRes.json());
      if (badgeRes.ok) setBadges(await badgeRes.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [student.id]);

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Target':
        return <Target className="w-5 h-5 text-purple-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-blue-400" />;
      case 'Sunrise':
        return <Sunrise className="w-5 h-5 text-amber-400" />;
      case 'Flame':
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-400" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5 text-rose-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 'Award':
      default:
        return <Award className="w-5 h-5 text-purple-400" />;
    }
  };

  // Handle Claim Action
  const handleClaim = async (ach: AchievementItem) => {
    if (claimingCode) return;
    setClaimingCode(ach.code);

    try {
      const res = await fetch('/api/achievements/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ach.code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playBadgeUnlock();
        setUnlockedCelebration({
          achievement: data.achievement,
          badgeItem: data.badgeItem,
        });
        if (data.student) onUpdateStudent(data.student);
        await loadData();
      } else {
        alert(data.error || 'خطا در دریافت پاداش دستاورد.');
      }
    } catch {
      alert('خطای ارتباط با سرور.');
    } finally {
      setClaimingCode(null);
    }
  };

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <div className="w-full space-y-6">
      {/* Top Header Card */}
      <div
        className={`p-6 sm:p-7 rounded-3xl glass-primary border ${
          theme === 'dark' ? 'border-purple-500/25 bg-slate-900/80' : 'border-indigo-200/50 bg-white/80'
        } flex flex-col md:flex-row md:items-center justify-between gap-5`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-purple-400 font-bold">
            <Award className="w-4 h-4" />
            <span>تالار افتخارات و دستاوردهای رسمی کنکور</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            دستاوردها، رکوردها و نشان‌های افتخار
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            دستاوردهای ۵‌گانه سامانه هدف تو مستقیماً از داده‌های ثبت‌شده پارت‌ها، استمرار و آزمون‌های شما محاسبه می‌شوند.
          </p>
        </div>

        {/* Unlocked Badges Counter Pill */}
        <div className="p-4 rounded-2xl bg-gradient-to-tr from-purple-950/60 to-slate-900/90 border border-purple-500/30 flex items-center gap-4 shrink-0 shadow-lg shadow-purple-600/10">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-200 font-black text-lg">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">دستاوردهای گشایش‌یافته</span>
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              {toPersianDigits(unlockedCount)} / {toPersianDigits(achievements.length)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================
          SECTION 1: 5 AUTHORITATIVE ACHIEVEMENTS
      ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>دستاوردهای ۵‌گانه آکادمیک</span>
          </h2>
          <span className="text-xs text-slate-400">
            محاسبه قطعی و سروری بر اساس پیشرفت واقعی
          </span>
        </div>

        {achievements.length === 0 ? (
          <div className="p-16 text-center rounded-3xl glass-secondary text-slate-400 space-y-2 border border-white/5">
            <Award className="w-12 h-12 mx-auto text-slate-600 mb-2" />
            <h3 className="text-base font-bold text-slate-300">
              هنوز دستاوردی کسب نکرده‌اید
            </h3>
            <p className="text-xs text-slate-500">
              با مطالعه پارت‌ها، حفظ استمرار و حل تست‌ها دستاوردهای تحصیلی به تدریج گشایش خواهند یافت.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach) => {
              const badge = badges.find((b) => b.id === ach.badgeId);
              const rarity = badge ? badge.rarity : 'حماسی';
              const rarityStyle = RARITY_CONFIG[rarity] || RARITY_CONFIG['معمولی'];
              const progressPct = Math.min(
                100,
                Math.round((ach.currentProgress / (ach.targetProgress || 1)) * 100)
              );
              const isClaiming = claimingCode === ach.code;

              return (
                <div
                  key={ach.id}
                  className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                    ach.isClaimed
                      ? 'bg-slate-900/60 border-emerald-500/30'
                      : ach.isUnlocked
                      ? 'bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-950 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/30'
                      : 'glass-secondary border-white/10 opacity-80'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Header: Status + Rarity */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${rarityStyle.border} ${rarityStyle.bg} ${rarityStyle.text}`}
                      >
                        {rarityStyle.label}
                      </span>

                      {ach.isClaimed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>دریافت شده</span>
                        </span>
                      ) : ach.isUnlocked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold animate-pulse">
                          آماده دریافت پاداش
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/10 text-[10px] flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>قفل شده</span>
                        </span>
                      )}
                    </div>

                    {/* Title + Icon + Description */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3.5 rounded-2xl border shrink-0 ${
                          ach.isUnlocked
                            ? 'bg-purple-600/20 border-purple-400/40 shadow-lg shadow-purple-600/20'
                            : 'bg-white/5 border-white/10 text-slate-500'
                        }`}
                      >
                        {badge ? getBadgeIcon(badge.icon) : <Award className="w-6 h-6" />}
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-slate-100">
                          {ach.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {ach.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Numeric Target */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">میزان پیشرفت:</span>
                        <span className="text-slate-200 font-bold">
                          {toPersianDigits(ach.currentProgress)} / {toPersianDigits(ach.targetProgress)}
                          {ach.code === '100_HOURS' && ' دقیقه'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${
                            ach.isClaimed
                              ? 'bg-emerald-500'
                              : ach.isUnlocked
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
                              : 'bg-purple-600/60'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Claim Action */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] text-purple-400 font-mono">
                      پاداش: نشان رسمی + ۱۰۰ FP
                    </span>

                    {ach.isClaimed ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>پاداش در موجودی شماست</span>
                      </span>
                    ) : ach.isUnlocked ? (
                      <button
                        type="button"
                        disabled={isClaiming}
                        onClick={() => handleClaim(ach)}
                        className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98 animate-bounce duration-1000"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isClaiming ? 'در حال ثبت...' : 'دریافت نشان و پاداش'}</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        شرایط لازم هنوز کامل نشده
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================
          SECTION 2: ALL BADGES GALLERY & 3 COUNSELOR-ONLY BADGES
      ======================================================== */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>گالری تمام نشان‌های افتخار هدف تو</span>
          </h2>
          <span className="text-xs text-slate-400">
            شامل ۳ نشان فوق‌کمیاب انحصاری استاد مشاور
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((b) => {
            const rarityStyle = RARITY_CONFIG[b.rarity] || RARITY_CONFIG['معمولی'];
            const isCounselorOnly = b.isCounselorOnly;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-3 ${
                  isCounselorOnly
                    ? 'bg-gradient-to-b from-purple-950/50 via-slate-900/90 to-slate-950 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                    : 'glass-secondary border-white/10 hover:border-purple-500/30'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rarityStyle.border} ${rarityStyle.bg} ${rarityStyle.text}`}
                    >
                      {rarityStyle.label}
                    </span>

                    {isCounselorOnly && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>انحصاری مشاور</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-2xl bg-white/5 border shrink-0 ${
                        isCounselorOnly ? 'border-amber-400/40 text-amber-300' : 'border-white/10'
                      }`}
                    >
                      {getBadgeIcon(b.icon)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">
                        {b.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </div>
                </div>

                {isCounselorOnly && (
                  <div className="pt-2.5 border-t border-amber-500/20 text-[11px] text-amber-300/80 font-medium leading-relaxed">
                    این نشان در فروشگاه فروخته نمی‌شود و تنها با ارزیابی بالینی استاد مشاور اعطا می‌گردد.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          SIGNATURE CELEBRATION MODAL: MEDICAL-TECH BADGE UNLOCK
      ======================================================== */}
      {unlockedCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-md p-7 sm:p-8 rounded-3xl glass-primary border border-purple-500/50 shadow-[0_0_80px_rgba(168,85,247,0.35)] text-center space-y-6">
            <button
              type="button"
              onClick={() => setUnlockedCelebration(null)}
              className="absolute top-4 left-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Medical-Tech Violet Ring & ECG Pulse */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-ping opacity-40" />
              <div className="absolute inset-2 rounded-full border border-indigo-400/50 animate-spin duration-4000" />
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-2xl shadow-purple-600/60 animate-ecg">
                <Award className="w-10 h-10 drop-shadow" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>دستاورد تحصیلی با موفقیت گشایش یافت!</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                {unlockedCelebration.achievement.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                {unlockedCelebration.achievement.description}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-200 flex items-center justify-between font-mono">
              <span>پاداش Focus Points:</span>
              <span className="font-bold text-sm text-emerald-400">+۱۰۰ FP</span>
            </div>

            <button
              type="button"
              onClick={() => setUnlockedCelebration(null)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/40 transition-all cursor-pointer"
            >
              افزودن نشان به موجودی و بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
