/**
 * Data Normalizer for Daily PDF Report Engine
 * Produces a single, validated DailyReportData object strictly from real application data.
 */
import {
  Student,
  PlanTask,
  SessionReport,
  Habit,
  HabitLog,
  FocusPointTransaction,
} from '../../types/index.js';
import { formatIsoToJalaliDetails, toPersianDigits } from '../../utils/persianDate.js';
import { DailyReportData, HabitItem } from './types.js';

export function computeTestScorePercentage(correct: number, wrong: number, total: number): number {
  if (total <= 0) return 0;
  const raw = ((correct - wrong / 3) / total) * 100;
  return Math.round(Math.max(-33.33, Math.min(100, raw)) * 10) / 10;
}

export function normalizeDailyReportData(
  student: Student,
  date: string,
  allTasks: PlanTask[],
  allReports: SessionReport[],
  allHabits: Habit[] = [],
  allHabitLogs: HabitLog[] = [],
  allTransactions: FocusPointTransaction[] = []
): DailyReportData {
  const jalali = formatIsoToJalaliDetails(date);

  // 1. Tasks for selected student and date
  const dayTasks = allTasks
    .filter((t) => t.studentId === student.id && t.date === date)
    .slice()
    .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));

  // 2. Reports matching tasks or date (strictly indexed by taskId)
  const reportsByTaskId: Record<string, SessionReport> = {};

  // Strictly index student's reports by taskId
  const studentReports = allReports.filter(
    (r) => r && (!r.studentId || r.studentId === student.id)
  );

  // Sort by createdAt ascending so latest report takes precedence
  const sortedReports = [...studentReports].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  sortedReports.forEach((r) => {
    if (r.taskId) {
      reportsByTaskId[r.taskId] = r;
    }
  });

  // Support tasks referencing sessionReportId
  dayTasks.forEach((t) => {
    if (t.sessionReportId && !reportsByTaskId[t.id]) {
      const matched = sortedReports.find((r) => r.id === t.sessionReportId);
      if (matched) {
        reportsByTaskId[t.id] = matched;
      }
    }
  });

  // Reports strictly associated with this day's tasks
  const matchedTaskReports = dayTasks
    .map((t) => reportsByTaskId[t.id])
    .filter((r): r is SessionReport => Boolean(r));

  // Include any other student reports specifically for this date
  const otherDateReports = sortedReports.filter(
    (r) => r.date === date && !matchedTaskReports.some((m) => m.id === r.id)
  );

  const dayReports = [...matchedTaskReports, ...otherDateReports];

  // 3. Task completion states
  const completedTasks = dayTasks.filter((t) => t.isCompleted);
  const missedTasks = dayTasks.filter(
    (t) => !t.isCompleted && t.status === 'MISSED'
  );

  // 4. Study times
  const plannedStudyMinutes = dayTasks.reduce(
    (acc, t) => acc + (t.durationMinutes || 0),
    0
  );
  const actualStudyMinutes = dayTasks.reduce((acc, t) => {
    if (t.isCompleted) {
      return acc + (t.actualDurationMinutes || t.durationMinutes || 0);
    }
    return acc;
  }, 0);

  const dailyGoalMinutes = student.dailyStudyGoalMinutes || 0;
  const dailyGoalProgressPct =
    dailyGoalMinutes > 0
      ? Math.min(100, Math.round((actualStudyMinutes / dailyGoalMinutes) * 100))
      : null;

  const planCompletionRate =
    dayTasks.length > 0
      ? Math.round((completedTasks.length / dayTasks.length) * 100)
      : 0;

  // 5. Test results aggregation
  let totalTestsCount = 0;
  let totalCorrectTests = 0;
  let totalWrongTests = 0;
  let totalBlankTests = 0;
  const testPercentages: number[] = [];

  dayReports.forEach((r) => {
    const count = typeof r.testResult?.total === 'number'
      ? r.testResult.total
      : typeof r.testsCount === 'number'
      ? r.testsCount
      : 0;
    totalTestsCount += count;
    if (r.testResult) {
      const { correct = 0, wrong = 0, unanswered = 0, percentage } = r.testResult;
      totalCorrectTests += correct;
      totalWrongTests += wrong;
      totalBlankTests += unanswered;
      if (typeof percentage === 'number') {
        testPercentages.push(percentage);
      } else if (r.testResult.total > 0) {
        testPercentages.push(computeTestScorePercentage(correct, wrong, r.testResult.total));
      }
    }
  });

  const averageTestPercentage =
    testPercentages.length > 0
      ? Math.round(
          testPercentages.reduce((a, b) => a + b, 0) / testPercentages.length
        )
      : null;

  // 6. Focus, Satisfaction, Difficulty
  const validFocusReports = dayReports.filter(
    (r) => typeof r.focus === 'number' && r.focus > 0
  );
  const averageFocus =
    validFocusReports.length > 0
      ? Math.round(
          (validFocusReports.reduce((a, r) => a + r.focus, 0) /
            validFocusReports.length) *
            10
        ) / 10
      : null;

  const validSatReports = dayReports.filter(
    (r) => typeof r.satisfaction === 'number' && r.satisfaction > 0
  );
  const averageSatisfaction =
    validSatReports.length > 0
      ? Math.round(
          (validSatReports.reduce((a, r) => a + r.satisfaction, 0) /
            validSatReports.length) *
            10
        ) / 10
      : null;

  const validDiffReports = dayReports.filter(
    (r) => typeof r.difficulty === 'number' && r.difficulty > 0
  );
  const averageDifficulty =
    validDiffReports.length > 0
      ? Math.round(
          (validDiffReports.reduce((a, r) => a + r.difficulty, 0) /
            validDiffReports.length) *
            10
        ) / 10
      : null;

  // 7. Habits
  const studentDayLogs = allHabitLogs.filter(
    (l) => l.studentId === student.id && l.date === date
  );
  const logsByHabitId = new Map(studentDayLogs.map((l) => [l.habitId, l]));

  const activeHabits = allHabits.filter((h) => h.active);
  const habitsList: HabitItem[] = activeHabits.map((h) => {
    const log = logsByHabitId.get(h.id);
    return {
      id: h.id,
      title: h.title,
      category: h.category,
      completed: Boolean(log?.completed),
    };
  });

  const completedHabitsCount = habitsList.filter((h) => h.completed).length;

  // 8. Focus Points earned on this date
  const dayTx = allTransactions.filter(
    (tx) => tx.studentId === student.id && tx.createdAt?.startsWith(date)
  );
  let focusPointsEarned = dayTx.reduce((acc, tx) => acc + (tx.amount || 0), 0);
  if (focusPointsEarned === 0) {
    // If no transactions tracked, sum focus points reported directly on reports
    focusPointsEarned = dayReports.reduce(
      (acc, r) => acc + (r.focusPointsEarned || 0),
      0
    );
  }

  // 9. Notes from session reports
  const notes = dayReports
    .map((r) => r.reflectionNote?.trim())
    .filter((n): n is string => Boolean(n && n.length > 0));

  // 10. Goals
  const goals = student.goals || [];

  // 11. Strengths (Algorithmically derived from real data ONLY)
  const strengths: string[] = [];
  if (planCompletionRate === 100 && dayTasks.length > 0) {
    strengths.push('تکمیل ۱۰۰٪ کلیه پارت‌های برنامه‌ریزی‌شده روزانه بدون اتلاف وقت');
  } else if (planCompletionRate >= 80 && dayTasks.length > 0) {
    strengths.push(`نرخ تکمیل بالای برنامه درسی (${toPersianDigits(planCompletionRate)}٪)`);
  }

  if (actualStudyMinutes > 0 && dailyGoalMinutes > 0 && actualStudyMinutes >= dailyGoalMinutes) {
    strengths.push(`تحقق کامل هدف کمی مطالعه روزانه (${toPersianDigits(Math.round(actualStudyMinutes / 60))} ساعت مطالعه خالص)`);
  }

  if (averageTestPercentage !== null && averageTestPercentage >= 75) {
    strengths.push(`عملکرد تست‌زنی درخشان با میانگین تراز و درصد ${toPersianDigits(averageTestPercentage)}٪`);
  }

  if (averageFocus !== null && averageFocus >= 4.0) {
    strengths.push(`شاخص تمرکز عمیق بالا (میانگین ${toPersianDigits(averageFocus)} از ۵) در طول جلسات`);
  }

  if (student.streak >= 7) {
    strengths.push(`حفظ ریتم استمرار بی‌وقفه به مدت ${toPersianDigits(student.streak)} روز متوالی`);
  }

  if (habitsList.length > 0 && completedHabitsCount === habitsList.length) {
    strengths.push('انجام تمامی عادات و روتین‌های روزانه برنامه‌ریزی‌شده');
  }

  // 12. Areas For Attention (Derived from real facts only)
  const areasForAttention: string[] = [];
  if (missedTasks.length > 0) {
    areasForAttention.push(`${toPersianDigits(missedTasks.length)} پارت از برنامه‌ریزی روزانه به وضعیت ناتمام/از دست رفته درآمده است`);
  }

  if (averageTestPercentage !== null && averageTestPercentage < 50) {
    areasForAttention.push(`میانگین درصد پاسخگویی تست‌ها (${toPersianDigits(averageTestPercentage)}٪) نیازمند بازبینی و تحلیل آزمون است`);
  }

  if (totalWrongTests > 0 && totalTestsCount > 0 && (totalWrongTests / totalTestsCount) > 0.3) {
    const wrongPct = Math.round((totalWrongTests / totalTestsCount) * 100);
    areasForAttention.push(`نسبت تست‌های نادرست بالاست (${toPersianDigits(wrongPct)}٪)؛ نیاز به مدیریت نمره منفی و شک‌دارها`);
  }

  if (actualStudyMinutes > 0 && dailyGoalMinutes > 0 && actualStudyMinutes < dailyGoalMinutes * 0.7) {
    areasForAttention.push(`ساعت مطالعه تحقق‌یافته کمتر از هدف تعیین‌شده مشاور است (${toPersianDigits(Math.round(actualStudyMinutes / 60))} ساعت از ${toPersianDigits(Math.round(dailyGoalMinutes / 60))} ساعت)`);
  }

  if (averageFocus !== null && averageFocus < 3.0) {
    areasForAttention.push(`شاخص تمرکز جلسات در سطح متوسط به پایین ارزیابی شده است (${toPersianDigits(averageFocus)} از ۵)`);
  }

  return {
    student,
    date,
    jalaliFormatted: jalali.jalaliFormatted,
    dayOfWeekName: jalali.dayName,
    fullJalaliDate: jalali.fullDate,
    fileDateString: jalali.fileDateString,
    tasks: dayTasks,
    completedTasks,
    missedTasks,
    sessionReports: dayReports,
    reportsByTaskId,
    plannedStudyMinutes,
    actualStudyMinutes,
    dailyGoalMinutes,
    dailyGoalProgressPct,
    planCompletionRate,
    totalTestsCount,
    totalCorrectTests,
    totalWrongTests,
    totalBlankTests,
    averageTestPercentage,
    averageFocus,
    averageSatisfaction,
    averageDifficulty,
    habits: habitsList,
    completedHabitsCount,
    totalHabitsCount: habitsList.length,
    focusPointsEarned,
    totalFocusPoints: student.focusPoints || 0,
    streak: student.streak || 0,
    goals,
    notes,
    strengths,
    areasForAttention,
  };
}

