import React, { useState, useMemo } from 'react';
import {
  Student,
  PlanTask,
  ActivityType,
  TestMode,
} from '../types/index.js';
import {
  toPersianDigits,
  getPersianWeekDays,
  calculateEndTime,
  PersianWeekDay,
  PERSIAN_WEEKDAYS,
} from '../utils/persianDate.js';
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Coffee,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Download,
} from 'lucide-react';
import { soundManager } from '../utils/audio.js';

interface Props {
  students: Student[];
  tasks: PlanTask[];
  selectedStudentId: string;
  onSelectStudentId: (id: string) => void;
  onRefreshData: () => Promise<void>;
  theme?: 'dark' | 'light';
}

type ZoomLevel = 'compact' | 'normal' | 'spacious';

const COMMON_SUBJECT_PRESETS = [
  'زیست‌شناسی',
  'شیمی',
  'ریاضیات',
  'فیزیک',
  'حسابان',
  'هندسه و گسسته',
  'ادبیات و فارسی',
  'زبان انگلیسی',
  'عربی اختصاصی',
  'فلسفه و منطق',
  'جامعه‌شناسی',
  'اقتصاد و روان‌شناسی',
];

const START_HOUR = 6; // 06:00
const END_HOUR = 24; // 24:00 (midnight)
const TOTAL_HOURS = END_HOUR - START_HOUR; // 18 hours

export const SpreadsheetPlanBuilder: React.FC<Props> = ({
  students,
  tasks,
  selectedStudentId,
  onSelectStudentId,
  onRefreshData,
  theme = 'dark',
}) => {
  // Navigation: Week offset from current week (0 = this week, -1 = last week, +1 = next week)
  const [weekOffset, setWeekOffsetState] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = window.sessionStorage.getItem('hadafeto:planner-week-offset');
    return saved !== null ? Number(saved) : 0;
  });

  const setWeekOffset = (val: number | ((prev: number) => number)) => {
    setWeekOffsetState((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('hadafeto:planner-week-offset', String(next));
      }
      return next;
    });
  };

  // Zoom Level
  const [zoomLevel, setZoomLevelState] = useState<ZoomLevel>(() => {
    if (typeof window === 'undefined') return 'normal';
    return (window.sessionStorage.getItem('hadafeto:planner-zoom-level') as ZoomLevel) || 'normal';
  });

  const setZoomLevel = (val: ZoomLevel) => {
    setZoomLevelState(val);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:planner-zoom-level', val);
    }
  };

  // Filter by activity type

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showCopyDayModal, setShowCopyDayModal] = useState<boolean>(false);

  // Selected or Editing Task
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null);

  // Create Form State
  const [formDate, setFormDate] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('08:00');
  const [formDuration, setFormDuration] = useState<number>(75);
  const [formCourseName, setFormCourseName] = useState<string>('');
  const [formActivityType, setFormActivityType] = useState<ActivityType>('مطالعه');
  const [formTestMode, setFormTestMode] = useState<TestMode>('ندارد');
  const [formMinTests, setFormMinTests] = useState<number>(30);
  const [formIsRest, setFormIsRest] = useState<boolean>(false);

  // Copy Day State
  const [copySourceDate, setCopySourceDate] = useState<string>('');
  const [copyTargetDate, setCopyTargetDate] = useState<string>('');

  // Loading / Feedback message
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showNotice = (text: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Compute current week days (Saturday to Friday)
  const weekDays = useMemo<PersianWeekDay[]>(() => {
    return getPersianWeekDays(new Date(), weekOffset);
  }, [weekOffset]);

  // Selected Student
  const currentStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  // Tasks for the selected student
  const studentTasks = useMemo(() => {
    if (!currentStudent) return [];
    return tasks.filter((t) => t.studentId === currentStudent.id);
  }, [tasks, currentStudent]);

  // Tasks mapped by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, PlanTask[]>();
    weekDays.forEach((day) => {
      const dayTasks = studentTasks
        .filter((t) => t.date === day.isoDate)
        .slice()
        .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
      map.set(day.isoDate, dayTasks);
    });
    return map;
  }, [weekDays, studentTasks]);

  const authHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
  });

  // Weekly Stats
  const weekStats = useMemo(() => {
    let totalMinutes = 0;
    let totalTests = 0;
    let totalParts = 0;
    let completedParts = 0;

    weekDays.forEach((d) => {
      const dayTasks = tasksByDate.get(d.isoDate) || [];
      dayTasks.forEach((t) => {
        totalParts++;
        totalMinutes += t.durationMinutes || 0;
        if (t.testMode !== 'ندارد') {
          totalTests += t.minTests || 0;
        }
        if (t.isCompleted) {
          completedParts++;
        }
      });
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return {
      totalHours: hours,
      totalMinutes: mins,
      totalParts,
      totalTests,
      completedParts,
      completionRate: totalParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0,
    };
  }, [weekDays, tasksByDate]);

  // Pixel width per hour based on zoom
  const hourWidth = useMemo(() => {
    switch (zoomLevel) {
      case 'compact':
        return 72; // ~1300px total
      case 'normal':
        return 110; // ~1980px total
      case 'spacious':
        return 160; // ~2880px total
    }
  }, [zoomLevel]);

  const totalGridWidth = hourWidth * TOTAL_HOURS;

  // Hours array [6, 7, 8, ..., 23]
  const hoursList = useMemo(() => {
    const arr: number[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  // Calculated End Time for Create Form
  const calculatedEndTime = useMemo(() => {
    return calculateEndTime(formStartTime, formDuration);
  }, [formStartTime, formDuration]);

  // Open modal to create a part for a specific day and hour
  const handleCellClick = (date: string, hour: number, minute: number = 0) => {
    const hStr = String(hour).padStart(2, '0');
    const mStr = String(minute).padStart(2, '0');
    setFormDate(date);
    setFormStartTime(`${hStr}:${mStr}`);
    setFormDuration(75);
    setFormCourseName('');
    setFormActivityType('مطالعه');
    setFormTestMode('ندارد');
    setFormMinTests(30);
    setFormIsRest(false);
    setShowCreateModal(true);
  };

  // Open modal to edit existing part
  const handleTaskClick = (e: React.MouseEvent, task: PlanTask) => {
    e.stopPropagation();
    setEditingTask(task);
    setFormDate(task.date);
    setFormStartTime(task.startTime || '08:00');
    setFormDuration(task.durationMinutes || 60);
    setFormCourseName(task.courseName);
    setFormActivityType(task.activityType);
    setFormTestMode(task.testMode);
    setFormMinTests(task.minTests || 0);
    setFormIsRest(!!task.isRest);
    setShowEditModal(true);
  };

  // Handle Save New Task
  const handleSaveNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !formCourseName.trim() || !formDate) return;

    setIsSubmitting(true);
    try {
      const payload = {
        studentId: currentStudent.id,
        date: formDate,
        courseName: formCourseName.trim(),
        activityType: formIsRest ? 'مرور' : formActivityType,
        testMode: formIsRest ? 'ندارد' : formTestMode,
        minTests: formIsRest || formTestMode === 'ندارد' ? 0 : formMinTests,
        durationMinutes: formDuration,
        startTime: formStartTime,
        endTime: calculatedEndTime,
        isRest: formIsRest,
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('خطا در ذخیره پارت');

      soundManager.playSessionStart();
      showNotice('پارت جدید با موفقیت به برنامه اضافه شد.');
      setShowCreateModal(false);
      await onRefreshData();
    } catch {
      showNotice('خطا در ارتباط با سرور', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Existing Task
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !formCourseName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        date: formDate,
        courseName: formCourseName.trim(),
        activityType: formIsRest ? 'مرور' : formActivityType,
        testMode: formIsRest ? 'ندارد' : formTestMode,
        minTests: formIsRest || formTestMode === 'ندارد' ? 0 : formMinTests,
        durationMinutes: formDuration,
        startTime: formStartTime,
        endTime: calculateEndTime(formStartTime, formDuration),
        isRest: formIsRest,
      };

      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('خطا در به‌روزرسانی پارت');

      showNotice('تغییرات پارت با موفقیت ذخیره شد.');
      setShowEditModal(false);
      setEditingTask(null);
      await onRefreshData();
    } catch {
      showNotice('خطا در ویرایش پارت', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('آیا از حذف این پارت مطالعه اطمینان دارید؟')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('خطا در حذف پارت');

      showNotice('پارت مورد نظر حذف شد.');
      setShowEditModal(false);
      setEditingTask(null);
      await onRefreshData();
    } catch {
      showNotice('خطا در حذف پارت', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Copy Day Schedule
  const handleCopyDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent || !copySourceDate || !copyTargetDate) return;
    if (copySourceDate === copyTargetDate) {
      alert('روز مبدأ و روز مقصد نمی‌توانند یکسان باشند.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks/copy-day', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          studentId: currentStudent.id,
          sourceDate: copySourceDate,
          targetDate: copyTargetDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'خطا در کپی برنامه');
      }

      const data = await res.json();
      showNotice(`${toPersianDigits(data.count)} پارت با موفقیت کپی شدند.`);
      setShowCopyDayModal(false);
      await onRefreshData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطا در کپی روز';
      showNotice(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Clear Day Schedule
  const handleClearDay = async (date: string, dayName: string) => {
    if (!currentStudent) return;
    if (!confirm(`آیا مطمئن هستید که می‌خواهید تمام پارت‌های روز «${dayName}» را حذف کنید؟`)) return;

    try {
      const res = await fetch('/api/tasks/clear-day', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          studentId: currentStudent.id,
          date,
        }),
      });

      if (res.ok) {
        showNotice(`برنامه روز ${dayName} با موفقیت خالی شد.`);
        await onRefreshData();
      }
    } catch {
      showNotice('خطا در خالی کردن برنامه', 'error');
    }
  };

  // Export to CSV for Excel with Persian UTF-8 BOM
  const handleExportCSV = () => {
    if (!currentStudent) return;
    let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Persian compatibility
    csvContent += 'روز,تاریخ,ساعت شروع,ساعت پایان,مدت (دقیقه),درس و مبحث,نوع فعالیت,نوع تست,حداقل تست,استراحت,وضعیت\n';

    weekDays.forEach((day) => {
      const dayTasks = tasksByDate.get(day.isoDate) || [];
      dayTasks.forEach((t) => {
        const row = [
          `"${day.dayName}"`,
          `"${day.jalaliFormatted}"`,
          `"${t.startTime || '-'}"`,
          `"${t.endTime || '-'}"`,
          `"${t.durationMinutes}"`,
          `"${t.courseName.replace(/"/g, '""')}"`,
          `"${t.activityType}"`,
          `"${t.testMode}"`,
          `"${t.minTests || 0}"`,
          `"${t.isRest ? 'بله' : 'خیر'}"`,
          `"${t.isCompleted ? 'تکمیل شده' : 'در انتظار'}"`,
        ].join(',');
        csvContent += row + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `برنامه_هفتگی_${currentStudent.fullName.replace(/\s+/g, '_')}_${weekDays[0].jalaliFormatted.replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice('فایل اکسل (CSV) با موفقیت دانلود شد.');
  };

  // Helper to get color theme for activity types
  const getActivityBadgeStyle = (task: PlanTask) => {
    if (task.isRest) {
      return {
        bg: 'bg-sky-500/20 border-sky-400/40 text-sky-200',
        bar: 'bg-sky-400',
        badge: 'bg-sky-950/80 text-sky-300 border-sky-500/30',
      };
    }
    switch (task.activityType) {
      case 'مطالعه':
        return {
          bg: 'bg-purple-600/20 border-purple-500/40 text-purple-100',
          bar: 'bg-purple-500',
          badge: 'bg-purple-950/80 text-purple-300 border-purple-500/30',
        };
      case 'تست':
        return {
          bg: 'bg-amber-600/20 border-amber-500/40 text-amber-100',
          bar: 'bg-amber-500',
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/30',
        };
      case 'مرور':
        return {
          bg: 'bg-teal-600/20 border-teal-500/40 text-teal-100',
          bar: 'bg-teal-500',
          badge: 'bg-teal-950/80 text-teal-300 border-teal-500/30',
        };
      case 'جمع‌بندی':
        return {
          bg: 'bg-emerald-600/20 border-emerald-500/40 text-emerald-100',
          bar: 'bg-emerald-500',
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30',
        };
      case 'ویدئو':
        return {
          bg: 'bg-indigo-600/20 border-indigo-500/40 text-indigo-100',
          bar: 'bg-indigo-500',
          badge: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30',
        };
      case 'آزمون':
        return {
          bg: 'bg-rose-600/20 border-rose-500/40 text-rose-100',
          bar: 'bg-rose-500',
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/30',
        };
      default:
        return {
          bg: 'bg-slate-700/40 border-slate-600 text-slate-200',
          bar: 'bg-slate-400',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between border shadow-lg backdrop-blur-xl animate-in fade-in duration-200 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
              : 'bg-rose-950/80 text-rose-200 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice.text}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Toolbar Controls */}
      <div
        className={`p-5 rounded-3xl border transition-all ${
          theme === 'dark'
            ? 'bg-slate-900/85 border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.36)]'
            : 'bg-white/90 border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
        } backdrop-blur-2xl space-y-4`}
      >
        {/* Row 1: Student Switcher & Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider">
                  طراحی تقویمی برنامه تحصیلی
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                  Excel Spreadsheet View
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>برنامه‌ریزی مشاور به سبک تقویم اکسل</span>
              </h2>
            </div>
          </div>

          {/* Student Selector Dropdown */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <label className="text-xs text-slate-400 font-medium">دانش‌آموز فعال:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => onSelectStudentId(e.target.value)}
              className="py-2 px-3.5 rounded-xl bg-slate-800/90 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none transition-all cursor-pointer min-w-[200px]"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.major} · {s.grade})
                </option>
              ))}
            </select>

            {currentStudent && (
              <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
                {toPersianDigits(currentStudent.focusPoints)} FP
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Week Navigation, Zoom, Presets, Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/5 flex-wrap">
          {/* Week Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="هفته قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setWeekOffset(0)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                weekOffset === 0
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              هفته جاری
            </button>

            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="هفته بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <div className="flex items-center gap-1.5 px-2 text-xs text-purple-200 font-medium">
              <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
              <span>
                {weekDays[0].jalaliFormatted} تا {weekDays[6].jalaliFormatted}
              </span>
            </div>
          </div>

          {/* Zoom and Actions Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-white/10 text-xs text-slate-400">
              <button
                onClick={() => setZoomLevel('compact')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  zoomLevel === 'compact'
                    ? 'bg-purple-600/80 text-white font-bold'
                    : 'hover:text-white'
                }`}
                title="نمای فشرده (مشاهده تمام ساعات بدون اسکرول افقی)"
              >
                فشرده
              </button>
              <button
                onClick={() => setZoomLevel('normal')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  zoomLevel === 'normal'
                    ? 'bg-purple-600/80 text-white font-bold'
                    : 'hover:text-white'
                }`}
                title="نمای استاندارد"
              >
                استاندارد
              </button>
              <button
                onClick={() => setZoomLevel('spacious')}
                className={`px-2.5 py-1 rounded-xl transition-all ${
                  zoomLevel === 'spacious'
                    ? 'bg-purple-600/80 text-white font-bold'
                    : 'hover:text-white'
                }`}
                title="نمای عریض (جزئیات کامل)"
              >
                عریض
              </button>
            </div>

            {/* Copy Day Modal Button */}
            <button
              onClick={() => {
                setCopySourceDate(weekDays[0].isoDate);
                setCopyTargetDate(weekDays[1].isoDate);
                setShowCopyDayModal(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="کپی برنامه یک روز به روز دیگر"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>کپی روز</span>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="py-1.5 px-3 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 border border-white/10 hover:border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="خروجی فایل اکسل (CSV) با پشتیبانی کامل از حروف فارسی"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>خروجی اکسل</span>
            </button>

            {/* New Part Button */}
            <button
              onClick={() => {
                setFormDate(weekDays[0].isoDate);
                setFormStartTime('08:00');
                setFormDuration(75);
                setFormCourseName('');
                setFormActivityType('مطالعه');
                setFormTestMode('ندارد');
                setFormMinTests(30);
                setFormIsRest(false);
                setShowCreateModal(true);
              }}
              className="py-1.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4" />
              <span>+ پارت جدید</span>
            </button>
          </div>
        </div>

        {/* Row 3: Weekly KPI Quick Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">مجموع مطالعه این هفته</div>
              <div className="font-bold text-slate-100 font-mono">
                {toPersianDigits(weekStats.totalHours)} ساعت
                {weekStats.totalMinutes > 0 && ` و ${toPersianDigits(weekStats.totalMinutes)} دقیقه`}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">تعداد کل پارت‌ها</div>
              <div className="font-bold text-slate-100 font-mono">
                {toPersianDigits(weekStats.totalParts)} پارت
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">مجموع تست‌های الزامی</div>
              <div className="font-bold text-slate-100 font-mono">
                {toPersianDigits(weekStats.totalTests)} تست
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400">پیشرفت انجام برنامه</div>
              <div className="font-bold text-emerald-400 font-mono">
                {toPersianDigits(weekStats.completedParts)} از {toPersianDigits(weekStats.totalParts)} ({toPersianDigits(weekStats.completionRate)}٪)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spreadsheet / Excel Calendar Grid Container */}
      <div
        className={`rounded-3xl border overflow-hidden transition-all shadow-2xl ${
          theme === 'dark'
            ? 'bg-slate-900/90 border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200 shadow-[0_16px_48px_rgba(0,0,0,0.08)]'
        }`}
      >
        {/* Scrollable Viewport: Vertical & Horizontal scroll with RTL */}
        <div
          dir="rtl"
          className="overflow-x-auto overflow-y-auto max-h-[750px] relative select-none scrollbar-thin scrollbar-thumb-purple-600/40 scrollbar-track-slate-950/40"
        >
          <div
            style={{ width: `${totalGridWidth + 200}px` }}
            className="min-w-full flex flex-col"
          >
            {/* Header Row: Hours (Sticky Top) */}
            <div className="sticky top-0 z-30 flex items-stretch border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
              {/* Corner Cell: Sticky Right in RTL */}
              <div className="sticky right-0 z-40 w-[200px] shrink-0 p-3 bg-slate-950/95 border-l border-white/10 flex items-center justify-between text-xs font-bold text-purple-300">
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-purple-400" />
                  <span>روز / ساعت</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">RTL</span>
              </div>

              {/* Hour Columns Headers */}
              <div className="flex flex-1 relative" style={{ width: `${totalGridWidth}px` }}>
                {hoursList.map((hour) => {
                  const hourLabel = `${String(hour).padStart(2, '0')}:00`;
                  return (
                    <div
                      key={hour}
                      style={{ width: `${hourWidth}px` }}
                      className="shrink-0 border-l border-white/5 py-2.5 px-1.5 text-center flex flex-col items-center justify-center group"
                    >
                      <span className="font-mono text-xs font-bold text-slate-300 group-hover:text-purple-300 transition-colors">
                        {toPersianDigits(hourLabel)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day Rows (7 days from Saturday to Friday) */}
            <div className="divide-y divide-white/5">
              {weekDays.map((day) => {
                const dayTasks = tasksByDate.get(day.isoDate) || [];
                const dayTotalMinutes = dayTasks.reduce(
                  (acc, t) => acc + (t.durationMinutes || 0),
                  0
                );
                const dayHours = Math.floor(dayTotalMinutes / 60);
                const dayMins = dayTotalMinutes % 60;

                return (
                  <div
                    key={day.isoDate}
                    className={`flex items-stretch min-h-[92px] group/row transition-colors ${
                      day.isToday ? 'bg-purple-950/20' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Day Column (Sticky Right in RTL) */}
                    <div className="sticky right-0 z-20 w-[200px] shrink-0 p-3 bg-slate-950/90 group-hover/row:bg-slate-950 border-l border-white/10 flex flex-col justify-between transition-colors shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                            <span>{day.dayName}</span>
                            {day.isToday && (
                              <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white font-mono text-[9px] font-bold animate-pulse">
                                امروز
                              </span>
                            )}
                          </span>

                          {/* Quick Add Button */}
                          <button
                            onClick={() => handleCellClick(day.isoDate, 8, 0)}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all opacity-0 group-hover/row:opacity-100"
                            title={`افزودن پارت به ${day.dayName}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-[11px] text-purple-300/80 font-medium mt-0.5">
                          {day.jalaliFormatted}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                        <span className="font-mono">
                          {toPersianDigits(dayTasks.length)} پارت
                        </span>
                        <span className="font-mono text-purple-300">
                          {toPersianDigits(dayHours)}س {dayMins > 0 ? `${toPersianDigits(dayMins)}د` : ''}
                        </span>
                        {dayTasks.length > 0 && (
                          <button
                            onClick={() => handleClearDay(day.isoDate, day.dayName)}
                            className="text-slate-500 hover:text-rose-400 transition-colors"
                            title="خالی کردن پارت‌های این روز"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Canvas & Cells for this day */}
                    <div
                      className="relative flex-1 flex"
                      style={{ width: `${totalGridWidth}px` }}
                    >
                      {/* Background Grid Cells for clicking & visual guidelines */}
                      <div className="absolute inset-0 flex pointer-events-auto">
                        {hoursList.map((hour) => (
                          <div
                            key={hour}
                            style={{ width: `${hourWidth}px` }}
                            className="shrink-0 border-l border-white/5 relative h-full group/cell hover:bg-purple-600/5 transition-colors cursor-pointer flex"
                            onClick={() => handleCellClick(day.isoDate, hour, 0)}
                            title={`کلیک برای ایجاد پارت در ساعت ${hour}:00`}
                          >
                            {/* Half-hour guide line */}
                            <div className="absolute inset-y-0 right-1/2 w-px border-r border-dashed border-white/5 pointer-events-none" />

                            {/* Ghost "+ ایجاد پارت" indicator on hover */}
                            <div className="hidden group-hover/cell:flex items-center justify-center w-full h-full text-[10px] text-purple-400/60 font-mono">
                              + {hour}:00
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Rendered Study Tasks Placed Accurately in Time */}
                      <div className="absolute inset-0 pointer-events-none p-1">
                        {dayTasks.map((task, idx) => {
                          // Parse task start time
                          let startMinutesFromGridStart = 0;
                          if (task.startTime) {
                            const [hStr, mStr] = task.startTime.split(':');
                            const h = parseInt(hStr, 10) || START_HOUR;
                            const m = parseInt(mStr, 10) || 0;
                            const totalStartMinutes = h * 60 + m;
                            startMinutesFromGridStart = Math.max(
                              0,
                              totalStartMinutes - START_HOUR * 60
                            );
                          } else {
                            // If no start time, position sequentially starting at 08:00
                            startMinutesFromGridStart = (2 + idx * 1.5) * 60;
                          }

                          const durationMins = task.durationMinutes || 60;
                          const pixelsPerMinute = hourWidth / 60;
                          const rightOffset = startMinutesFromGridStart * pixelsPerMinute;
                          const taskWidth = Math.max(48, durationMins * pixelsPerMinute - 4);

                          const style = getActivityBadgeStyle(task);

                          return (
                            <div
                              key={task.id}
                              style={{
                                right: `${rightOffset}px`,
                                width: `${taskWidth}px`,
                              }}
                              onClick={(e) => handleTaskClick(e, task)}
                              className={`absolute top-1.5 bottom-1.5 rounded-2xl border ${style.bg} pointer-events-auto cursor-pointer p-2 flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-200 hover:scale-[1.02] hover:z-30 hover:shadow-purple-500/30 group/card`}
                              title={`${task.courseName} (${task.activityType}) · ${task.startTime || '۰۸:۰۰'} تا ${task.endTime || ''}`}
                            >
                              {/* Top Bar: Activity Badge & Times */}
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.bar}`}
                                  />
                                  <span className="font-mono text-[10px] font-bold text-slate-200 truncate">
                                    {toPersianDigits(task.startTime || '—')}
                                    {task.endTime && ` - ${toPersianDigits(task.endTime)}`}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  {task.isCompleted && (
                                    <span className="p-0.5 rounded-full bg-emerald-500 text-slate-950">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                  {task.isRest ? (
                                    <Coffee className="w-3 h-3 text-sky-400" />
                                  ) : null}
                                </div>
                              </div>

                              {/* Center: Course Name & Topic */}
                              <div className="font-bold text-xs text-white truncate my-0.5 group-hover/card:text-purple-200 transition-colors">
                                {task.courseName}
                              </div>

                              {/* Bottom: Activity Type & Tests */}
                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded-md border text-[9px] font-medium ${style.badge}`}>
                                  {task.isRest ? 'استراحت' : task.activityType}
                                </span>

                                <span className="font-mono text-slate-300">
                                  {toPersianDigits(task.durationMinutes)}د
                                  {task.testMode !== 'ندارد' && ` · ${toPersianDigits(task.minTests)}ت`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create New Part */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            dir="rtl"
            className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    تعریف پارت جدید در برنامه
                  </h3>
                  <p className="text-xs text-purple-300">
                    دانش‌آموز: {currentStudent?.fullName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewTask} className="space-y-4 text-xs">
              {/* Date & Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">تاریخ پارت:</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ساعت شروع:</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Duration and Auto End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">مدت مطالعه (دقیقه):</label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value, 10) || 60)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-center focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ساعت پایان (محاسبه خودکار):</label>
                  <div className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-purple-300 font-mono text-center font-bold">
                    {toPersianDigits(calculatedEndTime)}
                  </div>
                </div>
              </div>

              {/* Quick Duration Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">میانبرهای مدت:</span>
                {[45, 60, 75, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setFormDuration(mins)}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono transition-colors ${
                      formDuration === mins
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-800 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {toPersianDigits(mins)}د
                  </button>
                ))}
              </div>

              {/* Course Name Free Text */}
              <div>
                <label className="block text-slate-400 mb-1">
                  نام درس و مبحث (متن آزاد تعیین‌شده توسط مشاور):
                </label>
                <input
                  type="text"
                  value={formCourseName}
                  onChange={(e) => setFormCourseName(e.target.value)}
                  placeholder="مثال: زیست‌شناسی ۳ - فصل ۵ گفتار ۱ (تنفس نوری)"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white placeholder:text-slate-500 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Common Course Name Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">پیشنهاد سریع:</span>
                {COMMON_SUBJECT_PRESETS.slice(0, 6).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setFormCourseName((prev) => (prev ? `${sub} - ${prev}` : `${sub} - `))}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-white/5 transition-colors"
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* Is Rest Toggle */}
              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="formIsRest"
                  checked={formIsRest}
                  onChange={(e) => setFormIsRest(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-slate-800"
                />
                <label htmlFor="formIsRest" className="text-slate-200 cursor-pointer flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-sky-400" />
                  <span>این پارت به عنوان استراحت / هوازی / تنفس برنامه‌ریزی شود</span>
                </label>
              </div>

              {!formIsRest && (
                <>
                  {/* Activity Type */}
                  <div>
                    <label className="block text-slate-400 mb-1">نوع فعالیت:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {(['مطالعه', 'تست', 'مرور', 'جمع‌بندی', 'ویدئو', 'آزمون'] as ActivityType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormActivityType(type)}
                          className={`py-1.5 rounded-xl border text-center transition-all ${
                            formActivityType === type
                              ? 'bg-purple-600 border-purple-500 text-white font-bold'
                              : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Test Mode */}
                  <div>
                    <label className="block text-slate-400 mb-1">بخش تستی:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormTestMode('ندارد')}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          formTestMode === 'ندارد'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-800 border-white/5 text-slate-400'
                        }`}
                      >
                        ندارد
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormTestMode('آموزشی')}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          formTestMode === 'آموزشی'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-800 border-white/5 text-slate-400'
                        }`}
                      >
                        آموزشی
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormTestMode('آزمونی')}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          formTestMode === 'آزمونی'
                            ? 'bg-amber-600/30 border-amber-500 text-amber-200 font-bold'
                            : 'bg-slate-800 border-white/5 text-slate-400'
                        }`}
                      >
                        آزمونی (زمان‌دار)
                      </button>
                    </div>
                  </div>

                  {/* Min Tests */}
                  {formTestMode !== 'ندارد' && (
                    <div>
                      <label className="block text-slate-400 mb-1">
                        تعداد حداقل تست الزامی:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formMinTests}
                        onChange={(e) => setFormMinTests(parseInt(e.target.value, 10) || 0)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-center focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت پارت در تقویم</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit / Delete Existing Part */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            dir="rtl"
            className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-300 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    ویرایش یا حذف پارت مطالعه
                  </h3>
                  <p className="text-xs text-purple-300">
                    شناسه: {editingTask.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} className="space-y-4 text-xs">
              {/* Date & Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">تاریخ پارت:</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ساعت شروع:</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Duration and End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">مدت مطالعه (دقیقه):</label>
                  <input
                    type="number"
                    min="15"
                    step="5"
                    value={formDuration}
                    onChange={(e) => setFormDuration(parseInt(e.target.value, 10) || 60)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-center focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ساعت پایان (محاسبه خودکار):</label>
                  <div className="w-full p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-purple-300 font-mono text-center font-bold">
                    {toPersianDigits(calculatedEndTime)}
                  </div>
                </div>
              </div>

              {/* Course Name */}
              <div>
                <label className="block text-slate-400 mb-1">نام درس و مبحث:</label>
                <input
                  type="text"
                  value={formCourseName}
                  onChange={(e) => setFormCourseName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>

              {/* Is Rest Toggle */}
              <div className="flex items-center gap-2 pt-1 pb-1">
                <input
                  type="checkbox"
                  id="editIsRest"
                  checked={formIsRest}
                  onChange={(e) => setFormIsRest(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-slate-800"
                />
                <label htmlFor="editIsRest" className="text-slate-200 cursor-pointer flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-sky-400" />
                  <span>پارت استراحت / تنفس</span>
                </label>
              </div>

              {!formIsRest && (
                <>
                  {/* Activity Type */}
                  <div>
                    <label className="block text-slate-400 mb-1">نوع فعالیت:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {(['مطالعه', 'تست', 'مرور', 'جمع‌بندی', 'ویدئو', 'آزمون'] as ActivityType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormActivityType(type)}
                          className={`py-1.5 rounded-xl border text-center transition-all ${
                            formActivityType === type
                              ? 'bg-purple-600 border-purple-500 text-white font-bold'
                              : 'bg-slate-800 border-white/5 text-slate-400 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Test Mode */}
                  <div>
                    <label className="block text-slate-400 mb-1">بخش تستی:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormTestMode('ندارد')}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          formTestMode === 'ندارد'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-800 border-white/5 text-slate-400'
                        }`}
                      >
                        ندارد
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormTestMode('آموزشی')}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          formTestMode === 'آموزشی'
                            ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                            : 'bg-slate-800 border-white/5 text-slate-400'
                        }`}
                      >
                        آموزشی
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormTestMode('آزمونی')}
                        className={`py-2 rounded-xl border text-center transition-all ${
                          formTestMode === 'آزمونی'
                            ? 'bg-amber-600/30 border-amber-500 text-amber-200 font-bold'
                            : 'bg-slate-800 border-white/5 text-slate-400'
                        }`}
                      >
                        آزمونی (زمان‌دار)
                      </button>
                    </div>
                  </div>

                  {/* Min Tests */}
                  {formTestMode !== 'ندارد' && (
                    <div>
                      <label className="block text-slate-400 mb-1">
                        تعداد حداقل تست الزامی:
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formMinTests}
                        onChange={(e) => setFormMinTests(parseInt(e.target.value, 10) || 0)}
                        className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-center focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id)}
                  disabled={isSubmitting}
                  className="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف پارت</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  انصراف
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره تغییرات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Copy Day Schedule to Another Day */}
      {showCopyDayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            dir="rtl"
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-300 flex items-center justify-center">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    کپی برنامه روزانه به روز دیگر
                  </h3>
                  <p className="text-xs text-slate-400">
                    تکرار سریع پارت‌های مطالعه برای روزهای هفته
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCopyDayModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCopyDay} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">روز مبدأ (برنامه فعلی):</label>
                <select
                  value={copySourceDate}
                  onChange={(e) => setCopySourceDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                >
                  {weekDays.map((d) => {
                    const count = (tasksByDate.get(d.isoDate) || []).length;
                    return (
                      <option key={d.isoDate} value={d.isoDate}>
                        {d.dayName} ({d.jalaliFormatted}) — {toPersianDigits(count)} پارت
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-center text-slate-500 py-1">
                <ArrowRight className="w-5 h-5 rotate-90 sm:rotate-0" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">روز مقصد (اعمال کپی روی آن):</label>
                <select
                  value={copyTargetDate}
                  onChange={(e) => setCopyTargetDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                >
                  {weekDays.map((d) => (
                    <option key={d.isoDate} value={d.isoDate}>
                      {d.dayName} ({d.jalaliFormatted})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-purple-300 text-[11px]">
                پارت‌های روز مبدأ با همان ساعت‌ها، مدت و مشخصات روی روز مقصد کپی خواهند شد.
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCopyDayModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  <span>انجام کپی برنامه</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
