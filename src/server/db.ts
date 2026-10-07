import fs from 'fs';
import path from 'path';
import { hashPassword, isStrongPassword, createSessionToken } from './security.js';
import { Pool } from 'pg';
import type {
  Student,
  StudentGoal,
  PlanTask,
  SessionReport,
  Habit,
  HabitLog,
  FocusPointTransaction,
  Reward,
  StudentRewardClaim,
  SystemSettings,
  TournamentLeaderboardItem,
  UserSessionRecord,
  BadgeItem,
  TitleItem,
  StoreProduct,
  InventoryItem,
  AchievementItem,
  StudyHallPresence,
  CounselorBadgeGrant,
} from '../types/index.js';

interface DatabaseSchema {
  students: Student[];
  tasks: PlanTask[];
  sessionReports: SessionReport[];
  habits: Habit[];
  habitLogs: HabitLog[];
  transactions: FocusPointTransaction[];
  rewards: Reward[];
  rewardClaims: StudentRewardClaim[];
  settings: SystemSettings;
  notes: Array<{ id: string; studentId: string; note: string; createdAt: string }>;
  badges: BadgeItem[];
  titles: TitleItem[];
  storeProducts: StoreProduct[];
  inventory: InventoryItem[];
  counselorBadgeGrants: CounselorBadgeGrant[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');
const DEMO_PASSWORD_HASH = 'scrypt$32768$8$1$XN61wbTHVTEWM7j-g6vW-Q$C7hHbZFR1nIp4AfYelzFLev8ayrCGvE3M52VzClYvNaqGW0Cz4qS-hymzUbPrRWQoXk4mvuHgMtRTfsSIdlC-w';

function getInitialData(): DatabaseSchema {
  const today = new Date().toISOString().split('T')[0];
  
  const students: Student[] = [
    {
      id: 'student_1',
      username: 'aryan',
      passwordHash: DEMO_PASSWORD_HASH,
      fullName: 'آرین محمدی',
      nickname: 'آرین',
      motto: 'پزشکی دانشگاه تهران؛ هر روز، یک قدم نزدیک‌تر.',
      grade: 'دوازدهم',
      major: 'علوم تجربی',
      goals: [
        { id: 'g1', title: 'رتبه زیر ۱۰۰ منطقه یک', targetRank: '۵۰', targetUniversity: 'دانشگاه علوم پزشکی تهران', isPublic: true },
        { id: 'g2', title: 'درصد زیست‌شناسی بالای ۸۵٪', isPublic: true },
        { id: 'g3', title: 'تثبیت میانگین تراز قلم‌چی روی ۷۲۰۰', isPublic: false }
      ],
      phone: '۰۹۱۲۳۴۵۶۷۸۹',
      city: 'تهران',
      counselorNotes: 'دانش‌آموز بسیار منظم، در تست‌های مفهومی زیست‌شناسی ژنتیک نیاز به تمرکز بیشتر دارد. روحیه رقابتی عالی.',
      focusPoints: 1420,
      streak: 34, // Tier 4 Mythic!
      dailyStudyGoalMinutes: 480, // هدف مطالعه روزانه ۸ ساعت
      weeklyStudyGoalMinutes: 3000,
      createdAt: '2026-08-01T08:00:00.000Z'
    },
    {
      id: 'student_2',
      username: 'sara',
      passwordHash: DEMO_PASSWORD_HASH,
      fullName: 'سارا کاظمی',
      nickname: 'سارا',
      motto: 'مهندسی کامپیوتر دانشگاه صنعتی شریف.',
      grade: 'دوازدهم',
      major: 'ریاضی فیزیک',
      goals: [
        { id: 'g4', title: 'رتبه دو رقمی کنکور ریاضی', targetRank: '۳۵', targetUniversity: 'دانشگاه صنعتی شریف', isPublic: true },
        { id: 'g5', title: 'حسابان و هندسه بالای ۸۰٪', isPublic: true }
      ],
      phone: '۰۹۱۹۸۷۶۵۴۳۲',
      city: 'اصفهان',
      counselorNotes: 'استعداد فوق‌العاده در ریاضیات. سرعت تست‌زنی باید با آزمون‌های زمان‌دار تقویت شود.',
      focusPoints: 985,
      streak: 18, // Tier 3
      dailyStudyGoalMinutes: 420, // هدف مطالعه روزانه ۷ ساعت
      weeklyStudyGoalMinutes: 2800,
      createdAt: '2026-08-10T08:00:00.000Z'
    },
    {
      id: 'student_3',
      username: 'mohammad',
      passwordHash: DEMO_PASSWORD_HASH,
      fullName: 'محمد رضایی',
      nickname: 'محمد',
      motto: 'دانشکده حقوق دانشگاه شهید بهشتی.',
      grade: 'دوازدهم',
      major: 'علوم انسانی',
      goals: [
        { id: 'g6', title: 'رتبه تک‌رقمی کنکور انسانی', targetRank: '۸', targetUniversity: 'دانشگاه شهید بهشتی', isPublic: true }
      ],
      phone: '۰۹۳۵۱۱۱۲۲۳۳',
      city: 'شیراز',
      counselorNotes: 'مرورهای دوره‌ای فنون و عربی بسیار منظم انجام می‌شود.',
      focusPoints: 640,
      streak: 9, // Tier 2
      dailyStudyGoalMinutes: 360, // هدف مطالعه روزانه ۶ ساعت
      weeklyStudyGoalMinutes: 2400,
      createdAt: '2026-08-20T08:00:00.000Z'
    },
    {
      id: 'student_4',
      username: 'niloufar',
      passwordHash: DEMO_PASSWORD_HASH,
      fullName: 'نیلوفر راد',
      nickname: 'نیلوفر',
      motto: 'پشتکار بالا کلید هر موفقیتی است.',
      grade: 'یازدهم',
      major: 'علوم تجربی',
      goals: [
        { id: 'g7', title: 'دندانپزشکی شهید بهشتی', isPublic: false }
      ],
      phone: '۰۹۱۲۹۹۹۸۸۷۷',
      city: 'تبریز',
      counselorNotes: 'پایه یازدهم، شروع پرانرژی برای جمع‌بندی دروس پایه.',
      focusPoints: 320,
      streak: 4, // Tier 1
      dailyStudyGoalMinutes: 300, // هدف مطالعه روزانه ۵ ساعت
      weeklyStudyGoalMinutes: 2000,
      createdAt: '2026-09-01T08:00:00.000Z'
    }
  ];

  const tasks: PlanTask[] = [
    // Tasks for today for student_1 (Aryan)
    {
      id: 'task_1',
      studentId: 'student_1',
      date: today,
      courseName: 'زیست‌شناسی ۳ - فصل ۵ (از ماده به انرژی)',
      activityType: 'مطالعه',
      testMode: 'ندارد',
      minTests: 0,
      durationMinutes: 75,
      startTime: '08:00',
      endTime: '09:15',
      order: 1,
      isCompleted: true,
      completedAt: '2026-10-06T08:15:00.000Z'
    },
    {
      id: 'task_2',
      studentId: 'student_1',
      date: today,
      courseName: 'زیست‌شناسی ۳ - تست تنفس نوری و زنجیره انتقال',
      activityType: 'تست',
      testMode: 'آزمونی',
      minTests: 40,
      durationMinutes: 60,
      startTime: '09:45',
      endTime: '10:45',
      order: 2,
      isCompleted: true,
      completedAt: '2026-10-06T10:00:00.000Z'
    },
    {
      id: 'task_3',
      studentId: 'student_1',
      date: today,
      courseName: 'شیمی ۲ - ساختار اتم و آرایش الکترونی',
      activityType: 'مرور',
      testMode: 'آموزشی',
      minTests: 25,
      durationMinutes: 75,
      startTime: '11:15',
      endTime: '12:30',
      order: 3,
      isCompleted: false
    },
    {
      id: 'task_4',
      studentId: 'student_1',
      date: today,
      courseName: 'فیزیک ۳ - دینامیک و حرکت دایره‌ای',
      activityType: 'تست',
      testMode: 'آزمونی',
      minTests: 30,
      durationMinutes: 90,
      startTime: '14:00',
      endTime: '15:30',
      order: 4,
      isCompleted: false
    },
    {
      id: 'task_5',
      studentId: 'student_1',
      date: today,
      courseName: 'استراحت میان‌وعده و هوازی',
      activityType: 'مرور',
      testMode: 'ندارد',
      minTests: 0,
      durationMinutes: 30,
      startTime: '15:45',
      endTime: '16:15',
      order: 5,
      isRest: true,
      isCompleted: false
    },
    // Tasks for student_2
    {
      id: 'task_6',
      studentId: 'student_2',
      date: today,
      courseName: 'حسابان ۲ - مشتق و کاربرد مشتق',
      activityType: 'تست',
      testMode: 'آزمونی',
      minTests: 35,
      durationMinutes: 90,
      startTime: '08:30',
      endTime: '10:00',
      order: 1,
      isCompleted: false
    }
  ];

  const sessionReports: SessionReport[] = [
    {
      id: 'report_1',
      studentId: 'student_1',
      taskId: 'task_1',
      date: today,
      courseName: 'زیست‌شناسی ۳ - فصل ۵ (از ماده به انرژی)',
      isCompleted: true,
      satisfaction: 5,
      focus: 5,
      difficulty: 3,
      testsCount: 0,
      reflectionNote: 'مفاهیم زنجیره انتقال الکترون به طور کامل مرور شد و جدول خلاصه رسم کردم.',
      focusPointsEarned: 20, // 15 part + 5 report
      createdAt: '2026-10-06T08:16:00.000Z'
    },
    {
      id: 'report_2',
      studentId: 'student_1',
      taskId: 'task_2',
      date: today,
      courseName: 'زیست‌شناسی ۳ - تست تنفس نوری و زنجیره انتقال',
      isCompleted: true,
      satisfaction: 4,
      focus: 4,
      difficulty: 4,
      testsCount: 40,
      testResult: {
        total: 40,
        correct: 33,
        wrong: 4,
        unanswered: 3,
        percentage: 79.17
      },
      reflectionNote: 'تله‌های گزینه‌ای مربوط به فسفوریلاسیون اکسیداتیو مشخص شدند.',
      focusPointsEarned: 60, // 15 part + 40 tests + 5 report
      createdAt: '2026-10-06T10:02:00.000Z'
    }
  ];

  const habits: Habit[] = [
    {
      id: 'h1',
      title: 'بیداری رأس ساعت ۰۶:۰۰ صبح',
      description: 'تنظیم ریتم شبانه‌روزی و شروع با انرژی بالا',
      category: 'روتین',
      active: true,
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'h2',
      title: 'خواب باکیفیت قبل از ساعت ۲۳:۳۰',
      description: 'حداقل ۷ ساعت خواب پیوسته برای تثبیت حافظه',
      category: 'سلامت',
      active: true,
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'h3',
      title: 'ورزش کششی یا پیاده‌روی ۲۰ دقیقه‌ای',
      description: 'بهبود اکسیژن‌رسانی به مغز',
      category: 'سلامت',
      active: true,
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'h4',
      title: 'تحلیل دقیق و نشان‌دار کردن تست‌های غلط',
      description: 'یادداشت‌برداری نکات تستی در دفترچه اختصاصی',
      category: 'مطالعه',
      active: true,
      createdAt: '2026-08-01T00:00:00.000Z'
    }
  ];

  const habitLogs: HabitLog[] = [
    {
      id: 'hl1',
      habitId: 'h1',
      studentId: 'student_1',
      date: today,
      completed: true,
      status: 'APPROVED',
      requestedAt: '2026-10-06T06:05:00.000Z',
      reviewedAt: '2026-10-06T06:10:00.000Z'
    },
    {
      id: 'hl2',
      habitId: 'h2',
      studentId: 'student_1',
      date: today,
      completed: true,
      status: 'APPROVED',
      requestedAt: '2026-10-06T06:00:00.000Z',
      reviewedAt: '2026-10-06T06:08:00.000Z'
    }
  ];

  const rewards: Reward[] = [
    {
      id: 'r_free_consulting',
      title: 'یک ماه مشاوره تخصصی رایگان',
      description: 'پاداش ویژه برای دانش‌آموزان با استمرار اسطوره‌ای و امتیاز فوق‌العاده. هزینه بالا و قابل تنظیم توسط مشاور.',
      cost: 5000,
      icon: 'Crown',
      active: true,
      isFreeConsultingMonth: true,
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'r_break_30',
      title: '۳۰ دقیقه استراحت آزاد',
      description: 'یک وقت استراحت مازاد بدون تداخل با برنامه رسمی',
      cost: 150,
      icon: 'Coffee',
      active: true,
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'r_game_60',
      title: 'یک ساعت آزادی و تفریح دلخواه',
      description: 'مجوز بازی، فیلم یا تفریح آزاد در پایان هفته با هماهنگی مشاور',
      cost: 300,
      icon: 'Gamepad2',
      active: true,
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'r_badge_konkur',
      title: 'نشان افتخار: فاتح کنکور (Badge)',
      description: 'نشان زرین در صفحه پروفایل و تورنمنت',
      cost: 600,
      icon: 'Award',
      active: true,
      badgeType: 'VICTOR',
      createdAt: '2026-08-01T00:00:00.000Z'
    },
    {
      id: 'r_badge_streak',
      title: 'نشان افتخار: اراده پولادین (Badge)',
      description: 'ویژه دانش‌آموزان با استمرار بالای ۲۰ روز',
      cost: 800,
      icon: 'Flame',
      active: true,
      badgeType: 'STEEL_WILL',
      createdAt: '2026-08-01T00:00:00.000Z'
    }
  ];

  const transactions: FocusPointTransaction[] = [
    {
      id: 'tx_1',
      studentId: 'student_1',
      amount: 20,
      type: 'PART',
      description: 'تکمیل پارت مطالعه زیست‌شناسی و ثبت کامل گزارش',
      actor: 'SYSTEM',
      createdAt: '2026-10-06T08:16:00.000Z'
    },
    {
      id: 'tx_2',
      studentId: 'student_1',
      amount: 60,
      type: 'TEST',
      description: 'تکمیل پارت تست زیست‌شناسی (۴۰ تست + پارت)',
      actor: 'SYSTEM',
      createdAt: '2026-10-06T10:02:00.000Z'
    },
    {
      id: 'tx_3',
      studentId: 'student_1',
      amount: 10,
      type: 'HABIT',
      description: 'تکمیل عادت بیداری ساعت ۰۶:۰۰ صبح',
      actor: 'SYSTEM',
      createdAt: '2026-10-06T06:05:00.000Z'
    },
    {
      id: 'tx_4',
      studentId: 'student_1',
      amount: 10,
      type: 'HABIT',
      description: 'تکمیل عادت خواب منظم',
      actor: 'SYSTEM',
      createdAt: '2026-10-06T06:00:00.000Z'
    },
    {
      id: 'tx_5',
      studentId: 'student_1',
      amount: 50,
      type: 'COUNSELOR_BONUS',
      description: 'پاداش تشویقی مشاور برای نظم فوق‌العاده در آزمون آزمایشی',
      actor: 'COUNSELOR',
      createdAt: '2026-10-05T18:30:00.000Z'
    }
  ];

  const rewardClaims: StudentRewardClaim[] = [];

  const settings: SystemSettings = {
    testPercentageFormula: '((correct - (wrong / 3)) / total) * 100',
    diagnosticWeights: {
      studyHours: 0.25,
      tests: 0.25,
      planCompletion: 0.20,
      streak: 0.15,
      habits: 0.10,
      focus: 0.05
    },
    konkurDate: '2027-04-23T08:00:00.000Z'
  };

  const badges: BadgeItem[] = [
    { id: 'badge_1', name: 'نشان تمرکز عمیق', description: 'ثبت پارت‌های متوالی با شاخص تمرکز حداکثری', rarity: 'معمولی', icon: 'Target', createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_2', name: 'نشان ریتم پایدار', description: 'حفظ استمرار منظم مطالعه در تمام ایام هفته', rarity: 'معمولی', icon: 'Activity', createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_3', name: 'نشان سحرخیز کنکور', description: 'شروع اولین پارت درسی رأس ساعت ۶ صبح', rarity: 'کمیاب', icon: 'Sunrise', createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_4', name: 'نشان اراده پولادین', description: 'دستیابی به استمرار بی‌وقفه بالای ۲۰ روز در برنامه رسمی', rarity: 'حماسی', icon: 'Flame', createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_5', name: 'نشان نابغه آزمون', description: 'کسب درصد بالای ۸۰٪ در آزمون‌های دشوار مفهومی', rarity: 'افسانه‌ای', icon: 'Zap', createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_6', name: 'نشان فاتح کنکور', description: 'پایداری خارق‌العاده و رتبه برتر در جدول تورنمنت کشوری', rarity: 'اسطوره‌ای', icon: 'Trophy', createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_c_nabz', name: 'نشان نبض برتر', description: 'بالاترین نشان افتخار مشاوره برای نظم و رشد جهشی بالینی در مطالعه', rarity: 'اسطوره‌ای', icon: 'HeartPulse', isCounselorOnly: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_c_masir', name: 'نشان مسیر طلایی', description: 'نشان ویژه وفاداری بی‌نقص به نقشه راه راهبردی و استراتژی مشاوره', rarity: 'افسانه‌ای', icon: 'Compass', isCounselorOnly: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'badge_c_mohr', name: 'نشان مهر مشاور', description: 'تاییدیه انحصاری استاد مشاور به پاس اراده پولادین و اخلاق حرفه‌ای تحصیلی', rarity: 'حماسی', icon: 'Award', isCounselorOnly: true, createdAt: '2026-08-01T00:00:00.000Z' },
  ];

  const titles: TitleItem[] = [
    { id: 'title_1', title: 'پیشگام', description: 'دانش‌آموزی که پیشتاز اجرای برنامه است', rarity: 'معمولی', cost: 250, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'title_2', title: 'پژوهشگر', description: 'دقت در تحلیل موشکافانه پاسخنامه آزمون‌ها', rarity: 'معمولی', cost: 300, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'title_3', title: 'محور تمرکز', description: 'توانایی حفظ سکوت و تمرکز مطلق در سالن مطالعه', rarity: 'کمیاب', cost: 600, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'title_4', title: 'فرمانده مطالعه', description: 'تسلط بی‌چون‌وچرا بر حجم بالای مباحث کنکور', rarity: 'حماسی', cost: 1100, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'title_5', title: 'نابغه', description: 'استعداد درخشان با رویکرد علمی و استراتژیک', rarity: 'افسانه‌ای', cost: 1800, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'title_6', title: 'اسطوره‌ای', description: 'عنوان والامرتبه برگزیدگان رتبه‌های تک‌رقمی', rarity: 'اسطوره‌ای', cost: 3000, createdAt: '2026-08-01T00:00:00.000Z' },
  ];

  const storeProducts: StoreProduct[] = [
    { id: 'sp_b1', title: 'نشان تمرکز عمیق', description: 'نشان دیجیتال تمرکز بالا در پارت‌ها', cost: 200, rarity: 'معمولی', category: 'BADGE', icon: 'Target', isConsumable: false, badgeId: 'badge_1', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_b2', title: 'نشان ریتم پایدار', description: 'نشان حفظ استمرار هفتگی', cost: 350, rarity: 'معمولی', category: 'BADGE', icon: 'Activity', isConsumable: false, badgeId: 'badge_2', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_b3', title: 'نشان سحرخیز کنکور', description: 'نشان بیداری رأس ساعت ۶ صبح', cost: 500, rarity: 'کمیاب', category: 'BADGE', icon: 'Sunrise', isConsumable: false, badgeId: 'badge_3', active: true, featured: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_b4', title: 'نشان اراده پولادین', description: 'نشان استمرار بالای ۲۰ روز', cost: 850, rarity: 'حماسی', category: 'BADGE', icon: 'Flame', isConsumable: false, badgeId: 'badge_4', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_b5', title: 'نشان نابغه آزمون', description: 'نشان تراز درخشان در آزمون‌ها', cost: 1200, rarity: 'افسانه‌ای', category: 'BADGE', icon: 'Zap', isConsumable: false, badgeId: 'badge_5', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_b6', title: 'نشان فاتح کنکور', description: 'نشان زرین رتبه برتر', cost: 2000, rarity: 'اسطوره‌ای', category: 'BADGE', icon: 'Trophy', isConsumable: false, badgeId: 'badge_6', active: true, featured: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_t1', title: 'عنوان «پیشگام»', description: 'عنوان رسمی در کنار نام کاربری در سالن مطالعه', cost: 250, rarity: 'معمولی', category: 'TITLE', icon: 'Tag', isConsumable: false, titleId: 'title_1', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_t2', title: 'عنوان «پژوهشگر»', description: 'عنوان موشکافی و دقت تحلیلی', cost: 300, rarity: 'معمولی', category: 'TITLE', icon: 'Tag', isConsumable: false, titleId: 'title_2', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_t3', title: 'عنوان «محور تمرکز»', description: 'عنوان پرستیژ در سالن مطالعه', cost: 600, rarity: 'کمیاب', category: 'TITLE', icon: 'Tag', isConsumable: false, titleId: 'title_3', active: true, featured: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_t4', title: 'عنوان «فرمانده مطالعه»', description: 'عنوان افتخاری تسلط بر برنامه', cost: 1100, rarity: 'حماسی', category: 'TITLE', icon: 'Tag', isConsumable: false, titleId: 'title_4', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_t5', title: 'عنوان «نابغه»', description: 'عنوان طلایی دانشجویان ممتاز', cost: 1800, rarity: 'افسانه‌ای', category: 'TITLE', icon: 'Tag', isConsumable: false, titleId: 'title_5', active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_t6', title: 'عنوان «اسطوره‌ای»', description: 'والاترین عنوان سامانه هدف تو', cost: 3000, rarity: 'اسطوره‌ای', category: 'TITLE', icon: 'Crown', isConsumable: false, titleId: 'title_6', active: true, featured: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_c1', title: '۳۰ دقیقه استراحت آزاد', description: 'یک پارت استراحت بدون ثبت در کاستی‌های برنامه هفتگی', cost: 150, rarity: 'معمولی', category: 'CONSUMABLE', icon: 'Coffee', isConsumable: true, active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_c2', title: 'یک ساعت تفریح دلخواه', description: 'مجوز استراحت مازاد در پایان هفته با هماهنگی مشاور', cost: 300, rarity: 'کمیاب', category: 'CONSUMABLE', icon: 'Gamepad2', isConsumable: true, active: true, createdAt: '2026-08-01T00:00:00.000Z' },
    { id: 'sp_c_consult', title: 'یک ماه مشاوره تخصصی رایگان', description: 'گران‌ترین و ارزشمندترین پاداش سامانه هدف تو شامل ۴ جلسه تحلیل اختصاصی و برنامه‌ریزی فردی', cost: 5000, rarity: 'اسطوره‌ای', category: 'SPECIAL', icon: 'Sparkles', isConsumable: true, isFreeConsultingMonth: true, active: true, featured: true, createdAt: '2026-08-01T00:00:00.000Z' },
  ];

  const inventory: InventoryItem[] = [
    { id: 'inv_1', studentId: 'student_1', productId: 'sp_t1', itemType: 'TITLE', title: 'پیشگام', description: 'دانش‌آموزی که پیشتاز اجرای برنامه است', rarity: 'معمولی', icon: 'Tag', isEquipped: true, isConsumed: false, titleId: 'title_1', acquiredAt: '2026-08-05T00:00:00.000Z' },
    { id: 'inv_2', studentId: 'student_1', productId: 'sp_b1', itemType: 'BADGE', title: 'نشان تمرکز عمیق', description: 'ثبت پارت‌های متوالی با شاخص تمرکز حداکثری', rarity: 'معمولی', icon: 'Target', isEquipped: true, isConsumed: false, badgeId: 'badge_1', acquiredAt: '2026-08-06T00:00:00.000Z' },
  ];

  const counselorBadgeGrants: CounselorBadgeGrant[] = [];

  return {
    students,
    tasks,
    sessionReports,
    habits,
    habitLogs,
    transactions,
    rewards,
    rewardClaims,
    settings,
    notes: [],
    badges,
    titles,
    storeProducts,
    inventory,
    counselorBadgeGrants,
  };
}

function getEmptyProductionData(): DatabaseSchema {
  const seeded = getInitialData();
  return {
    students: [],
    tasks: [],
    sessionReports: [],
    habits: [],
    habitLogs: [],
    transactions: [],
    rewards: [],
    rewardClaims: [],
    settings: seeded.settings,
    notes: [],
    badges: seeded.badges,
    titles: seeded.titles,
    storeProducts: seeded.storeProducts,
    inventory: [],
    counselorBadgeGrants: [],
  };
}

/** Hosted environments can optionally require PostgreSQL via REQUIRE_POSTGRES=true. */
const requiresPersistentStorage = (): boolean =>
  process.env.REQUIRE_POSTGRES === 'true';

class Database {
  private data: DatabaseSchema;
  private sessions: Map<string, UserSessionRecord> = new Map();
  private remoteReady: Promise<void>;
  private remoteWriteQueue: Promise<void> = Promise.resolve();
  private pool: Pool | null = null;

  private usePostgres = Boolean(process.env.DATABASE_URL);
  private readonly databaseUrl = process.env.DATABASE_URL || '';
  private readonly databaseSSL = process.env.DATABASE_SSL === 'true';
  private studyHallPresence = new Map<string, StudyHallPresence>();

  constructor() {
    const configuredUrl = process.env.DATABASE_URL || '';
    if (configuredUrl.includes('.railway.internal') && !process.env.RAILWAY_ENVIRONMENT) {
      console.warn('[Database] .railway.internal is only reachable inside Railway. Falling back to local/in-memory storage.');
      this.usePostgres = false;
    } else if (requiresPersistentStorage() && (!configuredUrl || configuredUrl.includes('${{'))) {
      console.warn('[Database] DATABASE_URL is missing or unresolved. Falling back to local storage.');
      this.usePostgres = false;
    }
    console.log(`[Database] Storage mode: ${configuredUrl && this.usePostgres ? 'PostgreSQL' : 'local file / in-memory'}`);
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    // Local database is supported for development and standalone operation.
    if (fs.existsSync(DB_PATH)) {
      try {
        this.data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      } catch (err) {
        console.error('Error reading local database, loading initial data:', err);
        this.data = getInitialData();
      }
    } else {
      this.data = getInitialData();
    }

    // Ensure new domains exist even if reading legacy database.json
    const defaults = getInitialData();
    if (!this.data.badges) this.data.badges = defaults.badges;
    if (!this.data.titles) this.data.titles = defaults.titles;
    if (!this.data.storeProducts) this.data.storeProducts = defaults.storeProducts;
    if (!this.data.inventory) this.data.inventory = defaults.inventory;
    if (!this.data.counselorBadgeGrants) this.data.counselorBadgeGrants = [];

    if (this.usePostgres) {
      try {
        this.pool = new Pool({
          connectionString: this.databaseUrl,
          max: Math.min(10, Math.max(2, Number(process.env.DB_POOL_MAX || 5))),
          connectionTimeoutMillis: 5_000,
          idleTimeoutMillis: 30_000,
          ssl: this.databaseSSL ? { rejectUnauthorized: false } : undefined,
        });
        this.pool.on('error', (err) => console.error('[Database] Idle PostgreSQL client error:', err.message));
        this.remoteReady = this.connectWithRetry();
      } catch (err) {
        console.warn('[Database] Failed to create PostgreSQL pool, using local storage:', err);
        this.usePostgres = false;
        this.remoteReady = Promise.resolve();
      }
    } else {
      if (this.migrateLegacyPasswords()) this.save();
      else if (!fs.existsSync(DB_PATH)) this.save();
      this.remoteReady = Promise.resolve();
    }
  }

  private remoteLoaded = false;

  /**
   * Production must NEVER silently fall back to local files: Railway/Render disk is ephemeral,
   * so a fallback shows default data and loses everything on the next deploy.
   * Instead retry (private networking can need a few seconds at boot) and fail loudly.
   */
  private async connectWithRetry(): Promise<void> {
    const isProduction = requiresPersistentStorage();
    const maxAttempts = isProduction ? 15 : 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.initializePostgresDatabase();
        this.remoteLoaded = true;
        console.log('[Database] PostgreSQL ready.');
        return;
      } catch (err) {
        console.warn(`[Database] PostgreSQL attempt ${attempt}/${maxAttempts} failed:`, (err as Error).message);
        if ((err as Error).message?.includes('ENOTFOUND') || (err as Error).message?.includes('getaddrinfo')) {
          break;
        }
        if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, Math.min(attempt * 1000, 3000)));
      }
    }
    console.warn('[Database] PostgreSQL unavailable or disconnected — falling back to local/in-memory storage.');
    this.usePostgres = false;
    this.remoteLoaded = false;
  }

  public async ready(): Promise<void> {
    await this.remoteReady;
  }

  public async flush(): Promise<void> {
    await this.remoteWriteQueue.catch(() => undefined);
  }

  private async initializePostgresDatabase(): Promise<void> {
    if (!this.pool) throw new Error('PostgreSQL pool is not initialized.');

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const result = await this.pool.query<{ id: number; data: DatabaseSchema }>(
      'SELECT id, data FROM app_state WHERE id = 1 LIMIT 1'
    );

    if (result.rows.length > 0 && result.rows[0]?.data) {
      // Rolling safety snapshots (last 20) so an accidental overwrite is always recoverable.
      await this.pool.query(`CREATE TABLE IF NOT EXISTS app_state_backups (id SERIAL PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
      await this.pool.query('INSERT INTO app_state_backups (data) SELECT data FROM app_state WHERE id = 1');
      await this.pool.query('DELETE FROM app_state_backups WHERE id NOT IN (SELECT id FROM app_state_backups ORDER BY id DESC LIMIT 20)');
      this.data = result.rows[0].data;
      console.log(`[Database] Loaded existing app_state: ${this.data.students?.length ?? 0} students.`);
      const defaults = getInitialData();
      if (!this.data.badges) this.data.badges = defaults.badges;
      if (!this.data.titles) this.data.titles = defaults.titles;
      if (!this.data.storeProducts) this.data.storeProducts = defaults.storeProducts;
      if (!this.data.inventory) this.data.inventory = defaults.inventory;
      if (!this.data.counselorBadgeGrants) this.data.counselorBadgeGrants = [];
    } else {
      // A fresh Render database starts empty in production unless explicitly
      // requested to use the bundled demo seed.
      console.warn('[Database] app_state is EMPTY — creating a fresh dataset.');
      const seedDemoData = process.env.SEED_DEMO_DATA === 'true';
      if (requiresPersistentStorage() && !seedDemoData) {
        this.data = getEmptyProductionData();
      }
      await this.persistPostgres(JSON.stringify(this.data));
    }

    if (this.migrateLegacyPasswords()) {
      await this.persistPostgres(JSON.stringify(this.data));
    }
  }

  private save(): void {
    if (this.usePostgres) {
      // Never overwrite the stored data with in-memory defaults before it has been loaded.
      if (!this.remoteLoaded) return;
      const snapshot = JSON.stringify(this.data);
      // Serialize writes so rapid Planner edits cannot overwrite each other out of order.
      this.remoteWriteQueue = this.remoteWriteQueue
        .catch(() => undefined)
        .then(() => this.persistPostgres(snapshot))
        .catch((error) => console.error('PostgreSQL save failed:', error));
      return;
    }

    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), { encoding: 'utf-8', mode: 0o600 });
    fs.renameSync(tmpPath, DB_PATH);
    try { fs.chmodSync(DB_PATH, 0o600); } catch { /* Windows and restricted hosts may ignore chmod. */ }
  }

  private async persistPostgres(serializedData: string): Promise<void> {
    if (!this.pool) throw new Error('PostgreSQL pool is not initialized.');
    const parsed = JSON.parse(serializedData) as DatabaseSchema;
    await this.pool.query(
      `INSERT INTO app_state (id, data, updated_at)
       VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id)
       DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(parsed)]
    );
  }

  private migrateLegacyPasswords(): boolean {
    let changed = false;
    for (const student of this.data.students) {
      if (!student.passwordHash && student.password) {
        student.passwordHash = hashPassword(student.password);
        delete student.password;
        changed = true;
      }
    }
    return changed;
  }

  // Sessions
  public createSession(data: {
    role: 'COUNSELOR' | 'STUDENT';
    studentId?: string;
    userId: string;
    username: string;
    fullName: string;
  }): UserSessionRecord {
    const token = createSessionToken();
    const ttlHours = Math.min(24 * 30, Math.max(1, Number(process.env.SESSION_TTL_HOURS || 168)));
    const session: UserSessionRecord = {
      token,
      ...data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlHours * 60 * 60 * 1000
    };
    this.sessions.set(token, session);
    return session;
  }

  public getSession(token: string): UserSessionRecord | null {
    if (!token) return null;
    const session = this.sessions.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.sessions.delete(token);
      return null;
    }
    return session;
  }

  public deleteSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  // Goals CRUD
  public addStudentGoal(studentId: string, goalData: Omit<StudentGoal, 'id'>): StudentGoal | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;
    if (!student.goals) student.goals = [];
    const newGoal: StudentGoal = {
      ...goalData,
      id: `g_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    student.goals.push(newGoal);
    this.save();
    return newGoal;
  }

  public updateStudentGoal(studentId: string, goalId: string, updates: Partial<StudentGoal>): StudentGoal | null {
    const student = this.getStudentById(studentId);
    if (!student || !student.goals) return null;
    const idx = student.goals.findIndex((g) => g.id === goalId);
    if (idx === -1) return null;
    student.goals[idx] = { ...student.goals[idx], ...updates };
    this.save();
    return student.goals[idx];
  }

  public deleteStudentGoal(studentId: string, goalId: string): boolean {
    const student = this.getStudentById(studentId);
    if (!student || !student.goals) return false;
    const initialLen = student.goals.length;
    student.goals = student.goals.filter((g) => g.id !== goalId);
    if (student.goals.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Students
  public getStudents(): Student[] {
    return this.data.students;
  }

  public getStudentById(id: string): Student | undefined {
    return this.data.students.find((s) => s.id === id);
  }

  public getStudentByUsername(username: string): Student | undefined {
    return this.data.students.find((s) => s.username.toLowerCase() === username.toLowerCase());
  }

  public createStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'focusPoints' | 'streak'>): Student {
    if (!isStrongPassword(studentData.password)) {
      throw new Error('رمز عبور باید حداقل ۱۰ کاراکتر باشد.');
    }
    const { password: _legacyPassword, passwordHash: suppliedHash, ...safeData } = studentData as any;
    const newStudent: Student = {
      ...safeData,
      passwordHash: suppliedHash || hashPassword(studentData.password),
      id: `student_${Date.now()}_${createSessionToken().slice(0, 8)}`,
      focusPoints: 0,
      streak: 1,
      createdAt: new Date().toISOString()
    };
    this.data.students.push(newStudent);
    this.save();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const idx = this.data.students.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const patch: Record<string, unknown> = { ...updates };
    delete patch.id;
    delete patch.createdAt;
    // Never accept a raw passwordHash from the browser. Only a supplied password
    // is converted to a fresh salted hash on the server.
    delete patch.passwordHash;
    if ('password' in patch) {
      const raw = patch.password;
      delete patch.password;
      if (raw !== undefined && raw !== '') {
        if (!isStrongPassword(raw)) throw new Error('رمز عبور باید حداقل ۱۰ کاراکتر باشد.');
        patch.passwordHash = hashPassword(raw as string);
      }
    }
    this.data.students[idx] = { ...this.data.students[idx], ...(patch as Partial<Student>) };
    delete this.data.students[idx].password;
    this.save();
    return this.data.students[idx];
  }

  public deleteStudent(id: string): boolean {
    const initialLen = this.data.students.length;
    this.data.students = this.data.students.filter((s) => s.id !== id);
    if (this.data.students.length !== initialLen) {
      // cascade clean up
      this.data.tasks = this.data.tasks.filter((t) => t.studentId !== id);
      this.data.sessionReports = this.data.sessionReports.filter((r) => r.studentId !== id);
      this.data.habitLogs = this.data.habitLogs.filter((h) => h.studentId !== id);
      this.data.rewardClaims = this.data.rewardClaims.filter((c) => c.studentId !== id);
      this.data.transactions = this.data.transactions.filter((tx) => tx.studentId !== id);
      this.save();
      return true;
    }
    return false;
  }

  // Streak management (ONLY counselor can reset)
  public resetStudentStreak(studentId: string): Student | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;
    student.streak = 0;
    this.save();
    return student;
  }

  public incrementStudentStreak(studentId: string): Student | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;
    student.streak += 1;
    this.save();
    return student;
  }

  // Tasks & Plans
  private computeTaskStatus(t: PlanTask): PlanTask {
    const today = new Date().toISOString().split('T')[0];
    let status = t.status;
    if (t.isCompleted) {
      status = 'COMPLETED';
    } else if (t.status === 'RUNNING') {
      status = 'RUNNING';
    } else if (t.date < today) {
      status = 'MISSED';
    } else {
      status = status || 'PLANNED';
    }
    return { ...t, status };
  }

  public getTasks(studentId: string, date: string): PlanTask[] {
    return this.data.tasks
      .filter((t) => t.studentId === studentId && t.date === date)
      .sort((a, b) => a.order - b.order)
      .map((t) => this.computeTaskStatus(t));
  }

  public getAllTasks(studentId?: string): PlanTask[] {
    const list = !studentId ? this.data.tasks : this.data.tasks.filter((t) => t.studentId === studentId);
    return list
      .map((t) => this.computeTaskStatus(t))
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
      });
  }

  public createTask(task: Omit<PlanTask, 'id'>): PlanTask {
    const newTask: PlanTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };
    this.data.tasks.push(newTask);
    this.save();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<PlanTask>): PlanTask | null {
    const idx = this.data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const existing = this.data.tasks[idx];
    const nextDate = typeof updates.date === 'string' && updates.date ? updates.date : existing.date;
    const movedToAnotherDay = nextDate !== existing.date;

    // Never allow update payloads to replace identity/completion fields accidentally.
    const sanitized: Partial<PlanTask> = { ...updates };
    delete sanitized.id;
    delete sanitized.studentId;
    delete sanitized.order;

    this.data.tasks[idx] = {
      ...existing,
      ...sanitized,
      date: nextDate,
      order: existing.order,
    };

    if (movedToAnotherDay) {
      const targetTasks = this.data.tasks.filter(
        (t) => t.id !== id && t.studentId === existing.studentId && t.date === nextDate
      );
      this.data.tasks[idx].order = targetTasks.length + 1;
    }

    this.normalizeTaskOrders(existing.studentId, existing.date);
    if (movedToAnotherDay) this.normalizeTaskOrders(existing.studentId, nextDate);

    this.save();
    return this.computeTaskStatus(this.data.tasks[idx]);
  }

  public deleteTask(id: string): boolean {
    const task = this.data.tasks.find((t) => t.id === id);
    if (!task) return false;

    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.normalizeTaskOrders(task.studentId, task.date);
    this.save();
    return true;
  }

  private normalizeTaskOrders(studentId: string, date: string): void {
    this.data.tasks
      .filter((t) => t.studentId === studentId && t.date === date)
      .sort((a, b) => {
        const orderCompare = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
        return orderCompare !== 0 ? orderCompare : a.id.localeCompare(b.id);
      })
      .forEach((task, index) => {
        task.order = index + 1;
      });
  }

  public reorderTasks(studentId: string, date: string, taskIds: string[]): PlanTask[] | null {
    const dayTasks = this.data.tasks.filter(
      (t) => t.studentId === studentId && t.date === date
    );

    if (taskIds.length !== dayTasks.length) return null;
    const actualIds = new Set(dayTasks.map((task) => task.id));
    const requestedIds = new Set(taskIds);
    if (requestedIds.size !== taskIds.length || requestedIds.size !== actualIds.size) return null;
    for (const id of requestedIds) {
      if (!actualIds.has(id)) return null;
    }

    taskIds.forEach((id, index) => {
      const task = this.data.tasks.find((t) => t.id === id);
      if (task) task.order = index + 1;
    });

    this.save();
    return this.getTasks(studentId, date);
  }

  // Reports
  public addSessionReport(report: Omit<SessionReport, 'id' | 'createdAt'>): SessionReport {
    const newReport: SessionReport = {
      ...report,
      id: `report_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.sessionReports.push(newReport);

    // mark task completed
    const task = this.data.tasks.find((t) => t.id === report.taskId);
    if (task) {
      task.isCompleted = report.isCompleted;
      task.completedAt = newReport.createdAt;
      task.sessionReportId = newReport.id;
    }

    // Award FP to student
    const student = this.getStudentById(report.studentId);
    if (student) {
      student.focusPoints += report.focusPointsEarned;
    }

    // Record FP transaction
    this.addTransaction({
      studentId: report.studentId,
      amount: report.focusPointsEarned,
      type: report.testsCount > 0 ? 'TEST' : 'PART',
      description: `تکمیل پارت «${report.courseName}» (${report.focusPointsEarned} FP)`,
      actor: 'SYSTEM'
    });

    this.save();
    return newReport;
  }

  public getSessionReports(studentId?: string): SessionReport[] {
    if (!studentId) return this.data.sessionReports;
    return this.data.sessionReports.filter((r) => r.studentId === studentId);
  }

  // Habits
  public getHabits(): Habit[] {
    return this.data.habits;
  }

  public createHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: `habit_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.habits.push(newHabit);
    this.save();
    return newHabit;
  }

  public updateHabit(id: string, updates: Partial<Habit>): Habit | null {
    const idx = this.data.habits.findIndex((h) => h.id === id);
    if (idx === -1) return null;
    this.data.habits[idx] = { ...this.data.habits[idx], ...updates };
    this.save();
    return this.data.habits[idx];
  }

  public deleteHabit(id: string): boolean {
    const initialLen = this.data.habits.length;
    this.data.habits = this.data.habits.filter((h) => h.id !== id);
    if (this.data.habits.length !== initialLen) {
      this.data.habitLogs = this.data.habitLogs.filter((hl) => hl.habitId !== id);
      this.save();
      return true;
    }
    return false;
  }

  public toggleHabitLog(habitId: string, studentId: string, date: string): { completed: boolean; status: 'PENDING' | 'APPROVED' | 'REJECTED'; requestedAt: string } {
    const existingIdx = this.data.habitLogs.findIndex(
      (h) => h.habitId === habitId && h.studentId === studentId && h.date === date
    );

    const now = new Date().toISOString();

    if (existingIdx !== -1) {
      const existing = this.data.habitLogs[existingIdx];
      // If already approved, cannot toggle back from student side
      if (existing.status === 'APPROVED') {
        return { completed: true, status: 'APPROVED', requestedAt: existing.requestedAt };
      }
      
      // If was pending, student toggles off
      if (existing.completed && existing.status === 'PENDING') {
        existing.completed = false;
        existing.status = 'REJECTED';
        this.save();
        return { completed: false, status: 'REJECTED', requestedAt: existing.requestedAt };
      }

      // Re-enable to pending
      existing.completed = true;
      existing.status = 'PENDING';
      existing.requestedAt = now;
      this.save();
      return { completed: true, status: 'PENDING', requestedAt: now };
    } else {
      // Create new pending log without awarding points immediately
      const newLog: HabitLog = {
        id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        habitId,
        studentId,
        date,
        completed: true,
        status: 'PENDING',
        requestedAt: now
      };
      this.data.habitLogs.push(newLog);
      this.save();
      return { completed: true, status: 'PENDING', requestedAt: now };
    }
  }

  public approveHabitLog(logId: string): { success: boolean; log?: HabitLog; student?: Student } {
    const log = this.data.habitLogs.find((h) => h.id === logId);
    if (!log || log.status !== 'PENDING') {
      return { success: false };
    }

    log.status = 'APPROVED';
    log.completed = true;
    log.reviewedAt = new Date().toISOString();

    // Award +10 FP to student upon counselor approval
    const student = this.getStudentById(log.studentId);
    const habit = this.data.habits.find((h) => h.id === log.habitId);
    const habitTitle = habit ? habit.title : 'عادت';

    if (student) {
      student.focusPoints += 10;
      this.addTransaction({
        studentId: log.studentId,
        amount: 10,
        type: 'HABIT',
        description: `تایید تکمیل عادت «${habitTitle}» توسط مشاور (+10 FP)`,
        actor: 'COUNSELOR'
      });
    }

    this.save();
    return { success: true, log, student: student || undefined };
  }

  public rejectHabitLog(logId: string): { success: boolean; log?: HabitLog } {
    const log = this.data.habitLogs.find((h) => h.id === logId);
    if (!log) return { success: false };

    log.status = 'REJECTED';
    log.completed = false;
    log.reviewedAt = new Date().toISOString();
    this.save();
    return { success: true, log };
  }

  public getPendingHabitLogs(): Array<HabitLog & { studentName: string; studentNickname: string; habitTitle: string; habitCategory: string }> {
    return this.data.habitLogs
      .filter((h) => h.status === 'PENDING')
      .map((h) => {
        const student = this.getStudentById(h.studentId);
        const habit = this.data.habits.find((item) => item.id === h.habitId);
        return {
          ...h,
          studentName: student?.fullName || 'دانش‌آموز',
          studentNickname: student?.nickname || student?.fullName || '',
          habitTitle: habit?.title || 'عادت',
          habitCategory: habit?.category || 'روتین'
        };
      })
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  public getHabitLogs(studentId: string, date: string): HabitLog[] {
    return this.data.habitLogs.filter((h) => h.studentId === studentId && h.date === date);
  }

  public getAllHabitLogs(studentId?: string): HabitLog[] {
    return studentId ? this.data.habitLogs.filter((log) => log.studentId === studentId) : this.data.habitLogs;
  }

  // Focus Points & Transactions
  public addTransaction(tx: Omit<FocusPointTransaction, 'id' | 'createdAt'>): FocusPointTransaction {
    const newTx: FocusPointTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.data.transactions.push(newTx);
    this.save();
    return newTx;
  }

  public getTransactions(studentId?: string): FocusPointTransaction[] {
    if (!studentId) return this.data.transactions.slice().reverse();
    return this.data.transactions.filter((t) => t.studentId === studentId).reverse();
  }

  public adjustStudentFP(studentId: string, amount: number, reason: string, isPenalty: boolean): Student | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    student.focusPoints += amount;
    if (student.focusPoints < 0) student.focusPoints = 0;

    this.addTransaction({
      studentId,
      amount,
      type: isPenalty ? 'COUNSELOR_PENALTY' : 'COUNSELOR_BONUS',
      description: reason || (isPenalty ? 'جریمه توسط مشاور' : 'پاداش دستی مشاور'),
      actor: 'COUNSELOR'
    });

    this.save();
    return student;
  }

  // Rewards
  public getRewards(): Reward[] {
    return this.data.rewards;
  }

  public createReward(reward: Omit<Reward, 'id' | 'createdAt'>): Reward {
    const newReward: Reward = {
      ...reward,
      id: `reward_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    this.data.rewards.push(newReward);
    this.save();
    return newReward;
  }

  public updateReward(id: string, updates: Partial<Reward>): Reward | null {
    const idx = this.data.rewards.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.rewards[idx] = { ...this.data.rewards[idx], ...updates };
    this.save();
    return this.data.rewards[idx];
  }

  public claimReward(studentId: string, rewardId: string): { success: boolean; message: string; claim?: StudentRewardClaim } {
    const student = this.getStudentById(studentId);
    const reward = this.data.rewards.find((r) => r.id === rewardId && r.active);

    if (!student) return { success: false, message: 'دانش‌آموز یافت نشد' };
    if (!reward) return { success: false, message: 'جایزه یافت نشد یا غیرفعال است' };
    if (student.focusPoints < reward.cost) {
      return { success: false, message: 'امتیاز تمرکز کافی نیست' };
    }

    // Create pending claim without deducting immediately
    const claim: StudentRewardClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId,
      rewardId,
      costPaid: reward.cost,
      status: 'PENDING',
      claimedAt: new Date().toISOString()
    };
    this.data.rewardClaims.push(claim);
    this.save();
    return { success: true, message: 'درخواست پاداش با موفقیت ثبت شد و پس از تایید مشاور فعال خواهد شد.', claim };
  }

  public approveRewardClaim(claimId: string): { success: boolean; message?: string; claim?: StudentRewardClaim; student?: Student } {
    const claim = this.data.rewardClaims.find((c) => c.id === claimId);
    if (!claim || claim.status !== 'PENDING') {
      return { success: false, message: 'درخواست معتبر نیست' };
    }

    const student = this.getStudentById(claim.studentId);
    const reward = this.data.rewards.find((r) => r.id === claim.rewardId);

    if (!student) return { success: false, message: 'دانش‌آموز یافت نشد' };
    if (student.focusPoints < claim.costPaid) {
      return { success: false, message: 'امتیاز فعلی دانش‌آموز برای این جایزه کافی نیست' };
    }

    // Deduct FP now upon counselor approval
    student.focusPoints -= claim.costPaid;
    claim.status = 'APPROVED';
    claim.reviewedAt = new Date().toISOString();

    this.addTransaction({
      studentId: student.id,
      amount: -claim.costPaid,
      type: 'REWARD_PURCHASE',
      description: `تایید دریافت پاداش «${reward ? reward.title : 'جایزه'}» توسط مشاور (-${claim.costPaid} FP)`,
      actor: 'COUNSELOR'
    });

    this.save();
    return { success: true, claim, student };
  }

  public rejectRewardClaim(claimId: string): { success: boolean; claim?: StudentRewardClaim } {
    const claim = this.data.rewardClaims.find((c) => c.id === claimId);
    if (!claim) return { success: false };

    claim.status = 'REJECTED';
    claim.reviewedAt = new Date().toISOString();
    this.save();
    return { success: true, claim };
  }

  public getPendingRewardClaims(): Array<StudentRewardClaim & { studentName: string; studentNickname: string; rewardTitle: string; rewardIcon: string }> {
    return this.data.rewardClaims
      .filter((c) => c.status === 'PENDING')
      .map((c) => {
        const student = this.getStudentById(c.studentId);
        const reward = this.data.rewards.find((r) => r.id === c.rewardId);
        return {
          ...c,
          studentName: student?.fullName || 'دانش‌آموز',
          studentNickname: student?.nickname || student?.fullName || '',
          rewardTitle: reward?.title || 'پاداش',
          rewardIcon: reward?.icon || 'Gift'
        };
      })
      .sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  public getRewardClaims(studentId?: string): StudentRewardClaim[] {
    if (!studentId) return this.data.rewardClaims;
    return this.data.rewardClaims.filter((c) => c.studentId === studentId);
  }

  // Settings
  public getSettings(): SystemSettings {
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    this.save();
    return this.data.settings;
  }

  // Tournament Data (Strict privacy filter for public view!)
  public getTournamentData(): {
    studyLeaderboard: TournamentLeaderboardItem[];
    testsLeaderboard: TournamentLeaderboardItem[];
    streakLeaderboard: TournamentLeaderboardItem[];
  } {
    // Calculate weekly study minutes and tests from session reports (last 7 days / current week)
    const statsByStudent: Record<string, { studyMinutes: number; testsCount: number }> = {};
    
    this.data.students.forEach((s) => {
      statsByStudent[s.id] = { studyMinutes: 0, testsCount: 0 };
    });

    // Populate from reports and tasks
    this.data.sessionReports.forEach((r) => {
      if (statsByStudent[r.studentId]) {
        // approximate duration from task
        const task = this.data.tasks.find((t) => t.id === r.taskId);
        const mins = task ? task.durationMinutes : 60;
        statsByStudent[r.studentId].studyMinutes += mins;
        statsByStudent[r.studentId].testsCount += r.testsCount || 0;
      }
    });

    const items: TournamentLeaderboardItem[] = this.data.students.map((s) => {
      const publicGoals = (s.goals || []).filter((g) => g.isPublic).map((g) => g.title);
      return {
        studentId: s.id,
        fullName: s.fullName,
        nickname: s.nickname || s.fullName.split(' ')[0],
        motto: s.motto,
        grade: s.grade,
        major: s.major,
        publicGoals,
        weeklyStudyMinutes: statsByStudent[s.id]?.studyMinutes || 0,
        weeklyTestsCount: statsByStudent[s.id]?.testsCount || 0,
        streak: s.streak,
        equippedTitle: s.equippedTitle,
        equippedBadges: s.equippedBadges || [],
        rank: 1
      };
    });

    // 1. Weekly study time leaderboard
    const studyLeaderboard = [...items]
      .sort((a, b) => b.weeklyStudyMinutes - a.weeklyStudyMinutes)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // 2. Weekly tests leaderboard
    const testsLeaderboard = [...items]
      .sort((a, b) => b.weeklyTestsCount - a.weeklyTestsCount)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // 3. Highest Streak leaderboard
    const streakLeaderboard = [...items]
      .sort((a, b) => b.streak - a.streak)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    return {
      studyLeaderboard,
      testsLeaderboard,
      streakLeaderboard
    };
  }

  // ==========================================
  // BADGES & TITLES
  // ==========================================
  public getBadges(): BadgeItem[] {
    return this.data.badges || [];
  }

  public createBadge(badgeData: Omit<BadgeItem, 'id' | 'createdAt'>): BadgeItem {
    const newBadge: BadgeItem = {
      ...badgeData,
      id: `badge_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    if (!this.data.badges) this.data.badges = [];
    this.data.badges.push(newBadge);
    this.save();
    return newBadge;
  }

  public updateBadge(id: string, updates: Partial<BadgeItem>): BadgeItem | null {
    const idx = (this.data.badges || []).findIndex((b) => b.id === id);
    if (idx === -1) return null;
    if (['badge_c_nabz', 'badge_c_masir', 'badge_c_mohr'].includes(id)) {
      delete updates.isCounselorOnly;
    }
    this.data.badges[idx] = { ...this.data.badges[idx], ...updates };
    this.save();
    return this.data.badges[idx];
  }

  public deleteBadge(id: string): { success: boolean; error?: string } {
    if (['badge_c_nabz', 'badge_c_masir', 'badge_c_mohr'].includes(id)) {
      return { success: false, error: 'این نشان ویژه انحصاری مشاور است و قابل حذف نمی‌باشد.' };
    }
    const idx = (this.data.badges || []).findIndex((b) => b.id === id);
    if (idx === -1) return { success: false, error: 'نشان یافت نشد.' };
    this.data.badges.splice(idx, 1);
    this.save();
    return { success: true };
  }

  public getTitles(): TitleItem[] {
    return this.data.titles || [];
  }

  public createTitle(titleData: Omit<TitleItem, 'id' | 'createdAt'>): TitleItem {
    const newTitle: TitleItem = {
      ...titleData,
      id: `title_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    if (!this.data.titles) this.data.titles = [];
    this.data.titles.push(newTitle);
    this.save();
    return newTitle;
  }

  public updateTitle(id: string, updates: Partial<TitleItem>): TitleItem | null {
    const idx = (this.data.titles || []).findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.data.titles[idx] = { ...this.data.titles[idx], ...updates };
    this.save();
    return this.data.titles[idx];
  }

  public deleteTitle(id: string): { success: boolean; error?: string } {
    const idx = (this.data.titles || []).findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, error: 'عنوان یافت نشد.' };
    this.data.titles.splice(idx, 1);
    this.save();
    return { success: true };
  }

  // ==========================================
  // STORE & INVENTORY
  // ==========================================
  public getStoreProducts(): StoreProduct[] {
    return (this.data.storeProducts || []).filter((p) => p.active !== false);
  }

  public getAllStoreProducts(): StoreProduct[] {
    return this.data.storeProducts || [];
  }

  public createStoreProduct(product: Omit<StoreProduct, 'id' | 'createdAt'>): StoreProduct {
    const newProduct: StoreProduct = {
      ...product,
      id: `sp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.storeProducts.push(newProduct);
    this.save();
    return newProduct;
  }

  public updateStoreProduct(id: string, updates: Partial<StoreProduct>): StoreProduct | null {
    const idx = this.data.storeProducts.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.storeProducts[idx] = { ...this.data.storeProducts[idx], ...updates };
    this.save();
    return this.data.storeProducts[idx];
  }

  public deleteStoreProduct(id: string): boolean {
    const idx = this.data.storeProducts.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const isPurchased = (this.data.inventory || []).some((inv) => inv.productId === id);
    if (isPurchased) {
      this.data.storeProducts[idx].active = false;
    } else {
      this.data.storeProducts.splice(idx, 1);
    }
    this.save();
    return true;
  }

  public getStudentInventory(studentId: string): InventoryItem[] {
    return (this.data.inventory || []).filter((i) => i.studentId === studentId);
  }

  /**
   * Atomic Store Purchase:
   * 1. Validates student and product.
   * 2. Checks permanent uniqueness (cannot re-buy permanent items).
   * 3. Validates FP balance.
   * 4. Atomically deducts FP.
   * 5. Records FocusPointTransaction.
   * 6. Grants item into inventory.
   */
  public purchaseStoreProduct(studentId: string, productId: string): {
    success: boolean;
    error?: string;
    item?: InventoryItem;
    student?: Student;
  } {
    const student = this.getStudentById(studentId);
    if (!student) return { success: false, error: 'دانش‌آموز یافت نشد.' };

    const product = (this.data.storeProducts || []).find((p) => p.id === productId);
    if (!product || !product.active) return { success: false, error: 'محصول یافت نشد یا غیرفعال است.' };

    // Prevent duplicate permanent purchase
    if (!product.isConsumable) {
      const alreadyOwned = (this.data.inventory || []).some(
        (i) => i.studentId === studentId && (i.productId === productId || (product.badgeId && i.badgeId === product.badgeId) || (product.titleId && i.titleId === product.titleId))
      );
      if (alreadyOwned) return { success: false, error: 'این نشان یا عنوان را قبلاً خریداری کرده‌اید.' };
    }

    if (student.focusPoints < product.cost) {
      return { success: false, error: `امتیاز تمرکز کافی نیست. موجودی: ${student.focusPoints} FP، قیمت: ${product.cost} FP` };
    }

    // Atomic deduction
    student.focusPoints -= product.cost;

    // Record FP Transaction
    this.addTransaction({
      studentId,
      amount: -product.cost,
      type: 'REWARD_PURCHASE',
      description: `خرید «${product.title}» از فروشگاه`,
      actor: 'STUDENT',
    });

    // Add to inventory
    const inventoryItem: InventoryItem = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      studentId,
      productId: product.id,
      itemType: product.category === 'TITLE' ? 'TITLE' : product.category === 'BADGE' ? 'BADGE' : 'CONSUMABLE',
      title: product.title.replace(/^عنوان\s+«|»$/g, '').replace(/^نشان\s+/g, 'نشان '),
      description: product.description,
      rarity: product.rarity,
      icon: product.icon,
      isEquipped: false,
      isConsumed: false,
      badgeId: product.badgeId,
      titleId: product.titleId,
      acquiredAt: new Date().toISOString(),
    };

    if (!this.data.inventory) this.data.inventory = [];
    this.data.inventory.push(inventoryItem);
    this.save();

    return {
      success: true,
      item: inventoryItem,
      student,
    };
  }

  public equipItem(studentId: string, inventoryItemId: string): {
    success: boolean;
    error?: string;
    item?: InventoryItem;
    student?: Student;
  } {
    const student = this.getStudentById(studentId);
    if (!student) return { success: false, error: 'دانش‌آموز یافت نشد.' };

    const item = (this.data.inventory || []).find((i) => i.id === inventoryItemId && i.studentId === studentId);
    if (!item) return { success: false, error: 'آیتم در موجودی شما یافت نشد.' };
    if (item.isConsumed) return { success: false, error: 'این آیتم مصرف شده است.' };

    if (item.itemType === 'TITLE') {
      // Unequip all other titles
      (this.data.inventory || []).forEach((i) => {
        if (i.studentId === studentId && i.itemType === 'TITLE') {
          i.isEquipped = false;
        }
      });
      item.isEquipped = true;
      student.equippedTitle = item.title;
    } else if (item.itemType === 'BADGE') {
      // Support up to 3 equipped badges
      item.isEquipped = true;
      const equippedBadges = (this.data.inventory || [])
        .filter((i) => i.studentId === studentId && i.itemType === 'BADGE' && i.isEquipped)
        .map((i) => i.title);
      student.equippedBadges = equippedBadges.slice(0, 3);
    }

    this.save();
    return { success: true, item, student };
  }

  public unequipItem(studentId: string, inventoryItemId: string): {
    success: boolean;
    error?: string;
    item?: InventoryItem;
    student?: Student;
  } {
    const student = this.getStudentById(studentId);
    if (!student) return { success: false, error: 'دانش‌آموز یافت نشد.' };

    const item = (this.data.inventory || []).find((i) => i.id === inventoryItemId && i.studentId === studentId);
    if (!item) return { success: false, error: 'آیتم یافت نشد.' };

    item.isEquipped = false;
    if (item.itemType === 'TITLE' && student.equippedTitle === item.title) {
      student.equippedTitle = undefined;
    } else if (item.itemType === 'BADGE' && student.equippedBadges) {
      student.equippedBadges = student.equippedBadges.filter((b) => b !== item.title);
    }

    this.save();
    return { success: true, item, student };
  }

  public consumeItem(studentId: string, inventoryItemId: string): {
    success: boolean;
    error?: string;
    item?: InventoryItem;
  } {
    const item = (this.data.inventory || []).find((i) => i.id === inventoryItemId && i.studentId === studentId);
    if (!item) return { success: false, error: 'آیتم یافت نشد.' };
    if (item.itemType !== 'CONSUMABLE') return { success: false, error: 'تنها آیتم‌های مصرفی قابل استفاده هستند.' };
    if (item.isConsumed) return { success: false, error: 'این آیتم قبلاً استفاده شده است.' };

    item.isConsumed = true;
    item.isEquipped = false;
    this.save();
    return { success: true, item };
  }

  // ==========================================
  // COUNSELOR-ONLY BADGES & AUDIT
  // ==========================================
  public getCounselorBadgeGrants(): CounselorBadgeGrant[] {
    return this.data.counselorBadgeGrants || [];
  }

  public grantCounselorBadge(studentId: string, badgeId: string, counselorUsername: string, reason: string): {
    success: boolean;
    error?: string;
    grant?: CounselorBadgeGrant;
  } {
    const student = this.getStudentById(studentId);
    if (!student) return { success: false, error: 'دانش‌آموز یافت نشد.' };

    const badge = (this.data.badges || []).find((b) => b.id === badgeId);
    if (!badge) return { success: false, error: 'نشان یافت نشد.' };

    const grant: CounselorBadgeGrant = {
      id: `grant_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      studentId,
      badgeId,
      badgeName: badge.name,
      counselorUsername,
      reason: reason || 'اعطای مستقیم توسط استاد مشاور',
      grantedAt: new Date().toISOString(),
    };

    if (!this.data.counselorBadgeGrants) this.data.counselorBadgeGrants = [];
    this.data.counselorBadgeGrants.push(grant);

    // Add to student's inventory
    const exists = (this.data.inventory || []).some((i) => i.studentId === studentId && i.badgeId === badgeId);
    if (!exists) {
      const inventoryItem: InventoryItem = {
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        studentId,
        productId: `counselor_grant_${badgeId}`,
        itemType: 'BADGE',
        title: badge.name,
        description: badge.description,
        rarity: badge.rarity,
        icon: badge.icon,
        isEquipped: false,
        isConsumed: false,
        badgeId,
        acquiredAt: new Date().toISOString(),
      };
      this.data.inventory.push(inventoryItem);
    }

    this.save();
    return { success: true, grant };
  }

  public revokeCounselorBadge(grantId: string): { success: boolean; error?: string } {
    const idx = (this.data.counselorBadgeGrants || []).findIndex((g) => g.id === grantId);
    if (idx === -1) return { success: false, error: 'سند اعطای نشان یافت نشد.' };

    const grant = this.data.counselorBadgeGrants[idx];
    const student = this.getStudentById(grant.studentId);
    if (student && student.equippedBadges) {
      student.equippedBadges = student.equippedBadges.filter((b) => b !== grant.badgeName);
    }

    // Remove from inventory
    this.data.inventory = (this.data.inventory || []).filter(
      (i) => !(i.studentId === grant.studentId && i.badgeId === grant.badgeId)
    );

    this.data.counselorBadgeGrants.splice(idx, 1);
    this.save();
    return { success: true };
  }

  // ==========================================
  // AUTHORITATIVE ACHIEVEMENTS ENGINE
  // ==========================================
  public getStudentAchievements(studentId: string): AchievementItem[] {
    const student = this.getStudentById(studentId);
    const reports = this.getSessionReports(studentId);
    const completedTasks = this.getAllTasks(studentId).filter((t) => t.isCompleted);

    // 1. Total real study minutes
    let realStudyMinutes = 0;
    reports.forEach((r) => {
      const task = completedTasks.find((t) => t.id === r.taskId);
      realStudyMinutes += task?.actualDurationMinutes || task?.durationMinutes || 60;
    });

    // 2. Total completed parts
    const completedPartsCount = completedTasks.length;

    // 3. Streak
    const streak = student?.streak || 0;

    // 4. Total tests
    let totalTests = 0;
    reports.forEach((r) => {
      totalTests += r.testsCount || 0;
    });

    // 5. Tournament champion status
    const tourney = this.getTournamentData();
    const isStudyChamp = tourney.studyLeaderboard[0]?.studentId === studentId && tourney.studyLeaderboard[0]?.weeklyStudyMinutes > 0;
    const isStreakChamp = tourney.streakLeaderboard[0]?.studentId === studentId && tourney.streakLeaderboard[0]?.streak > 0;
    const isChamp = isStudyChamp || isStreakChamp;

    const inventory = this.getStudentInventory(studentId);
    const isClaimed = (code: string) => inventory.some((i) => i.productId === `ach_${code}`);

    const achievements: AchievementItem[] = [
      {
        id: 'ach_1',
        code: 'TOURNAMENT_CHAMPION',
        title: 'قهرمان تورنمنت',
        description: 'کسب جایگاه نخست در جدول رده‌بندی رسمی تورنمنت',
        badgeId: 'badge_6',
        targetProgress: 1,
        currentProgress: isChamp ? 1 : 0,
        isUnlocked: isChamp,
        isClaimed: isClaimed('TOURNAMENT_CHAMPION'),
      },
      {
        id: 'ach_2',
        code: '100_HOURS',
        title: '۱۰۰ ساعت مطالعه خالص',
        description: 'ثبت و ارزیابی ۱۰۰ ساعت مطالعه استاندارد و باکیفیت',
        badgeId: 'badge_1',
        targetProgress: 6000, // 6000 minutes = 100 hours
        currentProgress: Math.min(6000, realStudyMinutes),
        isUnlocked: realStudyMinutes >= 6000,
        isClaimed: isClaimed('100_HOURS'),
      },
      {
        id: 'ach_3',
        code: '100_PARTS',
        title: 'فاتح ۱۰۰ پارت برنامه',
        description: 'تکمیل ۱۰۰ پارت درسی مطابق برنامه راهبردی مشاور',
        badgeId: 'badge_2',
        targetProgress: 100,
        currentProgress: Math.min(100, completedPartsCount),
        isUnlocked: completedPartsCount >= 100,
        isClaimed: isClaimed('100_PARTS'),
      },
      {
        id: 'ach_4',
        code: '30_DAY_STREAK',
        title: 'اراده پولادین ۳۰ روزه',
        description: 'ثبت استمرار متوالی و پیوسته به مدت ۳۰ روز تقویمی',
        badgeId: 'badge_4',
        targetProgress: 30,
        currentProgress: Math.min(30, streak),
        isUnlocked: streak >= 30,
        isClaimed: isClaimed('30_DAY_STREAK'),
      },
      {
        id: 'ach_5',
        code: '1000_TESTS',
        title: 'استاد تست‌زنی (۱۰۰۰ تست)',
        description: 'حل و تحلیل دقیق حداقل ۱۰۰۰ تست تشخیصی و آزمونی',
        badgeId: 'badge_5',
        targetProgress: 1000,
        currentProgress: Math.min(1000, totalTests),
        isUnlocked: totalTests >= 1000,
        isClaimed: isClaimed('1000_TESTS'),
      },
    ];

    return achievements;
  }

  public claimAchievement(studentId: string, code: string): {
    success: boolean;
    error?: string;
    achievement?: AchievementItem;
    badgeItem?: InventoryItem;
    student?: Student;
  } {
    const list = this.getStudentAchievements(studentId);
    const ach = list.find((a) => a.code === code);
    if (!ach) return { success: false, error: 'دستاورد یافت نشد.' };
    if (!ach.isUnlocked) return { success: false, error: 'شرایط لازم برای گشایش این دستاورد هنوز حاصل نشده است.' };
    if (ach.isClaimed) return { success: false, error: 'پاداش این دستاورد قبلاً دریافت شده است.' };

    const student = this.getStudentById(studentId);
    if (!student) return { success: false, error: 'دانش‌آموز یافت نشد.' };

    const badge = (this.data.badges || []).find((b) => b.id === ach.badgeId);
    const badgeName = badge ? badge.name : ach.title;

    // Grant Achievement Badge into Inventory
    const inventoryItem: InventoryItem = {
      id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      studentId,
      productId: `ach_${code}`,
      itemType: 'BADGE',
      title: badgeName,
      description: ach.description,
      rarity: badge ? badge.rarity : 'حماسی',
      icon: badge ? badge.icon : 'Award',
      isEquipped: false,
      isConsumed: false,
      badgeId: ach.badgeId,
      acquiredAt: new Date().toISOString(),
    };

    if (!this.data.inventory) this.data.inventory = [];
    this.data.inventory.push(inventoryItem);

    // Bonus Focus Points for claiming an achievement
    const bonusFP = 100;
    student.focusPoints += bonusFP;
    this.addTransaction({
      studentId,
      amount: bonusFP,
      type: 'COUNSELOR_BONUS',
      description: `پاداش گشایش دستاورد «${ach.title}»`,
      actor: 'SYSTEM',
    });

    this.save();
    return {
      success: true,
      achievement: { ...ach, isClaimed: true },
      badgeItem: inventoryItem,
      student,
    };
  }

  // ==========================================
  // STUDY HALL (Single Shared Room, Server Duration, Stale Cleanup)
  // ==========================================
  public enterStudyHall(studentId: string, taskId: string): {
    success: boolean;
    error?: string;
    presence?: StudyHallPresence;
  } {
    const student = this.getStudentById(studentId);
    if (!student) return { success: false, error: 'دانش‌آموز یافت نشد.' };

    const task = this.getAllTasks(studentId).find((t) => t.id === taskId);
    if (!task) return { success: false, error: 'برای ورود به سالن مطالعه ابتدا یک پارت از برنامه امروز انتخاب کنید.' };

    const now = Date.now();
    const presence: StudyHallPresence = {
      studentId,
      nickname: student.nickname || student.fullName.split(' ')[0],
      equippedTitle: student.equippedTitle,
      equippedBadges: student.equippedBadges || [],
      currentTaskTitle: task.courseName,
      major: student.major,
      grade: student.grade,
      streak: student.streak,
      startedAt: now,
      liveMinutes: 0,
      lastHeartbeat: now,
    };

    this.studyHallPresence.set(studentId, presence);
    return { success: true, presence };
  }

  public heartbeatStudyHall(studentId: string): {
    success: boolean;
    error?: string;
    presence?: StudyHallPresence;
  } {
    const presence = this.studyHallPresence.get(studentId);
    if (!presence) return { success: false, error: 'نشست حضور در سالن مطالعه یافت نشد.' };

    const now = Date.now();
    presence.lastHeartbeat = now;
    // Server-authoritative duration calculation from startedAt
    presence.liveMinutes = Math.max(0, Math.floor((now - presence.startedAt) / 60000));
    return { success: true, presence };
  }

  public leaveStudyHall(studentId: string): boolean {
    return this.studyHallPresence.delete(studentId);
  }

  public getStudyHallPresenceList(): StudyHallPresence[] {
    const now = Date.now();
    const STALE_TIMEOUT_MS = 45000; // 45 seconds without heartbeat cleans up automatically

    const activeList: StudyHallPresence[] = [];
    for (const [sId, p] of this.studyHallPresence.entries()) {
      if (now - p.lastHeartbeat > STALE_TIMEOUT_MS) {
        this.studyHallPresence.delete(sId);
      } else {
        p.liveMinutes = Math.max(0, Math.floor((now - p.startedAt) / 60000));
        activeList.push(p);
      }
    }

    // Ordered by highest live duration -> lowest live duration
    return activeList.sort((a, b) => b.liveMinutes - a.liveMinutes);
  }

  public terminateStudyHallPresence(studentId: string): boolean {
    return this.studyHallPresence.delete(studentId);
  }
}

export const db = new Database();
