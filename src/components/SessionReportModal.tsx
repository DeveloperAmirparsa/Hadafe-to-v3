import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { PlanTask, TestResultData } from '../types/index.js';
import { toPersianDigits, formatPersianPercentage } from '../utils/persianDate.js';
import { soundManager } from '../utils/audio.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: PlanTask;
  isAlreadyReported?: boolean;
  onSubmitReport: (reportData: {
    taskId: string;
    courseName: string;
    isCompleted: boolean;
    satisfaction: number;
    focus: number;
    difficulty: number;
    testsCount: number;
    testResult?: TestResultData;
    reflectionNote: string;
  }) => Promise<void>;
}

export const SessionReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  task,
  isAlreadyReported = false,
  onSubmitReport,
}) => {
  const [isCompleted, setIsCompleted] = useState(true);
  const [satisfaction, setSatisfaction] = useState(5);
  const [focus, setFocus] = useState(5);
  const [difficulty, setDifficulty] = useState(3);
  const [testsCount, setTestsCount] = useState<number>(task.minTests || 0);

  // Exam mode fields
  const [totalQuestions, setTotalQuestions] = useState<number>(task.minTests || 30);
  const [correct, setCorrect] = useState<number>(25);
  const [wrong, setWrong] = useState<number>(3);
  const [unanswered, setUnanswered] = useState<number>(2);

  const [reflectionNote, setReflectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto calculate percentage
  // ((Correct - (Wrong / 3)) / Total) * 100
  const isExamMode = task.testMode === 'آزمونی';
  const total = totalQuestions > 0 ? totalQuestions : 1;
  const calculatedPercentage = Math.max(
    -33.33,
    Math.min(100, Math.round((((correct - wrong / 3) / total) * 100) * 100) / 100)
  );

  const handleTotalChange = (val: number) => {
    setTotalQuestions(val);
    setTestsCount(val);
    const remaining = Math.max(0, val - correct - wrong);
    setUnanswered(remaining);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (isExamMode) {
      if (totalQuestions <= 0) {
        setValidationError('لطفاً تعداد کل تست‌های آزمونی را مشخص کنید.');
        return;
      }
      if (correct + wrong + unanswered !== totalQuestions) {
        setValidationError('مجموع صحیح، غلط و نزده باید برابر با تعداد کل تست‌ها باشد.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let testResultData: TestResultData | undefined = undefined;
      if (isExamMode && totalQuestions > 0) {
        testResultData = {
          total: totalQuestions,
          correct,
          wrong,
          unanswered,
          percentage: calculatedPercentage,
        };
      }

      await onSubmitReport({
        taskId: task.id,
        courseName: task.courseName,
        isCompleted,
        satisfaction,
        focus,
        difficulty,
        testsCount: isExamMode ? totalQuestions : testsCount,
        testResult: testResultData,
        reflectionNote,
      });

      soundManager.playRewardCoin();
      onClose();
    } catch (err) {
      setValidationError('خطا در ثبت گزارش. لطفاً مجدداً تلاش فرمایید.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.25)] text-white max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-5">
            <div>
              <div className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider mb-0.5">
                SESSION REPORT
              </div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>ثبت گزارش پارت مطالعه</span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +۵ FP پاداش ثبت
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 truncate max-w-md">
                درس: {task.courseName} ({task.activityType} - {task.durationMinutes} دقیقه)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isAlreadyReported && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>گزارش این پارت قبلاً ثبت شده است</span>
            </div>
          )}

          {validationError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* 1. Status: Completed / Not Completed */}
            <div>
              <label className="block text-slate-300 font-medium mb-2">وضعیت اجرای پارت</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsCompleted(true)}
                  className={`py-2.5 px-4 rounded-xl border text-center font-medium transition-all ${
                    isCompleted
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 shadow-sm'
                      : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  انجام شد (+۱۵ FP)
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompleted(false)}
                  className={`py-2.5 px-4 rounded-xl border text-center font-medium transition-all ${
                    !isCompleted
                      ? 'bg-rose-600/30 border-rose-500 text-rose-200 shadow-sm'
                      : 'bg-slate-800/40 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  انجام نشد (نیاز به بازنگری)
                </button>
              </div>
            </div>

            {/* 2. Sliders: Satisfaction, Focus, Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 rounded-2xl bg-slate-800/40 border border-white/5">
              {/* Satisfaction */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>میزان رضایت:</span>
                  <span className="font-mono text-purple-400 font-bold">{toPersianDigits(satisfaction)} / ۵</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={satisfaction}
                  onChange={(e) => setSatisfaction(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Focus */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>کیفیت تمرکز:</span>
                  <span className="font-mono text-purple-400 font-bold">{toPersianDigits(focus)} / ۵</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={focus}
                  onChange={(e) => setFocus(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Difficulty */}
              <div>
                <div className="flex justify-between text-slate-300 mb-1 font-medium">
                  <span>درجه سختی:</span>
                  <span className="font-mono text-purple-400 font-bold">{toPersianDigits(difficulty)} / ۵</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>

            {/* 3. Testing details */}
            {isExamMode ? (
              /* Exam Mode (آزمونی) - Mandatory Breakdown & Auto Percentage */
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-purple-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <span>ثبت نتایج آزمونی زمان‌دار (الزامی)</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    فرمول رسمی کنکور سراسری
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">تعداد کل تست‌ها</label>
                    <input
                      type="number"
                      min="1"
                      value={totalQuestions}
                      onChange={(e) => handleTotalChange(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-white/10 font-mono text-center text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-400 text-[11px] mb-1">صحیح</label>
                    <input
                      type="number"
                      min="0"
                      value={correct}
                      onChange={(e) => setCorrect(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-emerald-500/30 text-emerald-300 font-mono text-center text-sm focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-rose-400 text-[11px] mb-1">غلط (نمره منفی)</label>
                    <input
                      type="number"
                      min="0"
                      value={wrong}
                      onChange={(e) => setWrong(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-rose-500/30 text-rose-300 font-mono text-center text-sm focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">نزده / بدون پاسخ</label>
                    <input
                      type="number"
                      min="0"
                      value={unanswered}
                      onChange={(e) => setUnanswered(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-white/10 text-slate-400 font-mono text-center text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto calculated Percentage Display */}
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
                  <span className="text-slate-300 font-medium">درصد محاسبه‌شده با نمره منفی:</span>
                  <span className="text-xl font-bold font-mono text-purple-300 tabular-nums">
                    {formatPersianPercentage(calculatedPercentage)}
                  </span>
                </div>
              </div>
            ) : (
              /* Non-exam or regular practice */
              <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-slate-300 font-medium">تعداد تست‌های پاسخ‌داده‌شده:</div>
                  <div className="text-[11px] text-slate-400">هر تست = +۱ FP امتیاز تمرکز</div>
                </div>
                <input
                  type="number"
                  min="0"
                  value={testsCount}
                  onChange={(e) => setTestsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 py-1.5 px-3 rounded-xl bg-slate-900 border border-white/10 font-mono text-center text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            )}

            {/* 4. Free reflection note */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                توضیح آزاد و بازخورد اختصاصی به مشاور:
              </label>
              <textarea
                rows={3}
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                placeholder="نکات مهم، اشتباهات رایج، چالش‌ها یا مباحثی که نیاز به مرور مجدد دارند را بنویسید..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isAlreadyReported}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {isAlreadyReported
                    ? 'گزارش این پارت قبلاً ثبت شده است'
                    : isSubmitting
                    ? 'در حال ثبت...'
                    : 'ثبت قطعی گزارش و دریافت پاداش'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
