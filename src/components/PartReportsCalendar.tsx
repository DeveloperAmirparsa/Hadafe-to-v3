import React, { useState, useMemo } from 'react';
import {
  Student,
  PlanTask,
  SessionReport,
} from '../types/index.js';
import {
  toPersianDigits,
  getPersianWeekDays,
  formatPersianTime,
  formatPersianPercentage,
  PersianWeekDay,
  getTodayISODate,
} from '../utils/persianDate.js';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  X,
  Target,
  Flame,
  Coffee,
  HelpCircle,
  Percent,
} from 'lucide-react';

interface Props {
  student: Student;
  tasks: PlanTask[];
  reports: SessionReport[];
  theme?: 'dark' | 'light';
  isCounselor?: boolean;
}

type ZoomLevel = 'compact' | 'normal' | 'spacious';

const START_HOUR = 6;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

export const PartReportsCalendar: React.FC<Props> = ({
  student,
  tasks,
  reports,
  theme = 'dark',
  isCounselor = false,
}) => {
  const [weekOffset, setWeekOffsetState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.sessionStorage.getItem('hadafeto:reports-week-offset');
    return saved !== null ? Number(saved) : 0;
  });

  const setWeekOffset = (val: number | ((prev: number) => number)) => {
    setWeekOffsetState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('hadafeto:reports-week-offset', String(next));
      }
      return next;
    });
  };

  const [zoomLevel, setZoomLevelState] = useState<ZoomLevel>(() => {
    if (typeof window === 'undefined') return 'normal';
    return (window.sessionStorage.getItem('hadafeto:reports-zoom-level') as ZoomLevel) || 'normal';
  });

  const setZoomLevel = (val: ZoomLevel) => {
    setZoomLevelState(val);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:reports-zoom-level', val);
    }
  };
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<PlanTask | null>(null);

  // Week days (Saturday to Friday)
  const weekDays = useMemo<PersianWeekDay[]>(() => {
    return getPersianWeekDays(new Date(), weekOffset);
  }, [weekOffset]);

  // Tasks for this student
  const studentTasks = useMemo(() => {
    return tasks.filter((t) => t.studentId === student.id);
  }, [tasks, student.id]);

  // Reports for this student
  const studentReports = useMemo(() => {
    return reports.filter((r) => r.studentId === student.id);
  }, [reports, student.id]);

  // Tasks mapped by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, PlanTask[]>();
    weekDays.forEach((day) => {
      const dayTasks = studentTasks
        .filter((t) => t.date === day.isoDate)
        .slice()
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
      map.set(day.isoDate, dayTasks);
    });
    return map;
  }, [weekDays, studentTasks]);

  // Today ISO date
  const todayIso = getTodayISODate();

  // Compute Daily Indicator (Today)
  const dailyIndicator = useMemo(() => {
    const todayTasks = studentTasks.filter((t) => t.date === todayIso);
    const todayReports = studentReports.filter((r) => r.date === todayIso);

    const actualMinutes = todayTasks
      .filter((t) => t.isCompleted)
      .reduce((acc, t) => acc + (t.actualDurationMinutes || t.durationMinutes || 0), 0);

    const plannedMinutes = todayTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
    const goalMinutes = student.dailyStudyGoalMinutes || 0;

    const completedParts = todayTasks.filter((t) => t.isCompleted).length;
    const missedParts = todayTasks.filter((t) => !t.isCompleted && t.status === 'MISSED').length;

    const totalTests = todayReports.reduce((acc, r) => acc + (r.testsCount || 0), 0);
    const testsWithPct = todayReports.filter(
      (r) => r.testResult && typeof r.testResult.percentage === 'number'
    );
    const avgAccuracy =
      testsWithPct.length > 0
        ? Math.round(
            testsWithPct.reduce((acc, r) => acc + (r.testResult?.percentage || 0), 0) /
              testsWithPct.length
          )
        : null;

    const goalProgressPct =
      goalMinutes > 0 ? Math.min(100, Math.round((actualMinutes / goalMinutes) * 100)) : null;

    return {
      actualMinutes,
      plannedMinutes,
      goalMinutes,
      goalProgressPct,
      completedParts,
      missedParts,
      totalParts: todayTasks.length,
      totalTests,
      avgAccuracy,
    };
  }, [studentTasks, studentReports, todayIso, student.dailyStudyGoalMinutes]);

  // Compute Weekly Indicator (This selected week)
  const weeklyIndicator = useMemo(() => {
    let weekActualMinutes = 0;
    let weekPlannedMinutes = 0;
    let weekCompletedParts = 0;
    let weekMissedParts = 0;
    let weekTotalParts = 0;
    let weekTests = 0;

    const weekIsoDates = new Set(weekDays.map((d) => d.isoDate));
    const weekReports = studentReports.filter((r) => weekIsoDates.has(r.date));

    weekDays.forEach((day) => {
      const dTasks = tasksByDate.get(day.isoDate) || [];
      dTasks.forEach((t) => {
        weekTotalParts++;
        weekPlannedMinutes += t.durationMinutes || 0;
        if (t.isCompleted) {
          weekCompletedParts++;
          weekActualMinutes += t.actualDurationMinutes || t.durationMinutes || 0;
        } else if (t.status === 'MISSED' || day.isoDate < todayIso) {
          weekMissedParts++;
        }
      });
    });

    weekReports.forEach((r) => {
      weekTests += r.testsCount || 0;
    });

    const testsWithPct = weekReports.filter(
      (r) => r.testResult && typeof r.testResult.percentage === 'number'
    );
    const avgAccuracy =
      testsWithPct.length > 0
        ? Math.round(
            testsWithPct.reduce((acc, r) => acc + (r.testResult?.percentage || 0), 0) /
              testsWithPct.length
          )
        : null;

    const goalMinutes = student.weeklyStudyGoalMinutes || 0;
    const goalProgressPct =
      goalMinutes > 0 ? Math.min(100, Math.round((weekActualMinutes / goalMinutes) * 100)) : null;

    return {
      actualMinutes: weekActualMinutes,
      plannedMinutes: weekPlannedMinutes,
      goalMinutes,
      goalProgressPct,
      completedParts: weekCompletedParts,
      missedParts: weekMissedParts,
      totalParts: weekTotalParts,
      totalTests: weekTests,
      avgAccuracy,
    };
  }, [weekDays, tasksByDate, studentReports, student.weeklyStudyGoalMinutes, todayIso]);

  // Zoom Column Width
  const hourWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'compact':
        return 72;
      case 'normal':
        return 110;
      case 'spacious':
        return 160;
    }
  }, [zoomLevel]);

  const totalGridWidth = hourWidth * TOTAL_HOURS;

  const hoursList = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  // Look up session report for selected task
  const activeTaskReport = useMemo(() => {
    if (!selectedTaskForDetail) return null;
    return studentReports.find((r) => r.taskId === selectedTaskForDetail.id) || null;
  }, [selectedTaskForDetail, studentReports]);

  // Status Styling Helper (Green for Completed, Red for Missed, etc.)
  const getStatusStyle = (task: PlanTask, dayIso: string) => {
    const isPast = dayIso < todayIso;
    const isCompleted = task.isCompleted || task.status === 'COMPLETED';

    if (isCompleted) {
      return {
        bg: 'bg-emerald-600/25 border-emerald-500/50 text-emerald-100 hover:border-emerald-400',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        label: 'انجام شده',
        isDone: true,
      };
    }

    if (task.status === 'MISSED' || isPast) {
      return {
        bg: 'bg-rose-600/25 border-rose-500/50 text-rose-100 hover:border-rose-400',
        badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
        label: 'انجام نشده / از دست رفته',
        isDone: false,
      };
    }

    if (task.status === 'RUNNING') {
      return {
        bg: 'bg-amber-600/25 border-amber-500/50 text-amber-100 hover:border-amber-400',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        label: 'در حال مطالعه',
        isDone: false,
      };
    }

    return {
      bg: 'bg-purple-900/20 border-purple-500/30 text-purple-200 hover:border-purple-400',
      badge: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
      label: 'برنامه‌ریزی‌شده',
      isDone: false,
    };
  };

  return (
    <div className="w-full space-y-5">
      {/* Top Banner: Daily & Weekly Real Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Today Indicator */}
        <div
          className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-slate-900/80 border-white/5' : 'bg-white border-slate-200'
          } space-y-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">گزارش روزانه امروز</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  دانش‌آموز: {student.fullName}
                </span>
              </div>
            </div>

            <div className="text-left font-mono">
              <div className="text-sm font-bold text-slate-100">
                {formatPersianTime(dailyIndicator.actualMinutes)}
              </div>
              <div className="text-[10px] text-slate-400">
                {dailyIndicator.goalMinutes > 0
                  ? `هدف: ${formatPersianTime(dailyIndicator.goalMinutes)} (${toPersianDigits(dailyIndicator.goalProgressPct)}٪)`
                  : 'هدف روزانه تعیین نشده'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {dailyIndicator.goalMinutes > 0 && dailyIndicator.goalProgressPct !== null ? (
            <div className="w-full h-2 rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
              <div
                style={{ width: `${dailyIndicator.goalProgressPct}%` }}
                className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-300"
              />
            </div>
          ) : null}

          {/* Sub Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs">
            <div className="p-2 rounded-xl bg-slate-950/40 text-center">
              <span className="text-[10px] text-slate-400 block">پارت انجام‌شده</span>
              <span className="font-bold text-emerald-400 font-mono">
                {toPersianDigits(dailyIndicator.completedParts)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/40 text-center">
              <span className="text-[10px] text-slate-400 block">پارت انجام‌نشده</span>
              <span className="font-bold text-rose-400 font-mono">
                {toPersianDigits(dailyIndicator.missedParts)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/40 text-center">
              <span className="text-[10px] text-slate-400 block">تعداد تست</span>
              <span className="font-bold text-purple-300 font-mono">
                {toPersianDigits(dailyIndicator.totalTests)}
                {dailyIndicator.avgAccuracy !== null && ` (${toPersianDigits(dailyIndicator.avgAccuracy)}٪)`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Weekly Indicator */}
        <div
          className={`p-5 rounded-3xl border ${
            theme === 'dark' ? 'bg-slate-900/80 border-white/5' : 'bg-white border-slate-200'
          } space-y-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">گزارش هفتگی پارت‌ها</h3>
                <span className="text-[11px] text-slate-400">
                  {weekDays[0].jalaliFormatted} تا {weekDays[6].jalaliFormatted}
                </span>
              </div>
            </div>

            <div className="text-left font-mono">
              <div className="text-sm font-bold text-slate-100">
                {formatPersianTime(weeklyIndicator.actualMinutes)}
              </div>
              <div className="text-[10px] text-slate-400">
                {weeklyIndicator.goalMinutes > 0
                  ? `هدف: ${formatPersianTime(weeklyIndicator.goalMinutes)} (${toPersianDigits(weeklyIndicator.goalProgressPct)}٪)`
                  : 'هدف هفتگی تعیین نشده'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {weeklyIndicator.goalMinutes > 0 && weeklyIndicator.goalProgressPct !== null ? (
            <div className="w-full h-2 rounded-full bg-slate-950/80 overflow-hidden border border-white/5">
              <div
                style={{ width: `${weeklyIndicator.goalProgressPct}%` }}
                className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-300"
              />
            </div>
          ) : null}

          {/* Sub Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-xs">
            <div className="p-2 rounded-xl bg-slate-950/40 text-center">
              <span className="text-[10px] text-slate-400 block">پارت انجام‌شده</span>
              <span className="font-bold text-emerald-400 font-mono">
                {toPersianDigits(weeklyIndicator.completedParts)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/40 text-center">
              <span className="text-[10px] text-slate-400 block">پارت انجام‌نشده</span>
              <span className="font-bold text-rose-400 font-mono">
                {toPersianDigits(weeklyIndicator.missedParts)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/40 text-center">
              <span className="text-[10px] text-slate-400 block">تست‌های هفته</span>
              <span className="font-bold text-purple-300 font-mono">
                {toPersianDigits(weeklyIndicator.totalTests)}
                {weeklyIndicator.avgAccuracy !== null && ` (${toPersianDigits(weeklyIndicator.avgAccuracy)}٪)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation & Legend Controls */}
      <div
        className={`p-4 rounded-3xl border ${
          theme === 'dark' ? 'bg-slate-900/80 border-white/5' : 'bg-white border-slate-200'
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap`}
      >
        {/* Week Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="هفته قبل"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setWeekOffset(0)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              weekOffset === 0
                ? 'bg-purple-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            هفته جاری
          </button>

          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="هفته بعد"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <div className="flex items-center gap-1.5 px-2 text-xs text-purple-200 font-medium">
            <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
            <span>
              {weekDays[0].jalaliFormatted} تا {weekDays[6].jalaliFormatted}
            </span>
          </div>
        </div>

        {/* Legend: Green vs Red vs Planned */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="text-slate-300">انجام شده (سبز)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span className="text-slate-300">انجام نشده (قرمز)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-400">آینده / برنامه‌ریزی‌شده</span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/10 text-[11px] text-slate-400 mr-2">
            <button
              onClick={() => setZoomLevel('compact')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                zoomLevel === 'compact' ? 'bg-purple-600 text-white font-bold' : 'hover:text-white'
              }`}
            >
              فشرده
            </button>
            <button
              onClick={() => setZoomLevel('normal')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                zoomLevel === 'normal' ? 'bg-purple-600 text-white font-bold' : 'hover:text-white'
              }`}
            >
              استاندارد
            </button>
            <button
              onClick={() => setZoomLevel('spacious')}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                zoomLevel === 'spacious' ? 'bg-purple-600 text-white font-bold' : 'hover:text-white'
              }`}
            >
              عریض
            </button>
          </div>
        </div>
      </div>

      {/* Spreadsheet Calendar for Reports View */}
      <div
        className={`rounded-3xl border overflow-hidden transition-all shadow-xl ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200'
        }`}
      >
        <div
          dir="rtl"
          className="overflow-x-auto overflow-y-auto max-h-[720px] relative select-none scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-slate-950/40"
        >
          <div style={{ width: `${totalGridWidth + 200}px` }} className="min-w-full flex flex-col">
            {/* Header Row: Hours (Sticky Top) */}
            <div className="sticky top-0 z-30 flex items-stretch border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
              {/* Corner Cell: Sticky Right */}
              <div className="sticky right-0 z-40 w-[200px] shrink-0 p-3 bg-slate-950/95 border-l border-white/10 flex items-center justify-between text-xs font-bold text-purple-300">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>روز / ساعت</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">وضعیت پارت‌ها</span>
              </div>

              {/* Hour Columns */}
              <div className="flex flex-1 relative" style={{ width: `${totalGridWidth}px` }}>
                {hoursList.map((hour) => {
                  const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                  return (
                    <div
                      key={hour}
                      style={{ width: `${hourWidth}px` }}
                      className="shrink-0 border-l border-white/5 py-2.5 px-1.5 text-center flex flex-col items-center justify-center"
                    >
                      <span className="font-mono text-xs font-bold text-slate-300">
                        {toPersianDigits(hourLabel)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day Rows (Saturday to Friday) */}
            <div className="divide-y divide-white/5">
              {weekDays.map((day) => {
                const dayTasks = tasksByDate.get(day.isoDate) || [];
                const doneCount = dayTasks.filter((t) => t.isCompleted).length;
                const missedCount = dayTasks.filter((t) => !t.isCompleted && (t.status === 'MISSED' || day.isoDate < todayIso)).length;

                return (
                  <div
                    key={day.isoDate}
                    className={`flex items-stretch min-h-[92px] group/row transition-colors ${
                      day.isToday ? 'bg-purple-950/20' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Day Column (Sticky Right) */}
                    <div className="sticky right-0 z-20 w-[200px] shrink-0 p-3 bg-slate-950/90 group-hover/row:bg-slate-950 border-l border-white/10 flex flex-col justify-between transition-colors shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                            <span>{day.dayName}</span>
                            {day.isToday && (
                              <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-mono text-[9px] font-bold animate-pulse">
                                امروز
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-purple-300/80 font-medium mt-0.5">
                          {day.jalaliFormatted}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5 font-mono">
                        <span className="text-emerald-400 font-bold">{toPersianDigits(doneCount)} انجام</span>
                        <span className="text-rose-400 font-bold">{toPersianDigits(missedCount)} ناتمام</span>
                        <span className="text-slate-400">{toPersianDigits(dayTasks.length)} کل</span>
                      </div>
                    </div>

                    {/* Timeline Canvas */}
                    <div
                      className="relative flex-1 flex"
                      style={{ width: `${totalGridWidth}px` }}
                    >
                      {/* Grid background */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {hoursList.map((hour) => (
                          <div
                            key={hour}
                            style={{ width: `${hourWidth}px` }}
                            className="shrink-0 border-l border-white/5 relative h-full"
                          >
                            <div className="absolute inset-y-0 right-1/2 w-px border-r border-dashed border-white/5" />
                          </div>
                        ))}
                      </div>

                      {/* Rendered Tasks with Green/Red Status */}
                      <div className="absolute inset-0 p-1">
                        {dayTasks.map((task, idx) => {
                          let startMinutes = 0;
                          if (task.startTime) {
                            const [hStr, mStr] = task.startTime.split(':');
                            const h = parseInt(hStr, 10) || START_HOUR;
                            const m = parseInt(mStr, 10) || 0;
                            startMinutes = Math.max(0, h * 60 + m - START_HOUR * 60);
                          } else {
                            startMinutes = (2 + idx * 1.5) * 60;
                          }

                          const durationMins = task.durationMinutes || 60;
                          const pixelsPerMinute = hourWidth / 60;
                          const rightOffset = startMinutes * pixelsPerMinute;
                          const taskWidth = Math.max(48, durationMins * pixelsPerMinute - 4);

                          const statusStyle = getStatusStyle(task, day.isoDate);

                          return (
                            <div
                              key={task.id}
                              style={{
                                right: `${rightOffset}px`,
                                width: `${taskWidth}px`,
                              }}
                              onClick={() => setSelectedTaskForDetail(task)}
                              className={`absolute top-1.5 bottom-1.5 rounded-2xl border ${statusStyle.bg} cursor-pointer p-2 flex flex-col justify-between overflow-hidden shadow-md transition-all duration-200 hover:scale-[1.03] hover:z-30 hover:shadow-lg group/card`}
                              title={`کلیک برای مشاهده جزئیات گزارش: ${task.courseName} (${statusStyle.label})`}
                            >
                              {/* Top Bar */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  {statusStyle.isDone ? (
                                    <span className="p-0.5 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                                      <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  ) : (
                                    <span className="p-0.5 rounded-full bg-rose-500/80 text-white shrink-0">
                                      <AlertCircle className="w-3 h-3 stroke-[3]" />
                                    </span>
                                  )}
                                  <span className="font-mono text-[10px] font-bold truncate">
                                    {toPersianDigits(task.startTime || '—')}
                                    {task.endTime && ` - ${toPersianDigits(task.endTime)}`}
                                  </span>
                                </div>

                                {task.isRest ? <Coffee className="w-3 h-3 text-sky-400 shrink-0" /> : null}
                              </div>

                              {/* Course Name */}
                              <div className="font-bold text-xs truncate my-0.5 text-white">
                                {task.courseName}
                              </div>

                              {/* Bottom Badges */}
                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-medium ${statusStyle.badge}`}>
                                  {statusStyle.label}
                                </span>

                                <span className="font-mono text-slate-200 text-[10px]">
                                  {task.actualDurationMinutes
                                    ? `${toPersianDigits(task.actualDurationMinutes)}د واقعی`
                                    : `${toPersianDigits(task.durationMinutes)}د`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Part & Session Report Detail Modal */}
      {selectedTaskForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            dir="rtl"
            className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl text-xs space-y-5 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
                    selectedTaskForDetail.isCompleted
                      ? 'bg-emerald-600 shadow-md shadow-emerald-600/30'
                      : 'bg-rose-600 shadow-md shadow-rose-600/30'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    جزئیات پارت و گزارش مطالعه
                  </h3>
                  <p className="text-[11px] text-purple-300">
                    دانش‌آموز: {student.fullName} · تاریخ: {selectedTaskForDetail.date}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTaskForDetail(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Part Specification Box */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
              <div className="text-xs font-bold text-purple-300 flex items-center justify-between">
                <span>مشخصات پارت برنامه‌ریزی‌شده</span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                    selectedTaskForDetail.isCompleted
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-950/80 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {selectedTaskForDetail.isCompleted ? 'انجام شده' : 'انجام نشده / از دست رفته'}
                </span>
              </div>

              <div className="text-sm font-bold text-white pt-1">
                {selectedTaskForDetail.courseName}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px] text-slate-300 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">نوع فعالیت:</span>
                  {selectedTaskForDetail.activityType}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">زمان برنامه‌ریزی:</span>
                  {toPersianDigits(selectedTaskForDetail.startTime || '—')} تا {toPersianDigits(selectedTaskForDetail.endTime || '—')}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">مدت مصوب:</span>
                  {toPersianDigits(selectedTaskForDetail.durationMinutes)} دقیقه
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">مدت واقعی:</span>
                  <span className="text-emerald-400 font-bold">
                    {toPersianDigits(selectedTaskForDetail.actualDurationMinutes || (selectedTaskForDetail.isCompleted ? selectedTaskForDetail.durationMinutes : 0))} دقیقه
                  </span>
                </div>
              </div>
            </div>

            {/* Session Report Content */}
            {activeTaskReport ? (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>کارنامه و گزارش ثبت‌شده توسط دانش‌آموز</span>
                </h4>

                {/* Ratings */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">میزان تمرکز</span>
                    <span className="font-mono text-base font-bold text-purple-300">
                      {toPersianDigits(activeTaskReport.focus)} / ۵
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">رضایت از پارت</span>
                    <span className="font-mono text-base font-bold text-emerald-400">
                      {toPersianDigits(activeTaskReport.satisfaction)} / ۵
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/60 border border-white/5 text-center">
                    <span className="text-[10px] text-slate-400 block mb-0.5">سطح سختی</span>
                    <span className="font-mono text-base font-bold text-amber-400">
                      {toPersianDigits(activeTaskReport.difficulty)} / ۵
                    </span>
                  </div>
                </div>

                {/* Tests Result */}
                {activeTaskReport.testsCount > 0 && activeTaskReport.testResult && (
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-200">نتیجه آزمونی تست‌ها</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        درصد: {formatPersianPercentage(activeTaskReport.testResult.percentage)}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono pt-1 border-t border-purple-500/20">
                      <div>
                        <span className="text-[10px] text-slate-400 block">کل تست</span>
                        <span className="font-bold text-slate-200">{toPersianDigits(activeTaskReport.testResult.total)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-400 block">صحیح</span>
                        <span className="font-bold text-emerald-400">{toPersianDigits(activeTaskReport.testResult.correct)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-rose-400 block">غلط</span>
                        <span className="font-bold text-rose-400">{toPersianDigits(activeTaskReport.testResult.wrong)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">نزده</span>
                        <span className="font-bold text-slate-400">{toPersianDigits(activeTaskReport.testResult.unanswered)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reflection Note */}
                {activeTaskReport.reflectionNote ? (
                  <div className="p-3 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                    <span className="text-purple-400 font-bold block mb-1">یادداشت و جمع‌بندی دانش‌آموز:</span>
                    «{activeTaskReport.reflectionNote}»
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400">
                  <span>امتیاز کسب‌شده از پارت:</span>
                  <span className="font-mono font-bold text-purple-300">
                    +{toPersianDigits(activeTaskReport.focusPointsEarned)} FP
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-slate-400 space-y-1">
                <AlertCircle className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                <div className="font-bold text-slate-300">
                  برای این پارت هنوز گزارشی ثبت نشده است.
                </div>
                <p className="text-[11px] text-slate-500">
                  دانش‌آموز پس از مطالعه و زدن تست‌ها می‌تواند گزارش این پارت را ثبت کند.
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedTaskForDetail(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              بستن پنجره
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
