import React, { useState } from 'react';
import {
  CalendarCheck,
  Radio,
  ShoppingBag,
  Award,
  Trophy,
  CalendarRange,
  CalendarPlus,
  FileCheck2,
  BellRing,
  CheckCircle2,
  Activity,
  Users,
  Sliders,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  LogOut,
  Flame,
  Coins,
  Sparkles,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Student } from '../types/index.js';
import { soundManager } from '../utils/audio.js';
import { toPersianDigits } from '../utils/persianDate.js';

interface Props {
  role: 'COUNSELOR' | 'STUDENT';
  student?: Student;
  activeView: string;
  onSelectView: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenStore: () => void;
  onOpenStreakInfo?: () => void;
  onLogout: () => void;
}

export const SlimSidebar: React.FC<Props> = ({
  role,
  student,
  activeView,
  onSelectView,
  theme,
  onToggleTheme,
  onOpenProfile,
  onOpenStore,
  onOpenStreakInfo,
  onLogout,
}) => {
  const [soundOn, setSoundOn] = useState(soundManager.isEnabled());
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setEnabled(next);
  };

  const isCounselor = role === 'COUNSELOR';

  const studentNavItems = [
    { id: 'plan', label: 'امروز و برنامه', subtitle: 'میز کار مطالعه', icon: CalendarCheck },
    { id: 'study-hall', label: 'سالن مطالعه', subtitle: 'حضور زنده جمعی', icon: Radio, highlight: true },
    { id: 'store', label: 'فروشگاه و موجودی', subtitle: 'خرج امتیاز تمرکز', icon: ShoppingBag },
    { id: 'achievements', label: 'دستاوردها و نشان‌ها', subtitle: 'افتخارات تحصیلی', icon: Award },
    { id: 'tournament', label: 'تورنمنت', subtitle: 'رده‌بندی کشوری', icon: Trophy },
    { id: 'part-reports', label: 'تقویم گزارش‌ها', subtitle: 'آرشیو عملکرد', icon: CalendarRange },
    { id: 'habits', label: 'عادات روزانه', subtitle: 'تثبیت روتین‌ها', icon: CheckCircle2 },
    { id: 'analytics', label: 'پایش بالینی', subtitle: 'تحلیل سلامت درسی', icon: Activity },
  ];

  const counselorNavItems = [
    { id: 'plan', label: 'دانش‌آموزان و پرونده‌ها', subtitle: 'مدیریت و اطلاعات جامع', icon: Users },
    { id: 'plan-builder', label: 'طراحی برنامه هفتگی', subtitle: 'پلنر تقویمی اکسل', icon: CalendarRange },
    { id: 'reports', label: 'گزارشات و عملکرد', subtitle: 'پایش پارت‌های درسی', icon: FileCheck2 },
    { id: 'approvals', label: 'تایید درخواست‌ها', subtitle: 'عادات و جوایز معلق', icon: BellRing },
    { id: 'study-hall', label: 'سالن مطالعه زنده', subtitle: 'مانیتورینگ آنلاین', icon: Radio, highlight: true },
    { id: 'store', label: 'فروشگاه و محصولات', subtitle: 'مدیریت اقلام FP', icon: ShoppingBag },
    { id: 'achievements', label: 'نشان‌ها و عناوین', subtitle: 'اعطای ۳ نشان انحصاری', icon: Award },
    { id: 'tournament', label: 'تورنمنت جامع', subtitle: 'تحلیل هفتگی رقابت', icon: Trophy },
  ];

  const navItems = isCounselor ? counselorNavItems : studentNavItems;

  return (
    <>
      {/* Desktop & Tablet: Slim Fixed Right Sidebar (Persian RTL) */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`fixed top-0 right-0 z-40 h-screen transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hidden md:flex flex-col justify-between ${
          isExpanded ? 'w-64' : 'w-[72px]'
        } ${
          theme === 'dark'
            ? 'glass-floating border-l border-white/10 bg-slate-950/85 text-slate-100'
            : 'glass-floating border-l border-slate-300/60 bg-[#edf1f7]/92 text-slate-900 shadow-xl'
        }`}
      >
        {/* Top Section: Brand Lockup & Expand Indicator */}
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <button
            onClick={() => onSelectView('plan')}
            className={`flex items-center ${
              isExpanded ? 'gap-3 w-full text-right p-1' : 'justify-center w-full p-0'
            } rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer`}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-600/35 border border-white/20 shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm tracking-tighter">هدف</span>
            </div>
            {isExpanded && (
              <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
                <span className="font-black text-sm tracking-tight block bg-clip-text text-transparent bg-gradient-to-l from-purple-400 to-indigo-200">
                  هدف تو
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  {isCounselor ? 'پنل هدایت و مشاوره' : 'سامانه هوشمند کنکور'}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Middle Section: Navigation Items */}
        <nav className="flex-1 py-4 px-2 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`sidebar-nav-item relative w-full h-11 flex items-center ${
                  isExpanded ? 'justify-start gap-3 px-3' : 'justify-center p-0'
                } rounded-2xl transition-all duration-200 group text-right cursor-pointer ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/35 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                      : 'bg-purple-500/15 text-purple-950 border border-purple-500/35 font-bold shadow-sm'
                    : theme === 'dark'
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                }`}
              >
                {/* Active indicator bar on right edge */}
                {isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-l-full shadow-md shadow-purple-500/50" />
                )}

                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                      : item.highlight
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'text-current'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {isExpanded ? (
                  <div className="overflow-hidden whitespace-nowrap text-right animate-in fade-in duration-150">
                    <span className="text-xs font-bold block leading-snug">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block font-normal leading-none mt-0.5">
                      {item.subtitle}
                    </span>
                  </div>
                ) : (
                  /* Tooltip for narrow state */
                  <div
                    className={`sidebar-tooltip px-3 py-1.5 rounded-xl glass-floating border border-purple-500/25 text-xs font-bold shadow-2xl ${
                      theme === 'dark' ? 'text-slate-100 bg-slate-900/95' : 'text-slate-900 bg-white/95'
                    }`}
                  >
                    <span className="block text-xs">{item.label}</span>
                    <span className="block text-[10px] text-purple-400 font-normal">{item.subtitle}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Profile & System Controls */}
        <div className="p-2 border-t border-white/5 space-y-2 shrink-0">
          {/* Student Identity Widget */}
          {!isCounselor && student && (
            <div
              className={`p-2 rounded-2xl border transition-colors ${
                theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-slate-200/50 border-slate-300/60'
              }`}
            >
              <button
                onClick={onOpenProfile}
                className={`w-full flex items-center ${
                  isExpanded ? 'gap-2.5 text-right' : 'justify-center'
                } cursor-pointer group`}
                title="مشاهده پروفایل و اهداف"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                  {student.nickname ? student.nickname[0] : student.fullName[0]}
                </div>
                {isExpanded && (
                  <div className="overflow-hidden whitespace-nowrap text-right">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold block truncate">
                        {student.nickname || student.fullName}
                      </span>
                      {student.equippedTitle && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold truncate max-w-[80px]">
                          {student.equippedTitle}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {student.major}
                    </span>
                  </div>
                )}
              </button>

              {/* Stats badges */}
              {isExpanded ? (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between gap-1.5 text-xs">
                  <button
                    onClick={onOpenStore}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 hover:text-amber-300 font-mono font-bold text-[11px] transition-colors cursor-pointer min-w-0"
                    title="امتیاز تمرکز (FP)"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{toPersianDigits(student.focusPoints)} FP</span>
                  </button>
                  <button
                    onClick={onOpenStreakInfo}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 hover:text-orange-300 font-mono font-bold text-[11px] transition-colors cursor-pointer min-w-0"
                    title="استمرار پیاپی (روز)"
                  >
                    <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">{toPersianDigits(student.streak)} روز</span>
                  </button>
                </div>
              ) : (
                /* Collapsed: Centered FP badge */
                <div className="mt-1.5 pt-1.5 border-t border-white/5 flex flex-col items-center">
                  <button
                    onClick={onOpenStore}
                    className="w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold border border-amber-500/20 truncate transition-colors cursor-pointer"
                    title={`امتیاز تمرکز: ${toPersianDigits(student.focusPoints)} FP`}
                  >
                    <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate">{toPersianDigits(student.focusPoints)}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Counselor Quick Identity */}
          {isCounselor && (
            <div
              className={`p-2 rounded-2xl border text-center ${
                theme === 'dark' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-500/10 border-purple-400/30'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                {isExpanded && (
                  <span className="text-xs font-bold text-purple-300 truncate">پنل استاد مشاور</span>
                )}
              </div>
            </div>
          )}

          {/* Action Icons Row — Fixed dimensions for rock-solid stability */}
          <div
            className={`pt-1 flex items-center ${
              isExpanded ? 'justify-around gap-1' : 'flex-col gap-1.5'
            }`}
          >
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button
              onClick={handleToggleSound}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/5 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title={soundOn ? 'بی‌صدا کردن' : 'فعال‌سازی صدا'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onLogout}
              className="w-9 h-9 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="خروج از حساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Appbar & Bottom Floating Navigation */}
      <header
        className={`sticky top-0 z-30 w-full border-b md:hidden px-3.5 sm:px-5 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] flex items-center justify-between transition-colors ${
          theme === 'dark'
            ? 'glass-floating border-white/10 bg-slate-950/85 text-slate-100'
            : 'glass-floating border-slate-300/60 bg-[#edf1f7]/95 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSelectView('plan')}
            className="flex items-center gap-2 cursor-pointer text-right group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-600/30 shrink-0">
              هدف
            </div>
            <div>
              <span className="font-black text-sm block leading-none">هدف تو</span>
              <span className="text-[10px] text-purple-400 font-medium block mt-0.5">
                {isCounselor ? 'پنل مشاور' : 'سامانه کنکور'}
              </span>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isCounselor && student && (
            <button
              onClick={onOpenStore}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-500/10 text-purple-400 font-mono text-xs border border-purple-500/25 cursor-pointer active:scale-95 transition-transform"
              title="امتیاز تمرکز"
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>{toPersianDigits(student.focusPoints)}</span>
            </button>
          )}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
            title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
          <button
            onClick={onLogout}
            className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer transition-colors"
            title="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Floating Bottom Dock */}
      <nav
        className={`fixed bottom-2 sm:bottom-3 inset-x-2 sm:inset-x-4 max-w-xl mx-auto z-40 md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x py-2 px-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl ${
          theme === 'dark'
            ? 'glass-floating border-purple-500/20 bg-slate-950/92 text-slate-100'
            : 'glass-floating border-slate-300/70 bg-[#edf1f7]/96 text-slate-900'
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer shrink-0 min-w-[58px] min-h-[44px] ${
                isActive
                  ? 'text-purple-300 font-bold scale-102 bg-purple-500/20 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] truncate max-w-[56px] leading-tight font-medium">
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
