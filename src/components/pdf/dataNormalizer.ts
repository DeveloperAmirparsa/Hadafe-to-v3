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

  // 2. Reports matching tasks or date
  const dayTaskIds = new Set(dayTasks.map((t) => t.id));
  const dayReports = allReports.filter(
    (r) =>
      r.studentId === student.id &&
      (dayTaskIds.has(r.taskId) || r.date === date)
  );

  const reportsByTaskId: Record<string, SessionReport> = {};
  dayReports.forEach((r) => {
    if (r.taskId) reportsByTaskId[r.taskId] = r;
  });

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
    totalTestsCount += r.testsCount || 0;
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

/**
 * DEVELOPMENT-ONLY Stress-Test Generator
 * Generates 30+ tasks, long Persian notes, and diverse test results
 * strictly for verifying multi-page pagination stability and layout overflows.
 */
export function createStressTestDailyReportData(
  student: Student,
  date: string
): DailyReportData {
  const jalali = formatIsoToJalaliDetails(date);

  const sampleSubjects = [
    'زیست‌شناسی ۳ - فصل ژنتیک و پروتئین‌سازی',
    'شیمی دوازدهم - تعادل‌های شیمیایی و اسید و باز',
    'فیزیک جامع - حرکت‌شناسی و دینامیک نیوتنی',
    'ریاضیات تجربی - کاربرد مشتق و حد و پیوستگی',
    'زمین‌شناسی - منابع آب و توسعه پایدار',
    'ادبیات و علوم انسانی - آرایه‌های ادبی و قرابت معنایی',
    'عربی تخصصی - ساختار فعل مجهول و ترکیب جملات',
    'زبان انگلیسی - ریدینگ مفهومی و کلوزتست جامع',
  ];

  const tasks: PlanTask[] = [];
  const reports: SessionReport[] = [];
  const reportsByTaskId: Record<string, SessionReport> = {};

  for (let i = 1; i <= 32; i++) {
    const taskId = `stress_task_${i}`;
    const subject = sampleSubjects[(i - 1) % sampleSubjects.length];
    const isCompleted = i % 4 !== 0; // 75% completed
    const hasReport = isCompleted;
    const duration = 45 + ((i * 15) % 60);

    const task: PlanTask = {
      id: taskId,
      studentId: student.id,
      date,
      courseName: `${subject} (پارت شماره ${toPersianDigits(i)})`,
      activityType: i % 3 === 0 ? 'تست' : i % 3 === 1 ? 'مطالعه' : 'مرور',
      testMode: i % 2 === 0 ? 'آزمونی' : 'آموزشی',
      minTests: i % 2 === 0 ? 30 : 0,
      durationMinutes: duration,
      actualDurationMinutes: isCompleted ? duration : 0,
      startTime: `${String(6 + Math.floor(i / 3)).padStart(2, '0')}:00`,
      endTime: `${String(7 + Math.floor(i / 3)).padStart(2, '0')}:15`,
      order: i,
      status: isCompleted ? 'COMPLETED' : 'MISSED',
      isCompleted,
    };
    tasks.push(task);

    if (hasReport) {
      const tests = 25 + (i % 20);
      const wrong = (i % 4) + 1;
      const blank = (i % 3);
      const correct = Math.max(0, tests - wrong - blank);
      const pct = computeTestScorePercentage(correct, wrong, tests);

      const report: SessionReport = {
        id: `stress_rep_${i}`,
        studentId: student.id,
        taskId,
        date,
        courseName: task.courseName,
        isCompleted: true,
        satisfaction: ((i % 5) + 1),
        focus: Math.min(5, (i % 4) + 2),
        difficulty: ((i % 4) + 1),
        testsCount: tests,
        testResult: {
          total: tests,
          correct,
          wrong,
          unanswered: blank,
          percentage: pct,
        },
        reflectionNote: i % 2 === 0
          ? `یادداشت تحلیلی پارت ${toPersianDigits(i)}: تسلط مفهومی روی فرمول‌ها و نکات کلیدی تثبیت شد. در تست‌های زمان‌دار دوم، سرعت پاسخ‌دهی به مراتب ارتقا یافت.`
          : `نکات ترکیبی مبحث ثبت شد. تست‌های شماره ۱ تا ۱۵ بدون غلط حل شدند اما تست‌های چندگزینه‌ای انتهای پارت نیاز به دور دوم مرور دارند.`,
        focusPointsEarned: 25,
        createdAt: new Date().toISOString(),
      };
      reports.push(report);
      reportsByTaskId[taskId] = report;
    }
  }

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const missedTasks = tasks.filter((t) => !t.isCompleted);
  const plannedStudyMinutes = tasks.reduce((acc, t) => acc + t.durationMinutes, 0);
  const actualStudyMinutes = completedTasks.reduce((acc, t) => acc + (t.actualDurationMinutes || t.durationMinutes), 0);

  return {
    student: {
      ...student,
      fullName: student.fullName || 'آرین محمدی (آزمون استرس پجینیشن)',
    },
    date,
    jalaliFormatted: jalali.jalaliFormatted,
    dayOfWeekName: jalali.dayName,
    fullJalaliDate: jalali.fullDate,
    fileDateString: `stress-test-${jalali.fileDateString}`,
    tasks,
    completedTasks,
    missedTasks,
    sessionReports: reports,
    reportsByTaskId,
    plannedStudyMinutes,
    actualStudyMinutes,
    dailyGoalMinutes: 480,
    dailyGoalProgressPct: 100,
    planCompletionRate: Math.round((completedTasks.length / tasks.length) * 100),
    totalTestsCount: reports.reduce((acc, r) => acc + r.testsCount, 0),
    totalCorrectTests: reports.reduce((acc, r) => acc + (r.testResult?.correct || 0), 0),
    totalWrongTests: reports.reduce((acc, r) => acc + (r.testResult?.wrong || 0), 0),
    totalBlankTests: reports.reduce((acc, r) => acc + (r.testResult?.unanswered || 0), 0),
    averageTestPercentage: 78,
    averageFocus: 4.2,
    averageSatisfaction: 4.1,
    averageDifficulty: 3.2,
    habits: [
      { id: 'h1', title: 'بیداری ساعت ۰۶:۰۰ صبح', category: 'روتین', completed: true },
      { id: 'h2', title: 'ورزش و تحرک هوازی', category: 'سلامت', completed: true },
      { id: 'h3', title: 'تغذیه سالم و مصرف آب کافی', category: 'سلامت', completed: true },
      { id: 'h4', title: 'مرور خلاصه نویسی شبانه', category: 'مطالعه', completed: false },
    ],
    completedHabitsCount: 3,
    totalHabitsCount: 4,
    focusPointsEarned: 580,
    totalFocusPoints: 2100,
    streak: 35,
    goals: student.goals || [],
    notes: reports.map((r) => r.reflectionNote).filter(Boolean),
    strengths: [
      'حجم فوق‌العاده مطالعه روزانه و ثبت بیش از ۳۰ پارت کامل در سامانه',
      'دستیابی به تراز و میانگین درصد ۷۸٪ در پارت‌های آزمونی',
      'شاخص استمرار بالای ۳۵ روز و نظم پولادین در آزمون',
    ],
    areasForAttention: [
      'تعدادی از پارت‌ها به علت فشردگی بیش از حد تایم‌لاین از دست رفته‌اند',
      'مدیریت زمان استراحت بین جلسات برای حفظ شادابی ذهنی',
    ],
  };
}
