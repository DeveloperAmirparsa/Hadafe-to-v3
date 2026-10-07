import React, { useState, useMemo } from 'react';
import { SessionReport, PlanTask, HabitLog, DiagnosticWeights } from '../types/index.js';
import { toPersianDigits, formatPersianTime, formatPersianPercentage, getPersianWeekDays, getTodayISODate } from '../utils/persianDate.js';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  Flame,
  Activity,
  TrendingUp,
  Percent,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface Props {
  studentName: string;
  reports: SessionReport[];
  tasks: PlanTask[];
  habitLogs: HabitLog[];
  streak: number;
  dailyGoalMinutes?: number;
  weeklyGoalMinutes?: number;
  diagnosticWeights?: DiagnosticWeights;
  theme?: 'dark' | 'light';
}

type Timeframe = '7d' | '30d' | '90d' | 'all';

export const DiagnosticDashboardView: React.FC<Props> = ({
  studentName,
  reports,
  tasks,
  habitLogs,
  streak,
  dailyGoalMinutes,
  weeklyGoalMinutes,
  diagnosticWeights,
  theme = 'dark',
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');

  const filteredData = useMemo(() => {
    const today = getTodayISODate();
    const dateFromDaysAgo = (days: number) => {
      const d = new Date();
      d.setHours(12, 0, 0, 0);
      d.setDate(d.getDate() - (days - 1));
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const cutoffDate = timeframe === 'all' ? '' : dateFromDaysAgo(timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90);

    const inRange = (date: string) => !cutoffDate || date >= cutoffDate;
    return {
      tasks: tasks.filter((t) => inRange(t.date)),
      reports: reports.filter((r) => inRange(r.date)),
      habitLogs: habitLogs.filter((h) => inRange(h.date)),
      today,
    };
  }, [tasks, reports, habitLogs, timeframe]);

  const metrics = useMemo(() => {
    const fTasks = filteredData.tasks;
    const fReports = filteredData.reports;
    const fHabitLogs = filteredData.habitLogs;

    const actualStudyMinutes = fTasks
      .filter((t) => t.isCompleted || t.status === 'COMPLETED')
      .reduce((acc, t) => acc + (t.actualDurationMinutes ?? t.durationMinutes ?? 0), 0);
    const plannedStudyMinutes = fTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

    const totalTasksCount = fTasks.length;
    const completedTasksCount = fTasks.filter((t) => t.isCompleted || t.status === 'COMPLETED').length;
    const missedTasksCount = fTasks.filter((t) => !t.isCompleted && (t.status === 'MISSED' || t.date < filteredData.today)).length;
    const planCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    const totalTestsCount = fReports.reduce((acc, r) => acc + (r.testsCount || 0), 0);
    const correctTestsCount = fReports.reduce((acc, r) => acc + (r.testResult?.correct || 0), 0);
    const wrongTestsCount = fReports.reduce((acc, r) => acc + (r.testResult?.wrong || 0), 0);
    const totalAnswered = correctTestsCount + wrongTestsCount;
    const rawAccuracy = totalAnswered > 0 ? Math.round((correctTestsCount / totalAnswered) * 100) : null;

    const avgFocus = fReports.length > 0
      ? Number((fReports.reduce((acc, r) => acc + Number(r.focus || 0), 0) / fReports.length).toFixed(1))
      : null;

    const reportsWithPercentage = fReports.filter((r) => typeof r.testResult?.percentage === 'number');
    const avgTestPercentage = reportsWithPercentage.length > 0
      ? Math.round(reportsWithPercentage.reduce((acc, r) => acc + Number(r.testResult?.percentage || 0), 0) / reportsWithPercentage.length)
      : null;

    const habitRelevant = fHabitLogs.filter((h) => h.status === 'APPROVED' || h.completed);
    const habitRate = fHabitLogs.length > 0 ? Math.round((habitRelevant.length / fHabitLogs.length) * 100) : null;

    const studyTarget = timeframe === '7d'
      ? (weeklyGoalMinutes || (dailyGoalMinutes || 0) * 7)
      : timeframe === '30d'
      ? (dailyGoalMinutes || 0) * 30
      : timeframe === '90d'
      ? (dailyGoalMinutes || 0) * 90
      : 0;
    const studyTargetRate = studyTarget > 0 ? Math.min(100, Math.round((actualStudyMinutes / studyTarget) * 100)) : null;

    const safeScore = (value: number | null) => Math.max(0, Math.min(100, value ?? 0));
    const weight = diagnosticWeights || {
      studyHours: 0.25,
      tests: 0.25,
      planCompletion: 0.2,
      streak: 0.15,
      habits: 0.1,
      focus: 0.05,
    };
    const normalizedWeights = Object.values(weight).reduce((sum, v) => sum + (Number(v) || 0), 0) || 1;
    const studyScore = studyTargetRate ?? (plannedStudyMinutes > 0 ? Math.min(100, Math.round((actualStudyMinutes / plannedStudyMinutes) * 100)) : 0);
    const testsScore = avgTestPercentage ?? (totalTestsCount > 0 ? rawAccuracy ?? 0 : 0);
    const streakScore = Math.min(100, Math.max(0, Number(streak || 0) * 5));
    const habitsScore = habitRate ?? 0;
    const focusScore = avgFocus !== null ? Math.round((avgFocus / 5) * 100) : 0;
    const overallScore = Math.round((
      safeScore(studyScore) * (Number(weight.studyHours) || 0) +
      safeScore(testsScore) * (Number(weight.tests) || 0) +
      safeScore(planCompletionRate) * (Number(weight.planCompletion) || 0) +
      streakScore * (Number(weight.streak) || 0) +
      habitsScore * (Number(weight.habits) || 0) +
      focusScore * (Number(weight.focus) || 0)
    ) / normalizedWeights);

    return {
      actualStudyMinutes,
      plannedStudyMinutes,
      totalTasksCount,
      completedTasksCount,
      missedTasksCount,
      planCompletionRate,
      totalTestsCount,
      correctTestsCount,
      wrongTestsCount,
      rawAccuracy,
      avgFocus,
      avgTestPercentage,
      habitRate,
      studyTargetRate,
      overallScore,
      hasAnyActivity: fTasks.length > 0 || fReports.length > 0 || fHabitLogs.length > 0,
    };
  }, [filteredData, dailyGoalMinutes, weeklyGoalMinutes, diagnosticWeights, streak, timeframe]);

  // Compute Real 7-Day Week Trend from Actual Database Data
  const weekTrendData = useMemo(() => {
    const currentWeekDays = getPersianWeekDays(new Date(), 0);
    return currentWeekDays.map((day) => {
      const dayTasks = tasks.filter((t) => t.date === day.isoDate && t.isCompleted);
      const dayMinutes = dayTasks.reduce(
        (acc, t) => acc + (t.actualDurationMinutes || t.durationMinutes || 0),
        0
      );
      const dayHours = Number((dayMinutes / 60).toFixed(1));

      const dayReports = reports.filter((r) => r.date === day.isoDate);
      const dayTests = dayReports.reduce((acc, r) => acc + (r.testsCount || 0), 0);

      const testsWithPct = dayReports.filter(
        (r) => r.testResult && typeof r.testResult.percentage === 'number'
      );
      const dayPct =
        testsWithPct.length > 0
          ? Math.round(
              testsWithPct.reduce((acc, r) => acc + (r.testResult?.percentage || 0), 0) /
                testsWithPct.length
            )
          : null;

      return {
        day: day.dayName,
        date: day.jalaliFormatted,
        isToday: day.isToday,
        hours: dayHours,
        tests: dayTests,
        pct: dayPct,
      };
    });
  }, [tasks, reports]);

  const maxHoursInWeek = Math.max(...weekTrendData.map((d) => d.hours), 1);

  return (
    <div className="w-full space-y-6">
      {/* Header with Timeframe selector */}
      <div
        className={`p-6 rounded-3xl ${
          theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
        } border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
            <Activity className="w-4 h-4" />
            <span>داشبورد تحلیلی و تشخیصی · {studentName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            ارزیابی جامع عملکرد و بهره‌وری
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            محاسبه واقعی ساعت مطالعه، کیفیت تست‌زنی، استمرار و تحقق اهداف بدون هیچ داده ساختگی
          </p>
        </div>

        {/* Timeframe pill tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900/80 border border-white/5">
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === '7d' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ۷ روز اخیر
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === '30d' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ۳۰ روز
          </button>
          <button
            onClick={() => setTimeframe('90d')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === '90d' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            ۹۰ روز
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            کل دوره
          </button>
        </div>
      </div>

      {/* If absolutely NO activity exists for this student, render clear empty state */}
      {!metrics.hasAnyActivity ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-white/10 bg-slate-900/40 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-900/30 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <BarChart3 className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-200">
            داده کافی برای تحلیل وجود ندارد
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            هنوز جلسه مطالعه یا آزمونی برای این بازه ثبت نشده است. پس از اجرای برنامه و تکمیل گزارش جلسات، نمودارهای تحلیلی روند پیشرفت به صورت پویا در این بخش تشکیل خواهند شد.
          </p>
        </div>
      ) : (
        <>
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-[11px] text-purple-400 font-semibold mb-1">امتیاز تشخیصی واقعی</div>
              <div className="text-3xl font-black font-mono text-white">{toPersianDigits(metrics.overallScore)} / ۱۰۰</div>
              <div className="text-[11px] text-slate-400 mt-1">بر اساس داده‌های همین بازه و ضرایب تنظیم‌شده توسط مشاور</div>
            </div>
            <div className="w-full sm:w-64 h-3 rounded-full bg-slate-950 overflow-hidden border border-white/5">
              <div style={{ width: `${metrics.overallScore}%` }} className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 transition-all" />
            </div>
          </div>

          {/* 6 Key Diagnostic Real Indicator Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Actual Study Time */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-medium">ساعت مطالعه واقعی</span>
                  <Clock className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
                  {formatPersianTime(metrics.actualStudyMinutes)}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                برنامه‌ریزی: {formatPersianTime(metrics.plannedStudyMinutes)}
              </div>
            </div>

            {/* 2. Total Tests */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-medium">تست‌های واقعی</span>
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-white tabular-nums">
                  {toPersianDigits(metrics.totalTestsCount)} <span className="text-xs text-slate-400">تست</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                {metrics.correctTestsCount > 0 ? `${toPersianDigits(metrics.correctTestsCount)} صحیح` : 'بدون جزئیات'}
              </div>
            </div>

            {/* 3. Plan Completion Rate */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-medium">تحقق برنامه</span>
                  <Percent className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tabular-nums">
                  {formatPersianPercentage(metrics.planCompletionRate)}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2 font-mono">
                {toPersianDigits(metrics.completedTasksCount)} از {toPersianDigits(metrics.totalTasksCount)} پارت
              </div>
            </div>

            {/* 4. Consistency / Streak */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-medium">استمرار (Streak)</span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-amber-400 tabular-nums">
                  {toPersianDigits(streak)} روز
                </div>
              </div>
              <div className="text-[10px] text-amber-300 mt-2">
                {streak > 0 ? 'استمرار فعال' : 'بدون استمرار'}
              </div>
            </div>

            {/* 5. Average Focus Rating */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-medium">کیفیت تمرکز</span>
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-indigo-300 tabular-nums">
                  {metrics.avgFocus !== null ? `${toPersianDigits(metrics.avgFocus)} / ۵` : '—'}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                {metrics.avgFocus !== null ? 'میانگین جلسات' : 'هنوز ثبت نشده'}
              </div>
            </div>

            {/* 6. Testing Accuracy */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-medium">درصد آزمونی</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-purple-300 tabular-nums">
                  {metrics.avgTestPercentage !== null ? formatPersianPercentage(metrics.avgTestPercentage) : '—'}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                {metrics.avgTestPercentage !== null ? 'میانگین واقعی' : 'فاقد گزارش تست'}
              </div>
            </div>
          </div>

          {/* Visual Real Charts from Database */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Real Daily Study Hours in Current Week */}
            <div
              className={`p-6 rounded-3xl ${
                theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
              } border border-white/5`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">ساعت مطالعه روزانه در طول هفته</h3>
                  <p className="text-xs text-slate-400">شنبه تا جمعه (داده‌های ثبت‌شده واقعی)</p>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">
                  مجموع: {formatPersianTime(metrics.actualStudyMinutes)}
                </span>
              </div>

              {/* Bar Chart Representation with Real Values */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-white/10">
                {weekTrendData.map((d, i) => {
                  const heightPercent = d.hours > 0 ? Math.round((d.hours / maxHoursInWeek) * 100) : 4;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-slate-300 group-hover:text-purple-300 transition-colors opacity-0 group-hover:opacity-100">
                        {toPersianDigits(d.hours)}h
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                          d.hours > 0
                            ? 'bg-gradient-to-t from-purple-700 via-indigo-600 to-purple-400 group-hover:brightness-125 shadow-sm'
                            : 'bg-slate-800/40 border border-dashed border-white/5'
                        }`}
                      />
                      <span className={`text-[11px] mt-2 ${d.isToday ? 'text-purple-300 font-bold' : 'text-slate-400'}`}>
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Real Tests & Accuracy Trend */}
            <div
              className={`p-6 rounded-3xl ${
                theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
              } border border-white/5`}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">روند درصد آزمونی تستی</h3>
                  <p className="text-xs text-slate-400">محاسبه بر مبنای کارنامه آزمون‌های واقعی</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {metrics.avgTestPercentage !== null
                    ? `میانگین: ${formatPersianPercentage(metrics.avgTestPercentage)}`
                    : 'بدون آزمون ثبت‌شده'}
                </span>
              </div>

              {/* Trend Bars */}
              <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-white/10">
                {weekTrendData.map((d, i) => {
                  const heightPercent = d.pct !== null ? d.pct : 4;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                        {d.pct !== null ? `${toPersianDigits(d.pct)}٪` : '—'}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                          d.pct !== null
                            ? 'bg-gradient-to-t from-emerald-700 via-teal-600 to-emerald-400 group-hover:brightness-125 shadow-sm'
                            : 'bg-slate-800/40 border border-dashed border-white/5'
                        }`}
                      />
                      <span className={`text-[11px] mt-2 ${d.isToday ? 'text-purple-300 font-bold' : 'text-slate-400'}`}>
                        {d.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
