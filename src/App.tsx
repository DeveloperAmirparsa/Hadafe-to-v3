/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SlimSidebar } from './components/SlimSidebar.js';
import { DailyPlanView } from './components/DailyPlanView.js';
import { TimerView } from './components/TimerView.js';
import { HabitsView } from './components/HabitsView.js';
import { RewardsStoreView } from './components/RewardsStoreView.js';
import { StoreInventoryView } from './components/StoreInventoryView.js';
import { AchievementsView } from './components/AchievementsView.js';
import { StudyHallView } from './components/StudyHallView.js';
import { TournamentView } from './components/TournamentView.js';
import { DiagnosticDashboardView } from './components/DiagnosticDashboardView.js';
import { CounselorView } from './components/CounselorView.js';
import { KonkurCountdown } from './components/KonkurCountdown.js';
import { RewardModal } from './components/RewardModal.js';
import { SessionReportModal } from './components/SessionReportModal.js';
import { StudentProfileModal } from './components/StudentProfileModal.js';
import { LoginScreen } from './components/LoginScreen.js';
import { FooterBar } from './components/FooterBar.js';
import { PartReportsCalendar } from './components/PartReportsCalendar.js';

import {
  Student,
  PlanTask,
  SessionReport,
  Habit,
  HabitLog,
  Reward,
  StudentRewardClaim,
  FocusPointTransaction,
  SystemSettings,
  TournamentLeaderboardItem,
  StudentGoal,
} from './types/index.js';
import { getTodayISODate } from './utils/persianDate.js';
import { soundManager } from './utils/audio.js';

export default function App() {
  // Theme state: dark / light
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('hadafeto:theme') === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.body.dataset.theme = theme;
    window.localStorage.setItem('hadafeto:theme', theme);
  }, [theme]);

  // Auth / Role state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [role, setRole] = useState<'COUNSELOR' | 'STUDENT'>('STUDENT');
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  // Active view state with session persistence (never resets on mutations or refresh)
  const [activeView, setActiveViewState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'plan';
    return window.sessionStorage.getItem('hadafeto:active-view') || 'plan';
  });

  const setActiveView = (view: string) => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:active-view', view);
    }
  };

  // Application Data
  const [students, setStudents] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [sessionReports, setSessionReports] = useState<SessionReport[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardClaims, setRewardClaims] = useState<StudentRewardClaim[]>([]);
  const [transactions, setTransactions] = useState<FocusPointTransaction[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    testPercentageFormula: '((correct - (wrong / 3)) / total) * 100',
    diagnosticWeights: {
      studyHours: 0.25,
      tests: 0.25,
      planCompletion: 0.2,
      streak: 0.15,
      habits: 0.1,
      focus: 0.05,
    },
    konkurDate: '2027-04-23T08:00:00.000Z',
  });

  const [tournamentData, setTournamentData] = useState<{
    studyLeaderboard: TournamentLeaderboardItem[];
    testsLeaderboard: TournamentLeaderboardItem[];
    streakLeaderboard: TournamentLeaderboardItem[];
  }>({
    studyLeaderboard: [],
    testsLeaderboard: [],
    streakLeaderboard: [],
  });

  // Active Task for Timer
  const [timerActiveTask, setTimerActiveTask] = useState<PlanTask | null>(null);

  // Celebration & Report Modals
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardModalPrevFP, setRewardModalPrevFP] = useState(0);
  const [rewardModalNewFP, setRewardModalNewFP] = useState(0);
  const [reportModalTask, setReportModalTask] = useState<PlanTask | null>(null);
  const [pendingReportActualDurationMinutes, setPendingReportActualDurationMinutes] = useState<number | undefined>(undefined);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Check persistent session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (res.ok) {
          const data = await res.json();
          if (data.role === 'COUNSELOR') {
            setRole('COUNSELOR');
            setCurrentStudent(null);
            setIsAuthenticated(true);
          } else if (data.role === 'STUDENT' && data.student) {
            setRole('STUDENT');
            setCurrentStudent(data.student);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    verifySession();
  }, []);

  // Load all initial data from backend API
  const fetchAllData = async () => {
    if (!isAuthenticated) return;

    try {
      const today = getTodayISODate();
      const headers: Record<string, string> = {};

      const [studentsRes, habitsRes, rewardsRes, settingsRes, tournamentRes] = await Promise.all([
        fetch('/api/students', { headers }),
        fetch('/api/habits', { headers }),
        fetch('/api/rewards', { headers }),
        fetch('/api/settings', { headers }),
        fetch('/api/tournament', { headers }),
      ]);

      if (studentsRes.ok) {
        const stds: Student[] = await studentsRes.json();
        setStudents(stds);

        if (role === 'STUDENT' && currentStudent) {
          const fresh = stds.find((s) => s.id === currentStudent.id);
          if (fresh) setCurrentStudent(fresh);
        } else if (role === 'COUNSELOR') {
          if (!currentStudent && stds.length > 0) {
            setCurrentStudent(stds[0]);
          } else if (currentStudent) {
            const fresh = stds.find((s) => s.id === currentStudent.id);
            if (fresh) setCurrentStudent(fresh);
          }
        }
      }

      if (habitsRes.ok) setHabits(await habitsRes.json());
      if (rewardsRes.ok) setRewards(await rewardsRes.json());
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (tournamentRes.ok) setTournamentData(await tournamentRes.json());

      // Keep one canonical task collection in parent state.
      // Counselors need the full task set so the weekly Spreadsheet Planner can
      // switch students/dates without losing tasks after edit/delete/reorder.
      // Students only receive their own current-day tasks.
      const targetStudentId = currentStudent?.id;
      if (role === 'COUNSELOR') {
        const [tasksRes, reportsRes, txRes] = await Promise.all([
          fetch('/api/tasks', { headers }),
          fetch('/api/reports', { headers }),
          fetch('/api/transactions', { headers }),
        ]);

        if (tasksRes.ok) setTasks(await tasksRes.json());
        if (reportsRes.ok) setSessionReports(await reportsRes.json());
        if (txRes.ok) setTransactions(await txRes.json());
      } else if (targetStudentId) {
        const [tasksRes, reportsRes, habitLogsRes, claimsRes, txRes] = await Promise.all([
          // Load the complete task history for the student. Individual views
          // (daily plan/reports/diagnostics) apply their own date filters.
          fetch(`/api/tasks?studentId=${targetStudentId}`, { headers }),
          fetch(`/api/reports?studentId=${targetStudentId}`, { headers }),
          fetch(`/api/habits/logs?studentId=${targetStudentId}`, { headers }),
          fetch(`/api/rewards/claims?studentId=${targetStudentId}`, { headers }),
          fetch(`/api/transactions?studentId=${targetStudentId}`, { headers }),
        ]);

        if (tasksRes.ok) {
          const freshTasks: PlanTask[] = await tasksRes.json();
          setTasks(freshTasks);

          // Task deletion/completion guard for timer & study hall
          setTimerActiveTask((prev) => {
            if (!prev) return null;
            const updated = freshTasks.find((t) => t.id === prev.id);
            if (!updated || updated.isCompleted || updated.status === 'COMPLETED') {
              return null;
            }
            return updated;
          });
        }
        if (reportsRes.ok) setSessionReports(await reportsRes.json());
        if (habitLogsRes.ok) setHabitLogs(await habitLogsRes.json());
        if (claimsRes.ok) setRewardClaims(await claimsRes.json());
        if (txRes.ok) setTransactions(await txRes.json());
      }
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();

      // Live synchronization: auto-poll every 12 seconds and on window focus
      const pollInterval = window.setInterval(fetchAllData, 12000);
      const handleFocus = () => {
        fetchAllData();
      };
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') fetchAllData();
      };

      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(pollInterval);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [isAuthenticated, role, currentStudent?.id]);

  // Handle Session completion in timer (+15 FP)
  const handleSessionComplete = async (task: PlanTask, durationSeconds: number) => {
    if (!currentStudent) return;

    const alreadyReported = sessionReports.some((report) => report.taskId === task.id);
    if (task.isCompleted || task.status === 'COMPLETED' || alreadyReported) {
      setTimerActiveTask(null);
      if (activeView === 'timer') {
        setActiveView('plan');
      }
      return;
    }

    const previousFP = currentStudent.focusPoints;
    const newFP = previousFP + 15;
    const actualMinutes = Math.max(0, Math.round(durationSeconds / 60));

    setRewardModalPrevFP(previousFP);
    setRewardModalNewFP(newFP);
    setShowRewardModal(true);
    setCurrentStudent({ ...currentStudent, focusPoints: newFP });
    setPendingReportActualDurationMinutes(actualMinutes);
    setReportModalTask(task);
  };

  // Submit Session Report (+5 FP, +1 FP per test)
  const handleSubmitReport = async (reportData: {
    taskId: string;
    courseName: string;
    isCompleted: boolean;
    satisfaction: number;
    focus: number;
    difficulty: number;
    testsCount: number;
    testResult?: any;
    reflectionNote: string;
  }) => {
    if (!currentStudent) return;

    const existingReport = sessionReports.find((report) => report.taskId === reportData.taskId);
    const existingTask = tasks.find((task) => task.id === reportData.taskId);
    if (existingReport || existingTask?.isCompleted || existingTask?.status === 'COMPLETED') {
      setReportModalTask(null);
      setPendingReportActualDurationMinutes(undefined);
      return;
    }

    const res = await fetch('/api/reports', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...reportData,
        studentId: currentStudent.id,
        date: existingTask?.date || getTodayISODate(),
        actualDurationMinutes: pendingReportActualDurationMinutes,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(errorBody.error || 'ثبت گزارش ناموفق بود');
    }

    const data = await res.json();
    if (data.student) setCurrentStudent(data.student);
    setReportModalTask(null);
    setPendingReportActualDurationMinutes(undefined);
    setTimerActiveTask(null);
    if (activeView === 'timer') {
      setActiveView('plan');
    }
    await fetchAllData();
  };

  // Toggle Habit completion (+10 FP)
  const handleToggleHabit = async (habitId: string) => {
    if (!currentStudent) return;

    const res = await fetch('/api/habits/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        habitId,
        studentId: currentStudent.id,
        date: getTodayISODate(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.student) {
        setCurrentStudent(data.student);
      }
      await fetchAllData();
    }
  };

  // Reorder today's tasks with optimistic UI + server reconciliation.
  const handleReorderTasks = async (newTaskIds: string[]) => {
    if (!currentStudent || newTaskIds.length === 0) return;

    const today = getTodayISODate();
    const previousTasks = tasks;
    const orderById = new Map(newTaskIds.map((id, index) => [id, index + 1]));

    // Update immediately so the UI never appears stuck while the request is in flight.
    setTasks((prev) => {
      const todayTasks = prev
        .filter((task) => task.studentId === currentStudent.id && task.date === today)
        .map((task) => ({ ...task, order: orderById.get(task.id) ?? task.order }));
      const todayMap = new Map(todayTasks.map((task) => [task.id, task]));
      const orderedToday = newTaskIds
        .map((id) => todayMap.get(id))
        .filter((task): task is PlanTask => !!task);
      const remaining = prev.filter(
        (task) => !(task.studentId === currentStudent.id && task.date === today)
      );
      return [...remaining, ...orderedToday];
    });

    try {
      const res = await fetch('/api/tasks/reorder', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: currentStudent.id,
          date: today,
          taskIds: newTaskIds,
        }),
      });

      if (!res.ok) {
        setTasks(previousTasks);
        return;
      }

      const serverTasks: PlanTask[] = await res.json();
      setTasks((prev) => {
        const serverMap = new Map(serverTasks.map((task) => [task.id, task]));
        return prev.map((task) => serverMap.get(task.id) || task);
      });
    } catch (error) {
      console.error('Error reordering tasks:', error);
      setTasks(previousTasks);
    }
  };

  // Redeem Reward in Store
  const handleClaimReward = async (rewardId: string): Promise<boolean> => {
    if (!currentStudent) return false;

    const res = await fetch('/api/rewards/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: currentStudent.id,
        rewardId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.student) {
        setCurrentStudent(data.student);
      }
      await fetchAllData();
      return true;
    }
    return false;
  };

  // Update Student Goals visibility
  const handleUpdateGoals = async (updatedGoals: StudentGoal[]) => {
    if (!currentStudent) return;

    const res = await fetch(`/api/students/${currentStudent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals: updatedGoals }),
    });

    if (res.ok) {
      const updated = await res.json();
      setCurrentStudent(updated);
      await fetchAllData();
    }
  };

  // Login Handler
  const handleLogin = async (username: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          window.localStorage.setItem('hadafeto:token', data.token);
        }
        if (data.role === 'COUNSELOR') {
          setRole('COUNSELOR');
          const savedView = window.sessionStorage.getItem('hadafeto:active-view') || 'plan';
          setActiveView(savedView);
          setTimerActiveTask(null);
          setIsAuthenticated(true);
          return true;
        } else if (data.student) {
          setRole('STUDENT');
          setCurrentStudent(data.student);
          const savedView = window.sessionStorage.getItem('hadafeto:active-view') || 'plan';
          setActiveView(savedView);
          setTimerActiveTask(null);
          setIsAuthenticated(true);
          return true;
        }
      }
    } catch {
      // fallback
    }
    return false;
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // ignore
    } finally {
      window.localStorage.removeItem('hadafeto:token');
      setIsAuthenticated(false);
      setCurrentStudent(null);
      setTasks([]);
      setSessionReports([]);
      setHabitLogs([]);
      setRewardClaims([]);
      setTransactions([]);
    }
  };

  const handleSelectTaskForTimer = (task: PlanTask) => {
    const hasReport = sessionReports.some((report) => report.taskId === task.id);
    const isCompleted = task.isCompleted || task.status === 'COMPLETED';
    if (isCompleted || hasReport) return;

    // Timer is intentionally hidden from the navbar, but it remains a real app view.
    // Selecting a planned part explicitly enters that view. Clone the task so later
    // planner refreshes cannot replace the active timer's reference mid-session.
    setTimerActiveTask({ ...task });
    setActiveView('timer');
  };

  useEffect(() => {
    if (activeView === 'timer' && !timerActiveTask) {
      setActiveView('plan');
    }
  }, [activeView, timerActiveTask]);

  // Authentication Guard: Loading Screen
  if (isCheckingAuth) {
    return (
      <div
        data-theme={theme}
        className={`app-shell min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200 ${
          theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-600/40 animate-pulse mb-4">
          <span className="text-base font-black text-white">هدف</span>
        </div>
        <p className="text-xs text-purple-400 font-medium animate-pulse">
          در حال بررسی نشست کاربری...
        </p>
      </div>
    );
  }

  // Authentication Guard: Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />
    );
  }

  return (
    <div
      data-theme={theme}
      className={`app-shell min-h-screen transition-colors duration-300 ${
        theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* Icon-First Slim Sidebar Navigation */}
      <SlimSidebar
        role={role}
        student={currentStudent || undefined}
        activeView={activeView}
        onSelectView={setActiveView}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenStore={() => setActiveView('store')}
        onOpenStreakInfo={() => setActiveView('tournament')}
        onLogout={handleLogout}
      />

      {/* Main Viewport Container — Padded for Slim Sidebar in RTL, with safe bottom margin on mobile */}
      <main className="max-w-7xl mx-auto md:pr-[84px] px-4 sm:px-6 py-5 sm:py-7 pb-28 md:pb-10 space-y-6">
        {/* Konkur Days, Hours, Minutes, Seconds Countdown Timer */}
        <KonkurCountdown konkurDate={settings.konkurDate} theme={theme} />

        {role === 'COUNSELOR' ? (
          <CounselorView
            students={students}
            tasks={tasks}
            reports={sessionReports}
            habits={habits}
            rewards={rewards}
            transactions={transactions}
            settings={settings}
            tournamentData={tournamentData}
            onRefreshData={fetchAllData}
            theme={theme}
            activeView={activeView}
            onSelectView={setActiveView}
          />
        ) : (
          <>
            {activeView === 'plan' && (
              <DailyPlanView
                tasks={tasks}
                reports={sessionReports}
                selectedTask={timerActiveTask}
                onSelectTask={(task) => setTimerActiveTask(task)}
                onSelectTaskForTimer={handleSelectTaskForTimer}
                onEnterStudyHallWithTask={(task) => {
                  setTimerActiveTask(task);
                  setActiveView('study-hall');
                }}
                onOpenReportModal={(t) => {
                  setReportModalTask(t);
                }}
                onReorderTasks={handleReorderTasks}
                theme={theme}
              />
            )}

            {activeView === 'study-hall' && (
              <StudyHallView
                role={role}
                student={currentStudent}
                selectedTask={timerActiveTask}
                onGoToPlan={() => setActiveView('plan')}
                onCompleteSession={handleSessionComplete}
                onOpenReportModal={(t) => setReportModalTask(t)}
                theme={theme}
              />
            )}

            {(activeView === 'store' || activeView === 'rewards') && currentStudent && (
              <StoreInventoryView
                student={currentStudent}
                currentFP={currentStudent.focusPoints}
                onUpdateStudent={(fresh) => {
                  setCurrentStudent(fresh);
                  setStudents((prev) => prev.map((s) => (s.id === fresh.id ? fresh : s)));
                }}
                theme={theme}
              />
            )}

            {activeView === 'achievements' && currentStudent && (
              <AchievementsView
                student={currentStudent}
                onUpdateStudent={(fresh) => {
                  setCurrentStudent(fresh);
                  setStudents((prev) => prev.map((s) => (s.id === fresh.id ? fresh : s)));
                }}
                theme={theme}
              />
            )}

            {activeView === 'part-reports' && currentStudent && (
              <PartReportsCalendar
                student={currentStudent}
                tasks={tasks}
                reports={sessionReports}
                habits={habits}
                habitLogs={habitLogs}
                transactions={transactions}
                theme={theme}
              />
            )}

            {activeView === 'timer' && (
              <TimerView
                activeTask={timerActiveTask}
                theme={theme}
                onSessionComplete={handleSessionComplete}
                onOpenReportModal={(t) => {
                  setReportModalTask(t);
                }}
                onBackToPlan={() => setActiveView('plan')}
              />
            )}

            {activeView === 'habits' && (
              <HabitsView
                habits={habits}
                habitLogs={habitLogs}
                onToggleHabit={handleToggleHabit}
                theme={theme}
              />
            )}

            {activeView === 'tournament' && (
              <TournamentView
                tournamentData={tournamentData}
                currentStudentId={currentStudent?.id}
                theme={theme}
              />
            )}

            {activeView === 'analytics' && (
              <DiagnosticDashboardView
                studentName={currentStudent?.fullName || 'دانش‌آموز'}
                reports={sessionReports}
                tasks={tasks}
                habitLogs={habitLogs}
                streak={currentStudent?.streak || 0}
                dailyGoalMinutes={currentStudent?.dailyStudyGoalMinutes}
                weeklyGoalMinutes={currentStudent?.weeklyStudyGoalMinutes}
                diagnosticWeights={settings.diagnosticWeights}
                theme={theme}
              />
            )}
          </>
        )}

        {/* Global Luxury Glass Footer with animated RGB gradient text */}
        <FooterBar theme={theme} />
      </main>

      {/* Reward Celebration Animation Modal */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        previousFP={rewardModalPrevFP}
        newFP={rewardModalNewFP}
        streak={currentStudent?.streak || 1}
        courseName={timerActiveTask?.courseName}
        onOpenReport={() => {
          if (timerActiveTask) setReportModalTask(timerActiveTask);
        }}
      />

      {/* Session Report Modal */}
      {reportModalTask && (
        <SessionReportModal
          isOpen={!!reportModalTask}
          onClose={() => setReportModalTask(null)}
          task={reportModalTask}
          isAlreadyReported={sessionReports.some((r) => r.taskId === reportModalTask.id)}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {/* Student Profile & Goals Modal */}
      {currentStudent && (
        <StudentProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          student={currentStudent}
          tasks={tasks}
          reports={sessionReports}
          onUpdateGoals={handleUpdateGoals}
          theme={theme}
        />
      )}
    </div>
  );
}
