import React from 'react';
import { Habit, HabitLog } from '../types/index.js';
import { toPersianDigits, formatPersianDateTime, getTodayISODate } from '../utils/persianDate.js';
import { Check, Sparkles, Activity, Moon, Sun, Dumbbell, BookOpen, Clock3, AlertCircle } from 'lucide-react';
import { soundManager } from '../utils/audio.js';

interface Props {
  habits: Habit[];
  habitLogs: HabitLog[];
  onToggleHabit: (habitId: string) => Promise<void>;
  theme?: 'dark' | 'light';
}

export const HabitsView: React.FC<Props> = ({
  habits,
  habitLogs,
  onToggleHabit,
  theme = 'dark',
}) => {
  const today = getTodayISODate();
  const todayLogs = habitLogs.filter((log) => log.date === today);

  const getHabitLog = (habitId: string): HabitLog | undefined => {
    return todayLogs.find((l) => l.habitId === habitId);
  };

  const approvedCount = habits.filter((h) => getHabitLog(h.id)?.status === 'APPROVED').length;
  const pendingCount = habits.filter((h) => getHabitLog(h.id)?.status === 'PENDING').length;
  const totalCount = habits.length;

  const handleToggle = async (habitId: string) => {
    const log = getHabitLog(habitId);
    if (!log || log.status !== 'APPROVED') {
      soundManager.playRewardCoin();
      await onToggleHabit(habitId);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'روتین':
        return <Sun className="w-4 h-4 text-amber-400" />;
      case 'سلامت':
        return <Dumbbell className="w-4 h-4 text-emerald-400" />;
      case 'تمرکز':
        return <Activity className="w-4 h-4 text-purple-400" />;
      case 'مطالعه':
      default:
        return <BookOpen className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div
        className={`p-6 rounded-3xl ${
          theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
        } border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>عادت‌های بنیادین موفقیت</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            چک‌لیست روزانه استمرار و انضباط
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            پس از تیک زدن هر عادت، درخواست شما به مشاور ارسال شده و با تایید مشاور <span className="text-emerald-400 font-bold font-mono">+۱۰ FP</span> دریافت می‌کنید.
          </p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">تایید شده توسط مشاور</div>
            <div className="text-sm font-bold font-mono text-emerald-400">
              {toPersianDigits(approvedCount)} از {toPersianDigits(totalCount)} عادت
            </div>
          </div>
          {pendingCount > 0 && (
            <div className="text-right border-r border-white/10 pr-4">
              <div className="text-[11px] text-amber-400">در انتظار تایید</div>
              <div className="text-sm font-bold font-mono text-amber-300">
                {toPersianDigits(pendingCount)} مورد
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {habits.map((habit) => {
          const log = getHabitLog(habit.id);
          const isPending = log?.status === 'PENDING' && log.completed;
          const isApproved = log?.status === 'APPROVED' && log.completed;

          return (
            <div
              key={habit.id}
              onClick={() => handleToggle(habit.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 select-none ${
                isApproved
                  ? 'bg-slate-900/60 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : isPending
                  ? 'bg-slate-900/70 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] ring-1 ring-amber-500/20'
                  : 'bg-slate-900/80 border-white/10 hover:border-purple-500/40'
              } flex items-center justify-between gap-3`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Category Icon */}
                <div className="p-2 rounded-xl bg-slate-800/80 shrink-0">
                  {getCategoryIcon(habit.category)}
                </div>

                <div className="min-w-0">
                  <div
                    className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                      isApproved ? 'text-emerald-300' : isPending ? 'text-amber-300' : 'text-slate-100'
                    }`}
                  >
                    {habit.title}
                  </div>
                  {habit.description && (
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {habit.description}
                    </div>
                  )}

                  {/* Status subtitle with time if recorded */}
                  {isPending && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-1 font-medium">
                      <Clock3 className="w-3 h-3" />
                      <span>ارسال شده در {formatPersianDateTime(log.requestedAt)} · در انتظار تایید مشاور</span>
                    </div>
                  )}
                  {isApproved && (
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1 font-medium">
                      <Check className="w-3 h-3" />
                      <span>تایید شد (+۱۰ FP دریافت گردید)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox Button */}
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all ${
                    isApproved
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                      : isPending
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse'
                      : 'border-white/20 bg-slate-800/60 text-transparent hover:border-purple-400'
                  }`}
                  title={isApproved ? 'تایید شده' : isPending ? 'در انتظار تایید مشاور' : 'ثبت تیک عادت'}
                >
                  {isApproved ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : isPending ? (
                    <Clock3 className="w-4 h-4" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[2]" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
