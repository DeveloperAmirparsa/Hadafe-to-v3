import React, { useState } from 'react';
import { toPersianDigits } from '../utils/persianDate.js';
import { Info, Sparkles } from 'lucide-react';

interface Props {
  points: number;
  theme?: 'dark' | 'light';
  onOpenStore?: () => void;
}

export const FocusPointWidget: React.FC<Props> = ({ points, theme = 'dark', onOpenStore }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={onOpenStore}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-900/80 hover:bg-slate-800/90 border border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
            : 'bg-white/80 hover:bg-white border border-purple-300/60 hover:border-purple-400 shadow-[0_2px_12px_rgba(168,85,247,0.1)]'
        }`}
        title="فروشگاه پاداش‌ها و امتیاز تمرکز"
      >
        {/* Mythic Coin Icon */}
        <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-[0_0_10px_rgba(147,51,234,0.5)] group-hover:scale-105 transition-transform">
          <div className="w-5.5 h-5.5 rounded-full border border-purple-200/40 flex items-center justify-center">
            <span className="text-[10px] font-bold font-mono text-white tracking-tighter drop-shadow">FP</span>
          </div>
          <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-pulse pointer-events-none" />
        </div>

        {/* FP Display */}
        <div className="flex items-baseline gap-1 text-right">
          <span className="text-xs font-mono font-medium text-purple-400">FP =</span>
          <span className="text-sm font-bold font-mono tabular-nums text-slate-100 dark:text-slate-100 group-hover:text-purple-300 transition-colors">
            {toPersianDigits(points)}
          </span>
        </div>

        <Sparkles className="w-3.5 h-3.5 text-purple-400/70 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Tooltip / Quick Rules Guide */}
      {showTooltip && (
        <div
          className={`absolute left-0 top-full mt-2 w-64 p-3 rounded-xl z-50 text-xs shadow-2xl backdrop-blur-xl border transition-all ${
            theme === 'dark'
              ? 'bg-slate-900/95 border-purple-500/20 text-slate-200'
              : 'bg-white/95 border-purple-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-purple-400 mb-2 border-b border-purple-500/10 pb-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>قوانین امتیاز Focus Point</span>
          </div>
          <ul className="space-y-1.5 text-[11px] leading-relaxed">
            <li className="flex justify-between">
              <span>هر تست پاسخ داده شده:</span>
              <span className="font-mono font-bold text-emerald-400">+۱ FP</span>
            </li>
            <li className="flex justify-between">
              <span>هر پارت مطالعه کامل:</span>
              <span className="font-mono font-bold text-emerald-400">+۱۵ FP</span>
            </li>
            <li className="flex justify-between">
              <span>هر عادت تکمیل شده:</span>
              <span className="font-mono font-bold text-emerald-400">+۱۰ FP</span>
            </li>
            <li className="flex justify-between">
              <span>ثبت کامل گزارش پارت:</span>
              <span className="font-mono font-bold text-emerald-400">+۵ FP</span>
            </li>
          </ul>
          <p className="mt-2 pt-1.5 border-t border-purple-500/10 text-[10px] text-purple-400/80 text-center">
            کلیک برای مشاهده و خرج امتیاز در فروشگاه پاداش‌ها
          </p>
        </div>
      )}
    </div>
  );
};
