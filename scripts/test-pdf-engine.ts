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

console.log('\n--- ALL PDF ENGINE TESTS PASSED SUCCESSFULLY! ---');
