import React, { useMemo } from 'react';
import { PlanTask, SessionReport } from '../types/index.js';
import { toPersianDigits, getTodayJalaliString, getTodayISODate } from '../utils/persianDate.js';
import {
  Clock,
  ArrowUp,
  ArrowDown,
  Play,
  CheckCircle2,
  Coffee,
  BookOpen,
  FileText,
  Radio,
  Sparkles,
  Flame,
  Check,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';

interface Props {
  tasks: PlanTask[];
  reports: SessionReport[];
  selectedTask?: PlanTask | null;
  onSelectTask?: (task: PlanTask) => void;
  onSelectTaskForTimer: (task: PlanTask) => void;
  onEnterStudyHallWithTask?: (task: PlanTask) => void;
  onOpenReportModal: (task: PlanTask) => void;
  onReorderTasks: (newOrderTaskIds: string[]) => void;
  theme?: 'dark' | 'light';
}

export const DailyPlanView: React.FC<Props> = ({
  tasks,
  reports,
  selectedTask,
  onSelectTask,
  onSelectTaskForTimer,
  onEnterStudyHallWithTask,
  onOpenReportModal,
  onReorderTasks,
  theme = 'dark',
}) => {
  const visibleTasks = useMemo(() => {
    return tasks
      .filter((task) => task.date === getTodayISODate())
      .slice()
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
  }, [tasks]);

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= visibleTasks.length) return;

    const newTasks = [...visibleTasks];
    const [moved] = newTasks.splice(index, 1);
    newTasks.splice(targetIndex, 0, moved);
    onReorderTasks(newTasks.map((t) => t.id));
  };

  const completedCount = visibleTasks.filter((t) => t.isCompleted).length;
  const totalTasks = visibleTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const totalPlannedMinutes = visibleTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
  const totalActualMinutes = visibleTasks
    .filter((t) => t.isCompleted)
    .reduce((acc, t) => acc + (t.actualDurationMinutes || t.durationMinutes || 0), 0);

  return (
    <div className="w-full space-y-6">
      {/* Workspace Top Header — Apple/Linear Glass Surface */}
      <div
        className={`p-6 sm:p-7 rounded-3xl glass-primary transition-all duration-300 ${
          theme === 'dark' ? 'border-purple-500/20' : 'border-indigo-200/50'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>میز کار تحصیلی امروز · {getTodayJalaliString()}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              برنامه پارت‌های امروز
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              هر روز یک گام استوار به سوی هدفتان. برای ورود به سالن مطالعه یا اجرای تایمر هوشمند، پارت موردنظر را انتخاب فرمایید.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-slate-400 block mb-0.5 truncate">پارت‌های انجام شده</span>
              <span className="text-xs sm:text-base font-black font-mono text-emerald-400">
                {toPersianDigits(completedCount)} / {toPersianDigits(totalTasks)}
              </span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-slate-400 block mb-0.5 truncate">زمان مطالعه موثر</span>
              <span className="text-xs sm:text-base font-black font-mono text-purple-300">
                {toPersianDigits(Math.floor(totalActualMinutes / 60))}:{toPersianDigits(String(totalActualMinutes % 60).padStart(2, '0'))}
              </span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-white/5">
              <span className="text-[10px] text-slate-400 block mb-0.5 truncate">تکمیل برنامه</span>
              <span className="text-xs sm:text-base font-black font-mono text-blue-400">
                {toPersianDigits(completionPercentage)}٪
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hybrid UI: Chronological Timeline + Interactive Part Cards */}
      {visibleTasks.length === 0 ? (
        <div className="p-14 text-center rounded-3xl glass-secondary border border-dashed border-white/10 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-2" />
          <h3 className="text-base font-bold text-slate-200">هنوز برنامه‌ای برای امروز ثبت نشده است</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            مشاور شما در حال طراحی و بهینه‌سازی برنامه تحصیلی روزانه شما می‌باشد. به زودی پارت‌های درسی اضافه خواهند شد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Detailed Part Cards List — Displayed first on Mobile & Tablet, 8 cols on Desktop */}
          <div className="order-1 lg:order-2 lg:col-span-8 space-y-3.5">
            {visibleTasks.map((task, index) => {
              const taskReport = reports.find((report) => report.taskId === task.id);
              const isReported = !!taskReport;
              const isCompleted = !!task.isCompleted || task.status === 'COMPLETED' || taskReport?.isCompleted === true;
              const isSelected = selectedTask?.id === task.id;
              const isRest = task.isRest;

              return (
                <div
                  key={task.id}
                  onClick={() => onSelectTask?.(task)}
                  className={`p-4 sm:p-5 rounded-3xl glass-secondary glass-secondary-hover border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-purple-500/60 bg-purple-950/25 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-emerald-950/15'
                      : isRest
                      ? 'border-blue-500/30 bg-blue-950/20'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Part Details & Tags */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-[11px] font-bold font-mono">
                          پارت {toPersianDigits(index + 1)}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isRest
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          {task.activityType}
                        </span>

                        {task.testMode && task.testMode !== 'ندارد' && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                            {task.testMode} {task.minTests > 0 ? `(${toPersianDigits(task.minTests)} تست)` : ''}
                          </span>
                        )}

                        {isCompleted && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold mr-auto">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تکمیل شد</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold tracking-tight">
                        {task.courseName}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono flex-wrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{toPersianDigits(task.durationMinutes)} دقیقه برنامه‌ریزی</span>
                        </div>
                        {task.actualDurationMinutes && (
                          <div className="flex items-center gap-1 text-purple-300 font-bold">
                            <span>(عملکرد واقعی: {toPersianDigits(task.actualDurationMinutes)}د)</span>
                          </div>
                        )}
                        {task.startTime && (
                          <div>
                            زمان: {task.startTime} {task.endTime ? `تا ${task.endTime}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Controls (Move Up / Down - strictly NO drag-drop) */}
                    <div className="flex sm:flex-col items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTask(index, 'up');
                        }}
                        disabled={index === 0}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-slate-300 cursor-pointer"
                        title="افزایش اولویت پارت"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTask(index, 'down');
                        }}
                        disabled={index === visibleTasks.length - 1}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-slate-300 cursor-pointer"
                        title="کاهش اولویت پارت"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isCompleted ? (
                        <>
                          {/* Timer trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTaskForTimer(task);
                            }}
                            className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-95 flex-1 sm:flex-none"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>شروع مطالعه با تایمر</span>
                          </button>

                          {/* Study Hall trigger */}
                          {onEnterStudyHallWithTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEnterStudyHallWithTask(task);
                              }}
                              className="py-2.5 px-3.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 flex-1 sm:flex-none"
                              title="ورود به سالن مطالعه جمعی با این پارت"
                            >
                              <Radio className="w-3.5 h-3.5 text-purple-400" />
                              <span>ورود به سالن مطالعه</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          <span>پارت با موفقیت تکمیل و ثبت گردید</span>
                        </div>
                      )}
                    </div>

                    {/* Report action button */}
                    <div className="self-end sm:self-auto">
                      {!isReported ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenReportModal(task);
                          }}
                          className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-purple-400" />
                          <span>ثبت گزارش پارت</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-mono">
                          گزارش ثبت شده ({toPersianDigits(taskReport.satisfaction)}/۵ رضایت · {toPersianDigits(taskReport.testsCount || 0)} تست)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Overview Strip — Displayed second on Mobile & Tablet, 4 cols on Desktop */}
          <div className="order-2 lg:order-1 lg:col-span-4 space-y-3">
            <div className="p-5 rounded-3xl glass-secondary space-y-4">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>گاه‌شمار زمانی پارت‌ها</span>
              </h3>

              <div className="space-y-3 relative before:absolute before:right-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {visibleTasks.map((t, idx) => {
                  const isCompleted = t.isCompleted || t.status === 'COMPLETED';
                  const isSelected = selectedTask?.id === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTask?.(t)}
                      className={`relative pr-8 pl-3 py-2 rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200'
                          : isCompleted
                          ? 'bg-emerald-950/20 text-emerald-300'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      {/* Timeline dot marker */}
                      <span
                        className={`absolute right-2 top-3 w-3 h-3 rounded-full border-2 transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/50'
                            : isSelected
                            ? 'bg-purple-500 border-purple-300 shadow-sm shadow-purple-500/50'
                            : 'bg-slate-800 border-slate-600'
                        }`}
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold truncate max-w-[160px]">{t.courseName}</span>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {t.startTime || `${toPersianDigits(t.durationMinutes)}د`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>پارت {toPersianDigits(idx + 1)}</span>
                        <span>·</span>
                        <span>{t.activityType}</span>
                        {isCompleted && (
                          <span className="text-emerald-400 font-semibold mr-auto">✓ تکمیل</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
