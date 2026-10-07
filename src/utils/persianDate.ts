/**
 * Persian Date and Number Utilities
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return '';
  return num
    .toString()
    .replace(/\d/g, (digit) => PERSIAN_DIGITS[parseInt(digit, 10)]);
}

export function formatPersianTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '۰ دقیقه';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  if (hours > 0 && minutes > 0) {
    return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(minutes)} دقیقه`;
  }
  if (hours > 0) {
    return `${toPersianDigits(hours)} ساعت`;
  }
  return `${toPersianDigits(minutes)} دقیقه`;
}

export function formatSecondsToClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${toPersianDigits(mm)}:${toPersianDigits(ss)}`;
}

// Persian week days starting Saturday (شنبه)
export const PERSIAN_WEEKDAYS = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

// Simple accurate Gregorian to Jalali converter
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 +
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) +
    gd +
    g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

export function getTodayJalaliString(): string {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  const weekdayIndex = (now.getDay() + 1) % 7; // Saturday is 0
  const weekdayName = PERSIAN_WEEKDAYS[weekdayIndex];
  const monthName = PERSIAN_MONTHS[jm - 1];
  return `${weekdayName}، ${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

export function getTodayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatPersianPercentage(num: number): string {
  return `${toPersianDigits(Math.round(num))}٪`;
}

export function formatPersianDateTime(isoString: string | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    const [jy, jm, jd] = gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${toPersianDigits(hours)}:${toPersianDigits(minutes)}:${toPersianDigits(seconds)} (${toPersianDigits(jd)} ${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)})`;
  } catch {
    return '—';
  }
}

// Calculate end time string from HH:mm + duration in minutes
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return '';
  const parts = startTime.split(':');
  if (parts.length < 2) return '';
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const totalMins = h * 60 + m + durationMinutes;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export interface PersianWeekDay {
  dayName: string;
  isoDate: string;
  jalaliFormatted: string;
  isToday: boolean;
  dayIndex: number; // 0 for شنبه, 6 for جمعه
}

// Get Persian week (Saturday to Friday) for any given reference date
export function getPersianWeekDays(referenceDate: Date = new Date(), weekOffset: number = 0): PersianWeekDay[] {
  const d = new Date(referenceDate);
  if (weekOffset !== 0) {
    d.setDate(d.getDate() + weekOffset * 7);
  }

  // In JavaScript: Sunday is 0, Monday is 1, ..., Saturday is 6.
  // In Persian calendar: Saturday (شنبه) is the first day of the week!
  const jsDay = d.getDay(); // 0 (Sun) to 6 (Sat)
  // Distance from last Saturday:
  // Saturday (6) -> 0 days back
  // Sunday (0) -> 1 day back
  // Monday (1) -> 2 days back
  // ...
  // Friday (5) -> 6 days back
  const daysSinceSaturday = (jsDay + 1) % 7;

  const saturday = new Date(d);
  saturday.setDate(saturday.getDate() - daysSinceSaturday);

  const todayIso = getTodayISODate();
  const weekDays: PersianWeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(saturday);
    current.setDate(saturday.getDate() + i);

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;

    const [jy, jm, jd] = gregorianToJalali(year, current.getMonth() + 1, current.getDate());

    weekDays.push({
      dayName: PERSIAN_WEEKDAYS[i],
      isoDate,
      jalaliFormatted: `${toPersianDigits(jd)} ${PERSIAN_MONTHS[jm - 1]}`,
      isToday: isoDate === todayIso,
      dayIndex: i,
    });
  }

  return weekDays;
}

