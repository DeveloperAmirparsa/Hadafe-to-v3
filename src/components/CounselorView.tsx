import React, { useState, useEffect } from 'react';
import { SpreadsheetPlanBuilder } from './SpreadsheetPlanBuilder.js';
import { PartReportsCalendar } from './PartReportsCalendar.js';
import { TournamentView } from './TournamentView.js';
import {
  Student,
  PlanTask,
  SessionReport,
  Habit,
  Reward,
  FocusPointTransaction,
  SystemSettings,
  ActivityType,
  TestMode,
  HabitLog,
  StudentRewardClaim,
  TournamentLeaderboardItem,
  BadgeItem,
  TitleItem,
  StoreProduct,
  InventoryItem,
  AchievementItem,
  StudyHallPresence,
  CounselorBadgeGrant,
  RarityType,
} from '../types/index.js';
import { toPersianDigits, getTodayISODate, formatPersianPercentage, formatPersianDateTime } from '../utils/persianDate.js';
import {
  Users,
  CalendarPlus,
  FileCheck2,
  Coins,
  Gift,
  ListTodo,
  Settings,
  UserPlus,
  Flame,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ShieldAlert,
  Sparkles,
  Clock,
  Clock3,
  CalendarDays,
  BellRing,
  Trophy,
  Radio,
  ShoppingBag,
  Award,
  Crown,
  Tag,
  ShieldCheck,
  RefreshCw,
  Eye,
  Shield,
  Package,
  Target,
} from 'lucide-react';
import { soundManager } from '../utils/audio.js';

interface Props {
  students: Student[];
  tasks: PlanTask[];
  reports: SessionReport[];
  habits: Habit[];
  rewards: Reward[];
  transactions: FocusPointTransaction[];
  settings: SystemSettings;
  tournamentData: {
    studyLeaderboard: TournamentLeaderboardItem[];
    testsLeaderboard: TournamentLeaderboardItem[];
    streakLeaderboard: TournamentLeaderboardItem[];
  };
  onRefreshData: () => Promise<void>;
  theme?: 'dark' | 'light';
  activeView?: string;
  onSelectView?: (view: string) => void;
}

type CounselorTab =
  | 'students'
  | 'approvals'
  | 'plan-builder'
  | 'reports'
  | 'tournament'
  | 'fp-transactions'
  | 'rewards'
  | 'habits'
  | 'settings'
  | 'study-hall'
  | 'store-mgmt'
  | 'badge-mgmt'
  | 'achievements';

export const CounselorView: React.FC<Props> = ({
  students,
  tasks,
  reports,
  habits,
  rewards,
  transactions,
  settings,
  tournamentData,
  onRefreshData,
  theme = 'dark',
  activeView,
  onSelectView,
}) => {
  const [activeTab, setActiveTab] = useState<CounselorTab>(() => {
    if (typeof window === 'undefined') return 'students';
    const saved = window.sessionStorage.getItem('hadafeto:counselor-active-tab') as CounselorTab | null;
    return saved || 'students';
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>(() => {
    if (typeof window === 'undefined') return students[0]?.id || '';
    return window.sessionStorage.getItem('hadafeto:counselor-selected-student') || students[0]?.id || '';
  });

  const switchTab = (tab: CounselorTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:counselor-active-tab', tab);
    }
    if (onSelectView) {
      if (tab === 'students') onSelectView('plan');
      else if (tab === 'plan-builder') onSelectView('plan-builder');
      else if (tab === 'reports') onSelectView('reports');
      else if (tab === 'approvals') onSelectView('approvals');
      else if (tab === 'study-hall') onSelectView('study-hall');
      else if (tab === 'store-mgmt') onSelectView('store');
      else if (tab === 'badge-mgmt' || tab === 'achievements') onSelectView('achievements');
      else if (tab === 'tournament') onSelectView('tournament');
      else if (tab === 'settings') onSelectView('settings');
      else if (tab === 'fp-transactions') onSelectView('fp-transactions');
      else if (tab === 'rewards') onSelectView('rewards');
      else if (tab === 'habits') onSelectView('habits');
    }
    if (tab === 'study-hall') fetchStudyHallPresence();
    else if (tab === 'store-mgmt') fetchStoreProductsAll();
    else if (tab === 'badge-mgmt') fetchBadgesAndTitles();
    else if (tab === 'approvals') fetchPendingData();
  };


  // Pending Items
  const [pendingHabits, setPendingHabits] = useState<Array<HabitLog & { studentName: string; studentNickname: string; habitTitle: string; habitCategory: string }>>([]);
  const [pendingRewards, setPendingRewards] = useState<Array<StudentRewardClaim & { studentName: string; studentNickname: string; rewardTitle: string; rewardIcon: string }>>([]);

  // Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [showAdjustFPModal, setShowAdjustFPModal] = useState(false);
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [showAddHabitModal, setShowAddHabitModal] = useState(false);
  const [showEditHabitModal, setShowEditHabitModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  // New Student Form
  const [newStudentFullName, setNewStudentFullName] = useState('');
  const [newStudentUsername, setNewStudentUsername] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentNickname, setNewStudentNickname] = useState('');
  const [newStudentMotto, setNewStudentMotto] = useState('هر روز، یک قدم نزدیک‌تر.');
  const [newStudentGrade, setNewStudentGrade] = useState<'دهم' | 'یازدهم' | 'دوازدهم' | 'فارغ‌التحصیل'>('دوازدهم');
  const [newStudentMajor, setNewStudentMajor] = useState<'علوم تجربی' | 'ریاضی فیزیک' | 'علوم انسانی' | 'هنر و منحصراً زبان'>('علوم تجربی');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentCity, setNewStudentCity] = useState('');
  const [newStudentNotes, setNewStudentNotes] = useState('');

  // Edit Student Form
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editMotto, setEditMotto] = useState('');
  const [editGrade, setEditGrade] = useState<'دهم' | 'یازدهم' | 'دوازدهم' | 'فارغ‌التحصیل'>('دوازدهم');
  const [editMajor, setEditMajor] = useState<'علوم تجربی' | 'ریاضی فیزیک' | 'علوم انسانی' | 'هنر و منحصراً زبان'>('علوم تجربی');
  const [editPhone, setEditPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Plan Builder Form
  const [planDate, setPlanDate] = useState(getTodayISODate());
  const [courseName, setCourseName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('مطالعه');
  const [testMode, setTestMode] = useState<TestMode>('آموزشی');
  const [minTests, setMinTests] = useState(30);
  const [durationMinutes, setDurationMinutes] = useState(75);
  const [isRest, setIsRest] = useState(false);

  // Adjust FP / Penalty Form
  const [fpAmount, setFpAmount] = useState<number>(50);
  const [fpReason, setFpReason] = useState('');
  const [isPenalty, setIsPenalty] = useState(false);

  // Reward Form
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardCost, setRewardCost] = useState(500);
  const [isFreeConsultingMonth, setIsFreeConsultingMonth] = useState(false);

  // Habit Form
  const [habitTitle, setHabitTitle] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [habitCategory, setHabitCategory] = useState<'روتین' | 'سلامت' | 'تمرکز' | 'مطالعه'>('روتین');

  // Edit Habit Form
  const [editHabitTitle, setEditHabitTitle] = useState('');
  const [editHabitDesc, setEditHabitDesc] = useState('');
  const [editHabitCategory, setEditHabitCategory] = useState<'روتین' | 'سلامت' | 'تمرکز' | 'مطالعه'>('روتین');

  // Diagnostic weights & Konkur Date state
  const [diagWeights, setDiagWeights] = useState(settings.diagnosticWeights);
  const [formulaString, setFormulaString] = useState(settings.testPercentageFormula);
  const [konkurDateInput, setKonkurDateInput] = useState(
    settings.konkurDate ? new Date(settings.konkurDate).toISOString().slice(0, 16) : '2027-04-23T08:00'
  );

  // Study Hall Monitoring state
  const [studyHallPresenceList, setStudyHallPresenceList] = useState<StudyHallPresence[]>([]);
  const [isRefreshingStudyHall, setIsRefreshingStudyHall] = useState(false);

  // Store Management state
  const [allStoreProducts, setAllStoreProducts] = useState<StoreProduct[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCost, setProdCost] = useState(300);
  const [prodRarity, setProdRarity] = useState<RarityType>('معمولی');
  const [prodCategory, setProdCategory] = useState<'BADGE' | 'TITLE' | 'CONSUMABLE' | 'SPECIAL'>('BADGE');
  const [prodIcon, setProdIcon] = useState('Award');
  const [prodIsConsumable, setProdIsConsumable] = useState(false);
  const [prodFeatured, setProdFeatured] = useState(false);

  // Badge & Title Management state
  const [allBadges, setAllBadges] = useState<BadgeItem[]>([]);
  const [allTitles, setAllTitles] = useState<TitleItem[]>([]);
  const [counselorGrants, setCounselorGrants] = useState<CounselorBadgeGrant[]>([]);
  const [grantTargetStudentId, setGrantTargetStudentId] = useState(students[0]?.id || '');
  const [grantBadgeId, setGrantBadgeId] = useState('badge_c_nabz');
  const [grantReason, setGrantReason] = useState('');
  const [showCreateBadgeModal, setShowCreateBadgeModal] = useState(false);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDesc, setNewBadgeDesc] = useState('');
  const [newBadgeRarity, setNewBadgeRarity] = useState<RarityType>('حماسی');
  const [newBadgeIcon, setNewBadgeIcon] = useState('Award');
  const [showCreateTitleModal, setShowCreateTitleModal] = useState(false);
  const [newTitleName, setNewTitleName] = useState('');
  const [newTitleDesc, setNewTitleDesc] = useState('');
  const [newTitleRarity, setNewTitleRarity] = useState<RarityType>('کمیاب');
  const [newTitleCost, setNewTitleCost] = useState(500);

  // Achievements & Claims state
  const [achievementInspectStudentId, setAchievementInspectStudentId] = useState(students[0]?.id || '');
  const [inspectedAchievements, setInspectedAchievements] = useState<AchievementItem[]>([]);

  // Student Inventory Inspector Modal state
  const [inspectStudentInventory, setInspectStudentInventory] = useState<Student | null>(null);
  const [inspectInventoryItems, setInspectInventoryItems] = useState<InventoryItem[]>([]);

  // Student Dossier & Goals Management Modal state
  const [dossierStudent, setDossierStudent] = useState<Student | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedId = window.sessionStorage.getItem('hadafeto:counselor-dossier-student');
    if (savedId) {
      return students.find((s) => s.id === savedId) || null;
    }
    return null;
  });

  // Keep open dossier synchronized with fresh students data after mutations
  useEffect(() => {
    if (dossierStudent) {
      const fresh = students.find((s) => s.id === dossierStudent.id);
      if (fresh) {
        setDossierStudent(fresh);
      }
    } else if (typeof window !== 'undefined') {
      const savedId = window.sessionStorage.getItem('hadafeto:counselor-dossier-student');
      if (savedId && students.length > 0) {
        const fresh = students.find((s) => s.id === savedId);
        if (fresh) setDossierStudent(fresh);
      }
    }
  }, [students]);

  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalType, setNewGoalType] = useState<'مطالعه' | 'تست' | 'دلخواه'>('مطالعه');
  const [newGoalTargetValue, setNewGoalTargetValue] = useState('100');
  const [newGoalRank, setNewGoalRank] = useState('');
  const [newGoalUniversity, setNewGoalUniversity] = useState('');
  const [newGoalIsPublic, setNewGoalIsPublic] = useState(true);

  // Banner message
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMsg({ text, type });
    setTimeout(() => setBannerMsg(null), 4000);
  };

  const openStudentDossier = (student: Student) => {
    setDossierStudent(student);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:counselor-dossier-student', student.id);
    }
    setShowAddGoalForm(false);
    setNewGoalTitle('');
    setNewGoalDesc('');
    setNewGoalRank('');
    setNewGoalUniversity('');
  };

  const closeStudentDossier = () => {
    setDossierStudent(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('hadafeto:counselor-dossier-student');
    }
  };

  const handleAddGoalForStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dossierStudent || !newGoalTitle.trim()) return;

    try {
      const res = await fetch(`/api/students/${dossierStudent.id}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoalTitle.trim(),
          description: newGoalDesc.trim(),
          targetType: newGoalType,
          targetValue: parseFloat(newGoalTargetValue) || undefined,
          targetRank: newGoalRank.trim() || undefined,
          targetUniversity: newGoalUniversity.trim() || undefined,
          isPublic: newGoalIsPublic,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showBanner('هدف جدید با موفقیت برای دانش‌آموز ثبت گردید.');
        setShowAddGoalForm(false);
        setNewGoalTitle('');
        setNewGoalDesc('');
        if (data.student) setDossierStudent(data.student);
        await onRefreshData();
      } else {
        const errData = await res.json();
        showBanner(errData.error || 'خطا در ثبت هدف', 'error');
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  const handleDeleteGoalForStudent = async (studentId: string, goalId: string) => {
    if (!window.confirm('آیا از حذف این هدف آموزشی اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/students/${studentId}/goals/${goalId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        showBanner('هدف مورد نظر با موفقیت حذف گردید.');
        if (data.student) setDossierStudent(data.student);
        await onRefreshData();
      } else {
        showBanner('خطا در حذف هدف', 'error');
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  // Sync activeTab with activeView from sidebar
  useEffect(() => {
    if (!activeView) return;
    const viewToTabMap: Record<string, CounselorTab> = {
      'study-hall': 'study-hall',
      'store': 'store-mgmt',
      'achievements': 'badge-mgmt',
      'tournament': 'tournament',
      'plan': 'students',
      'plan-builder': 'plan-builder',
      'reports': 'reports',
      'approvals': 'approvals',
      'settings': 'settings',
      'fp-transactions': 'fp-transactions',
      'rewards': 'rewards',
      'habits': 'habits',
    };
    const targetTab = viewToTabMap[activeView];
    if (targetTab && targetTab !== activeTab) {
      setActiveTab(targetTab);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('hadafeto:counselor-active-tab', targetTab);
      }
      if (targetTab === 'study-hall') fetchStudyHallPresence();
      else if (targetTab === 'store-mgmt') fetchStoreProductsAll();
      else if (targetTab === 'badge-mgmt') fetchBadgesAndTitles();
      else if (targetTab === 'approvals') fetchPendingData();
    }
  }, [activeView]);

  // Fetch pending submissions
  const fetchPendingData = async () => {
    try {
      const [hRes, rRes] = await Promise.all([
        fetch('/api/habits/pending'),
        fetch('/api/rewards/pending'),
      ]);
      if (hRes.ok) setPendingHabits(await hRes.json());
      if (rRes.ok) setPendingRewards(await rRes.json());
    } catch {
      // ignore
    }
  };

  const fetchStudyHallPresence = async () => {
    setIsRefreshingStudyHall(true);
    try {
      const res = await fetch('/api/study-hall/presence');
      if (res.ok) setStudyHallPresenceList(await res.json());
    } catch {
      // ignore
    } finally {
      setIsRefreshingStudyHall(false);
    }
  };

  const fetchStoreProductsAll = async () => {
    try {
      const res = await fetch('/api/store/products/all');
      if (res.ok) setAllStoreProducts(await res.json());
    } catch {
      // ignore
    }
  };

  const fetchBadgesAndTitles = async () => {
    try {
      const [bRes, tRes, gRes] = await Promise.all([
        fetch('/api/badges'),
        fetch('/api/titles'),
        fetch('/api/counselor/badge-grants'),
      ]);
      if (bRes.ok) setAllBadges(await bRes.json());
      if (tRes.ok) setAllTitles(await tRes.json());
      if (gRes.ok) setCounselorGrants(await gRes.json());
    } catch {
      // ignore
    }
  };

  const fetchInspectedAchievements = async (sId: string) => {
    if (!sId) return;
    try {
      const res = await fetch(`/api/achievements?studentId=${sId}`);
      if (res.ok) setInspectedAchievements(await res.json());
    } catch {
      // ignore
    }
  };

  const openInspectInventory = async (student: Student) => {
    setInspectStudentInventory(student);
    try {
      const res = await fetch(`/api/inventory?studentId=${student.id}`);
      if (res.ok) setInspectInventoryItems(await res.json());
    } catch {
      // ignore
    }
  };

  const handleTerminatePresence = async (studentId: string) => {
    try {
      const res = await fetch(`/api/study-hall/presence/${studentId}/terminate`, { method: 'POST' });
      if (res.ok) {
        showBanner('نشست سالن مطالعه با موفقیت خاتمه یافت.');
        fetchStudyHallPresence();
      }
    } catch {
      showBanner('خطا در خاتمه نشست', 'error');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim()) return;

    try {
      if (editingProduct) {
        const res = await fetch(`/api/store/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: prodTitle.trim(),
            description: prodDesc.trim(),
            cost: Math.max(0, Math.round(Number(prodCost) || 0)),
            rarity: prodRarity,
            category: prodCategory,
            icon: prodIcon,
            isConsumable: prodIsConsumable,
            featured: prodFeatured,
          }),
        });
        if (res.ok) {
          showBanner('محصول با موفقیت ویرایش شد.');
          setShowProductModal(false);
          setEditingProduct(null);
          fetchStoreProductsAll();
        } else {
          const err = await res.json();
          showBanner(err.error || 'خطا در ویرایش محصول', 'error');
        }
      } else {
        const res = await fetch('/api/store/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: prodTitle.trim(),
            description: prodDesc.trim(),
            cost: Math.max(0, Math.round(Number(prodCost) || 0)),
            rarity: prodRarity,
            category: prodCategory,
            icon: prodIcon,
            isConsumable: prodIsConsumable,
            featured: prodFeatured,
          }),
        });
        if (res.ok) {
          showBanner('محصول جدید به فروشگاه اضافه شد.');
          setShowProductModal(false);
          fetchStoreProductsAll();
        } else {
          const err = await res.json();
          showBanner(err.error || 'خطا در ثبت محصول', 'error');
        }
      }
    } catch {
      showBanner('خطای ارتباط با سرور', 'error');
    }
  };

  const handleToggleProductActive = async (prod: StoreProduct) => {
    try {
      const res = await fetch(`/api/store/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !prod.active }),
      });
      if (res.ok) {
        showBanner(`وضعیت محصول تغییر یافت.`);
        fetchStoreProductsAll();
      }
    } catch {
      showBanner('خطای ارتباط با سرور', 'error');
    }
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف یا غیرفعال‌سازی محصول «${title}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/store/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showBanner('محصول با موفقیت حذف یا غیرفعال گردید.');
        fetchStoreProductsAll();
      }
    } catch {
      showBanner('خطای ارتباط با سرور', 'error');
    }
  };

  const handleGrantBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantTargetStudentId || !grantBadgeId) return;

    try {
      const res = await fetch('/api/counselor/badge-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: grantTargetStudentId,
          badgeId: grantBadgeId,
          reason: grantReason.trim() || 'اعطای رسمی نشان توسط استاد مشاور',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playBadgeUnlock();
        showBanner('نشان انحصاری مشاور با موفقیت به دانش‌آموز اعطا گردید.');
        setGrantReason('');
        fetchBadgesAndTitles();
        onRefreshData();
      } else {
        showBanner(data.error || 'خطا در اعطای نشان', 'error');
      }
    } catch {
      showBanner('خطای ارتباط با سرور', 'error');
    }
  };

  const handleRevokeBadge = async (grantId: string, badgeName: string) => {
    if (!window.confirm(`آیا از لغو نشان «${badgeName}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/counselor/badge-grants/${grantId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showBanner('نشان با موفقیت از دانش‌آموز سلب شد.');
        fetchBadgesAndTitles();
        onRefreshData();
      } else {
        showBanner(data.error || 'خطا در لغو نشان', 'error');
      }
    } catch {
      showBanner('خطای ارتباط با سرور', 'error');
    }
  };

  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeName.trim()) return;
    try {
      const res = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBadgeName.trim(),
          description: newBadgeDesc.trim(),
          rarity: newBadgeRarity,
          icon: newBadgeIcon,
          isCounselorOnly: false,
        }),
      });
      if (res.ok) {
        showBanner('نشان جدید با موفقیت ایجاد شد.');
        setShowCreateBadgeModal(false);
        setNewBadgeName('');
        setNewBadgeDesc('');
        fetchBadgesAndTitles();
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  const handleDeleteBadge = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف نشان «${name}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/badges/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showBanner('نشان حذف شد.');
        fetchBadgesAndTitles();
      } else {
        showBanner(data.error || 'خطا در حذف نشان', 'error');
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  const handleCreateTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitleName.trim()) return;
    try {
      const res = await fetch('/api/titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitleName.trim(),
          description: newTitleDesc.trim(),
          rarity: newTitleRarity,
          cost: Math.max(0, Math.round(Number(newTitleCost) || 0)),
        }),
      });
      if (res.ok) {
        showBanner('عنوان جدید با موفقیت ایجاد شد.');
        setShowCreateTitleModal(false);
        setNewTitleName('');
        setNewTitleDesc('');
        fetchBadgesAndTitles();
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  const handleDeleteTitle = async (id: string, titleName: string) => {
    if (!window.confirm(`آیا از حذف عنوان «${titleName}» اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/titles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showBanner('عنوان حذف شد.');
        fetchBadgesAndTitles();
      } else {
        showBanner(data.error || 'خطا در حذف عنوان', 'error');
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('hadafeto:counselor-active-tab', activeTab);
    }
    fetchPendingData();
  }, [activeTab]);

  useEffect(() => {
    if (!selectedStudentId && students[0]?.id) {
      setSelectedStudentId(students[0].id);
      return;
    }
    if (selectedStudentId && students.length > 0 && !students.some((s) => s.id === selectedStudentId)) {
      const fallback = students[0].id;
      setSelectedStudentId(fallback);
      if (typeof window !== 'undefined') window.sessionStorage.setItem('hadafeto:counselor-selected-student', fallback);
    } else if (typeof window !== 'undefined' && selectedStudentId) {
      window.sessionStorage.setItem('hadafeto:counselor-selected-student', selectedStudentId);
    }
  }, [students, selectedStudentId]);

  // Handlers: Student CRUD
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentFullName || !newStudentUsername) return;

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newStudentFullName,
          username: newStudentUsername,
          password: newStudentPassword,
          nickname: newStudentNickname || newStudentFullName.split(' ')[0],
          motto: newStudentMotto,
          grade: newStudentGrade,
          major: newStudentMajor,
          phone: newStudentPhone,
          city: newStudentCity,
          counselorNotes: newStudentNotes,
        }),
      });
      if (res.ok) {
        showBanner('دانش‌آموز با موفقیت ایجاد شد.');
        setShowAddStudentModal(false);
        setNewStudentFullName('');
        setNewStudentUsername('');
        await onRefreshData();
      } else {
        const data = await res.json();
        showBanner(data.error || 'خطا در ایجاد دانش‌آموز', 'error');
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  const openEditStudentModal = (student: Student) => {
    setEditingStudent(student);
    setEditFullName(student.fullName);
    setEditUsername(student.username);
    setEditPassword('');
    setEditNickname(student.nickname || '');
    setEditMotto(student.motto || '');
    setEditGrade(student.grade);
    setEditMajor(student.major);
    setEditPhone(student.phone || '');
    setEditCity(student.city || '');
    setEditNotes(student.counselorNotes || '');
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await fetch(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName,
          username: editUsername,
          ...(editPassword.trim() ? { password: editPassword } : {}),
          nickname: editNickname,
          motto: editMotto,
          grade: editGrade,
          major: editMajor,
          phone: editPhone,
          city: editCity,
          counselorNotes: editNotes,
        }),
      });

      if (res.ok) {
        showBanner('اطلاعات دانش‌آموز با موفقیت ویرایش و بروزرسانی شد.');
        setShowEditStudentModal(false);
        setEditingStudent(null);
        await onRefreshData();
      } else {
        const data = await res.json();
        showBanner(data.error || 'خطا در بروزرسانی اطلاعات', 'error');
      }
    } catch {
      showBanner('خطا در ارتباط با سرور', 'error');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!window.confirm(`آیا از حذف کامل دانش‌آموز «${studentName}» و تمامی برنامه‌ها و گزارش‌های وی اطمینان دارید؟ این عمل غیرقابل بازگشت است.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
      if (res.ok) {
        showBanner(`دانش‌آموز «${studentName}» با موفقیت حذف گردید.`);
        await onRefreshData();
      } else {
        showBanner('خطا در حذف دانش‌آموز', 'error');
      }
    } catch {
      showBanner('خطای شبکه', 'error');
    }
  };

  // Handlers: Habit CRUD & Approvals
  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle) return;

    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: habitTitle,
          description: habitDesc,
          category: habitCategory,
        }),
      });
      if (res.ok) {
        showBanner('عادت با موفقیت تعریف گردید.');
        setShowAddHabitModal(false);
        setHabitTitle('');
        setHabitDesc('');
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در تعریف عادت', 'error');
    }
  };

  const openEditHabitModal = (habit: Habit) => {
    setEditingHabit(habit);
    setEditHabitTitle(habit.title);
    setEditHabitDesc(habit.description || '');
    setEditHabitCategory(habit.category);
    setShowEditHabitModal(true);
  };

  const handleUpdateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit) return;

    try {
      const res = await fetch(`/api/habits/${editingHabit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editHabitTitle,
          description: editHabitDesc,
          category: editHabitCategory,
        }),
      });
      if (res.ok) {
        showBanner('عادت با موفقیت ویرایش شد.');
        setShowEditHabitModal(false);
        setEditingHabit(null);
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در ویرایش عادت', 'error');
    }
  };

  const handleDeleteHabit = async (habitId: string, habitTitle: string) => {
    if (!window.confirm(`آیا از حذف عادت «${habitTitle}» اطمینان دارید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      if (res.ok) {
        showBanner(`عادت «${habitTitle}» حذف شد.`);
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در حذف عادت', 'error');
    }
  };

  const handleApproveHabit = async (logId: string) => {
    try {
      const res = await fetch(`/api/habits/logs/${logId}/approve`, { method: 'POST' });
      if (res.ok) {
        soundManager.playRewardCoin();
        showBanner('تکمیل عادت تایید شد و ۱۰ FP به دانش‌آموز اعطا گردید.');
        await fetchPendingData();
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در تایید عادت', 'error');
    }
  };

  const handleRejectHabit = async (logId: string) => {
    try {
      const res = await fetch(`/api/habits/logs/${logId}/reject`, { method: 'POST' });
      if (res.ok) {
        showBanner('درخواست تکمیل عادت رد شد.');
        await fetchPendingData();
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در رد عادت', 'error');
    }
  };

  // Handlers: Reward Claims Approvals
  const handleApproveReward = async (claimId: string) => {
    try {
      const res = await fetch(`/api/rewards/claims/${claimId}/approve`, { method: 'POST' });
      if (res.ok) {
        soundManager.playBadgeUnlock();
        showBanner('درخواست پاداش با موفقیت تایید شد و امتیاز لازم از دانش‌آموز کسر گردید.');
        await fetchPendingData();
        await onRefreshData();
      } else {
        const data = await res.json();
        showBanner(data.error || 'خطا در تایید پاداش', 'error');
      }
    } catch {
      showBanner('خطا در برقراری ارتباط با سرور', 'error');
    }
  };

  const handleRejectReward = async (claimId: string) => {
    try {
      const res = await fetch(`/api/rewards/claims/${claimId}/reject`, { method: 'POST' });
      if (res.ok) {
        showBanner('درخواست دریافت پاداش رد شد.');
        await fetchPendingData();
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در رد پاداش', 'error');
    }
  };

  // Settings Save (Formula, Weights, Konkur Date)
  const handleSaveSettings = async () => {
    try {
      const konkurIso = new Date(konkurDateInput).toISOString();

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testPercentageFormula: formulaString,
          diagnosticWeights: diagWeights,
          konkurDate: konkurIso,
        }),
      });

      if (res.ok) {
        showBanner('تنظیمات، تاریخ کنکور و ضرایب تشخیصی ذخیره گردید.');
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در ذخیره تنظیمات', 'error');
    }
  };

  // Handlers: Tasks & FP adjustments
  const handleResetStreak = async (studentId: string) => {
    if (!window.confirm('آیا از بازنشانی استمرار (Streak) این دانش‌آموز به ۰ روز اطمینان دارید؟')) {
      return;
    }
    try {
      const res = await fetch(`/api/students/${studentId}/reset-streak`, { method: 'POST' });
      if (res.ok) {
        showBanner('استمرار دانش‌آموز به صفر بازنشانی شد.');
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در بازنشانی استمرار', 'error');
    }
  };

  const handleAdjustFP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !fpAmount) return;

    const finalAmount = isPenalty ? -Math.abs(fpAmount) : Math.abs(fpAmount);
    try {
      const res = await fetch(`/api/students/${selectedStudentId}/adjust-fp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          reason: fpReason || (isPenalty ? 'جریمه مشاور' : 'پاداش تشویقی مشاور'),
          isPenalty,
        }),
      });
      if (res.ok) {
        showBanner(isPenalty ? 'جریمه کسر امتیاز با موفقیت اعمال شد.' : 'پاداش امتیاز با موفقیت ثبت شد.');
        setShowAdjustFPModal(false);
        setFpReason('');
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در اعمال امتیاز', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !courseName) {
      showBanner('نام درس و دانش‌آموز الزامی است.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
          date: planDate,
          courseName,
          activityType,
          testMode,
          minTests: testMode !== 'ندارد' ? minTests : 0,
          durationMinutes,
          isRest,
        }),
      });
      if (res.ok) {
        showBanner('پارت مطالعه به برنامه اضافه شد.');
        setCourseName('');
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در ایجاد پارت', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',        headers: {},
      });
      if (res.ok) {
        showBanner('پارت از برنامه حذف گردید.');
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در حذف پارت', 'error');
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle) return;

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rewardTitle,
          description: rewardDesc,
          cost: Number(rewardCost),
          icon: isFreeConsultingMonth ? 'Crown' : 'Gift',
          isFreeConsultingMonth,
        }),
      });
      if (res.ok) {
        showBanner('پاداش جدید در سامانه ثبت شد.');
        setShowAddRewardModal(false);
        setRewardTitle('');
        setRewardDesc('');
        await onRefreshData();
      }
    } catch {
      showBanner('خطا در ایجاد پاداش', 'error');
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const selectedStudentTasks = tasks.filter(
    (t) => t.studentId === selectedStudentId && t.date === planDate
  );

  const totalPendingCount = pendingHabits.length + pendingRewards.length;

  return (
    <div className="w-full space-y-6">
      {/* Top Banner Message */}
      {bannerMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
            bannerMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          <span>{bannerMsg.text}</span>
        </div>
      )}

      {/* Counselor Header */}
      <div
        className={`p-6 rounded-3xl ${
          theme === 'dark' ? 'glass-panel-dark' : 'glass-panel-light'
        } border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>اتاق فرماندهی مشاور · سامانه اختصاصی کنکور</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            پنل مدیریت و راهبری تحصیلی مشاور
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            کنترل کامل بر تایید عادت‌ها و جوایز، تاریخ کنکور، طراحی برنامه‌ها و ویرایش و حذف دانش‌آموزان
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddStudentModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>ثبت دانش‌آموز جدید</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/80 border border-white/5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => switchTab('students')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'students' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>دانش‌آموزان ({toPersianDigits(students.length)})</span>
        </button>

        <button
          onClick={() => switchTab('approvals')}
          className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'approvals' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>تایید درخواست‌ها</span>
          {totalPendingCount > 0 && (
            <span className="font-mono text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold animate-pulse">
              {toPersianDigits(totalPendingCount)}
            </span>
          )}
        </button>

        <button
          onClick={() => switchTab('plan-builder')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'plan-builder' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>طراحی برنامه (Plan Builder)</span>
        </button>

        <button
          onClick={() => switchTab('reports')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reports' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>گزارشات پارت‌ها ({toPersianDigits(reports.length)})</span>
        </button>

        <button
          onClick={() => switchTab('tournament')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tournament' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>تورنمنت</span>
        </button>

        <button
          onClick={() => switchTab('fp-transactions')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'fp-transactions' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>مدیریت امتیاز و جریمه</span>
        </button>

        <button
          onClick={() => switchTab('rewards')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'rewards' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>تنظیم جوایز و پاداش</span>
        </button>

        <button
          onClick={() => switchTab('habits')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'habits' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>کانفیگ عادت‌ها ({toPersianDigits(habits.length)})</span>
        </button>

        <button
          onClick={() => switchTab('settings')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'settings' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>تنظیم تاریخ کنکور و فرمول</span>
        </button>

        <button
          onClick={() => switchTab('study-hall')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'study-hall' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>سالن مطالعه زنده ({toPersianDigits(studyHallPresenceList.length)})</span>
        </button>

        <button
          onClick={() => switchTab('store-mgmt')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'store-mgmt' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>مدیریت فروشگاه و محصولات</span>
        </button>

        <button
          onClick={() => switchTab('badge-mgmt')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'badge-mgmt' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>نشان‌ها و عناوین (اعطای نشان مشاور)</span>
        </button>

        <button
          onClick={() => {
            const targetId = achievementInspectStudentId || students[0]?.id;
            if (targetId) {
              setAchievementInspectStudentId(targetId);
              fetchInspectedAchievements(targetId);
            }
            switchTab('achievements');
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'achievements' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>دستاوردها و پیشرفت</span>
        </button>
      </div>

      {/* Tab 1: Students Directory with EDIT & DELETE */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                className="p-5 rounded-3xl bg-slate-900/80 border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-100">{student.fullName}</span>
                        <span className="text-xs text-purple-400 font-mono">({student.username})</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {student.grade} · {student.major} · نام نمایشی: {student.nickname}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="px-2.5 py-1 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-300 font-mono font-bold text-xs">
                        {toPersianDigits(student.focusPoints)} FP
                      </div>
                      <div className="px-2.5 py-1 rounded-xl bg-amber-900/30 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{toPersianDigits(student.streak)} روز</span>
                      </div>
                    </div>
                  </div>

                  {student.motto && (
                    <div className="p-2.5 rounded-xl bg-slate-950/40 text-xs text-purple-300/90 italic mb-3">
                      «{student.motto}»
                    </div>
                  )}

                  {/* Private Details */}
                  <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-white/5">
                    <div className="flex justify-between">
                      <span>رمز عبور:</span>
                      <span className="font-mono text-slate-300">هش‌شده و غیرقابل نمایش</span>
                    </div>
                    <div className="flex justify-between">
                      <span>شماره تماس (محرمانه):</span>
                      <span className="font-mono text-slate-200">{student.phone || 'ثبت نشده'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>شهر سکونت (محرمانه):</span>
                      <span className="text-slate-200">{student.city || 'ثبت نشده'}</span>
                    </div>
                    {student.counselorNotes && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-800/40 text-[11px] text-slate-300">
                        <span className="text-purple-400 font-medium">یادداشت مشاور: </span>
                        {student.counselorNotes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Counselor Actions: Dossier & Goals, Edit, Delete, Bonus, Penalty, Streak, Part Reports */}
                <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                  <button
                    onClick={() => openStudentDossier(student)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>پرونده جامع، اهداف و دارایی‌ها</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        switchTab('plan-builder');
                      }}
                      className="py-2 px-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 border border-purple-500/25 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CalendarPlus className="w-3.5 h-3.5 text-purple-400" />
                      <span>طراحی برنامه</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        switchTab('reports');
                      }}
                      className="py-2 px-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>تقویم گزارش‌ها</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openInspectInventory(student)}
                      className="py-2 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/25 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-amber-400" />
                      <span>صندوق تجهیزات</span>
                    </button>

                    <button
                      onClick={() => {
                        setAchievementInspectStudentId(student.id);
                        fetchInspectedAchievements(student.id);
                        switchTab('achievements');
                      }}
                      className="py-2 px-2.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/25 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-blue-400" />
                      <span>دستاوردها</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditStudentModal(student)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>ویرایش اطلاعات</span>
                    </button>
                    <button
                      onClick={() => handleDeleteStudent(student.id, student.fullName)}
                      className="py-1.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors flex items-center gap-1"
                      title="حذف کامل حساب دانش‌آموز"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف دانش‌آموز</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setIsPenalty(false);
                        setShowAdjustFPModal(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
                    >
                      + پاداش FP
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setIsPenalty(true);
                        setShowAdjustFPModal(true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
                    >
                      - جریمه FP
                    </button>
                    <button
                      onClick={() => handleResetStreak(student.id)}
                      className="py-1.5 px-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors flex items-center gap-1"
                      title="ریست استمرار"
                    >
                      <Flame className="w-3 h-3" />
                      <span>ریست استمرار</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: APPROVALS QUEUE (Habits & Rewards) */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Section 1: Pending Habits */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-purple-400" />
                  <span>درخواست‌های تایید عادت‌های روزانه دانش‌آموزان</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  زمان دقیق تیک خوردن هر عادت ثبت شده و پس از تایید شما ۱۰ FP به دانش‌آموز تعلق می‌گیرد.
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-900/40 text-purple-300 border border-purple-500/30">
                {toPersianDigits(pendingHabits.length)} مورد در انتظار
              </span>
            </div>

            {pendingHabits.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-slate-500 text-xs">
                در حال حاضر هیچ درخواست تایید عادتی در صف وجود ندارد.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingHabits.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-100 text-sm">{item.studentName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-medium text-purple-300">{item.habitTitle}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px]">
                          {item.habitCategory}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>زمان دقیق ثبت تیک توسط دانش‌آموز: {formatPersianDateTime(item.requestedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleRejectHabit(item.id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-colors"
                      >
                        رد
                      </button>
                      <button
                        onClick={() => handleApproveHabit(item.id)}
                        className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید و اعطای +۱۰ FP</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Pending Reward Claims */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span>درخواست‌های دریافت جوایز و پاداش‌ها</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  دانش‌آموزان درخواست پاداش را ثبت کرده‌اند و با تایید مشاور، امتیاز مربوطه کسر و جایزه تقدیم می‌شود.
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-900/40 text-amber-300 border border-amber-500/30">
                {toPersianDigits(pendingRewards.length)} مورد در انتظار
              </span>
            </div>

            {pendingRewards.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-dashed border-white/10 text-slate-500 text-xs">
                در حال حاضر هیچ درخواست پاداشی در صف تایید وجود ندارد.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRewards.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-100 text-sm">{item.studentName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="font-bold text-amber-300 text-sm">{item.rewardTitle}</span>
                        <span className="font-mono font-bold text-purple-300 px-2 py-0.5 rounded-lg bg-purple-900/30 border border-purple-500/30">
                          {toPersianDigits(item.costPaid)} FP
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>زمان دقیق ثبت درخواست: {formatPersianDateTime(item.claimedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleRejectReward(item.id)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-colors"
                      >
                        رد
                      </button>
                      <button
                        onClick={() => handleApproveReward(item.id)}
                        className="py-1.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/30 transition-all"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>تایید پاداش و کسر امتیاز</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Spreadsheet Plan Builder */}
      {activeTab === 'plan-builder' && (
        <SpreadsheetPlanBuilder
          students={students}
          tasks={tasks}
          selectedStudentId={selectedStudentId}
          onSelectStudentId={setSelectedStudentId}
          onRefreshData={onRefreshData}
          theme={theme}
        />
      )}

      {/* Tab 4: Part Reports Calendar & Session Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-900/80 border border-white/5 flex-wrap gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-400" />
                <span>تقویم و گزارش پارت‌های دانش‌آموز</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                نمایش وضعیت سبز (انجام شده) و قرمز (انجام نشده / از دست رفته) به همراه جزئیات کامل گزارش هر پارت
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">دانش‌آموز:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:border-purple-500 focus:outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.major})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedStudent && (
            <PartReportsCalendar
              student={selectedStudent}
              tasks={tasks}
              reports={reports}
              theme={theme}
              isCounselor={true}
            />
          )}

          <div className="space-y-3 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-slate-300">
              فهرست تاریخچه گزارش‌های جلسات مطالعه ثبت‌شده ({toPersianDigits(reports.length)})
            </h4>

            {reports.map((r) => {
              const student = students.find((s) => s.id === r.studentId);

              return (
                <div
                  key={r.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-white/5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">
                          {student?.fullName || 'دانش‌آموز'}
                        </span>
                        <span className="text-xs text-purple-400 font-mono">
                          +{toPersianDigits(r.focusPointsEarned)} FP
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        درس: {r.courseName} · تاریخ: {r.date}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="text-slate-400">تمرکز: </span>
                        <span className="font-mono font-bold text-purple-300">{toPersianDigits(r.focus)}/۵</span>
                      </div>
                      <div>
                        <span className="text-slate-400">رضایت: </span>
                        <span className="font-mono font-bold text-purple-300">{toPersianDigits(r.satisfaction)}/۵</span>
                      </div>
                    </div>
                  </div>

                  {r.testResult && (
                    <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-slate-300">
                        <span>کل: {toPersianDigits(r.testResult.total)}</span>
                        <span className="text-emerald-400">صحیح: {toPersianDigits(r.testResult.correct)}</span>
                        <span className="text-rose-400">غلط: {toPersianDigits(r.testResult.wrong)}</span>
                        <span className="text-slate-400">نزده: {toPersianDigits(r.testResult.unanswered)}</span>
                      </div>
                      <div className="font-mono font-bold text-sm text-purple-300">
                        درصد: {formatPersianPercentage(r.testResult.percentage)}
                      </div>
                    </div>
                  )}

                  {r.reflectionNote && (
                    <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
                      <span className="text-purple-400 font-semibold">توضیح دانش‌آموز: </span>
                      {r.reflectionNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Tournament */}
      {activeTab === 'tournament' && (
        <TournamentView
          tournamentData={tournamentData}
          theme={theme}
        />
      )}

      {/* Tab 6: FP Transactions */}
      {activeTab === 'fp-transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              ثبت شفاف و بدون بازگشت تمام تراکنش‌های امتیاز، پاداش‌ها و جریمه‌ها
            </div>
            <button
              onClick={() => {
                setIsPenalty(true);
                setShowAdjustFPModal(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/30 text-xs font-bold transition-colors"
            >
              - ثبت جریمه فوری برای دانش‌آموز
            </button>
          </div>

          <div className="space-y-2">
            {transactions.map((tx) => {
              const student = students.find((s) => s.id === tx.studentId);
              const isPositive = tx.amount > 0;

              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold text-sm px-2 py-0.5 rounded-lg tabular-nums ${
                        isPositive
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isPositive ? `+${toPersianDigits(tx.amount)}` : toPersianDigits(tx.amount)} FP
                    </span>
                    <div>
                      <div className="font-bold text-slate-100">
                        {student?.fullName || 'دانش‌آموز'} · {tx.description}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        توسط: {tx.actor === 'COUNSELOR' ? 'مشاور' : 'سیستم'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 6: Rewards Config */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              تعریف و ویرایش پاداش‌ها و تنظیم هزینه «یک ماه مشاوره رایگان»
            </div>
            <button
              onClick={() => setShowAddRewardModal(true)}
              className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تعریف پاداش جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-100">{r.title}</span>
                    <span className="font-mono font-bold text-xs text-purple-300 px-2 py-0.5 rounded-lg bg-purple-900/30 border border-purple-500/30">
                      {toPersianDigits(r.cost)} FP
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    {r.description}
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-white/5">
                  وضعیت: {r.active ? 'فعال در فروشگاه دانش‌آموز' : 'غیرفعال'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Habits Config & Delete */}
      {activeTab === 'habits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">
              کانفیگ، ویرایش و حذف عادت‌های رفتاری تعریف‌شده برای دانش‌آموزان
            </div>
            <button
              onClick={() => setShowAddHabitModal(true)}
              className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تعریف عادت جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {habits.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-white/5 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-100">{h.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{h.description}</div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-purple-300 font-medium">
                    {h.category}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => openEditHabitModal(h)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors flex items-center gap-1 text-xs"
                    title="ویرایش عادت"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </button>
                  <button
                    onClick={() => handleDeleteHabit(h.id, h.title)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1 text-xs"
                    title="حذف عادت"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 8: Settings (Formula, Diagnostic Weights & KONKUR DATE) */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 space-y-6 max-w-2xl text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-400" />
              <span>تنظیم روز کنکور و شاخص‌های تشخیصی</span>
            </h2>
            <p className="text-slate-400">
              مشاور می‌تواند تاریخ دقیق کنکور سراسری، فرمول نمره منفی و ضرایب ارزیابی را تنظیم کند.
            </p>
          </div>

          {/* Konkur Date Input */}
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
            <label className="block text-purple-300 font-bold">
              تاریخ و ساعت برگزاری کنکور سراسری (برای تایمر شمارش معکوس):
            </label>
            <input
              type="datetime-local"
              value={konkurDateInput}
              onChange={(e) => setKonkurDateInput(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-mono text-sm focus:border-purple-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 block">
              این تاریخ به طور مستقیم در تایمر روز، ساعت، دقیقه و ثانیه تا کنکور در بالای اپلیکیشن اعمال می‌شود.
            </span>
          </div>

          {/* Formula */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              فرمول محاسبه درصد آزمونی (با نمره منفی):
            </label>
            <input
              type="text"
              value={formulaString}
              onChange={(e) => setFormulaString(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 font-mono text-purple-300 text-sm focus:border-purple-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              استاندارد کنکور: ((correct - wrong / 3) / total) * 100
            </span>
          </div>

          {/* Weights */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <h3 className="font-bold text-slate-200">وزن شاخص‌های تشخیصی در کارنامه:</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">وزن ساعت مطالعه:</label>
                <input
                  type="number"
                  step="0.05"
                  value={diagWeights.studyHours}
                  onChange={(e) =>
                    setDiagWeights({ ...diagWeights, studyHours: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">وزن تعداد تست:</label>
                <input
                  type="number"
                  step="0.05"
                  value={diagWeights.tests}
                  onChange={(e) =>
                    setDiagWeights({ ...diagWeights, tests: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">وزن استمرار (Streak):</label>
                <input
                  type="number"
                  step="0.05"
                  value={diagWeights.streak}
                  onChange={(e) =>
                    setDiagWeights({ ...diagWeights, streak: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">وزن تحقق برنامه:</label>
                <input
                  type="number"
                  step="0.05"
                  value={diagWeights.planCompletion}
                  onChange={(e) =>
                    setDiagWeights({ ...diagWeights, planCompletion: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors"
          >
            ذخیره تنظیمات و بروزرسانی روز کنکور
          </button>
        </div>
      )}

      {/* Tab 9: STUDY HALL LIVE MONITORING */}
      {activeTab === 'study-hall' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-1">
                <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>مانیتورینگ زنده و پایش حضور سالن مطالعه</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                سالن مطالعه اشتراکی (اتاق نظارت استاد مشاور)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                مشاهده لحظه‌ای دانش‌آموزان آنلاین، پارت‌های در حال مطالعه، زمان زنده و قابلیت خاتمه نشست‌های رهاشده.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchStudyHallPresence}
              disabled={isRefreshingStudyHall}
              className="py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStudyHall ? 'animate-spin' : ''}`} />
              <span>به‌روزرسانی فهرست</span>
            </button>
          </div>

          {studyHallPresenceList.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-white/5 text-slate-400 space-y-2">
              <Radio className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <h3 className="text-base font-bold text-slate-300">
                فعلاً دانش‌آموزی در سالن مطالعه نیست
              </h3>
              <p className="text-xs text-slate-500">
                به محض ورود هر دانش‌آموز با یک پارت درسی معتبر، مشخصات و تایمر لحظه‌ای در این صفحه ظاهر می‌شود.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studyHallPresenceList.map((p, idx) => (
                <div
                  key={p.studentId}
                  className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col justify-between space-y-4 shadow-lg hover:border-purple-500/30 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-300 font-bold text-xs flex items-center justify-center border border-purple-500/30 font-mono">
                          {toPersianDigits(idx + 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-100">{p.nickname}</span>
                            {p.equippedTitle && (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                                «{p.equippedTitle}»
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            {p.major} · {p.grade}
                          </span>
                        </div>
                      </div>

                      {p.streak > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-orange-500/15 text-orange-300 border border-orange-500/20 text-[10px] font-mono font-bold">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span>{toPersianDigits(p.streak)}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block mb-0.5">پارت در حال مطالعه:</span>
                      <span className="text-xs font-bold text-slate-200 line-clamp-1">
                        {p.currentTaskTitle}
                      </span>
                    </div>

                    {p.equippedBadges && p.equippedBadges.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.equippedBadges.map((badge) => (
                          <span
                            key={badge}
                            className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-medium flex items-center gap-1"
                          >
                            <Award className="w-2.5 h-2.5 text-amber-400" />
                            <span>{badge}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{toPersianDigits(p.liveMinutes)} دقیقه حضور زنده</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTerminatePresence(p.studentId)}
                      className="py-1 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
                    >
                      خاتمه نشست
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 10: STORE PRODUCTS MANAGEMENT */}
      {activeTab === 'store-mgmt' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-1">
                <ShoppingBag className="w-4 h-4" />
                <span>مدیریت محصولات، قیمت‌ها و کمیابی</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                فروشگاه پاداش‌ها و محصولات Focus Point
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                تعریف نشان‌های دیجیتال، عناوین هویتی، مجوزهای استراحت و مشاوره با سیستم نایابی ۵‌سطحی.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setProdTitle('');
                setProdDesc('');
                setProdCost(300);
                setProdRarity('معمولی');
                setProdCategory('BADGE');
                setProdIcon('Award');
                setProdIsConsumable(false);
                setProdFeatured(false);
                setShowProductModal(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن محصول جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allStoreProducts.map((prod) => (
              <div
                key={prod.id}
                className={`p-5 rounded-3xl bg-slate-900/80 border transition-all flex flex-col justify-between space-y-4 ${
                  !prod.active ? 'opacity-50 border-dashed border-white/20' : 'border-white/10 hover:border-purple-500/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {prod.rarity}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {prod.category}
                      </span>
                      {prod.isConsumable ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px]">مصرفی</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">دائمی</span>
                      )}
                      {prod.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">ویژه</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span>{prod.title}</span>
                      {!prod.active && <span className="text-[10px] text-rose-400 font-normal">(غیرفعال)</span>}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {prod.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="font-mono font-bold text-purple-300">
                    {toPersianDigits(prod.cost)} FP
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleProductActive(prod)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                        prod.active
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-white/10'
                      }`}
                    >
                      {prod.active ? 'فعال' : 'غیرفعال'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(prod);
                        setProdTitle(prod.title);
                        setProdDesc(prod.description);
                        setProdCost(prod.cost);
                        setProdRarity(prod.rarity);
                        setProdCategory(prod.category);
                        setProdIcon(prod.icon || 'Award');
                        setProdIsConsumable(!!prod.isConsumable);
                        setProdFeatured(!!prod.featured);
                        setShowProductModal(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod.id, prod.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="حذف یا غیرفعال‌سازی"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 11: BADGES & TITLES + 3 SPECIAL COUNSELOR BADGES */}
      {activeTab === 'badge-mgmt' && (
        <div className="space-y-6">
          {/* Section A: 3 Ultra-Rare Counselor Badges Grant Panel */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-950 border border-amber-500/40 shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>اعطای مستقیم ۳ نشان انحصاری استاد مشاور</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                نشان‌های والامرتبه مشاوره کنکور
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                این ۳ نشان در فروشگاه فروخته نمی‌شوند و تنها با ارزیابی و تقدیر اختصاصی استاد مشاور به دانش‌آموز اعطا می‌گردند.
              </p>
            </div>

            {/* 3 Special Badge Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-300">نشان نبض برتر</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">اسطوره‌ای</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  بالاترین نشان افتخار مشاوره برای نظم و رشد جهشی بالینی در مطالعه.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">نشان مسیر طلایی</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">افسانه‌ای</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  نشان ویژه وفاداری بی‌نقص به نقشه راه راهبردی و استراتژی مشاوره.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/40 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-purple-300">نشان مهر مشاور</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">حماسی</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  تاییدیه انحصاری استاد مشاور به پاس اراده پولادین و اخلاق حرفه‌ای تحصیلی.
                </p>
              </div>
            </div>

            {/* Grant Form */}
            <form onSubmit={handleGrantBadge} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h3 className="text-xs font-bold text-slate-200">فرم تخصیص نشان انحصاری به دانش‌آموز:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">انتخاب دانش‌آموز:</label>
                  <select
                    value={grantTargetStudentId}
                    onChange={(e) => setGrantTargetStudentId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white"
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">انتخاب نشان مشاور:</label>
                  <select
                    value={grantBadgeId}
                    onChange={(e) => setGrantBadgeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white"
                    required
                  >
                    <option value="badge_c_nabz">نشان نبض برتر (اسطوره‌ای)</option>
                    <option value="badge_c_masir">نشان مسیر طلایی (افسانه‌ای)</option>
                    <option value="badge_c_mohr">نشان مهر مشاور (حماسی)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">علت و متن تقدیرنامه مشاور:</label>
                  <input
                    type="text"
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    placeholder="مثال: رشد چشمگیر در تراز زیست‌شناسی"
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>اعطای رسمی و ثبت در موجودی دانش‌آموز</span>
              </button>
            </form>

            {/* Grant Audit Trail */}
            {counselorGrants.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-300 block">
                  سوابق و تاریخچه اعطای نشان‌های انحصاری:
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {counselorGrants.map((grant) => {
                    const student = students.find((s) => s.id === grant.studentId);
                    return (
                      <div
                        key={grant.id}
                        className="p-3 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-200">
                              {student?.fullName || grant.studentId}
                            </span>
                            <span className="text-slate-400 mx-2">·</span>
                            <span className="text-amber-300 font-semibold">{grant.badgeName}</span>
                            <span className="text-slate-500 text-[10px] block mt-0.5">
                              علت: {grant.reason} · زمان: {formatPersianDateTime(grant.grantedAt)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRevokeBadge(grant.id, grant.badgeName)}
                          className="py-1 px-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-[11px] transition-colors cursor-pointer"
                        >
                          لغو نشان
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section B: All Badges and Titles Catalog */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Badges Column */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  <span>فهرست نشان‌های رسمی ({toPersianDigits(allBadges.length)})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateBadgeModal(true)}
                  className="py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>نشان جدید</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {allBadges.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{b.name}</span>
                        <span className="px-2 py-0.2 rounded-md bg-purple-500/20 text-purple-300 text-[10px]">
                          {b.rarity}
                        </span>
                        {b.isCounselorOnly && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            انحصاری
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{b.description}</span>
                    </div>

                    {!b.isCounselorOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBadge(b.id, b.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Titles Column */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-indigo-400" />
                  <span>فهرست عناوین هویتی ({toPersianDigits(allTitles.length)})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateTitleModal(true)}
                  className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>عنوان جدید</span>
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {allTitles.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">«{t.title}»</span>
                        <span className="px-2 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px]">
                          {t.rarity}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px]">{toPersianDigits(t.cost)} FP</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{t.description}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTitle(t.id, t.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 12: ACHIEVEMENTS & STUDENT PROGRESS INSPECTION */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/25 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-400 font-bold mb-1">
                <Shield className="w-4 h-4" />
                <span>پایش دستاوردهای ۵‌گانه آکادمیک</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">
                بررسی وضعیت پیشرفت دستاوردهای دانش‌آموزان
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                مشاهده میزان پیشرفت دقیق هر دانش‌آموز در ۵ دستاورد اصلی کنکور (ساعات مطالعه، پارت‌ها، استمرار، تست‌ها و تورنمنت).
              </p>
            </div>

            {/* Student Picker */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 whitespace-nowrap">انتخاب دانش‌آموز:</span>
              <select
                value={achievementInspectStudentId}
                onChange={(e) => {
                  setAchievementInspectStudentId(e.target.value);
                  fetchInspectedAchievements(e.target.value);
                }}
                className="p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-bold"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.username})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspectedAchievements.map((ach) => {
              const progressPct = Math.min(
                100,
                Math.round((ach.currentProgress / (ach.targetProgress || 1)) * 100)
              );

              return (
                <div
                  key={ach.id}
                  className={`p-5 rounded-3xl bg-slate-900/80 border flex flex-col justify-between space-y-4 ${
                    ach.isClaimed
                      ? 'border-emerald-500/30'
                      : ach.isUnlocked
                      ? 'border-purple-500/50'
                      : 'border-white/5 opacity-80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200">{ach.title}</span>
                      {ach.isClaimed ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          دریافت شده
                        </span>
                      ) : ach.isUnlocked ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                          گشایش یافته (در انتظار دریافت)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                          قفل
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{ach.description}</p>

                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>میزان پیشرفت:</span>
                        <span className="text-slate-200 font-bold">
                          {toPersianDigits(ach.currentProgress)} / {toPersianDigits(ach.targetProgress)}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full ${ach.isClaimed ? 'bg-emerald-500' : 'bg-purple-600'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Store Product Create/Edit */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100">
              {editingProduct ? 'ویرایش محصول فروشگاه' : 'ایجاد محصول جدید برای فروشگاه FP'}
            </h2>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">عنوان محصول:</label>
                <input
                  type="text"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="مثال: عنوان «پیشگام» یا ۳۰ دقیقه استراحت"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">توضیحات محصول:</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">قیمت (Focus Points):</label>
                  <input
                    type="number"
                    value={prodCost}
                    onChange={(e) => setProdCost(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">درجه نایابی (Rarity):</label>
                  <select
                    value={prodRarity}
                    onChange={(e) => setProdRarity(e.target.value as RarityType)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="معمولی">معمولی</option>
                    <option value="کمیاب">کمیاب</option>
                    <option value="حماسی">حماسی</option>
                    <option value="افسانه‌ای">افسانه‌ای</option>
                    <option value="اسطوره‌ای">اسطوره‌ای</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">دسته‌بندی محصول:</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="BADGE">نشان افتخار (BADGE)</option>
                    <option value="TITLE">عنوان هویتی (TITLE)</option>
                    <option value="CONSUMABLE">استراحت و مصرفی (CONSUMABLE)</option>
                    <option value="SPECIAL">مشاوره ویژه (SPECIAL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">آیکون:</label>
                  <select
                    value={prodIcon}
                    onChange={(e) => setProdIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 font-mono"
                  >
                    <option value="Award">Award</option>
                    <option value="Target">Target</option>
                    <option value="Activity">Activity</option>
                    <option value="Sunrise">Sunrise</option>
                    <option value="Flame">Flame</option>
                    <option value="Zap">Zap</option>
                    <option value="Trophy">Trophy</option>
                    <option value="Crown">Crown</option>
                    <option value="Coffee">Coffee</option>
                    <option value="Gamepad2">Gamepad2</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodIsConsumable}
                    onChange={(e) => setProdIsConsumable(e.target.checked)}
                    className="rounded text-purple-600"
                  />
                  <span>آیتم مصرفی است (یک‌بار مصرف)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodFeatured}
                    onChange={(e) => setProdFeatured(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>محصول ویژه (Featured)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  ذخیره محصول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Badge */}
      {showCreateBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4">
            <h2 className="text-base font-bold text-slate-100">ثبت نشان افتخار جدید</h2>
            <form onSubmit={handleCreateBadge} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">نام نشان:</label>
                <input
                  type="text"
                  value={newBadgeName}
                  onChange={(e) => setNewBadgeName(e.target.value)}
                  placeholder="مثال: نشان تحلیل جامع"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">توضیحات و ملاک اعطا:</label>
                <textarea
                  value={newBadgeDesc}
                  onChange={(e) => setNewBadgeDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نایابی:</label>
                  <select
                    value={newBadgeRarity}
                    onChange={(e) => setNewBadgeRarity(e.target.value as RarityType)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="معمولی">معمولی</option>
                    <option value="کمیاب">کمیاب</option>
                    <option value="حماسی">حماسی</option>
                    <option value="افسانه‌ای">افسانه‌ای</option>
                    <option value="اسطوره‌ای">اسطوره‌ای</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">آیکون:</label>
                  <select
                    value={newBadgeIcon}
                    onChange={(e) => setNewBadgeIcon(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 font-mono"
                  >
                    <option value="Award">Award</option>
                    <option value="Target">Target</option>
                    <option value="Flame">Flame</option>
                    <option value="Zap">Zap</option>
                    <option value="Trophy">Trophy</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateBadgeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  ثبت نشان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Title */}
      {showCreateTitleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4">
            <h2 className="text-base font-bold text-slate-100">ثبت عنوان هویتی جدید</h2>
            <form onSubmit={handleCreateTitle} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">عنوان (بدون گیومه):</label>
                <input
                  type="text"
                  value={newTitleName}
                  onChange={(e) => setNewTitleName(e.target.value)}
                  placeholder="مثال: استراتژیست"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">توضیحات عنوان:</label>
                <textarea
                  value={newTitleDesc}
                  onChange={(e) => setNewTitleDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نایابی:</label>
                  <select
                    value={newTitleRarity}
                    onChange={(e) => setNewTitleRarity(e.target.value as RarityType)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="معمولی">معمولی</option>
                    <option value="کمیاب">کمیاب</option>
                    <option value="حماسی">حماسی</option>
                    <option value="افسانه‌ای">افسانه‌ای</option>
                    <option value="اسطوره‌ای">اسطوره‌ای</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">قیمت پایه FP:</label>
                  <input
                    type="number"
                    value={newTitleCost}
                    onChange={(e) => setNewTitleCost(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateTitleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  ثبت عنوان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Inventory Inspector */}
      {inspectStudentInventory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-slate-100">
                  موجودی و تجهیزات دانش‌آموز: {inspectStudentInventory.fullName}
                </h3>
                <span className="text-slate-400 text-[11px] block mt-0.5">
                  امتیاز تمرکز: {toPersianDigits(inspectStudentInventory.focusPoints)} FP · استمرار: {toPersianDigits(inspectStudentInventory.streak)} روز
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectStudentInventory(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectInventoryItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                هنوز هیچ آیتمی در موجودی این دانش‌آموز ثبت نشده است.
              </div>
            ) : (
              <div className="space-y-2.5">
                {inspectInventoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{item.title}</span>
                        <span className="px-2 py-0.2 rounded-md bg-purple-500/20 text-purple-300 text-[10px]">
                          {item.rarity}
                        </span>
                        {item.isEquipped && (
                          <span className="px-2 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                            مجهز شده
                          </span>
                        )}
                        {item.isConsumed && (
                          <span className="px-2 py-0.2 rounded-md bg-slate-800 text-slate-400 text-[10px]">
                            مصرف شده
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 text-[11px] block mt-0.5">{item.description}</span>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatPersianDateTime(item.acquiredAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Student */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100">ایجاد دانش‌آموز کنکوری جدید</h2>

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    value={newStudentFullName}
                    onChange={(e) => setNewStudentFullName(e.target.value)}
                    placeholder="مثال: آرین محمدی"
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">نام کاربری (جهت لاگین):</label>
                  <input
                    type="text"
                    value={newStudentUsername}
                    onChange={(e) => setNewStudentUsername(e.target.value)}
                    placeholder="مثال: aryan"
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">رمز عبور:</label>
                  <input
                    type="password"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    placeholder="حداقل ۱۰ کاراکتر"
                    minLength={10}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">نام نمایشی (Nickname):</label>
                  <input
                    type="text"
                    value={newStudentNickname}
                    onChange={(e) => setNewStudentNickname(e.target.value)}
                    placeholder="نام در تورنمنت"
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">پایه تحصیلی:</label>
                  <select
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="دهم">دهم</option>
                    <option value="یازدهم">یازدهم</option>
                    <option value="دوازدهم">دوازدهم</option>
                    <option value="فارغ‌التحصیل">فارغ‌التحصیل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رشته تحصیلی:</label>
                  <select
                    value={newStudentMajor}
                    onChange={(e) => setNewStudentMajor(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="علوم تجربی">علوم تجربی</option>
                    <option value="ریاضی فیزیک">ریاضی فیزیک</option>
                    <option value="علوم انسانی">علوم انسانی</option>
                    <option value="هنر و منحصراً زبان">هنر و منحصراً زبان</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">شعار دانش‌آموز:</label>
                <input
                  type="text"
                  value={newStudentMotto}
                  onChange={(e) => setNewStudentMotto(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-slate-400 mb-1">شماره تماس (محرمانه):</label>
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="۰۹..."
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">شهر (محرمانه):</label>
                  <input
                    type="text"
                    value={newStudentCity}
                    onChange={(e) => setNewStudentCity(e.target.value)}
                    placeholder="مثال: تهران"
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">یادداشت مشاور (محرمانه):</label>
                <textarea
                  rows={2}
                  value={newStudentNotes}
                  onChange={(e) => setNewStudentNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold"
                >
                  ایجاد حساب دانش‌آموز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Student */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-purple-400" />
              <span>ویرایش اطلاعات دانش‌آموز ({editingStudent.fullName})</span>
            </h2>

            <form onSubmit={handleUpdateStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">نام کاربری:</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">رمز عبور:</label>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">نام نمایشی (Nickname):</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">پایه تحصیلی:</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="دهم">دهم</option>
                    <option value="یازدهم">یازدهم</option>
                    <option value="دوازدهم">دوازدهم</option>
                    <option value="فارغ‌التحصیل">فارغ‌التحصیل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">رشته تحصیلی:</label>
                  <select
                    value={editMajor}
                    onChange={(e) => setEditMajor(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  >
                    <option value="علوم تجربی">علوم تجربی</option>
                    <option value="ریاضی فیزیک">ریاضی فیزیک</option>
                    <option value="علوم انسانی">علوم انسانی</option>
                    <option value="هنر و منحصراً زبان">هنر و منحصراً زبان</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">شعار دانش‌آموز:</label>
                <input
                  type="text"
                  value={editMotto}
                  onChange={(e) => setEditMotto(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-slate-400 mb-1">شماره تماس (محرمانه):</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">شهر (محرمانه):</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">یادداشت مشاور (محرمانه):</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Habit */}
      {showEditHabitModal && editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-purple-400" />
              <span>ویرایش عادت ({editingHabit.title})</span>
            </h2>

            <form onSubmit={handleUpdateHabit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">عنوان عادت:</label>
                <input
                  type="text"
                  value={editHabitTitle}
                  onChange={(e) => setEditHabitTitle(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">دسته‌بندی:</label>
                <select
                  value={editHabitCategory}
                  onChange={(e) => setEditHabitCategory(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                >
                  <option value="روتین">روتین</option>
                  <option value="سلامت">سلامت</option>
                  <option value="تمرکز">تمرکز</option>
                  <option value="مطالعه">مطالعه</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">توضیحات:</label>
                <textarea
                  rows={2}
                  value={editHabitDesc}
                  onChange={(e) => setEditHabitDesc(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditHabitModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold"
                >
                  ذخیره ویرایش عادت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adjust FP (Bonus or Penalty) */}
      {showAdjustFPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4">
            <h2 className="text-base font-bold text-slate-100">
              {isPenalty ? 'ثبت جریمه کسر امتیاز' : 'اعطای پاداش Focus Point'}
            </h2>

            <form onSubmit={handleAdjustFP} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">دانش‌آموز:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({toPersianDigits(s.focusPoints)} FP فعلی)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  مقدار امتیاز ({isPenalty ? 'کسر جریمه' : 'افزایش پاداش'}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={fpAmount}
                  onChange={(e) => setFpAmount(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 font-mono text-center font-bold text-base"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">علت و توضیح مشاور (الزامی):</label>
                <input
                  type="text"
                  value={fpReason}
                  onChange={(e) => setFpReason(e.target.value)}
                  placeholder={
                    isPenalty
                      ? 'مثال: عدم ارسال گزارش روزانه / غیبت در پارت'
                      : 'مثال: پیشرفت عالی در درصد شیمی آزمون'
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAdjustFPModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className={`py-2 px-5 rounded-xl font-bold ${
                    isPenalty ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isPenalty ? 'اعمال جریمه' : 'اعطای پاداش'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Reward */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4">
            <h2 className="text-base font-bold text-slate-100">تعریف پاداش در فروشگاه</h2>

            <form onSubmit={handleCreateReward} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">عنوان پاداش:</label>
                <input
                  type="text"
                  value={rewardTitle}
                  onChange={(e) => setRewardTitle(e.target.value)}
                  placeholder="مثال: مشاوره ویژه تک‌جلسه یا کتاب تست رایگان"
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">هزینه (Focus Point):</label>
                <input
                  type="number"
                  min="50"
                  value={rewardCost}
                  onChange={(e) => setRewardCost(parseInt(e.target.value) || 0)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 font-mono text-center font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">توضیحات پاداش:</label>
                <textarea
                  rows={2}
                  value={rewardDesc}
                  onChange={(e) => setRewardDesc(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFreeConsult"
                  checked={isFreeConsultingMonth}
                  onChange={(e) => setIsFreeConsultingMonth(e.target.checked)}
                  className="rounded text-purple-600 bg-slate-800"
                />
                <label htmlFor="isFreeConsult" className="text-amber-300 font-medium">
                  پاداش «یک ماه مشاوره رایگان» (هزینه بالا و تاج سلطنتی)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold"
                >
                  ثبت پاداش
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Habit */}
      {showAddHabitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-4">
            <h2 className="text-base font-bold text-slate-100">تعریف عادت بنیادین جدید</h2>

            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">عنوان عادت:</label>
                <input
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="مثال: مطالعه متن زیست‌شناسی قبل از خواب"
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">دسته‌بندی:</label>
                <select
                  value={habitCategory}
                  onChange={(e) => setHabitCategory(e.target.value as any)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                >
                  <option value="روتین">روتین</option>
                  <option value="سلامت">سلامت</option>
                  <option value="تمرکز">تمرکز</option>
                  <option value="مطالعه">مطالعه</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">توضیحات:</label>
                <textarea
                  rows={2}
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-800 border border-white/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddHabitModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold"
                >
                  ثبت عادت (+۱۰ FP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Student Dossier & Goals Management */}
      {dossierStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-purple-500/30 text-white text-xs space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-purple-600/30">
                  {dossierStudent.nickname ? dossierStudent.nickname[0] : dossierStudent.fullName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-bold text-slate-100">
                      {dossierStudent.fullName}
                    </h2>
                    <span className="text-purple-400 font-mono text-xs">({dossierStudent.username})</span>
                    {dossierStudent.equippedTitle && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold text-[10px]">
                        عنوان مجهز: {dossierStudent.equippedTitle}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {dossierStudent.grade} · {dossierStudent.major} · نام نمایشی: {dossierStudent.nickname}
                  </div>
                </div>
              </div>

              <button
                onClick={closeStudentDossier}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Study Hall Live Presence Badge */}
            {(() => {
              const livePresence = studyHallPresenceList.find((p) => p.studentId === dossierStudent.id);
              if (livePresence) {
                return (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span className="text-emerald-300 font-bold">
                        هم‌اکنون در سالن مطالعه متمرکز آنلاین است
                      </span>
                      <span className="text-slate-400">· پارت: {livePresence.currentTaskTitle}</span>
                    </div>
                    <button
                      onClick={() => handleTerminatePresence(dossierStudent.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-500/30 text-[11px]"
                    >
                      خاتمه نشست
                    </button>
                  </div>
                );
              }
              return null;
            })()}

            {/* Motto */}
            {dossierStudent.motto && (
              <div className="p-3 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-300/90 italic">
                «{dossierStudent.motto}»
              </div>
            )}

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 text-[10px] block mb-0.5">موجودی FP</span>
                <span className="text-base font-black font-mono text-purple-300">
                  {toPersianDigits(dossierStudent.focusPoints)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 text-[10px] block mb-0.5">استمرار مطالعه</span>
                <span className="text-base font-black font-mono text-amber-400">
                  {toPersianDigits(dossierStudent.streak)} روز
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 text-[10px] block mb-0.5">کل ساعت مطالعه واقعی</span>
                <span className="text-base font-black font-mono text-emerald-400">
                  {toPersianDigits(
                    Math.round(
                      tasks
                        .filter((t) => t.studentId === dossierStudent.id && t.isCompleted)
                        .reduce((acc, t) => acc + (t.actualDurationMinutes || t.durationMinutes || 0), 0) / 60
                    )
                  )}س
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-slate-400 text-[10px] block mb-0.5">کل تست‌های ثبت‌شده</span>
                <span className="text-base font-black font-mono text-blue-400">
                  {toPersianDigits(
                    reports
                      .filter((r) => r.studentId === dossierStudent.id)
                      .reduce((acc, r) => acc + (r.testsCount || 0), 0)
                  )}
                </span>
              </div>
            </div>

            {/* Student Goals Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span>اهداف راهبردی و کنکوری دانش‌آموز</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    تغییرات شما مستقیماً در پروفایل دانش‌آموز منعکس شده و پیشرفت آن بر اساس داده‌های واقعی محاسبه می‌شود.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddGoalForm(!showAddGoalForm)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddGoalForm ? 'بستن فرم' : 'افزودن هدف جدید'}</span>
                </button>
              </div>

              {/* Add Goal Inline Form */}
              {showAddGoalForm && (
                <form
                  onSubmit={handleAddGoalForStudent}
                  className="p-4 rounded-xl bg-slate-950/60 border border-purple-500/30 space-y-3 animate-in fade-in duration-150"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">عنوان هدف:</label>
                      <input
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="مثال: رتبه زیر ۱۰۰ منطقه یا درصد زیست بالای ۸۰"
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">نوع هدف:</label>
                      <select
                        value={newGoalType}
                        onChange={(e) => setNewGoalType(e.target.value as any)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-xs"
                      >
                        <option value="مطالعه">مطالعه (محاسبه خودکار از پارت‌ها بر حسب ساعت)</option>
                        <option value="تست">تست (محاسبه خودکار از گزارش‌ها)</option>
                        <option value="دلخواه">دلخواه / رتبه‌ای</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">مقدار هدف رقمی:</label>
                      <input
                        type="number"
                        min="1"
                        value={newGoalTargetValue}
                        onChange={(e) => setNewGoalTargetValue(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-mono text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">رتبه هدف (اختیاری):</label>
                      <input
                        type="text"
                        value={newGoalRank}
                        onChange={(e) => setNewGoalRank(e.target.value)}
                        placeholder="مثال: زیر ۵۰"
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">دانشگاه هدف (اختیاری):</label>
                      <input
                        type="text"
                        value={newGoalUniversity}
                        onChange={(e) => setNewGoalUniversity(e.target.value)}
                        placeholder="مثال: علوم پزشکی تهران"
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={newGoalIsPublic}
                        onChange={(e) => setNewGoalIsPublic(e.target.checked)}
                        className="rounded text-purple-600 bg-slate-800"
                      />
                      <span>نمایش در پروفایل عمومی (تورنمنت و سالن مطالعه)</span>
                    </label>

                    <button
                      type="submit"
                      className="py-1.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                    >
                      ذخیره هدف برای دانش‌آموز
                    </button>
                  </div>
                </form>
              )}

              {/* Goals List */}
              {(!dossierStudent.goals || dossierStudent.goals.length === 0) ? (
                <div className="p-6 text-center rounded-xl bg-slate-950/40 border border-dashed border-white/10 text-slate-500">
                  هنوز هدفی برای این دانش‌آموز تعریف نشده است. با دکمه بالا می‌توانید اولین هدف را ثبت فرمایید.
                </div>
              ) : (
                <div className="space-y-2">
                  {dossierStudent.goals.map((goal) => {
                    const totalHours = Math.round(
                      tasks
                        .filter((t) => t.studentId === dossierStudent.id && t.isCompleted)
                        .reduce((acc, t) => acc + (t.actualDurationMinutes || t.durationMinutes || 0), 0) / 60
                    );
                    const totalTests = reports
                      .filter((r) => r.studentId === dossierStudent.id)
                      .reduce((acc, r) => acc + (r.testsCount || 0), 0);

                    let currentVal = 0;
                    if (goal.targetType === 'مطالعه') currentVal = totalHours;
                    else if (goal.targetType === 'تست') currentVal = totalTests;
                    else currentVal = goal.currentValue || 0;

                    const pct = goal.targetValue ? Math.min(100, Math.round((currentVal / goal.targetValue) * 100)) : null;

                    return (
                      <div
                        key={goal.id}
                        className="p-3 rounded-xl bg-slate-800/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-200">{goal.title}</span>
                            <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                              {goal.targetType}
                            </span>
                            {goal.targetRank && (
                              <span className="text-[10px] text-amber-400">رتبه: {goal.targetRank}</span>
                            )}
                            {goal.targetUniversity && (
                              <span className="text-[10px] text-blue-400">دانشگاه: {goal.targetUniversity}</span>
                            )}
                          </div>
                          {pct !== null && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <div className="flex-1 max-w-xs h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="font-mono">
                                {toPersianDigits(currentVal)} / {toPersianDigits(goal.targetValue)} ({toPersianDigits(pct)}٪)
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteGoalForStudent(dossierStudent.id, goal.id)}
                          className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900 border border-rose-500/20 shrink-0 cursor-pointer"
                          title="حذف هدف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Jumps to Other Modules */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setSelectedStudentId(dossierStudent.id);
                    switchTab('plan-builder');
                    closeStudentDossier();
                  }}
                  className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>طراحی برنامه (Plan Builder)</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedStudentId(dossierStudent.id);
                    switchTab('reports');
                    closeStudentDossier();
                  }}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>تقویم و گزارش‌ها</span>
                </button>

                <button
                  onClick={() => {
                    openInspectInventory(dossierStudent);
                  }}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5 text-amber-400" />
                  <span>صندوق دارایی‌ها (Inventory)</span>
                </button>

                <button
                  onClick={() => {
                    setAchievementInspectStudentId(dossierStudent.id);
                    switchTab('achievements');
                    closeStudentDossier();
                  }}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  <span>دستاوردها</span>
                </button>
              </div>

              <button
                type="button"
                onClick={closeStudentDossier}
                className="py-2 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                بستن پرونده
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
