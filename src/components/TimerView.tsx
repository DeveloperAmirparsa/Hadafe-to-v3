import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { PlanTask } from '../types/index.js';
import { toPersianDigits, formatSecondsToClock } from '../utils/persianDate.js';
import { soundManager } from '../utils/audio.js';

interface Props {
  activeTask: PlanTask | null;
  theme?: 'dark' | 'light';
  onSessionComplete: (task: PlanTask, durationSeconds: number) => void;
  onOpenReportModal: (task: PlanTask) => void;
  onBackToPlan?: () => void;
}

export const TimerView: React.FC<Props> = ({
  activeTask,
  theme = 'dark',
  onSessionComplete,
  onOpenReportModal,
  onBackToPlan,
}) => {
  if (!activeTask || activeTask.isCompleted || activeTask.status === 'COMPLETED') {
    return (
      <div className="w-full max-w-xl mx-auto py-12 px-4 text-center">
        <div
          className={`p-8 sm:p-10 rounded-3xl glass-primary border ${
            theme === 'dark' ? 'border-purple-500/25' : 'border-indigo-200/50'
          } space-y-4`}
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mx-auto text-purple-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-100">
            هیچ پارت معتبری برای اجرای تایمر انتخاب نشده است
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            پارت موردنظر ممکن است تکمیل شده یا توسط مشاور از برنامه حذف شده باشد. لطفاً برای شروع مطالعه، ابتدا از جدول برنامه امروز یک پارت درسی فعال را انتخاب فرمایید.
          </p>
          {onBackToPlan && (
            <button
              type="button"
              onClick={onBackToPlan}
              className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              بازگشت به برنامه امروز
            </button>
          )}
        </div>
      </div>
    );
  }

  const initialSeconds = activeTask.durationMinutes * 60;
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(15 * 60); // 15 min break
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(soundManager.isEnabled());

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTask && !isRunning && !isBreak) {
      setSecondsLeft(activeTask.durationMinutes * 60);
    }
  }, [activeTask]);

  // Timer Tick Engine
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        if (isBreak) {
          setBreakSecondsLeft((prev) => {
            if (prev <= 1) {
              soundManager.playBreakEnd();
              setIsBreak(false);
              setIsRunning(false);
              return 15 * 60;
            }
            return prev - 1;
          });
        } else {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              handleSessionFinish();
              return 0;
            }
            return prev - 1;
          });
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isBreak]);

  const handleToggleTimer = () => {
    if (!isRunning) {
      soundManager.playTimerStart();
    } else {
      soundManager.playTimerPause();
    }
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    if (isBreak) {
      setBreakSecondsLeft(15 * 60);
    } else {
      setSecondsLeft(initialSeconds);
      setElapsedSeconds(0);
    }
  };

  const handleSessionFinish = () => {
    setIsRunning(false);
    soundManager.playTimerFinish();
    if (activeTask) {
      const recordedSeconds = Math.max(60, elapsedSeconds > 0 ? elapsedSeconds : initialSeconds - secondsLeft);
      onSessionComplete(activeTask, recordedSeconds);
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  // Progress Calculations for Ring
  const totalTargetSeconds = isBreak ? 15 * 60 : initialSeconds;
  const currentSeconds = isBreak ? breakSecondsLeft : secondsLeft;
  const progressRatio = totalTargetSeconds > 0 ? (totalTargetSeconds - currentSeconds) / totalTargetSeconds : 0;
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Current Task Glass Header */}
      {activeTask && (
        <div
          className={`p-6 rounded-3xl glass-primary text-center space-y-2 border transition-all ${
            theme === 'dark' ? 'border-purple-500/25' : 'border-indigo-200/50'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
            <BookOpen className="w-3.5 h-3.5" />
            <span>پارت درسی انتخابی</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
            {activeTask.courseName}
          </h2>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 font-mono">
            <span>نوع فعالیت: {activeTask.activityType}</span>
            <span>·</span>
            <span>زمان برنامه‌ریزی: {toPersianDigits(activeTask.durationMinutes)} دقیقه</span>
            {activeTask.minTests > 0 && (
              <>
                <span>·</span>
                <span>تست: {toPersianDigits(activeTask.minTests)} عدد</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Apple-Grade Minimalist Timer Circle */}
      <div
        className={`p-8 sm:p-12 rounded-3xl glass-secondary flex flex-col items-center justify-center relative overflow-hidden border ${
          theme === 'dark' ? 'border-purple-500/20' : 'border-indigo-200/40'
        }`}
      >
        {/* Subtle Ambient Backlight Glow */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
            isRunning
              ? isBreak
                ? 'bg-blue-500/5'
                : 'bg-purple-600/10'
              : 'opacity-0'
          }`}
        />

        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 320 320">
            {/* Background Track */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              className={`${
                theme === 'dark' ? 'stroke-slate-800/80' : 'stroke-indigo-100'
              }`}
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active Progress Ring */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              className={`transition-all duration-1000 ease-linear ${
                isBreak ? 'stroke-blue-400' : 'stroke-purple-500'
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time Numerals Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 mb-1">
              {isBreak ? 'استراحت تجدید قوا' : isRunning ? 'تمرکز عمیق تحصیلی' : 'آماده برای شروع'}
            </span>
            <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-100">
              {toPersianDigits(formatSecondsToClock(currentSeconds))}
            </div>
            <span className="text-[11px] font-mono text-purple-400 mt-2">
              زمان سپری‌شده: {toPersianDigits(Math.floor(elapsedSeconds / 60))}:{toPersianDigits(String(elapsedSeconds % 60).padStart(2, '0'))}
            </span>
          </div>
        </div>

        {/* Minimal Controls Bar */}
        <div className="mt-8 flex items-center gap-4 z-10">
          <button
            type="button"
            onClick={handleResetTimer}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="بازنشانی زمان"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Large Primary Action Button */}
          <button
            type="button"
            onClick={handleToggleTimer}
            className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2.5 shadow-xl transition-all cursor-pointer active:scale-95 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-purple-600/40'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" />
                <span>توقف موقت</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>شروع تمرکز</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleSound}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={soundEnabled ? 'بی‌صدا' : 'فعال‌سازی صدا'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-purple-400" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        {/* Finish & Report Session Button */}
        <div className="mt-6 pt-6 border-t border-white/5 w-full flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleSessionFinish}
            className="py-2.5 px-6 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>اتمام پارت و ثبت گزارش بالینی</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBreak(!isBreak);
              setIsRunning(false);
            }}
            className="py-2.5 px-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>{isBreak ? 'بازگشت به مطالعه' : 'حالت استراحت'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
