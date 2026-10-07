import React from 'react';
import { FocusPointWidget } from './FocusPointWidget.js';
import { StreakBadge } from './StreakBadge.js';
import { Student } from '../types/index.js';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  User,
  Shield,
  LogOut,
  Calendar,
  ListTodo,
  Gift,
  Trophy,
  BarChart2,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { soundManager } from '../utils/audio.js';

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

export const Navbar: React.FC<Props> = ({
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
  const [soundOn, setSoundOn] = React.useState(soundManager.isEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.setEnabled(next);
  };

  const isCounselor = role === 'COUNSELOR';

  const studentNavItems = [
    { id: 'plan', label: 'برنامه امروز', icon: Calendar },
    { id: 'part-reports', label: 'برنامه هفتگی', icon: FileText },
    { id: 'habits', label: 'عادت‌ها', icon: ListTodo },
    { id: 'rewards', label: 'جوایز', icon: Gift },
    { id: 'tournament', label: 'تورنمنت', icon: Trophy },
    { id: 'analytics', label: 'داشبورد تشخیصی', icon: BarChart2 },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 border-b ${
        theme === 'dark'
          ? 'bg-slate-950/75 border-white/10 backdrop-blur-xl'
          : 'bg-white/80 border-slate-200/80 backdrop-blur-xl'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectView(isCounselor ? 'counselor' : 'plan')}
            className="flex items-center gap-2.5 text-right group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-xs tracking-tighter">هدف</span>
            </div>
            <div>
              <span className={`text-base sm:text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-l ${
                theme === 'light'
                  ? 'from-purple-800 via-indigo-700 to-blue-700'
                  : 'from-purple-400 via-indigo-300 to-white'
              }`}>
                هدف تو
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 mr-2 font-normal">
                هر روز، یک قدم نزدیک‌تر.
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        {!isCounselor && (
          <nav className="hidden lg:flex items-center gap-1">
            {studentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {isCounselor && (
          <div className="hidden md:flex items-center gap-2 text-xs text-purple-400 font-semibold px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-500/20">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>پنل نظارت و هدایت مشاور (دسترسی کامل)</span>
          </div>
        )}

        {/* Zone 3: Actions & Metrics (FP, Streak, Theme, User) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isCounselor && student && (
            <>
              {/* Focus Point Mythic Widget */}
              <FocusPointWidget
                points={student.focusPoints}
                theme={theme}
                onOpenStore={onOpenStore}
              />

              {/* Streak Badge */}
              <StreakBadge
                streak={student.streak}
                theme={theme}
                onClick={onOpenStreakInfo}
              />
            </>
          )}

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={soundOn ? 'صدا فعال' : 'صدا قطع'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile / Switcher */}
          {!isCounselor && student ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 transition-all text-xs"
              title="مشاهده پروفایل و تغییر حریم خصوصی اهداف"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-[10px]">
                {student.fullName.charAt(0)}
              </div>
              <span className="font-medium text-slate-200 hidden sm:inline truncate max-w-[80px]">
                {student.nickname || student.fullName.split(' ')[0]}
              </span>
            </button>
          ) : (
            <div className="px-2.5 py-1 rounded-xl bg-purple-900/40 text-purple-300 text-xs font-medium border border-purple-500/20">
              مشاور
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium cursor-pointer"
            title="خروج از حساب کاربری"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar for Students */}
      {!isCounselor && (
        <div className="lg:hidden flex items-center justify-around px-2 py-2 border-t border-white/5 bg-slate-950/90 overflow-x-auto text-[11px]">
          {studentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`py-1 px-2 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-purple-400 font-bold' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
