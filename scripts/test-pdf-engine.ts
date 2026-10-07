/**
 * Automated Verification Script for Hadafeto Daily PDF Engine
 */
import { normalizeDailyReportData } from '../src/components/pdf/dataNormalizer.js';
import { computePagination } from '../src/components/pdf/paginationEngine.js';
import { Student, PlanTask, SessionReport } from '../src/types/index.js';

const mockStudent: Student = {
  id: 'student_test',
  username: 'test_user',
  fullName: 'آرین محمدی',
  nickname: 'آرین',
  motto: 'پزشکی دانشگاه تهران؛ هر روز، یک قدم نزدیک‌تر.',
  grade: 'دوازدهم',
  major: 'علوم تجربی',
  goals: [
    { id: 'g1', title: 'رتبه زیر ۱۰۰ منطقه یک', isPublic: true },
    { id: 'g2', title: 'درصد زیست‌شناسی بالای ۸۵٪', isPublic: true },
  ],
  phone: '۰۹۱۲۳۴۵۶۷۸۹',
  city: 'تهران',
  counselorNotes: 'دانش‌آموز منظم و کوشا',
  focusPoints: 1250,
  streak: 24,
  dailyStudyGoalMinutes: 480,
  weeklyStudyGoalMinutes: 3000,
  createdAt: '2026-08-01T08:00:00.000Z',
};

console.log('--- TEST 1: Empty Date (Zero Tasks) ---');
const emptyData = normalizeDailyReportData(mockStudent, '2026-10-07', [], []);
const emptyPagination = computePagination(emptyData);
console.log(`Page count for 0 tasks: ${emptyPagination.totalPages}`);
if (emptyPagination.totalPages !== 1) throw new Error('Expected 1 page for 0 tasks');
console.log('✅ Test 1 Passed');

console.log('\n--- TEST 2: Real Day with 5 Tasks and Reports ---');
const sampleTasks: PlanTask[] = [
  { id: 't1', studentId: mockStudent.id, date: '2026-10-07', courseName: 'زیست‌شناسی ۳', activityType: 'مطالعه', testMode: 'ندارد', minTests: 0, durationMinutes: 90, actualDurationMinutes: 90, order: 1, isCompleted: true },
  { id: 't2', studentId: mockStudent.id, date: '2026-10-07', courseName: 'شیمی دوازدهم', activityType: 'تست', testMode: 'آموزشی', minTests: 30, durationMinutes: 75, actualDurationMinutes: 75, order: 2, isCompleted: true },
  { id: 't3', studentId: mockStudent.id, date: '2026-10-07', courseName: 'فیزیک جامع', activityType: 'مطالعه', testMode: 'ندارد', minTests: 0, durationMinutes: 60, actualDurationMinutes: 60, order: 3, isCompleted: true },
  { id: 't4', studentId: mockStudent.id, date: '2026-10-07', courseName: 'ریاضی تجربی', activityType: 'تست', testMode: 'آزمونی', minTests: 25, durationMinutes: 60, actualDurationMinutes: 60, order: 4, isCompleted: true },
  { id: 't5', studentId: mockStudent.id, date: '2026-10-07', courseName: 'ادبیات فارسی', activityType: 'مرور', testMode: 'ندارد', minTests: 0, durationMinutes: 45, actualDurationMinutes: 0, order: 5, isCompleted: false, status: 'MISSED' },
];

const sampleReports: SessionReport[] = [
  { id: 'r1', studentId: mockStudent.id, taskId: 't1', date: '2026-10-07', courseName: 'زیست‌شناسی ۳', isCompleted: true, satisfaction: 5, focus: 4, difficulty: 3, testsCount: 0, reflectionNote: 'مبحث ژنتیک با دقت مطالعه شد.', focusPointsEarned: 20, createdAt: '2026-10-07T08:00:00Z' },
  { id: 'r2', studentId: mockStudent.id, taskId: 't2', date: '2026-10-07', courseName: 'شیمی دوازدهم', isCompleted: true, satisfaction: 4, focus: 5, difficulty: 4, testsCount: 30, testResult: { total: 30, correct: 25, wrong: 3, unanswered: 2, percentage: 80 }, reflectionNote: 'تست‌های محاسباتی غلظت عالی پیش رفت.', focusPointsEarned: 30, createdAt: '2026-10-07T10:00:00Z' },
  { id: 'r4', studentId: mockStudent.id, taskId: 't4', date: '2026-10-07', courseName: 'ریاضی تجربی', isCompleted: true, satisfaction: 4, focus: 4, difficulty: 3, testsCount: 25, testResult: { total: 25, correct: 20, wrong: 3, unanswered: 2, percentage: 76 }, reflectionNote: 'تست‌های زمان‌دار هندسه حل شد.', focusPointsEarned: 25, createdAt: '2026-10-07T14:00:00Z' },
];

const normalData = normalizeDailyReportData(mockStudent, '2026-10-07', sampleTasks, sampleReports);
const normalPagination = computePagination(normalData);
console.log(`Page count for 5 tasks: ${normalPagination.totalPages}`);
console.log(`Plan completion rate: ${normalData.planCompletionRate}%`);
console.log(`Actual study minutes: ${normalData.actualStudyMinutes} mins`);
console.log(`Strengths count: ${normalData.strengths.length}`);
console.log(`Areas for attention count: ${normalData.areasForAttention.length}`);
if (normalPagination.totalPages < 2) throw new Error('Expected at least 2 pages for 5 detailed tasks');
console.log('✅ Test 2 Passed');

console.log('\n--- TEST 3: Dynamic Atomic Block Height Calculation & 10 Tasks Packing ---');
const tenTasks: PlanTask[] = Array.from({ length: 10 }, (_, i) => ({
  id: `task_${i + 1}`,
  studentId: mockStudent.id,
  date: '2026-10-07',
  courseName: `درس آزمایشی ${i + 1}`,
  activityType: i % 2 === 0 ? 'تست' : 'مطالعه',
  testMode: i % 3 === 0 ? 'آزمونی' : i % 2 === 0 ? 'آموزشی' : 'ندارد',
  minTests: i % 2 === 0 ? 25 : 0,
  durationMinutes: 60,
  actualDurationMinutes: 60,
  order: i + 1,
  isCompleted: true,
}));

const tenReports: SessionReport[] = tenTasks.map((t, i) => ({
  id: `rep_${t.id}`,
  studentId: mockStudent.id,
  taskId: t.id,
  date: '2026-10-07',
  courseName: t.courseName,
  isCompleted: true,
  satisfaction: 4,
  focus: 4,
  difficulty: 3,
  testsCount: t.minTests,
  testResult: t.testMode === 'آزمونی'
    ? { total: 25, correct: 20, wrong: 3, unanswered: 2, percentage: 76 }
    : undefined,
  reflectionNote: `یادداشت عملکرد پارت ${i + 1}`,
  focusPointsEarned: 15,
  createdAt: `2026-10-07T${10 + i}:00:00Z`,
}));

const tenData = normalizeDailyReportData(mockStudent, '2026-10-07', tenTasks, tenReports);
const tenPagination = computePagination(tenData);
console.log(`Page count for 10 tasks: ${tenPagination.totalPages}`);
// 10 tasks should fit smoothly across 2 or 3 pages without awkward 1-card spillover
tenPagination.pages.forEach((p) => {
  const taskCount = p.sections.find((s) => s.type === 'TASK_CARD_LIST')?.tasks?.length ?? 0;
  console.log(`Page ${p.pageNumber}: ${p.pageTitle} (${taskCount} tasks, sections: ${p.sections.map((s) => s.type).join(', ')})`);
});
if (tenPagination.totalPages > 3) throw new Error('10 tasks should not exceed 3 pages with dynamic height budget');
console.log('✅ Test 3 Passed');

console.log('\n--- TEST 4: Strict task.id Mapping & Test Reporting Integrity ---');
// Verify reports are mapped strictly by taskId
const testTasks: PlanTask[] = [
  { id: 'exam_task', studentId: mockStudent.id, date: '2026-10-07', courseName: 'آزمون شیمی', activityType: 'تست', testMode: 'آزمونی', minTests: 30, durationMinutes: 60, order: 1, isCompleted: true },
  { id: 'edu_task', studentId: mockStudent.id, date: '2026-10-07', courseName: 'تست آموزشی فیزیک', activityType: 'تست', testMode: 'آموزشی', minTests: 20, durationMinutes: 45, order: 2, isCompleted: true },
  { id: 'unreported_test_task', studentId: mockStudent.id, date: '2026-10-07', courseName: 'تست ثبت‌نشده', activityType: 'تست', testMode: 'آزمونی', minTests: 25, durationMinutes: 60, order: 3, isCompleted: false, status: 'MISSED' },
  { id: 'zero_test_task', studentId: mockStudent.id, date: '2026-10-07', courseName: 'پارت صفر تست', activityType: 'تست', testMode: 'آموزشی', minTests: 0, durationMinutes: 30, order: 4, isCompleted: true },
];

const testReports: SessionReport[] = [
  { id: 'rep_exam', studentId: mockStudent.id, taskId: 'exam_task', date: '2026-10-07', courseName: 'آزمون شیمی', isCompleted: true, satisfaction: 5, focus: 5, difficulty: 4, testsCount: 30, testResult: { total: 30, correct: 24, wrong: 3, unanswered: 3, percentage: 76.7 }, reflectionNote: '', focusPointsEarned: 20, createdAt: '2026-10-07T08:00:00Z' },
  { id: 'rep_edu', studentId: mockStudent.id, taskId: 'edu_task', date: '2026-10-07', courseName: 'تست آموزشی فیزیک', isCompleted: true, satisfaction: 4, focus: 4, difficulty: 3, testsCount: 20, reflectionNote: '', focusPointsEarned: 15, createdAt: '2026-10-07T10:00:00Z' },
  { id: 'rep_zero', studentId: mockStudent.id, taskId: 'zero_test_task', date: '2026-10-07', courseName: 'پارت صفر تست', isCompleted: true, satisfaction: 3, focus: 3, difficulty: 2, testsCount: 0, reflectionNote: '', focusPointsEarned: 5, createdAt: '2026-10-07T12:00:00Z' },
];

const testData = normalizeDailyReportData(mockStudent, '2026-10-07', testTasks, testReports);
// Check mapping strictly by taskId
if (!testData.reportsByTaskId['exam_task']) throw new Error('exam_task report missing');
if (!testData.reportsByTaskId['edu_task']) throw new Error('edu_task report missing');
if (testData.reportsByTaskId['unreported_test_task']) throw new Error('unreported_test_task should not have report');
if (!testData.reportsByTaskId['zero_test_task']) throw new Error('zero_test_task report missing');

// Verify zero test count is preserved as 0
if (testData.reportsByTaskId['zero_test_task'].testsCount !== 0) throw new Error('zero test count must be preserved as 0');

console.log('✅ Test 4 Passed');

console.log('\n--- ALL PDF ENGINE TESTS PASSED SUCCESSFULLY! ---');
