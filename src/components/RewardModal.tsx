import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Flame, CheckCircle, ArrowLeft } from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate.js';
import { soundManager } from '../utils/audio.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  previousFP: number;
  newFP: number;
  fpGained?: number;
  streak: number;
  courseName?: string;
  onOpenReport: () => void;
}

export const RewardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  previousFP,
  newFP,
  fpGained = 15,
  streak,
  courseName = 'پارت مطالعه',
  onOpenReport,
}) => {
  const [animatedFP, setAnimatedFP] = useState(previousFP);

  useEffect(() => {
    if (isOpen) {
      soundManager.playSessionComplete();
      // Animate FP counter rolling up
      const duration = 1200;
      const startTime = performance.now();
      const step = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentVal = Math.round(previousFP + (newFP - previousFP) * progress);
        setAnimatedFP(currentVal);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    } else {
      setAnimatedFP(previousFP);
    }
  }, [isOpen, previousFP, newFP]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.3)] text-center text-white overflow-hidden"
        >
          {/* Subtle cosmic glow aura */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-b from-purple-500/30 via-indigo-500/20 to-transparent blur-3xl pointer-events-none" />

          {/* Icon Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 12 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-purple-300/30"
          >
            <Trophy className="w-8 h-8 text-white drop-shadow" />
          </motion.div>

          {/* Heading */}
          <div className="text-[11px] font-mono tracking-widest text-purple-400 uppercase font-semibold mb-1">
            SESSION COMPLETE
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mb-1 text-slate-100">
            پارت با موفقیت تکمیل شد!
          </h2>
          <p className="text-xs text-slate-400 mb-6 truncate px-4">
            {courseName}
          </p>

          {/* Reward highlights box */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-white/5 space-y-3.5 mb-6">
            {/* FP Gain */}
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>پاداش تکمیل پارت:</span>
              </span>
              <motion.span
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="font-mono font-bold text-emerald-400 text-base tabular-nums"
              >
                +{toPersianDigits(fpGained)} FP
              </motion.span>
            </div>

            {/* FP Transition */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className="text-slate-400">مجموع امتیاز تمرکز:</span>
              <div className="flex items-center gap-1.5 font-mono font-semibold tabular-nums">
                <span className="text-slate-400 line-through">
                  {toPersianDigits(previousFP)}
                </span>
                <span className="text-purple-400">→</span>
                <span className="text-base text-purple-300 font-bold">
                  {toPersianDigits(animatedFP)} FP
                </span>
              </div>
            </div>

            {/* Streak Status */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>وضعیت استمرار روزانه:</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {toPersianDigits(streak)} روز پیوسته
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            استراحت ۳۰ دقیقه‌ای شما آغاز شد. برای کسب <span className="text-emerald-400 font-bold font-mono">+۵ FP</span> دیگر، لطفاً گزارش پارت را ثبت کنید.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenReport();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>ثبت گزارش پارت (+۵ FP)</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-colors"
            >
              متوجه شدم
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
