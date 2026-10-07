import React, { useState, useEffect } from 'react';
import { toPersianDigits } from '../utils/persianDate.js';
import { Hourglass, Sparkles, CalendarDays } from 'lucide-react';

interface Props {
  konkurDate: string; // ISO string or date
  theme?: 'dark' | 'light';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const KonkurCountdown: React.FC<Props> = ({ konkurDate, theme = 'dark' }) => {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(konkurDate).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [konkurDate]);

  return (
    <div
      className={`relative w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-slate-900/75 border-purple-500/30 shadow-[0_4px_24px_rgba(168,85,247,0.12)]'
          : 'bg-white/85 border-purple-200/80 shadow-[0_4px_24px_rgba(168,85,247,0.08)]'
      } backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden`}
    >
      {/* Background soft ambient gradient */}
      <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Left Title & Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-600/30">
          <Hourglass className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-purple-500 tracking-wide uppercase">
              شمارش معکوس سرنوشت‌ساز
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h2 className={`text-sm sm:text-base font-bold flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            <span>زمان باقی‌مانده تا آزمون سراسری کنکور</span>
          </h2>
          <p className={`text-[11px] mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            «هر ثانیه، فرصتی است طلایی برای یک تست بیشتر و یک رتبه بهتر.»
          </p>
        </div>
      </div>

      {/* Right Digital Segmented Blocks */}
      <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 self-center sm:self-auto">
        {/* Days */}
        <div className={`flex flex-col items-center justify-center min-w-[58px] sm:min-w-[64px] py-2 px-2.5 rounded-xl border shadow-inner ${
          theme === 'dark' ? 'bg-slate-950/70 border-white/10' : 'bg-indigo-50/80 border-indigo-200/70'
        }`}>
          <span className={`font-mono font-black text-lg sm:text-2xl tabular-nums ${theme === 'dark' ? 'text-purple-300' : 'text-indigo-700'}`}>
            {toPersianDigits(timeLeft.days)}
          </span>
          <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>روز</span>
        </div>

        <span className="font-mono text-purple-400 font-bold text-lg -mt-3 select-none">:</span>

        {/* Hours */}
        <div className={`flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] py-2 px-2 rounded-xl border shadow-inner ${
          theme === 'dark' ? 'bg-slate-950/70 border-white/10' : 'bg-slate-100/90 border-slate-200/80'
        }`}>
          <span className={`font-mono font-bold text-base sm:text-xl tabular-nums ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            {toPersianDigits(String(timeLeft.hours).padStart(2, '0'))}
          </span>
          <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>ساعت</span>
        </div>

        <span className="font-mono text-purple-400 font-bold text-lg -mt-3 select-none">:</span>

        {/* Minutes */}
        <div className={`flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] py-2 px-2 rounded-xl border shadow-inner ${
          theme === 'dark' ? 'bg-slate-950/70 border-white/10' : 'bg-slate-100/90 border-slate-200/80'
        }`}>
          <span className={`font-mono font-bold text-base sm:text-xl tabular-nums ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            {toPersianDigits(String(timeLeft.minutes).padStart(2, '0'))}
          </span>
          <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>دقیقه</span>
        </div>

        <span className="font-mono text-purple-400 font-bold text-lg -mt-3 select-none">:</span>

        {/* Seconds */}
        <div className={`flex flex-col items-center justify-center min-w-[50px] sm:min-w-[56px] py-2 px-2 rounded-xl border shadow-inner ${
          theme === 'dark' ? 'bg-slate-950/70 border-purple-500/40' : 'bg-emerald-50/80 border-emerald-300/70'
        }`}>
          <span className="font-mono font-bold text-base sm:text-xl text-emerald-600 dark:text-emerald-400 tabular-nums">
            {toPersianDigits(String(timeLeft.seconds).padStart(2, '0'))}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">ثانیه</span>
        </div>
      </div>
    </div>
  );
};
