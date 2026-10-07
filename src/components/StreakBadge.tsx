import React from 'react';
import { Flame, Sparkles, ShieldAlert } from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate.js';

interface Props {
  streak: number;
  theme?: 'dark' | 'light';
  onClick?: () => void;
}

export const StreakBadge: React.FC<Props> = ({ streak, theme = 'dark', onClick }) => {
  // Determine tier
  let tier = 1;
  let label = 'شعله اولیه';
  let flameColor = 'text-amber-500';
  let badgeBorder = 'border-amber-500/30';
  let glowStyle = 'shadow-[0_0_12px_rgba(245,158,11,0.25)]';
  let bgGradient = 'from-amber-500/10 to-orange-500/5';

  if (streak >= 30) {
    tier = 4;
    label = 'اسطوره‌ای (Mythic)';
    flameColor = 'text-purple-400';
    badgeBorder = 'border-purple-400/60 ring-1 ring-purple-400/40';
    glowStyle = 'shadow-[0_0_24px_rgba(168,85,247,0.5),0_0_12px_rgba(59,130,246,0.3)] animate-pulse';
    bgGradient = 'from-purple-600/25 via-indigo-600/20 to-blue-600/25';
  } else if (streak >= 15) {
    tier = 3;
    label = 'درخشش طلایی';
    flameColor = 'text-yellow-400';
    badgeBorder = 'border-yellow-400/40';
    glowStyle = 'shadow-[0_0_18px_rgba(234,179,8,0.35)]';
    bgGradient = 'from-yellow-500/15 to-amber-600/15';
  } else if (streak >= 7) {
    tier = 2;
    label = 'شعله استمرار';
    flameColor = 'text-orange-400';
    badgeBorder = 'border-orange-400/30';
    glowStyle = 'shadow-[0_0_14px_rgba(249,115,22,0.3)]';
    bgGradient = 'from-orange-500/15 to-red-500/10';
  }

  return (
    <button
      onClick={onClick}
      className={`relative group flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 ${badgeBorder} ${glowStyle} ${
        theme === 'dark' ? 'bg-slate-900/80 hover:bg-slate-800' : 'bg-white/80 hover:bg-white'
      } bg-gradient-to-r ${bgGradient}`}
      title={`استمرار روزانه: ${toPersianDigits(streak)} روز (${label}) - فقط مشاور می‌تواند استمرار را بازنشانی کند.`}
    >
      <div className="relative flex items-center justify-center">
        <Flame
          className={`w-4.5 h-4.5 ${flameColor} transition-transform group-hover:scale-110 ${
            tier >= 3 ? 'animate-bounce' : ''
          }`}
        />
        {tier === 4 && (
          <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-purple-300 animate-spin" />
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-xs font-medium text-slate-300">استمرار:</span>
        <span className="text-sm font-bold font-mono tabular-nums text-white">
          {toPersianDigits(streak)}
        </span>
        <span className="text-[11px] text-slate-400">روز</span>
      </div>

      {tier === 4 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white tracking-widest uppercase">
          MYTHIC
        </span>
      )}
    </button>
  );
};
