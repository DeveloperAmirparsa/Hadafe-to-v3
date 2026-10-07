export type ActivityType = 
  | 'مطالعه'
  | 'تست'
  | 'مرور'
  | 'جمع‌بندی'
  | 'ویدئو'
  | 'آزمون';

export type TestMode = 'آموزشی' | 'آزمونی' | 'ندارد';

export type TaskStatus = 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export type GoalType = 'مطالعه' | 'تست' | 'رتبه' | 'تراز' | 'دلخواه';

export interface StudentGoal {
  id: string;
  title: string;
  description?: string;
  targetType?: GoalType;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  startDate?: string;
  endDate?: string;
  isPrimary?: boolean;
  targetRank?: string;
  targetUniversity?: string;
  isPublic: boolean;
  createdAt?: string;
}

export interface Student {
  id: string;
  username: string;
  /** @deprecated Legacy plaintext field; server migrates and removes it at startup. */
  password?: string;
  passwordHash?: string;
  fullName: string;
  nickname: string;
  motto: string;
  grade: 'دهم' | 'یازدهم' | 'دوازدهم' | 'فارغ‌التحصیل';
  major: 'علوم تجربی' | 'ریاضی فیزیک' | 'علوم انسانی' | 'هنر و منحصراً زبان';
  goals: StudentGoal[];
  phone: string; // Private
  city: string; // Private
  counselorNotes: string; // Private
  avatarUrl?: string;
  focusPoints: number;
  streak: number;
  equippedTitle?: string;
  equippedBadges?: string[];
  dailyStudyGoalMinutes?: number; // هدف مطالعه روزانه بر حسب دقیقه (کاملاً داینامیک)
  weeklyStudyGoalMinutes?: number; // هدف مطالعه هفتگی بر حسب دقیقه
  deleted_at?: string; // Soft delete support
  createdAt: string;
}

export interface PlanTask {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  courseName: string; // Free text entered by counselor
  activityType: ActivityType;
  testMode: TestMode;
  minTests: number;
  durationMinutes: number;
  actualDurationMinutes?: number;
  startTime?: string; // HH:mm مثلاً 08:00
  endTime?: string; // HH:mm مثلاً 09:15
  order: number;
  status?: TaskStatus;
  isRest?: boolean;
  isCompleted?: boolean;
  completedAt?: string;
  sessionReportId?: string;
}

export interface Plan {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  counselorNote?: string;
  createdAt: string;
}

export interface TestResultData {
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percentage: number;
}

export interface SessionReport {
  id: string;
  studentId: string;
  taskId: string;
  date: string;
  courseName: string;
  isCompleted: boolean;
  satisfaction: number; // 1-5
  focus: number; // 1-5
  difficulty: number; // 1-5
  testsCount: number;
  testResult?: TestResultData;
  reflectionNote: string;
  focusPointsEarned: number;
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  category: 'روتین' | 'سلامت' | 'تمرکز' | 'مطالعه';
  active: boolean;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  studentId: string;
  date: string;
  completed: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string; // زمان دقیق ثبت تیک توسط دانش‌آموز
  reviewedAt?: string;
}

export type FPTransactionType = 
  | 'TEST'
  | 'PART'
  | 'HABIT'
  | 'REPORT'
  | 'COUNSELOR_BONUS'
  | 'COUNSELOR_PENALTY'
  | 'REWARD_PURCHASE';

export interface FocusPointTransaction {
  id: string;
  studentId: string;
  amount: number; // can be negative for penalty/purchase
  type: FPTransactionType;
  description: string;
  actor: 'SYSTEM' | 'COUNSELOR' | 'STUDENT';
  createdAt: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  active: boolean;
  isFreeConsultingMonth?: boolean;
  badgeType?: string;
  createdAt: string;
}

export interface StudentRewardClaim {
  id: string;
  studentId: string;
  rewardId: string;
  costPaid: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  claimedAt: string; // زمان دقیق درخواست جایزه
  reviewedAt?: string;
}

export interface DiagnosticWeights {
  studyHours: number;
  tests: number;
  planCompletion: number;
  streak: number;
  habits: number;
  focus: number;
}

export interface SystemSettings {
  testPercentageFormula: string; // e.g. "((correct - wrong / 3) / total) * 100"
  diagnosticWeights: DiagnosticWeights;
  konkurDate: string; // تاریخ و زمان برگزاری کنکور سراسری
}

export interface TournamentLeaderboardItem {
  studentId: string;
  fullName: string;
  nickname: string;
  motto: string;
  grade: string;
  major: string;
  publicGoals: string[];
  weeklyStudyMinutes: number;
  weeklyTestsCount: number;
  streak: number;
  rank: number;
  equippedTitle?: string;
  equippedBadges?: string[];
}

export type RarityType = 'معمولی' | 'کمیاب' | 'حماسی' | 'افسانه‌ای' | 'اسطوره‌ای';

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  rarity: RarityType;
  icon: string;
  isCounselorOnly?: boolean;
  createdAt: string;
}

export interface TitleItem {
  id: string;
  title: string;
  description: string;
  rarity: RarityType;
  cost: number;
  createdAt: string;
}

export interface StoreProduct {
  id: string;
  title: string;
  description: string;
  cost: number;
  rarity: RarityType;
  category: 'BADGE' | 'TITLE' | 'CONSUMABLE' | 'SPECIAL';
  icon: string;
  isConsumable: boolean;
  isFreeConsultingMonth?: boolean;
  badgeId?: string;
  titleId?: string;
  active: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  studentId: string;
  productId: string;
  itemType: 'BADGE' | 'TITLE' | 'CONSUMABLE';
  title: string;
  description: string;
  rarity: RarityType;
  icon: string;
  isEquipped: boolean;
  isConsumed: boolean;
  badgeId?: string;
  titleId?: string;
  acquiredAt: string;
}

export type AchievementCode = 
  | 'TOURNAMENT_CHAMPION'
  | '100_HOURS'
  | '100_PARTS'
  | '30_DAY_STREAK'
  | '1000_TESTS';

export interface AchievementItem {
  id: string;
  code: AchievementCode;
  title: string;
  description: string;
  badgeId: string;
  targetProgress: number;
  currentProgress: number;
  isUnlocked: boolean;
  isClaimed: boolean;
  claimedAt?: string;
}

export interface StudyHallPresence {
  studentId: string;
  nickname: string;
  equippedTitle?: string;
  equippedBadges?: string[];
  currentTaskTitle: string;
  major: string;
  grade: string;
  streak: number;
  startedAt: number; // Unix timestamp ms
  liveMinutes: number;
  lastHeartbeat: number;
}

export interface CounselorBadgeGrant {
  id: string;
  studentId: string;
  badgeId: string;
  badgeName: string;
  counselorUsername: string;
  reason: string;
  grantedAt: string;
}

export interface UserSessionRecord {
  token: string;
  role: 'COUNSELOR' | 'STUDENT';
  studentId?: string;
  userId: string;
  username: string;
  fullName: string;
  createdAt: number;
  expiresAt: number;
}

export interface UserSession {
  role: 'COUNSELOR' | 'STUDENT';
  student?: Student;
}
