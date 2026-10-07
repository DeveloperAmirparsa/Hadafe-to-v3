import React, { useState, useMemo } from 'react';
import { Student, StudentGoal, GoalType, SessionReport, PlanTask } from '../types/index.js';
import { toPersianDigits, formatPersianPercentage } from '../utils/persianDate.js';
import {
  X,
  User,
  Target,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Sparkles,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  Award,
  BookOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  tasks?: PlanTask[];
  reports?: SessionReport[];
  onUpdateGoals: (updatedGoals: StudentGoal[]) => Promise<void>;
  theme?: 'dark' | 'light';
}

export const StudentProfileModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  tasks = [],
  reports = [],
  onUpdateGoals,
  theme = 'dark',
}) => {
  const [goals, setGoals] = useState<StudentGoal[]>(student.goals || []);

  // Modal states for Goal Edit, Add, and Delete
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Form states
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('مطالعه');
  const [goalTargetValue, setGoalTargetValue] = useState<string>('100');
  const [goalUnit, setGoalUnit] = useState<string>('ساعت');
  const [goalIsPrimary, setGoalIsPrimary] = useState<boolean>(false);
  const [goalIsPublic, setGoalIsPublic] = useState<boolean>(true);
  const [goalRank, setGoalRank] = useState<string>('');
  const [goalUniversity, setGoalUniversity] = useState<string>('');

  // Delete Confirmation state
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  // Loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if student goals change externally
  React.useEffect(() => {
    setGoals(student.goals || []);
  }, [student.goals]);

  if (!isOpen) return null;

  // Compute Real Progress for each goal
  const totalActualStudyHours = Math.round(
    tasks
      .filter((t) => t.isCompleted)
      .reduce((acc, t) => acc + (t.actualDurationMinutes || t.durationMinutes || 0), 0) / 60
  );

  const totalActualTests = reports.reduce((acc, r) => acc + (r.testsCount || 0), 0);

  const computeGoalProgress = (g: StudentGoal) => {
    if (!g.targetValue || g.targetValue <= 0) return null;
    let current = 0;
    if (g.targetType === 'مطالعه') {
      current = totalActualStudyHours;
    } else if (g.targetType === 'تست') {
      current = totalActualTests;
    } else {
      current = g.currentValue || 0;
    }

    const pct = Math.min(100, Math.round((current / g.targetValue) * 100));
    return { current, target: g.targetValue, pct };
  };

  const handleOpenAddGoal = () => {
    setEditingGoalId(null);
    setGoalTitle('');
    setGoalDesc('');
    setGoalType('مطالعه');
    setGoalTargetValue('100');
    setGoalUnit('ساعت');
    setGoalIsPrimary(false);
    setGoalIsPublic(true);
    setGoalRank('');
    setGoalUniversity('');
    setIsEditingGoal(true);
  };

  const handleOpenEditGoal = (g: StudentGoal) => {
    setEditingGoalId(g.id);
    setGoalTitle(g.title);
    setGoalDesc(g.description || '');
    setGoalType(g.targetType || 'دلخواه');
    setGoalTargetValue(g.targetValue ? String(g.targetValue) : '');
    setGoalUnit(g.unit || '');
    setGoalIsPrimary(!!g.isPrimary);
    setGoalIsPublic(g.isPublic !== false);
    setGoalRank(g.targetRank || '');
    setGoalUniversity(g.targetUniversity || '');
    setIsEditingGoal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedVal = parseFloat(goalTargetValue) || undefined;
      let updatedList: StudentGoal[];

      if (editingGoalId) {
        // Edit existing
        updatedList = goals.map((g) =>
          g.id === editingGoalId
            ? {
                ...g,
                title: goalTitle.trim(),
                description: goalDesc.trim(),
                targetType: goalType,
                targetValue: parsedVal,
                unit: goalUnit.trim(),
                isPrimary: goalIsPrimary,
                isPublic: goalIsPublic,
                targetRank: goalRank.trim(),
                targetUniversity: goalUniversity.trim(),
              }
            : g
        );
      } else {
        // Add new
        const newG: StudentGoal = {
          id: `g_${Date.now()}`,
          title: goalTitle.trim(),
          description: goalDesc.trim(),
          targetType: goalType,
          targetValue: parsedVal,
          unit: goalUnit.trim(),
          isPrimary: goalIsPrimary,
          isPublic: goalIsPublic,
          targetRank: goalRank.trim(),
          targetUniversity: goalUniversity.trim(),
          createdAt: new Date().toISOString(),
        };
        updatedList = [...goals, newG];
      }

      setGoals(updatedList);
      await onUpdateGoals(updatedList);
      setIsEditingGoal(false);
      setEditingGoalId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingGoalId) return;

    setIsSubmitting(true);
    try {
      const updatedList = goals.filter((g) => g.id !== deletingGoalId);
      setGoals(updatedList);
      await onUpdateGoals(updatedList);
      setDeletingGoalId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGoalVisibility = async (goalId: string) => {
    const updatedList = goals.map((g) =>
      g.id === goalId ? { ...g, isPublic: !g.isPublic } : g
    );
    setGoals(updatedList);
    await onUpdateGoals(updatedList);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        dir="rtl"
        className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs shadow-2xl max-h-[90vh] overflow-y-auto space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center font-bold text-white shadow-md shadow-purple-600/30 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{student.fullName}</h2>
                {student.equippedTitle && (
                  <span className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-500/25 to-indigo-500/25 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                    «{student.equippedTitle}»
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {student.grade} · رشته {student.major} · نام کاربری: {student.username}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Equipped Badges Showcase */}
        {student.equippedBadges && student.equippedBadges.length > 0 && (
          <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20">
            <span className="text-[10px] text-purple-400 font-bold block mb-1.5">نشان‌های افتخار فعال:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {student.equippedBadges.map((badgeName) => (
                <div
                  key={badgeName}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-bold shadow-sm"
                >
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>{badgeName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motto Display */}
        {student.motto && (
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 text-purple-300 italic">
            «{student.motto}»
          </div>
        )}

        {/* Goals Management Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
              <Target className="w-4 h-4 text-purple-400" />
              <span>اهداف و آرمان‌های تحصیلی</span>
            </h3>
            <button
              onClick={handleOpenAddGoal}
              className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-purple-600/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ تعریف هدف جدید</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-300/90 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span>
              اهدافی که علامت «عمومی» دارند در جدول رده‌بندی تورنمنت نمایش داده می‌شوند. اهداف «خصوصی» فقط برای شما و مشاور قابل مشاهده هستند.
            </span>
          </div>

          {/* Goals List or Clean Empty State */}
          {goals.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-slate-400 space-y-2">
              <Target className="w-8 h-8 mx-auto text-slate-600" />
              <div className="font-bold text-slate-300">هنوز هدفی ثبت نشده است.</div>
              <p className="text-[11px] text-slate-500">
                با کلیک روی «+ تعریف هدف جدید» هدف‌های درسی، ساعت مطالعه و رتبه کنکور خود را تعیین کنید.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {goals.map((g) => {
                const progress = computeGoalProgress(g);

                return (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-white/5 space-y-2 transition-all hover:border-purple-500/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-100 text-sm">{g.title}</span>
                          {g.isPrimary && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                              هدف اصلی
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[10px]">
                            {g.targetType || 'دلخواه'}
                          </span>
                        </div>

                        {g.description && (
                          <p className="text-[11px] text-slate-400">{g.description}</p>
                        )}

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                          {g.targetRank && <span>رتبه هدف: {toPersianDigits(g.targetRank)}</span>}
                          {g.targetUniversity && <span>· دانشگاه: {g.targetUniversity}</span>}
                        </div>
                      </div>

                      {/* Action Buttons: Visibility, Edit, Delete */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleGoalVisibility(g.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition-all ${
                            g.isPublic
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900 border-white/10 text-slate-400'
                          }`}
                          title={g.isPublic ? 'عمومی (نمایش در تورنمنت)' : 'خصوصی (فقط مشاور)'}
                        >
                          {g.isPublic ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>عمومی</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>خصوصی</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEditGoal(g)}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-purple-600/30 text-slate-300 hover:text-purple-200 transition-colors"
                          title="ویرایش هدف"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingGoalId(g.id)}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 transition-colors"
                          title="حذف هدف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Real Progress Bar if numerical target exists */}
                    {progress && (
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-slate-400">پیشرفت تحقق هدف:</span>
                          <span className="font-bold text-purple-300">
                            {toPersianDigits(progress.current)} از {toPersianDigits(progress.target)} {g.unit || ''} ({toPersianDigits(progress.pct)}٪)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            style={{ width: `${progress.pct}%` }}
                            className="h-full bg-gradient-to-r from-purple-600 to-emerald-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Add or Edit Goal Form */}
        {isEditingGoal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl space-y-4 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h4 className="font-bold text-slate-100 text-sm">
                  {editingGoalId ? 'ویرایش هدف تحصیلی' : 'تعریف هدف جدید'}
                </h4>
                <button
                  onClick={() => setIsEditingGoal(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-3.5">
                <div>
                  <label className="block text-slate-400 mb-1">عنوان هدف:</label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="مثال: ۳۰۰ ساعت مطالعه در ماه یا رتبه زیر ۱۰۰"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">نوع هدف:</label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="مطالعه">ساعت مطالعه (محاسبه خودکار از پارت‌ها)</option>
                    <option value="تست">تعداد تست (محاسبه خودکار از گزارش‌ها)</option>
                    <option value="رتبه">رتبه کنکور سراسری</option>
                    <option value="تراز">تراز آزمون آزمایشی</option>
                    <option value="دلخواه">هدف اختصاصی / کیفی</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1">مقدار هدف عددی:</label>
                    <input
                      type="number"
                      value={goalTargetValue}
                      onChange={(e) => setGoalTargetValue(e.target.value)}
                      placeholder="مثلاً: 300"
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-center focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">واحد اندازه‌گیری:</label>
                    <input
                      type="text"
                      value={goalUnit}
                      onChange={(e) => setGoalUnit(e.target.value)}
                      placeholder="ساعت، تست، تراز..."
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-center focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1">رتبه هدف (اختیاری):</label>
                    <input
                      type="text"
                      value={goalRank}
                      onChange={(e) => setGoalRank(e.target.value)}
                      placeholder="مثال: ۵۰ منطقه یک"
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">دانشگاه هدف (اختیاری):</label>
                    <input
                      type="text"
                      value={goalUniversity}
                      onChange={(e) => setGoalUniversity(e.target.value)}
                      placeholder="دانشگاه تهران، شریف..."
                      className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">توضیحات تکمیلی:</label>
                  <textarea
                    value={goalDesc}
                    onChange={(e) => setGoalDesc(e.target.value)}
                    rows={2}
                    placeholder="جزئیات و دلایل این هدف..."
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-white focus:border-purple-500 focus:outline-none text-[11px]"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={goalIsPrimary}
                      onChange={(e) => setGoalIsPrimary(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-slate-800"
                    />
                    <span>علامت‌گذاری به عنوان هدف اصلی</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={goalIsPublic}
                      onChange={(e) => setGoalIsPublic(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 bg-slate-800"
                    />
                    <span>نمایش عمومی در تورنمنت</span>
                  </label>
                </div>

                <div className="flex items-center gap-2.5 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditingGoal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30 disabled:opacity-50"
                  >
                    {editingGoalId ? 'ذخیره ویرایش' : 'افزودن هدف'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation Modal */}
        {deletingGoalId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
              dir="rtl"
              className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-rose-500/40 shadow-2xl space-y-4 text-xs text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-100">آیا از حذف این هدف مطمئن هستید؟</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  این هدف از حساب شما حذف شده و دیگر در داشبورد یا رده‌بندی تورنمنت نمایش داده نخواهد شد.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingGoalId(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  لغو
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/30 disabled:opacity-50"
                >
                  حذف قطعی
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
        >
          بستن پنجره پروفایل
        </button>
      </div>
    </div>
  );
};
