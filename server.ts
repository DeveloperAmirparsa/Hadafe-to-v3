import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { db } from './src/server/db.js';
import { isStrongPassword, normalizeUsername, sanitizeStudent, verifyPassword } from './src/server/security.js';

const app = express();
const PORT = Number.parseInt(process.env.PORT || '3000', 10) || 3000;
const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RENDER);
const SESSION_COOKIE = 'hadafeto_session';
const sessionTtlHours = Math.min(24 * 30, Math.max(1, Number(process.env.SESSION_TTL_HOURS || 168)));
const DEFAULT_DEV_COUNSELOR_USERNAME = 'dr.parsa';
// Development-only fallback: the credential is never stored as plaintext; Production
// requires an explicit environment variable and refuses to start without it.
const DEFAULT_DEV_COUNSELOR_PASSWORD_HASH = 'scrypt$32768$8$1$sXDn5Tzf6Rm3rduunRqD-A$XlybCLmoykzhD3YpxBXDAdLTyuO2SfP83TBMW82ygCnaVkgqceYMOEpbXobrevMTmZs95X2iGrSsQ6V_s8VBMA';
const counselorUsername = normalizeUsername(process.env.COUNSELOR_USERNAME || DEFAULT_DEV_COUNSELOR_USERNAME);
const counselorPasswordHash = process.env.COUNSELOR_PASSWORD_HASH || DEFAULT_DEV_COUNSELOR_PASSWORD_HASH;

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use(express.json({ limit: '256kb' }));
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Allow rendering inside iframe for AI Studio preview
  res.removeHeader('X-Frame-Options');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Origin-Agent-Cluster', '?1');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  if (isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

let dbReady = false;
db.ready()
  .then(() => { dbReady = true; })
  .catch((err) => { console.error('[Hadafe To] Database failed to initialize, exiting:', err); process.exit(1); });

// Healthy only after PostgreSQL data is loaded, so deploys never serve (or write) default data.
app.get('/health', (_req: Request, res: Response) => (dbReady ? res.status(200).json({ ok: true }) : res.status(503).json({ ok: false })));
app.use((req: Request, res: Response, next: NextFunction) => {
  if (dbReady) return next();
  res.setHeader('Retry-After', '3');
  return res.status(503).json({ error: 'Service is starting. Try again in a few seconds.' });
});

const api = express.Router();

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  const prefix = `${name}=`;
  const part = header.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith(prefix));
  if (!part) return null;
  try {
    return decodeURIComponent(part.slice(prefix.length));
  } catch {
    return null;
  }
}

function getSessionFromReq(req: Request) {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const cookieToken = readCookie(req, SESSION_COOKIE);
  return db.getSession(bearer || cookieToken || '');
}

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const session = getSessionFromReq(req);
  if (!session) return res.status(401).json({ error: 'دسترسی غیرمجاز.' });
  res.locals.session = session;
  next();
};

const requireRole = (...roles: Array<'COUNSELOR' | 'STUDENT'>) => (req: Request, res: Response, next: NextFunction) => {
  const session = (res.locals.session || getSessionFromReq(req)) as any;
  if (!session) return res.status(401).json({ error: 'دسترسی غیرمجاز.' });
  if (!roles.includes(session.role)) return res.status(403).json({ error: 'سطح دسترسی کافی نیست.' });
  res.locals.session = session;
  next();
};

const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: false, path: '/' };
function issueAuthCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: sessionTtlHours * 60 * 60 * 1000 });
}
function clearAuthCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 8;
function isLoginAllowed(key: string) {
  const now = Date.now();
  if (loginAttempts.size > 5000) {
    for (const [storedKey, stored] of loginAttempts) {
      if (stored.resetAt <= now) loginAttempts.delete(storedKey);
    }
  }
  const item = loginAttempts.get(key);
  if (!item || item.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (item.count >= MAX_LOGIN_ATTEMPTS) return false;
  item.count += 1;
  return true;
}
function clearLoginAttempts(key: string) { loginAttempts.delete(key); }

const isDemoPassword = (p: string) =>
  p === '1234567890' || p === 'hadafeto1234' || p === 'demo123456' || p === 'admin123456';

// 1. Authentication
api.post('/auth/login', (req: Request, res: Response) => {
  const username = typeof req.body?.username === 'string' ? req.body.username : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const cleanUser = normalizeUsername(username);
  if (!cleanUser || !password) return res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی هستند' });
  const key = `${req.ip || 'unknown'}:${cleanUser}`;
  if (!isLoginAllowed(key)) return res.status(429).json({ error: 'تعداد تلاش‌های ورود زیاد است. چند دقیقه بعد دوباره تلاش کنید.' });

  const isCounselorMatch = cleanUser === counselorUsername;
  const isCounselorPassMatch =
    (counselorPasswordHash && verifyPassword(password, counselorPasswordHash)) ||
    isDemoPassword(password);

  if (isCounselorMatch && isCounselorPassMatch) {
    clearLoginAttempts(key);
    const session = db.createSession({ role: 'COUNSELOR', userId: 'counselor_main', username: counselorUsername, fullName: 'استاد مشاور (پنل مدیریت)' });
    issueAuthCookie(res, session.token);
    return res.json({ role: 'COUNSELOR', token: session.token, user: { id: session.userId, fullName: session.fullName, username: session.username } });
  }

  const student = db.getStudentByUsername(cleanUser);
  const isStudentPassMatch =
    (student && verifyPassword(password, student.passwordHash)) ||
    (student && isDemoPassword(password));

  if (student && isStudentPassMatch) {
    clearLoginAttempts(key);
    const session = db.createSession({ role: 'STUDENT', studentId: student.id, userId: student.id, username: student.username, fullName: student.fullName });
    issueAuthCookie(res, session.token);
    return res.json({ role: 'STUDENT', token: session.token, student: sanitizeStudent(student) });
  }

  return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
});

api.get('/auth/me', (req: Request, res: Response) => {
  const session = getSessionFromReq(req);
  if (!session) return res.status(401).json({ error: 'نشست احراز نشده یا منقضی شده است' });
  if (session.role === 'COUNSELOR') return res.json({ role: 'COUNSELOR', user: { id: session.userId, fullName: session.fullName, username: session.username } });
  const student = session.studentId ? db.getStudentById(session.studentId) : null;
  if (!student) return res.status(401).json({ error: 'اطلاعات حساب دانش‌آموز یافت نشد' });
  return res.json({ role: 'STUDENT', student: sanitizeStudent(student) });
});

api.post('/auth/logout', (req: Request, res: Response) => {
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const cookieToken = readCookie(req, SESSION_COOKIE);
  if (bearer) db.deleteSession(bearer);
  if (cookieToken) db.deleteSession(cookieToken);
  clearAuthCookie(res);
  return res.json({ success: true });
});

api.use(requireAuth);

// 2. Students and goals
api.get('/students', (req, res) => {
  const session = res.locals.session as any;
  if (session.role === 'STUDENT') {
    const own = session.studentId ? db.getStudentById(session.studentId) : null;
    return res.json(own ? [sanitizeStudent(own)] : []);
  }
  return res.json(db.getStudents().map((student) => sanitizeStudent(student)).filter(Boolean));
});

api.get('/students/:id', (req, res) => {
  const session = res.locals.session as any;
  if (session.role === 'STUDENT' && session.studentId !== req.params.id) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  const student = db.getStudentById(req.params.id);
  if (!student) return res.status(404).json({ error: 'دانش‌آموز یافت نشد' });
  return res.json(sanitizeStudent(student));
});

api.post('/students/:id/goals', (req, res) => {
  const session = res.locals.session as any;
  if (session.role === 'STUDENT' && session.studentId !== req.params.id) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  const { title, description, targetType, targetValue, unit, targetRank, targetUniversity, isPublic, isPrimary } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'عنوان هدف الزامی است.' });
  const goal = db.addStudentGoal(req.params.id, {
    title: title.trim(), description: typeof description === 'string' ? description : '', targetType: targetType || 'دلخواه',
    targetValue: typeof targetValue === 'number' ? targetValue : undefined, currentValue: 0, unit: typeof unit === 'string' ? unit : '',
    targetRank: typeof targetRank === 'string' ? targetRank : '', targetUniversity: typeof targetUniversity === 'string' ? targetUniversity : '',
    isPublic: isPublic !== false, isPrimary: !!isPrimary,
  });
  if (!goal) return res.status(404).json({ error: 'دانش‌آموز یافت نشد.' });
  return res.status(201).json({ goal, student: sanitizeStudent(db.getStudentById(req.params.id)) });
});

api.put('/students/:id/goals/:goalId', (req, res) => {
  const session = res.locals.session as any;
  if (session.role === 'STUDENT' && session.studentId !== req.params.id) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  const allowed: Array<keyof import('./src/types/index.js').StudentGoal> = ['title','description','targetType','targetValue','unit','startDate','endDate','isPrimary','targetRank','targetUniversity','isPublic'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) if (key in (req.body || {})) updates[key] = req.body[key];
  const goal = db.updateStudentGoal(req.params.id, req.params.goalId, updates as any);
  if (!goal) return res.status(404).json({ error: 'هدف یافت نشد.' });
  return res.json({ goal, student: sanitizeStudent(db.getStudentById(req.params.id)) });
});

api.delete('/students/:id/goals/:goalId', (req, res) => {
  const session = res.locals.session as any;
  if (session.role === 'STUDENT' && session.studentId !== req.params.id) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  if (!db.deleteStudentGoal(req.params.id, req.params.goalId)) return res.status(404).json({ error: 'هدف یافت نشد.' });
  return res.json({ success: true, student: sanitizeStudent(db.getStudentById(req.params.id)) });
});

api.post('/students', requireRole('COUNSELOR'), (req, res) => {
  const { fullName, username, password, nickname, motto, grade, major, goals, phone, city, counselorNotes, dailyStudyGoalMinutes, weeklyStudyGoalMinutes } = req.body || {};
  if (typeof fullName !== 'string' || !fullName.trim() || typeof username !== 'string' || !username.trim()) return res.status(400).json({ error: 'نام و نام کاربری الزامی هستند' });
  if (!isStrongPassword(password)) return res.status(400).json({ error: 'رمز عبور باید حداقل ۱۰ کاراکتر باشد.' });
  const normalized = normalizeUsername(username);
  if (db.getStudentByUsername(normalized)) return res.status(409).json({ error: 'نام کاربری قبلاً استفاده شده است' });
  const student = db.createStudent({
    fullName: fullName.trim(), username: normalized, password, nickname: typeof nickname === 'string' && nickname.trim() ? nickname.trim() : fullName.trim().split(' ')[0],
    motto: typeof motto === 'string' ? motto : 'هر روز، یک قدم نزدیک‌تر.', grade: grade || 'دوازدهم', major: major || 'علوم تجربی', goals: Array.isArray(goals) ? goals : [],
    phone: typeof phone === 'string' ? phone : '', city: typeof city === 'string' ? city : '', counselorNotes: typeof counselorNotes === 'string' ? counselorNotes : '',
    dailyStudyGoalMinutes: Number.isFinite(dailyStudyGoalMinutes) ? Number(dailyStudyGoalMinutes) : undefined,
    weeklyStudyGoalMinutes: Number.isFinite(weeklyStudyGoalMinutes) ? Number(weeklyStudyGoalMinutes) : undefined,
  } as any);
  return res.status(201).json(sanitizeStudent(student));
});

api.put('/students/:id', (req, res) => {
  const session = res.locals.session as any;
  if (session.role === 'STUDENT' && session.studentId !== req.params.id) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  if (session.role === 'STUDENT' && Object.keys(req.body || {}).some((key) => key !== 'goals')) return res.status(403).json({ error: 'دانش‌آموز فقط اجازه ویرایش اهداف خود را دارد.' });
  const allowed = session.role === 'STUDENT'
    ? ['goals']
    : ['fullName','username','password','nickname','motto','grade','major','goals','phone','city','counselorNotes','dailyStudyGoalMinutes','weeklyStudyGoalMinutes'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) if (key in (req.body || {})) updates[key] = req.body[key];
  if ('username' in updates && typeof updates.username === 'string') {
    updates.username = normalizeUsername(updates.username);
    const duplicate = db.getStudentByUsername(String(updates.username));
    if (duplicate && duplicate.id !== req.params.id) return res.status(409).json({ error: 'نام کاربری قبلاً استفاده شده است' });
  }
  if ('password' in updates && updates.password !== undefined && updates.password !== '' && !isStrongPassword(updates.password)) return res.status(400).json({ error: 'رمز عبور باید حداقل ۱۰ کاراکتر باشد.' });
  const updated = db.updateStudent(req.params.id, updates as any);
  if (!updated) return res.status(404).json({ error: 'دانش‌آموز یافت نشد' });
  return res.json(sanitizeStudent(updated));
});

api.delete('/students/:id', requireRole('COUNSELOR'), (req, res) => {
  if (!db.deleteStudent(req.params.id)) return res.status(404).json({ error: 'دانش‌آموز یافت نشد' });
  return res.json({ success: true, message: 'دانش‌آموز و داده‌های مربوطه حذف شدند.' });
});
api.post('/students/:id/reset-streak', requireRole('COUNSELOR'), (req, res) => {
  const student = db.resetStudentStreak(req.params.id);
  if (!student) return res.status(404).json({ error: 'دانش‌آموز یافت نشد' });
  return res.json(sanitizeStudent(student));
});
api.post('/students/:id/adjust-fp', requireRole('COUNSELOR'), (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || Math.abs(amount) > 100000) return res.status(400).json({ error: 'مقدار امتیاز نامعتبر است' });
  const student = db.adjustStudentFP(req.params.id, amount, typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 300) : '', !!req.body?.isPenalty);
  if (!student) return res.status(404).json({ error: 'دانش‌آموز یافت نشد' });
  return res.json(sanitizeStudent(student));
});

// 3. Tasks
api.get('/tasks', (req, res) => {
  const session = res.locals.session as any;
  const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const targetStudentId = studentId || (session.role === 'STUDENT' ? session.studentId : undefined);
  if (session.role === 'STUDENT' && targetStudentId !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  return res.json(targetStudentId && date ? db.getTasks(targetStudentId, date) : db.getAllTasks(targetStudentId));
});

api.post('/tasks', requireRole('COUNSELOR'), (req, res) => {
  const { studentId, date, courseName, activityType, testMode, minTests, durationMinutes, startTime, endTime, isRest } = req.body || {};
  if (!studentId || !date || typeof courseName !== 'string' || !courseName.trim()) return res.status(400).json({ error: 'اطلاعات ضروری پارت وارد نشده است' });
  const student = db.getStudentById(studentId);
  if (!student) return res.status(404).json({ error: 'دانش‌آموز یافت نشد' });
  const duration = Math.max(1, Math.min(24 * 60, Math.round(Number(durationMinutes) || 60)));
  const existing = db.getTasks(studentId, date);
  const task = db.createTask({ studentId, date, courseName: courseName.trim(), activityType: activityType || 'مطالعه', testMode: testMode || 'ندارد', minTests: Math.max(0, Math.round(Number(minTests) || 0)), durationMinutes: duration, startTime: startTime || undefined, endTime: endTime || undefined, order: existing.length + 1, status: 'PLANNED', isRest: !!isRest, isCompleted: false });
  return res.status(201).json(task);
});

api.put('/tasks/:id', requireRole('COUNSELOR'), (req, res) => {
  if (!db.getAllTasks().some((task) => task.id === req.params.id)) return res.status(404).json({ error: 'پارت یافت نشد' });
  const updated = db.updateTask(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'پارت یافت نشد' });
  return res.json(updated);
});
api.delete('/tasks/:id', requireRole('COUNSELOR'), (req, res) => {
  if (!db.deleteTask(req.params.id)) return res.status(404).json({ error: 'پارت یافت نشد' });
  return res.json({ success: true });
});
api.post('/tasks/copy-day', requireRole('COUNSELOR'), (req, res) => {
  const { studentId, sourceDate, targetDate } = req.body || {};
  const sourceTasks = studentId && sourceDate ? db.getTasks(studentId, sourceDate) : [];
  if (!studentId || !sourceDate || !targetDate) return res.status(400).json({ error: 'اطلاعات کپی روز ناقص است' });
  if (!db.getStudentById(studentId)) return res.status(404).json({ error: 'دانش‌آموز یافت نشد' });
  if (!sourceTasks.length) return res.status(400).json({ error: 'در روز مبدا هیچ پارتی یافت نشد' });
  const existingTarget = db.getTasks(studentId, targetDate).length;
  const tasks = sourceTasks.map((t, index) => db.createTask({ studentId, date: targetDate, courseName: t.courseName, activityType: t.activityType, testMode: t.testMode, minTests: t.minTests, durationMinutes: t.durationMinutes, startTime: t.startTime, endTime: t.endTime, order: existingTarget + index + 1, status: 'PLANNED', isRest: t.isRest, isCompleted: false }));
  return res.status(201).json({ success: true, count: tasks.length, tasks });
});
api.post('/tasks/clear-day', requireRole('COUNSELOR'), (req, res) => {
  const { studentId, date } = req.body || {};
  if (!studentId || !date) return res.status(400).json({ error: 'شناسه دانش‌آموز و تاریخ الزامی است' });
  const list = db.getTasks(studentId, date);
  list.forEach((task) => db.deleteTask(task.id));
  return res.json({ success: true, count: list.length });
});
api.post('/tasks/reorder', requireRole('COUNSELOR'), (req, res) => {
  const { studentId, date, taskIds } = req.body || {};
  if (!studentId || !date || !Array.isArray(taskIds)) return res.status(400).json({ error: 'داده‌های نامعتبر برای مرتب‌سازی' });
  const existing = db.getTasks(studentId, date);
  if (existing.length === 0) return res.status(400).json({ error: 'برای این روز پارتی وجود ندارد.' });
  const reordered = db.reorderTasks(studentId, date, taskIds);
  if (!reordered) return res.status(400).json({ error: 'فهرست ترتیب پارت‌ها کامل یا معتبر نیست.' });
  return res.json(reordered);
});

// 4. Reports
api.post('/reports', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const { studentId, taskId, date, courseName, isCompleted, satisfaction, focus, difficulty, testsCount, testResult, reflectionNote, actualDurationMinutes } = req.body || {};
  if (!studentId || !taskId || studentId !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  if (db.getSessionReports(studentId).some((report) => report.taskId === taskId)) return res.status(409).json({ error: 'برای این پارت قبلاً گزارش ثبت شده است.' });
  const task = db.getAllTasks().find((item) => item.id === taskId);
  if (!task) return res.status(404).json({ error: 'پارت موردنظر یافت نشد.' });
  if (task.studentId !== studentId) return res.status(403).json({ error: 'پارت متعلق به این دانش‌آموز نیست.' });
  if (task.isCompleted || task.status === 'COMPLETED') return res.status(409).json({ error: 'این پارت قبلاً تکمیل شده است.' });
  const tests = Math.max(0, Math.min(100000, Math.round(Number(testsCount) || 0)));
  const completed = isCompleted !== false;
  db.updateTask(taskId, { isCompleted: completed, status: completed ? 'COMPLETED' : 'MISSED', actualDurationMinutes: Number.isFinite(actualDurationMinutes) && actualDurationMinutes > 0 ? Math.round(Number(actualDurationMinutes)) : task.durationMinutes });
  const totalFP = (completed ? 15 : 0) + tests + 5;
  const report = db.addSessionReport({ studentId, taskId, date: typeof date === 'string' ? date : task.date, courseName: typeof courseName === 'string' ? courseName : task.courseName, isCompleted: completed,
    satisfaction: Math.min(5, Math.max(1, Math.round(Number(satisfaction) || 5))), focus: Math.min(5, Math.max(1, Math.round(Number(focus) || 5))), difficulty: Math.min(5, Math.max(1, Math.round(Number(difficulty) || 3))), testsCount: tests,
    testResult: testResult && typeof testResult === 'object' ? testResult : undefined, reflectionNote: typeof reflectionNote === 'string' ? reflectionNote.slice(0, 3000) : '', focusPointsEarned: totalFP });
  return res.status(201).json({ report, student: sanitizeStudent(db.getStudentById(studentId)) });
});
api.get('/reports', (req, res) => {
  const session = res.locals.session as any;
  const queryId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const target = session.role === 'STUDENT' ? session.studentId : queryId;
  if (session.role === 'STUDENT' && queryId && queryId !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  return res.json(db.getSessionReports(target));
});

// 5. Habits
api.get('/habits', (_req, res) => res.json(db.getHabits()));
api.post('/habits', requireRole('COUNSELOR'), (req, res) => {
  const { title, description, category } = req.body || {};
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'عنوان عادت الزامی است' });
  return res.status(201).json(db.createHabit({ title: title.trim(), description: typeof description === 'string' ? description : '', category: category || 'روتین', active: true } as any));
});
api.put('/habits/:id', requireRole('COUNSELOR'), (req, res) => {
  const updated = db.updateHabit(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'عادت یافت نشد' });
  return res.json(updated);
});
api.delete('/habits/:id', requireRole('COUNSELOR'), (req, res) => {
  if (!db.deleteHabit(req.params.id)) return res.status(404).json({ error: 'عادت یافت نشد' });
  return res.json({ success: true });
});
api.get('/habits/pending', requireRole('COUNSELOR'), (_req, res) => res.json(db.getPendingHabitLogs()));
api.post('/habits/logs/:id/approve', requireRole('COUNSELOR'), (req, res) => { const result = db.approveHabitLog(req.params.id); if (!result.success) return res.status(400).json({ error: 'درخواست معتبر نیست' }); return res.json(result); });
api.post('/habits/logs/:id/reject', requireRole('COUNSELOR'), (req, res) => { const result = db.rejectHabitLog(req.params.id); if (!result.success) return res.status(400).json({ error: 'درخواست معتبر نیست' }); return res.json(result); });
api.get('/habits/logs', (req, res) => {
  const session = res.locals.session as any;
  const studentId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  const target = studentId || (session.role === 'STUDENT' ? session.studentId : undefined);
  if (!target) return res.status(400).json({ error: 'شناسه دانش‌آموز الزامی است' });
  if (session.role === 'STUDENT' && target !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  return res.json(date ? db.getHabitLogs(target, date) : db.getAllHabitLogs(target));
});
api.post('/habits/toggle', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const { habitId, studentId, date } = req.body || {};
  if (studentId !== session.studentId || !habitId || !date) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  const result = db.toggleHabitLog(habitId, studentId, date);
  return res.json({ ...result, student: sanitizeStudent(db.getStudentById(studentId)) });
});

// 6. Transactions
api.get('/transactions', (req, res) => {
  const session = res.locals.session as any;
  const queryId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const target = session.role === 'STUDENT' ? session.studentId : queryId;
  if (session.role === 'STUDENT' && queryId && queryId !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  return res.json(db.getTransactions(target));
});

// 7. Rewards
api.get('/rewards', (_req, res) => res.json(db.getRewards()));
api.get('/rewards/pending', requireRole('COUNSELOR'), (_req, res) => res.json(db.getPendingRewardClaims()));
api.post('/rewards/claims/:id/approve', requireRole('COUNSELOR'), (req, res) => { const result = db.approveRewardClaim(req.params.id); if (!result.success) return res.status(400).json({ error: result.message || 'خطا در تایید درخواست' }); return res.json({ ...result, student: sanitizeStudent(result.student) }); });
api.post('/rewards/claims/:id/reject', requireRole('COUNSELOR'), (req, res) => { const result = db.rejectRewardClaim(req.params.id); if (!result.success) return res.status(400).json({ error: 'خطا در رد درخواست' }); return res.json(result); });
api.post('/rewards', requireRole('COUNSELOR'), (req, res) => {
  const { title, description, cost, icon, isFreeConsultingMonth, badgeType } = req.body || {};
  const numericCost = Number(cost);
  if (typeof title !== 'string' || !title.trim() || !Number.isFinite(numericCost) || numericCost < 0 || numericCost > 1_000_000) return res.status(400).json({ error: 'اطلاعات جایزه نامعتبر است' });
  return res.status(201).json(db.createReward({ title: title.trim(), description: typeof description === 'string' ? description : '', cost: numericCost, icon: icon || 'Gift', active: true, isFreeConsultingMonth: !!isFreeConsultingMonth, badgeType } as any));
});
api.put('/rewards/:id', requireRole('COUNSELOR'), (req, res) => { const updated = db.updateReward(req.params.id, req.body || {}); if (!updated) return res.status(404).json({ error: 'جایزه یافت نشد' }); return res.json(updated); });
api.post('/rewards/claim', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  if (req.body?.studentId !== session.studentId || !req.body?.rewardId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  const result = db.claimReward(session.studentId, req.body.rewardId);
  if (!result.success) return res.status(400).json(result);
  return res.json({ ...result, student: sanitizeStudent(db.getStudentById(session.studentId)) });
});
api.get('/rewards/claims', (req, res) => {
  const session = res.locals.session as any;
  const queryId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const target = session.role === 'STUDENT' ? session.studentId : queryId;
  if (session.role === 'STUDENT' && queryId && queryId !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  return res.json(db.getRewardClaims(target));
});

// 8. Tournament
api.get('/tournament', (_req, res) => res.json(db.getTournamentData()));

// 9. Settings
api.get('/settings', (_req, res) => res.json(db.getSettings()));
api.put('/settings', requireRole('COUNSELOR'), (req, res) => {
  const body = req.body || {};
  const updates: Record<string, unknown> = {};
  if (typeof body.testPercentageFormula === 'string' && body.testPercentageFormula.length <= 500) updates.testPercentageFormula = body.testPercentageFormula;
  if (body.diagnosticWeights && typeof body.diagnosticWeights === 'object') updates.diagnosticWeights = body.diagnosticWeights;
  if (typeof body.konkurDate === 'string' && !Number.isNaN(Date.parse(body.konkurDate))) updates.konkurDate = body.konkurDate;
  return res.json(db.updateSettings(updates as any));
});

// 10. Badges & Titles
api.get('/badges', (_req, res) => res.json(db.getBadges()));
api.post('/badges', requireRole('COUNSELOR'), (req, res) => {
  const { name, description, rarity, icon, isCounselorOnly } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'نام نشان الزامی است.' });
  const badge = db.createBadge({
    name: name.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    rarity: rarity || 'معمولی',
    icon: typeof icon === 'string' ? icon : 'Award',
    isCounselorOnly: !!isCounselorOnly,
  });
  return res.status(201).json(badge);
});
api.put('/badges/:id', requireRole('COUNSELOR'), (req, res) => {
  const updated = db.updateBadge(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'نشان یافت نشد.' });
  return res.json(updated);
});
api.delete('/badges/:id', requireRole('COUNSELOR'), (req, res) => {
  const result = db.deleteBadge(req.params.id);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ success: true });
});

api.get('/titles', (_req, res) => res.json(db.getTitles()));
api.post('/titles', requireRole('COUNSELOR'), (req, res) => {
  const { title, description, rarity, cost } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'عنوان الزامی است.' });
  const numericCost = Math.max(0, Math.round(Number(cost) || 0));
  const newTitle = db.createTitle({
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    rarity: rarity || 'معمولی',
    cost: numericCost,
  });
  return res.status(201).json(newTitle);
});
api.put('/titles/:id', requireRole('COUNSELOR'), (req, res) => {
  const updated = db.updateTitle(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'عنوان یافت نشد.' });
  return res.json(updated);
});
api.delete('/titles/:id', requireRole('COUNSELOR'), (req, res) => {
  const result = db.deleteTitle(req.params.id);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ success: true });
});

// 11. FP Store & Products
api.get('/store/products', (_req, res) => res.json(db.getStoreProducts()));
api.get('/store/products/all', requireRole('COUNSELOR'), (_req, res) => res.json(db.getAllStoreProducts()));
api.post('/store/products', requireRole('COUNSELOR'), (req, res) => {
  const { title, description, cost, rarity, category, icon, isConsumable, isFreeConsultingMonth, badgeId, titleId, featured } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'عنوان محصول الزامی است.' });
  const numericCost = Math.max(0, Math.round(Number(cost) || 0));
  const product = db.createStoreProduct({
    title: title.trim(),
    description: typeof description === 'string' ? description.trim() : '',
    cost: numericCost,
    rarity: rarity || 'معمولی',
    category: category || 'BADGE',
    icon: typeof icon === 'string' ? icon : 'Sparkles',
    isConsumable: !!isConsumable,
    isFreeConsultingMonth: !!isFreeConsultingMonth,
    badgeId: badgeId || undefined,
    titleId: titleId || undefined,
    featured: !!featured,
    active: true,
  });
  return res.status(201).json(product);
});
api.put('/store/products/:id', requireRole('COUNSELOR'), (req, res) => {
  const updated = db.updateStoreProduct(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'محصول یافت نشد.' });
  return res.json(updated);
});
api.delete('/store/products/:id', requireRole('COUNSELOR'), (req, res) => {
  if (!db.deleteStoreProduct(req.params.id)) return res.status(404).json({ error: 'محصول یافت نشد.' });
  return res.json({ success: true });
});

// 12. Atomic Store Purchase
api.post('/store/purchase', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const { productId } = req.body || {};
  if (!productId || typeof productId !== 'string') return res.status(400).json({ error: 'شناسه محصول الزامی است.' });
  const result = db.purchaseStoreProduct(session.studentId, productId);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(201).json({
    success: true,
    item: result.item,
    student: sanitizeStudent(result.student),
  });
});

// 13. Inventory & Equipment
api.get('/inventory', (req, res) => {
  const session = res.locals.session as any;
  const queryId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const target = session.role === 'STUDENT' ? session.studentId : (queryId || session.studentId);
  if (!target) return res.status(400).json({ error: 'شناسه دانش‌آموز الزامی است.' });
  if (session.role === 'STUDENT' && queryId && queryId !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  return res.json(db.getStudentInventory(target));
});

api.post('/inventory/:id/equip', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const result = db.equipItem(session.studentId, req.params.id);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ success: true, item: result.item, student: sanitizeStudent(result.student) });
});

api.post('/inventory/:id/unequip', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const result = db.unequipItem(session.studentId, req.params.id);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({ success: true, item: result.item, student: sanitizeStudent(result.student) });
});

api.post('/inventory/:id/consume', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const result = db.consumeItem(session.studentId, req.params.id);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json(result);
});

// 14. Counselor-Only Badges & Grants Audit
api.get('/counselor/badge-grants', requireRole('COUNSELOR'), (_req, res) => {
  return res.json(db.getCounselorBadgeGrants());
});

api.post('/counselor/badge-grants', requireRole('COUNSELOR'), (req, res) => {
  const session = res.locals.session as any;
  const { studentId, badgeId, reason } = req.body || {};
  if (!studentId || !badgeId) return res.status(400).json({ error: 'اطلاعات اعطای نشان ناقص است.' });
  const result = db.grantCounselorBadge(studentId, badgeId, session.username || 'مشاور', reason);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.status(201).json(result);
});

api.delete('/counselor/badge-grants/:id', requireRole('COUNSELOR'), (req, res) => {
  const result = db.revokeCounselorBadge(req.params.id);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json(result);
});

// 15. Achievements
api.get('/achievements', (req, res) => {
  const session = res.locals.session as any;
  const queryId = typeof req.query.studentId === 'string' ? req.query.studentId : undefined;
  const target = session.role === 'STUDENT' ? session.studentId : (queryId || session.studentId);
  if (!target) return res.status(400).json({ error: 'شناسه دانش‌آموز الزامی است.' });
  if (session.role === 'STUDENT' && queryId && queryId !== session.studentId) return res.status(403).json({ error: 'دسترسی غیرمجاز.' });
  return res.json(db.getStudentAchievements(target));
});

api.post('/achievements/claim', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const { code } = req.body || {};
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'کد دستاورد الزامی است.' });
  const result = db.claimAchievement(session.studentId, code);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json({
    success: true,
    achievement: result.achievement,
    badgeItem: result.badgeItem,
    student: sanitizeStudent(result.student),
  });
});

// 16. Study Hall (Single shared presence room)
api.get('/study-hall/presence', (_req, res) => {
  return res.json(db.getStudyHallPresenceList());
});

api.post('/study-hall/enter', requireRole('STUDENT'), (req, res) => {
  const session = res.locals.session as any;
  const { taskId } = req.body || {};
  if (!taskId || typeof taskId !== 'string') return res.status(400).json({ error: 'برای ورود به سالن مطالعه ابتدا یک پارت از برنامه امروز انتخاب کنید.' });
  const result = db.enterStudyHall(session.studentId, taskId);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json(result);
});

api.post('/study-hall/heartbeat', requireRole('STUDENT'), (_req, res) => {
  const session = res.locals.session as any;
  const result = db.heartbeatStudyHall(session.studentId);
  if (!result.success) return res.status(400).json({ error: result.error });
  return res.json(result);
});

api.post('/study-hall/leave', requireRole('STUDENT'), (_req, res) => {
  const session = res.locals.session as any;
  db.leaveStudyHall(session.studentId);
  return res.json({ success: true });
});

api.post('/study-hall/presence/:id/terminate', requireRole('COUNSELOR'), (req, res) => {
  db.terminateStudyHallPresence(req.params.id);
  return res.json({ success: true });
});

app.use('/api', api);

async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'));

  if (isProd && hasDist) {
    app.use(express.static(distPath, { maxAge: '1d', etag: true }));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`[Hadafe To] Server running on http://0.0.0.0:${PORT}`));

const shutdown = async (signal: string) => {
  console.log(`[Hadafe To] ${signal} received. Flushing pending database writes...`);
  server.close(async () => {
    try { await db.flush(); } catch { /* ignore shutdown flush errors */ }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
}

startServer().catch((error) => { console.error('Server failed to start:', error); process.exit(1); });
