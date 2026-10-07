/**
 * Daily Report PDF Modal
 * Allows student/counselor to select a date, inspect the daily summary,
 * preview pages, and trigger high-resolution PDF download.
 */
import React, { useState, useMemo, useRef } from 'react';
import {
  Student,
  PlanTask,
  SessionReport,
  Habit,
  HabitLog,
  FocusPointTransaction,
} from '../types/index.js';
import {
  getPersianWeekDays,
  getTodayISODate,
  toPersianDigits,
  formatPersianTime,
} from '../utils/persianDate.js';
import {
  normalizeDailyReportData,
} from './pdf/dataNormalizer.js';
import { DailyReportPdfDocument } from './pdf/DailyReportPdfDocument.js';
import { exportDailyReportToPdf } from './pdf/pdfGenerator.js';
import {
  FileDown,
  X,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  tasks: PlanTask[];
  reports: SessionReport[];
  habits?: Habit[];
  habitLogs?: HabitLog[];
  transactions?: FocusPointTransaction[];
  initialDate?: string;
  theme?: 'dark' | 'light';
}

export const DailyReportPdfModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  tasks,
  reports,
  habits = [],
  habitLogs = [],
  transactions = [],
  initialDate,
  theme = 'dark',
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || getTodayISODate()
  );
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hidden container ref for deterministic PDF generation
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  // Week days for the selector
  const weekDays = useMemo(() => {
    return getPersianWeekDays(new Date(), weekOffset);
  }, [weekOffset]);

  // Normalized Daily Report Data
  const reportData = useMemo(() => {
    return normalizeDailyReportData(
      student,
      selectedDate,
      tasks,
      reports,
      habits,
      habitLogs,
      transactions
    );
  }, [
    student,
    selectedDate,
    tasks,
    reports,
    habits,
    habitLogs,
    transactions,
  ]);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!pdfContainerRef.current) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setProgressStatus('در حال آماده‌سازی سند...');

    try {
      const result = await exportDailyReportToPdf(
        pdfContainerRef.current,
        reportData,
        {
          onProgress: (p) => setProgressStatus(p.step),
        }
      );

      if (!result.success) {
        throw new Error(result.error || 'خطا در ساخت فایل PDF');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setErrorMessage('ساخت گزارش PDF با خطا مواجه شد. دوباره تلاش کنید.');
    } finally {
      setIsGenerating(false);
      setProgressStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 border-white/10 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                دانلود گزارش روزانه PDF
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30 font-normal">
                  استاندارد A4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                دانش‌آموز: {student.fullName} | تاریخ انتخابی: {reportData.fullJalaliDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Date Selector Bar */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>انتخاب روز جهت صدور گزارش PDF:</span>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setWeekOffset((p) => p - 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="هفته قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeekOffset(0);
                    setSelectedDate(getTodayISODate());
                  }}
                  className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium text-purple-300 hover:bg-purple-900/30 transition-colors"
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((p) => p + 1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="هفته بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days Pills (Saturday to Friday) */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const isSelected = selectedDate === day.isoDate;
                const dayTasksCount = tasks.filter(
                  (t) => t.studentId === student.id && t.date === day.isoDate
                ).length;

                return (
                  <button
                    key={day.isoDate}
                    type="button"
                    onClick={() => setSelectedDate(day.isoDate)}
                    className={`p-2.5 rounded-xl flex flex-col items-center justify-between transition-all border text-center ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30 font-bold scale-[1.02]'
                        : 'bg-slate-900/80 text-slate-300 border-white/5 hover:border-white/20 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[11px] font-medium opacity-80">{day.dayName}</span>
                    <span className="text-xs font-bold my-0.5 font-mono">
                      {day.jalaliFormatted}
                    </span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : dayTasksCount > 0
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                          : 'text-slate-500'
                      }`}
                    >
                      {dayTasksCount > 0 ? `${toPersianDigits(dayTasksCount)} پارت` : 'بدون پارت'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Summary Preview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">زمان مطالعه خالص</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {formatPersianTime(reportData.actualStudyMinutes)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                برنامه‌ریزی: {formatPersianTime(reportData.plannedStudyMinutes)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">پارت‌های مطالعه</span>
              <span className="text-base font-bold text-purple-300 font-mono">
                {toPersianDigits(reportData.completedTasks.length)} از {toPersianDigits(reportData.tasks.length)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                تکمیل: {toPersianDigits(reportData.planCompletionRate)}٪
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">تست‌های امروز</span>
              <span className="text-base font-bold text-sky-400 font-mono">
                {toPersianDigits(reportData.totalTestsCount)} تست
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                میانگین درصد: {reportData.averageTestPercentage !== null ? `${toPersianDigits(reportData.averageTestPercentage)}٪` : '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-white/5">
              <span className="text-[11px] text-slate-400 block mb-1">عادات و استمرار</span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {toPersianDigits(reportData.completedHabitsCount)} از {toPersianDigits(reportData.totalHabitsCount)}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                استمرار: {toPersianDigits(reportData.streak)} روز
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Interactive Page Preview Section Toggle */}
          <div className="border border-white/10 rounded-2xl p-4 bg-slate-950/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">
                  پیش‌نمایش بصری صفحات سند قبل از دانلود:
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewActive((p) => !p)}
                className="text-xs text-purple-300 hover:text-purple-200 font-medium"
              >
                {isPreviewActive ? 'بستن پیش‌نمایش' : 'مشاهده پیش‌نمایش صفحات'}
              </button>
            </div>

            {isPreviewActive && (
              <div className="w-full flex justify-center py-4 bg-slate-950 rounded-xl overflow-x-auto border border-white/5 max-h-[500px] overflow-y-auto">
                <div style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}>
                  <DailyReportPdfDocument data={reportData} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>
              قالب استاندارد A4 عمودی | مناسب پرینت و اشتراک‌گذاری با اولیا و مشاور
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progressStatus || 'در حال ساخت فایل PDF...'}</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>دانلود گزارش روزانه PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Offscreen Container for Clean & Deterministic PDF Generation */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          pointerEvents: 'none',
          opacity: 1,
          zIndex: -999,
        }}
      >
        <DailyReportPdfDocument data={reportData} containerRef={pdfContainerRef} />
      </div>
    </div>
  );
};
