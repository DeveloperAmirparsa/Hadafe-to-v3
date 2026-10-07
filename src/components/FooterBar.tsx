import React from 'react';
import { Sparkles, Shield, Cpu } from 'lucide-react';

interface Props {
  theme: 'dark' | 'light';
  className?: string;
}

export const FooterBar: React.FC<Props> = ({ theme, className = '' }) => {
  return (
    <footer
      className={`w-full transition-all duration-300 mt-10 ${className}`}
      dir="rtl"
    >
      <div
        className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 border ${
          theme === 'dark'
            ? 'glass-panel-dark border-purple-500/20 shadow-[0_8px_32px_0_rgba(147,51,234,0.12)]'
            : 'glass-panel-light border-purple-400/30 shadow-[0_8px_32px_0_rgba(99,102,241,0.08)]'
        }`}
      >
        {/* Subtle background ambient glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          {/* Copyright section */}
          <div className="flex items-center gap-2 text-center md:text-right">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600/30 to-blue-600/30 flex items-center justify-center border border-white/10 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-spin duration-6000" />
            </div>
            <p className="font-semibold tracking-wide">
              <span>تمامی حقوق محفوظ است © ۲۰۲۶ </span>
              <span className="text-gradient-rgb font-bold text-sm tracking-normal">
                VORN-RIFT Studio
              </span>
            </p>
          </div>

          {/* Divider on mobile */}
          <div className="w-16 h-px bg-white/10 md:hidden" />

          {/* Powered By section */}
          <div className="flex items-center gap-2 font-bold text-xs">
            <span className="text-slate-400 font-normal hidden sm:inline">طراح ارشد و توسعه دهنده:</span>
            <a
              href="https://www.instagram.com/amirparsa_hfz/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/25 border border-purple-500/20 hover:border-purple-500/50 backdrop-blur-md transition-all cursor-pointer shadow-sm hover:shadow-[0_0_16px_rgba(168,85,247,0.35)] hover:scale-105 active:scale-95 group"
              title="مشاهده صفحه اینستاگرام طراح و توسعه دهنده (@amirparsa_hfz)"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="text-gradient-rgb-fast font-extrabold text-[13px] tracking-wide" dir="ltr">
                amirparsa_hfz
              </span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
