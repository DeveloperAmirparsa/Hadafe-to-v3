import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Clock,
  Flame,
  Award,
  LogOut,
  Users,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Activity,
  Zap,
} from 'lucide-react';
import { PlanTask, Student, StudyHallPresence } from '../types/index.js';
import { toPersianDigits } from '../utils/persianDate.js';

interface Props {
  role: 'COUNSELOR' | 'STUDENT';
  student?: Student | null;
  selectedTask?: PlanTask | null;
  onGoToPlan: () => void;
  onCompleteSession?: (task: PlanTask, durationSeconds: number) => void;
  onOpenReportModal?: (task: PlanTask) => void;
  theme?: 'dark' | 'light';
}

export const StudyHallView: React.FC<Props> = ({
  role,
  student,
  selectedTask,
  onGoToPlan,
  onCompleteSession,
  onOpenReportModal,
  theme = 'dark',
}) => {
  const isCounselor = role === 'COUNSELOR';

  const [isInHall, setIsInHall] = useState(false);
  const [isEnteringMotion, setIsEnteringMotion] = useState(false);
  const [presenceList, setPresenceList] = useState<StudyHallPresence[]>([]);
  const [myPresence, setMyPresence] = useState<StudyHallPresence | null>(null);
  const [liveSeconds, setLiveSeconds] = useState(0);

  const heartbeatIntervalRef = useRef<number | null>(null);
  const pollIntervalRef = useRef<number | null>(null);
  const localTimerRef = useRef<number | null>(null);

  // Fetch active study hall presence list
  const fetchPresence = async () => {
    try {
      const res = await fetch('/api/study-hall/presence');
      if (res.ok) {
        const data: StudyHallPresence[] = await res.json();
        setPresenceList(data);
        if (student) {
          const current = data.find((p) => p.studentId === student.id);
          if (current) setMyPresence(current);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPresence();
    pollIntervalRef.current = window.setInterval(fetchPresence, 10000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [student]);

  // Handle Entrance
  const handleEnterHall = async () => {
    if (!selectedTask) return;

    // Trigger futuristic signature entrance sequence
    setIsEnteringMotion(true);

    try {
      const res = await fetch('/api/study-hall/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: selectedTask.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setTimeout(() => {
          setIsEnteringMotion(false);
          setIsInHall(true);
          setMyPresence(data.presence);
          setLiveSeconds(0);
          fetchPresence();
        }, 900);
      } else {
        setIsEnteringMotion(false);
      }
    } catch {
      setIsEnteringMotion(false);
    }
  };

  // Heartbeat & local live ticker while in hall
  useEffect(() => {
    if (isInHall && !isCounselor) {
      // Periodic server heartbeat every 20 seconds
      heartbeatIntervalRef.current = window.setInterval(async () => {
        try {
          const res = await fetch('/api/study-hall/heartbeat', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            if (data.presence) setMyPresence(data.presence);
          }
        } catch {
          // ignore
        }
      }, 20000);

      // Local ticker for smooth second display
      localTimerRef.current = window.setInterval(() => {
        setLiveSeconds((s) => s + 1);
      }, 1000);
    }

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [isInHall, isCounselor]);

  // Handle Exit
  const handleLeaveHall = async () => {
    try {
      await fetch('/api/study-hall/leave', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setIsInHall(false);
      setMyPresence(null);
      setLiveSeconds(0);
      fetchPresence();
    }
  };

  // Counselor action: terminate stale presence
  const handleTerminatePresence = async (studentId: string) => {
    try {
      const res = await fetch(`/api/study-hall/presence/${studentId}/terminate`, {
        method: 'POST',
      });
      if (res.ok) fetchPresence();
    } catch {
      // ignore
    }
  };

  // Format live duration
  const formatLiveDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${toPersianDigits(mins)}:${toPersianDigits(String(secs).padStart(2, '0'))}`;
  };

  // ==========================================
  // SIGNATURE ENTRANCE ANIMATION SCREEN
  // ==========================================
  if (isEnteringMotion) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl animate-study-hall-enter">
        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Engineering blueprint geometry circle */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping opacity-30" />
          <div className="absolute inset-4 rounded-full border border-indigo-400/40 animate-spin duration-3000" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-purple-600/50 animate-ecg">
            <Radio className="w-10 h-10" />
          </div>
        </div>
        <div className="mt-8 text-center space-y-2">
          <h3 className="text-xl font-black text-slate-100 tracking-tight">
            در حال احراز اتصال و همگام‌سازی سالن مطالعه...
          </h3>
          <p className="text-xs text-purple-400 font-mono">
            پارت انتخابی: {selectedTask?.courseName}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // LOBBY (STUDENT NOT YET ENTERED)
  // ==========================================
  if (!isInHall && !isCounselor) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl glass-primary border ${
            theme === 'dark' ? 'border-purple-500/25' : 'border-indigo-200/50'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>سالن مطالعه اشتراکی دیجیتال</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">
                سالن مطالعه متمرکز هدف تو
              </h1>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                فضایی آکادمیک برای هم‌افزایی اراده و ایجاد انگیزه جمعی بدون امکان چت یا برهم‌زدن سکوت و تمرکز.
              </p>
            </div>

            {/* Live Count Pill */}
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 text-center shrink-0">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">دانش‌آموزان در حال مطالعه</span>
                <span className="text-lg font-black font-mono text-emerald-400">
                  {toPersianDigits(presenceList.length)} نفر آنلاین
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Task Selection Requirement Card */}
        <div
          className={`p-6 sm:p-8 rounded-3xl glass-secondary border ${
            selectedTask
              ? 'border-purple-500/40 bg-purple-950/20 shadow-[0_0_40px_rgba(168,85,247,0.15)]'
              : 'border-white/10'
          }`}
        >
          {selectedTask ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-400 block">پارت درسی آماده ورود:</span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-100">
                    {selectedTask.courseName}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                    <span>مدت برنامه‌ریزی: {toPersianDigits(selectedTask.durationMinutes)} دقیقه</span>
                    <span>·</span>
                    <span>نوع فعالیت: {selectedTask.activityType}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onGoToPlan}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  تغییر پارت
                </button>
              </div>

              <button
                type="button"
                onClick={handleEnterHall}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-600/35 transition-all cursor-pointer active:scale-98"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>ورود رسمی به سالن مطالعه با این پارت</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <BookOpen className="w-12 h-12 mx-auto text-purple-400/60" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-200">
                  برای ورود به سالن مطالعه ابتدا یک پارت از برنامه امروز انتخاب کنید.
                </h3>
                <p className="text-xs text-slate-400">
                  طبق قوانین آموزشی هدف تو، حضور در سالن مطالعه متمرکز منوط به انتخاب پارت فعال از پلنر امروز است.
                </p>
              </div>

              <button
                type="button"
                onClick={onGoToPlan}
                className="py-3 px-6 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <span>مشاهده برنامه امروز و انتخاب پارت</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Live Peers Preview List (Read-only Preview) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>فهرست دانش‌آموزان حاضر در سالن (مرتب‌سازی بر اساس زمان حضور)</span>
          </h3>

          {presenceList.length === 0 ? (
            <div className="p-8 text-center rounded-2xl glass-secondary text-slate-400 text-xs">
              فعلاً دانش‌آموزی در سالن مطالعه نیست
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presenceList.map((p) => (
                <div
                  key={p.studentId}
                  className="p-4 rounded-2xl glass-secondary flex items-center justify-between gap-3 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-500/30">
                      {p.nickname ? p.nickname[0] : 'د'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-100">{p.nickname}</span>
                        {p.equippedTitle && (
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 text-[9px] font-semibold">
                            {p.equippedTitle}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[170px] mt-0.5">
                        در حال مطالعه: {p.currentTaskTitle}
                      </span>
                    </div>
                  </div>

                  <div className="text-left font-mono text-xs font-bold text-emerald-400 shrink-0">
                    {toPersianDigits(p.liveMinutes)} دقیقه
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE STUDY HALL SESSION (STUDENT OR COUNSELOR)
  // ==========================================
  return (
    <div className="w-full space-y-6">
      {/* Active Room Top Glass Control Bar */}
      <div
        className={`p-6 rounded-3xl glass-primary flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
          theme === 'dark' ? 'border-purple-500/30 bg-purple-950/20' : 'border-indigo-200/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-400 font-mono">
                {isCounselor ? 'نظارت استاد مشاور' : 'حضور زنده شما در سالن مطالعه'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                فعال
              </span>
            </div>
            {!isCounselor && selectedTask && (
              <h2 className="text-lg font-black text-slate-100 mt-0.5">
                {selectedTask.courseName}
              </h2>
            )}
            {isCounselor && (
              <h2 className="text-lg font-black text-slate-100 mt-0.5">
                مانیتورینگ زنده و پایش دانش‌آموزان
              </h2>
            )}
          </div>
        </div>

        {/* Live Counters & Leave Action */}
        <div className="flex items-center gap-4">
          {!isCounselor && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center font-mono">
              <span className="text-[10px] text-slate-400 block">مدت حضور پیوسته</span>
              <span className="text-xl font-black text-emerald-400">
                {formatLiveDuration(liveSeconds)}
              </span>
            </div>
          )}

          {!isCounselor ? (
            <div className="flex items-center gap-2 flex-wrap">
              {onCompleteSession && selectedTask && (
                <button
                  type="button"
                  onClick={async () => {
                    const secs = liveSeconds;
                    await handleLeaveHall();
                    onCompleteSession(selectedTask, secs);
                  }}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>پایان مطالعه و ثبت پارت (+۱۵ FP)</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleLeaveHall}
                className="py-3 px-4 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج از سالن</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 font-mono">
              {toPersianDigits(presenceList.length)} دانش‌آموز متصل
            </div>
          )}
        </div>
      </div>

      {/* Grid of Active Presence Cards (Ordered highest live duration -> lowest) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span>میزهای مطالعه فعال (به ترتیب مدت زمان حضور پیوسته)</span>
          </h3>

          <span className="text-xs text-slate-400 font-mono">
            به‌روزرسانی خودکار زنده
          </span>
        </div>

        {presenceList.length === 0 ? (
          <div className="p-16 text-center rounded-3xl glass-secondary text-slate-400 space-y-2">
            <Radio className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <h4 className="font-bold text-slate-300">فعلاً دانش‌آموزی در سالن مطالعه نیست</h4>
            <p className="text-xs text-slate-500">
              با انتخاب یک پارت درسی، اولین نفری باشید که میز مطالعه خود را روشن می‌کند.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presenceList.map((p, idx) => {
              const isMe = student && p.studentId === student.id;

              return (
                <div
                  key={p.studentId}
                  className={`p-5 rounded-3xl glass-secondary flex flex-col justify-between space-y-4 border transition-all ${
                    isMe
                      ? 'border-purple-500/60 bg-purple-950/30 shadow-[0_0_30px_rgba(168,85,247,0.2)]'
                      : 'border-white/10'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* Header: Rank + Nickname + Title */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-500/30 font-mono">
                          {toPersianDigits(idx + 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-slate-100">{p.nickname}</span>
                            {p.equippedTitle && (
                              <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                «{p.equippedTitle}»
                              </span>
                            )}
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded-md bg-purple-600 text-white text-[9px] font-bold">
                                شما
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                            {p.major} · {p.grade}
                          </span>
                        </div>
                      </div>

                      {/* Streak Pill */}
                      {p.streak > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-500/20 text-[10px] font-mono font-bold shrink-0">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span>{toPersianDigits(p.streak)}</span>
                        </div>
                      )}
                    </div>

                    {/* Task Title */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block mb-0.5">پارت در حال مطالعه:</span>
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">
                        {p.currentTaskTitle}
                      </span>
                    </div>

                    {/* Equipped Badges */}
                    {p.equippedBadges && p.equippedBadges.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.equippedBadges.map((badge) => (
                          <span
                            key={badge}
                            className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-medium flex items-center gap-1"
                          >
                            <Award className="w-2.5 h-2.5 text-amber-400" />
                            <span>{badge}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer: Live Duration + Counselor Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                      <Activity className="w-3.5 h-3.5" />
                      <span>{toPersianDigits(p.liveMinutes)} دقیقه در سالن</span>
                    </div>

                    {/* Counselor Terminate Action */}
                    {isCounselor && (
                      <button
                        type="button"
                        onClick={() => handleTerminatePresence(p.studentId)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        خاتمه نشست
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
