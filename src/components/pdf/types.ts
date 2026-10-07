/**
 * PDF Engine Types & Data Model
 */
import { Student, PlanTask, SessionReport, StudentGoal } from '../../types/index.js';

export interface HabitItem {
  id: string;
  title: string;
  category: string;
  completed: boolean;
}

export interface DailyReportData {
  student: Student;
  date: string; // ISO format: YYYY-MM-DD
  jalaliFormatted: string; // e.g. "۱۶ مهر ۱۴۰۵"
  dayOfWeekName: string; // e.g. "شنبه"
  fullJalaliDate: string; // e.g. "شنبه، ۱۶ مهر ۱۴۰۵"
  fileDateString: string; // e.g. "1405-07-16"

  // Tasks & Reports
  tasks: PlanTask[];
  completedTasks: PlanTask[];
  missedTasks: PlanTask[];
  sessionReports: SessionReport[];
  reportsByTaskId: Record<string, SessionReport>;

  // Metrics
  plannedStudyMinutes: number;
  actualStudyMinutes: number;
  dailyGoalMinutes: number;
  dailyGoalProgressPct: number | null;
  planCompletionRate: number; // 0 to 100 percentage

  // Tests
  totalTestsCount: number;
  totalCorrectTests: number;
  totalWrongTests: number;
  totalBlankTests: number;
  averageTestPercentage: number | null;

  // Behavior & Quality
  averageFocus: number | null; // 1 to 5
  averageSatisfaction: number | null; // 1 to 5
  averageDifficulty: number | null; // 1 to 5

  // Habits
  habits: HabitItem[];
  completedHabitsCount: number;
  totalHabitsCount: number;

  // Gamification & Progress
  focusPointsEarned: number;
  totalFocusPoints: number;
  streak: number;

  // Goals & Notes
  goals: StudentGoal[];
  notes: string[];

  // Algorithmic Insights (Real data only)
  strengths: string[];
  areasForAttention: string[];
}

export interface PaginationResult {
  pages: PdfPageContent[];
  totalPages: number;
}

export type PageSectionType =
  | 'OVERVIEW_HEADER'
  | 'KPI_GRID'
  | 'PROGRESS_RINGS'
  | 'HABITS_AND_GOALS'
  | 'TIMELINE_OVERVIEW'
  | 'TASK_CARD_LIST'
  | 'INSIGHTS_SECTION'
  | 'FINAL_SUMMARY';

export interface PdfPageContent {
  pageNumber: number;
  pageTitle?: string;
  sections: {
    type: PageSectionType;
    tasks?: PlanTask[]; // For TASK_CARD_LIST
  }[];
}
