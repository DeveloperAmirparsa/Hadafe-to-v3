/**
 * Reusable PDF Page Components for Hadafeto
 * High-resolution, stable A4 elements respecting the approved visual identity.
 */
import React from 'react';
import { DailyReportData } from './types.js';
import { PlanTask } from '../../types/index.js';
import {
  toPersianDigits,
  formatPersianTime,
} from '../../utils/persianDate.js';

interface PageProps {
  pageNumber: number;
  totalPages: number;
  title?: string;
  data: DailyReportData;
  children: React.ReactNode;
}

export const PdfPage: React.FC<PageProps> = ({
  pageNumber,
  totalPages,
  title,
  data,
  children,
}) => {
  return (
    <div
      data-pdf-page={pageNumber}
      style={{
        width: '794px',
        height: '1123px',
        minHeight: '1123px',
        maxHeight: '1123px',
        backgroundColor: '#090b17',
        color: '#f8fafc',
        fontFamily: "'Estedad', sans-serif",
        boxSizing: 'border-box',
        padding: '30px 36px 24px 36px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        direction: 'rtl',
        breakAfter: pageNumber === totalPages ? 'auto' : 'page',
        pageBreakAfter: pageNumber === totalPages ? 'auto' : 'always',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      {/* Background ambient gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'radial-gradient(circle at 85% 0%, rgba(139, 92, 246, 0.08) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Header */}
        <PdfHeader data={data} pageNumber={pageNumber} subTitle={title} />

        {/* Content Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, marginTop: '14px' }}>
          {children}
        </div>
      </div>

      {/* Footer */}
      <PdfFooter data={data} pageNumber={pageNumber} totalPages={totalPages} />
    </div>
  );
};

export const PdfHeader: React.FC<{
  data: DailyReportData;
  pageNumber: number;
  subTitle?: string;
}> = ({ data, pageNumber, subTitle }) => {
  const isFirstPage = pageNumber === 1;

  return (
    <div
      style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Right side: Branding & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>هـ</span>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
              هدف تو <span style={{ color: '#a78bfa', fontWeight: 400, fontSize: '13px' }}>| سامانه ارزیابی کنکور</span>
            </h1>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(139, 92, 246, 0.18)',
                color: '#c4b5fd',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontWeight: 600,
              }}
            >
              گزارش عملکرد روزانه
            </span>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
            {subTitle && !isFirstPage ? subTitle : data.fullJalaliDate}
          </div>
        </div>
      </div>

      {/* Left side: Student Info */}
      <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
          {data.student.fullName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#94a3b8' }}>
          <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '1px 6px', borderRadius: '4px' }}>
            پایه {data.student.grade}
          </span>
          <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '1px 6px', borderRadius: '4px' }}>
            رشته {data.student.major}
          </span>
          {data.student.streak > 0 && (
            <span style={{ color: '#fb923c', fontWeight: 600 }}>
              استمرار: {toPersianDigits(data.student.streak)} روز 🔥
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const PdfFooter: React.FC<{
  data: DailyReportData;
  pageNumber: number;
  totalPages: number;
}> = ({ data, pageNumber, totalPages }) => {
  return (
    <div
      style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '10px',
        color: '#64748b',
        zIndex: 2,
      }}
    >
      <div>
        هدف تو | شناسه گزارش: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>HD-{data.fileDateString}-{data.student.id.slice(0, 6)}</span>
      </div>

      <div>
        تاریخ صدور: {data.fullJalaliDate}
      </div>

      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          padding: '2px 8px',
          borderRadius: '6px',
          color: '#cbd5e1',
          fontWeight: 600,
        }}
      >
        صفحه {toPersianDigits(pageNumber)} از {toPersianDigits(totalPages)}
      </div>
    </div>
  );
};

export const PdfKpiGrid: React.FC<{ data: DailyReportData }> = ({ data }) => {
  const kpis = [
    {
      label: 'مطالعه انجام‌شده',
      value: formatPersianTime(data.actualStudyMinutes),
      subtext: data.dailyGoalMinutes > 0
        ? `هدف: ${formatPersianTime(data.dailyGoalMinutes)}`
        : 'کل زمان خالص',
      color: '#34d399',
      border: 'rgba(16, 185, 129, 0.25)',
      bg: 'rgba(16, 185, 129, 0.08)',
    },
    {
      label: 'پارت‌های مطالعه',
      value: `${toPersianDigits(data.completedTasks.length)} از ${toPersianDigits(data.tasks.length)}`,
      subtext: data.missedTasks.length > 0
        ? `${toPersianDigits(data.missedTasks.length)} پارت انجام‌نشده`
        : 'تکمیل کامل برنامه',
      color: '#a78bfa',
      border: 'rgba(139, 92, 246, 0.25)',
      bg: 'rgba(139, 92, 246, 0.08)',
    },
    {
      label: 'مجموع تست‌های حل‌شده',
      value: toPersianDigits(data.totalTestsCount),
      subtext: data.averageTestPercentage !== null
        ? `میانگین درصد: ${toPersianDigits(data.averageTestPercentage)}٪`
        : 'ثبت در پارت‌های آزمونی',
      color: '#38bdf8',
      border: 'rgba(56, 189, 248, 0.25)',
      bg: 'rgba(56, 189, 248, 0.08)',
    },
    {
      label: 'امتیاز تمرکز کسب‌شده',
      value: `${toPersianDigits(data.focusPointsEarned)} FP`,
      subtext: `کل اندوخته: ${toPersianDigits(data.totalFocusPoints)}`,
      color: '#f59e0b',
      border: 'rgba(245, 158, 11, 0.25)',
      bg: 'rgba(245, 158, 11, 0.08)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
      }}
    >
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: kpi.bg,
            border: `1px solid ${kpi.border}`,
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{kpi.label}</span>
          <div style={{ fontSize: '16px', fontWeight: 800, color: kpi.color, margin: '5px 0 2px 0' }}>
            {kpi.value}
          </div>
          <span style={{ fontSize: '9.5px', color: '#64748b' }}>{kpi.subtext}</span>
        </div>
      ))}
    </div>
  );
};

export const PdfProgressRings: React.FC<{ data: DailyReportData }> = ({ data }) => {
  const rings = [
    {
      label: 'تکمیل برنامه',
      pct: data.tasks.length > 0 ? data.planCompletionRate : null,
      valText: data.tasks.length > 0 ? `${toPersianDigits(data.planCompletionRate)}٪` : '—',
      color: '#8b5cf6',
      desc: `${toPersianDigits(data.completedTasks.length)} از ${toPersianDigits(data.tasks.length)} پارت`,
    },
    {
      label: 'تحقق هدف مطالعه',
      pct: data.dailyGoalProgressPct,
      valText: data.dailyGoalProgressPct !== null ? `${toPersianDigits(data.dailyGoalProgressPct)}٪` : '—',
      color: '#10b981',
      desc: data.dailyGoalMinutes > 0 ? `${toPersianDigits(Math.round(data.actualStudyMinutes / 60 * 10) / 10)} ساعت` : 'هدف تعیین نشده',
    },
    {
      label: 'صحت و درصد تست',
      pct: data.averageTestPercentage,
      valText: data.averageTestPercentage !== null ? `${toPersianDigits(data.averageTestPercentage)}٪` : '—',
      color: '#06b6d4',
      desc: data.totalTestsCount > 0 ? `${toPersianDigits(data.totalCorrectTests)} تست درست` : 'تستی ثبت نشده',
    },
    {
      label: 'شاخص تمرکز عمیق',
      pct: data.averageFocus ? Math.round((data.averageFocus / 5) * 100) : null,
      valText: data.averageFocus ? `${toPersianDigits(data.averageFocus)} از ۵` : '—',
      color: '#f59e0b',
      desc: data.averageFocus ? 'کیفیت جلسات مطالعه' : 'داده کافی نیست',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
      }}
    >
      {rings.map((ring, idx) => {
        const radius = 28;
        const stroke = 5;
        const circumference = 2 * Math.PI * radius;
        const progress = ring.pct !== null ? Math.min(100, Math.max(0, ring.pct)) : 0;
        const strokeDashoffset = circumference - (progress / 100) * circumference;

        return (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {/* SVG Ring */}
            <div style={{ width: '64px', height: '64px', position: 'relative', flexShrink: 0 }}>
              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={stroke}
                  fill="transparent"
                />
                {ring.pct !== null && (
                  <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke={ring.color}
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                )}
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {ring.valText}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#e2e8f0' }}>{ring.label}</div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>{ring.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const PdfTimelineTable: React.FC<{ data: DailyReportData }> = ({ data }) => {
  if (data.tasks.length === 0) {
    return (
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '12px',
        }}
      >
        هیچ پارت مطالعه‌ای برای این روز در سامانه ثبت نشده است.
      </div>
    );
  }

  // Display first 7 tasks in overview timeline table
  const previewTasks = data.tasks.slice(0, 7);

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
          نمای کلی تایم‌لاین روزانه ({toPersianDigits(data.tasks.length)} پارت)
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
          پارت‌های سبز: انجام شده | قرمز: ناتمام
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
        <thead>
          <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'right' }}>
            <th style={{ padding: '4px 6px', width: '30px' }}>#</th>
            <th style={{ padding: '4px 6px' }}>درس و مبحث</th>
            <th style={{ padding: '4px 6px', width: '70px' }}>نوع فعالیت</th>
            <th style={{ padding: '4px 6px', width: '80px' }}>ساعت اجرا</th>
            <th style={{ padding: '4px 6px', width: '85px' }}>مدت زمان</th>
            <th style={{ padding: '4px 6px', width: '75px', textAlign: 'center' }}>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {previewTasks.map((t, idx) => {
            const isDone = t.isCompleted;
            const isMissed = !isDone && t.status === 'MISSED';
            const statusBg = isDone
              ? 'rgba(16, 185, 129, 0.15)'
              : isMissed
              ? 'rgba(239, 68, 68, 0.15)'
              : 'rgba(139, 92, 246, 0.12)';
            const statusColor = isDone
              ? '#34d399'
              : isMissed
              ? '#f87171'
              : '#c4b5fd';
            const statusText = isDone ? 'انجام شد' : isMissed ? 'از دست رفته' : 'برنامه‌ریزی';

            return (
              <tr
                key={t.id}
                style={{
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                }}
              >
                <td style={{ padding: '5px 6px', color: '#64748b' }}>{toPersianDigits(idx + 1)}</td>
                <td style={{ padding: '5px 6px', fontWeight: 600, color: '#f1f5f9' }}>{t.courseName}</td>
                <td style={{ padding: '5px 6px', color: '#cbd5e1' }}>{t.activityType}</td>
                <td style={{ padding: '5px 6px', color: '#94a3b8', direction: 'ltr', textAlign: 'right' }}>
                  {t.startTime ? `${toPersianDigits(t.startTime)} - ${toPersianDigits(t.endTime || '')}` : '—'}
                </td>
                <td style={{ padding: '5px 6px', color: '#94a3b8' }}>
                  {formatPersianTime(t.actualDurationMinutes || t.durationMinutes)}
                </td>
                <td style={{ padding: '5px 6px', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '9.5px',
                      fontWeight: 600,
                      backgroundColor: statusBg,
                      color: statusColor,
                    }}
                  >
                    {statusText}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {data.tasks.length > 7 && (
        <div style={{ textAlign: 'center', fontSize: '9.5px', color: '#818cf8', marginTop: '6px' }}>
          + {toPersianDigits(data.tasks.length - 7)} پارت دیگر در صفحات جزئیات گزارش آورده شده است.
        </div>
      )}
    </div>
  );
};

export const PdfHabitsAndGoals: React.FC<{ data: DailyReportData }> = ({ data }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
      }}
    >
      {/* Habits Card */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '5px',
          }}
        >
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f1f5f9' }}>
            روتین‌ها و عادات روزانه
          </div>
          <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 600 }}>
            {toPersianDigits(data.completedHabitsCount)} از {toPersianDigits(data.totalHabitsCount)}
          </div>
        </div>

        {data.habits.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b', padding: '6px 0' }}>
            عادت فعالی برای این تاریخ ثبت نشده است.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {data.habits.slice(0, 4).map((h) => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  color: h.completed ? '#f1f5f9' : '#94a3b8',
                }}
              >
                <span>{h.title}</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: h.completed ? '#34d399' : '#f87171',
                  }}
                >
                  {h.completed ? '✓' : '✕'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals Card */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px 14px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            paddingBottom: '5px',
          }}
        >
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#f1f5f9' }}>
            اهداف اصلی دانش‌آموز
          </div>
          <div style={{ fontSize: '10px', color: '#a78bfa' }}>
            کنکور سراسری
          </div>
        </div>

        {data.goals.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b', padding: '6px 0' }}>
            هدف ثبت‌شده‌ای برای نمایش وجود ندارد.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {data.goals.slice(0, 3).map((g) => (
              <div
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: '#e2e8f0',
                }}
              >
                <span style={{ fontWeight: 600 }}>• {g.title}</span>
                {g.targetRank && (
                  <span style={{ color: '#f59e0b', fontSize: '9.5px' }}>
                    رتبه هدف: {toPersianDigits(g.targetRank)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PdfTaskCard: React.FC<{
  task: PlanTask;
  data: DailyReportData;
}> = ({ task, data }) => {
  const report = data.reportsByTaskId[task.id];
  const isDone = task.isCompleted;
  const isMissed = !isDone && task.status === 'MISSED';

  const cardBorder = isDone
    ? 'rgba(16, 185, 129, 0.25)'
    : isMissed
    ? 'rgba(239, 68, 68, 0.25)'
    : 'rgba(139, 92, 246, 0.2)';

  const headerBg = isDone
    ? 'rgba(16, 185, 129, 0.08)'
    : isMissed
    ? 'rgba(239, 68, 68, 0.08)'
    : 'rgba(139, 92, 246, 0.06)';

  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: `1px solid ${cardBorder}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Task Top Header */}
      <div
        style={{
          backgroundColor: headerBg,
          padding: '8px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            {toPersianDigits(task.order || 1)}
          </span>

          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#ffffff' }}>
            {task.courseName}
          </span>

          <span
            style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#c4b5fd',
            }}
          >
            {task.activityType} {task.testMode && task.testMode !== 'ندارد' ? `(${task.testMode})` : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
            زمان برنامه‌ریزی: {formatPersianTime(task.durationMinutes)}
            {task.actualDurationMinutes ? ` | اجرا: ${formatPersianTime(task.actualDurationMinutes)}` : ''}
          </span>

          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '5px',
              backgroundColor: isDone ? 'rgba(16, 185, 129, 0.2)' : isMissed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: isDone ? '#34d399' : isMissed ? '#f87171' : '#c4b5fd',
            }}
          >
            {isDone ? 'انجام شده' : isMissed ? 'از دست رفته' : 'برنامه‌ریزی'}
          </span>
        </div>
      </div>

      {/* Task Details & Session Report (if present) */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {report ? (
          <>
            {/* Rating Scores: Satisfaction, Focus, Difficulty */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                fontSize: '10px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#94a3b8' }}>میزان تمرکز:</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>
                  {toPersianDigits(report.focus || '—')} از ۵
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#94a3b8' }}>رضایت از مطالعه:</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>
                  {toPersianDigits(report.satisfaction || '—')} از ۵
                </span>
              </div>

              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: '#94a3b8' }}>سطح دشواری:</span>
                <span style={{ fontWeight: 700, color: '#fb923c' }}>
                  {toPersianDigits(report.difficulty || '—')} از ۵
                </span>
              </div>
            </div>

            {/* Test Results Breakdown (if tests were taken) */}
            {report.testResult && report.testResult.total > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>
                    نتیجه تست: {toPersianDigits(report.testResult.total)} تست
                  </span>
                  <span style={{ color: '#34d399' }}>
                    درست: {toPersianDigits(report.testResult.correct)}
                  </span>
                  <span style={{ color: '#f87171' }}>
                    غلط: {toPersianDigits(report.testResult.wrong)}
                  </span>
                  <span style={{ color: '#94a3b8' }}>
                    نزده: {toPersianDigits(report.testResult.unanswered)}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    padding: '2px 8px',
                    borderRadius: '5px',
                    fontWeight: 700,
                  }}
                >
                  درصد نهایی: {toPersianDigits(report.testResult.percentage)}٪
                </div>
              </div>
            )}

            {/* Reflection Note */}
            {report.reflectionNote && report.reflectionNote.trim().length > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRight: '3px solid #8b5cf6',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  color: '#cbd5e1',
                  lineHeight: '1.6',
                  wordBreak: 'break-word',
                }}
              >
                <span style={{ color: '#a78bfa', fontWeight: 600, display: 'block', marginBottom: '2px' }}>
                  یادداشت دانش‌آموز:
                </span>
                {report.reflectionNote}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
            گزارش تفصیلی برای این پارت در سامانه ثبت نشده است.
          </div>
        )}
      </div>
    </div>
  );
};

export const PdfInsightsSection: React.FC<{ data: DailyReportData }> = ({ data }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
      }}
    >
      {/* Strengths */}
      <div
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '12px 14px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
          نقاط قوت امروز
        </div>

        {data.strengths.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            داده‌ای برای ارزیابی نقاط قوت در دسترس نیست.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.strengths.map((str, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  fontSize: '10px',
                  color: '#e2e8f0',
                  lineHeight: '1.5',
                }}
              >
                <span style={{ color: '#34d399', fontWeight: 700 }}>✓</span>
                <span>{str}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Areas For Attention */}
      <div
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '12px 14px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', marginBottom: '8px' }}>
          موارد نیازمند توجه
        </div>

        {data.areasForAttention.length === 0 ? (
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>
            مورد هشداردهنده‌ای برای این روز ثبت نشده و روند مطلوب است.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.areasForAttention.map((area, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  fontSize: '10px',
                  color: '#e2e8f0',
                  lineHeight: '1.5',
                }}
              >
                <span style={{ color: '#f87171', fontWeight: 700 }}>!</span>
                <span>{area}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PdfFinalSummary: React.FC<{ data: DailyReportData }> = ({ data }) => {
  return (
    <div
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          paddingBottom: '6px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9' }}>
          خلاصه عملکرد و ارزیابی نهایی روز
        </div>
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
          سامانه هوشمند هدف تو
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          fontSize: '10.5px',
        }}
      >
        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '6px' }}>
          <div style={{ color: '#94a3b8', fontSize: '9px' }}>مجموع ساعت مطالعه</div>
          <div style={{ fontWeight: 700, color: '#34d399', marginTop: '2px' }}>
            {formatPersianTime(data.actualStudyMinutes)}
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '6px' }}>
          <div style={{ color: '#94a3b8', fontSize: '9px' }}>نرخ تکمیل برنامه</div>
          <div style={{ fontWeight: 700, color: '#a78bfa', marginTop: '2px' }}>
            {toPersianDigits(data.planCompletionRate)}٪
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '6px' }}>
          <div style={{ color: '#94a3b8', fontSize: '9px' }}>تست‌های حل‌شده</div>
          <div style={{ fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
            {toPersianDigits(data.totalTestsCount)} ({toPersianDigits(data.averageTestPercentage ?? 0)}٪)
          </div>
        </div>

        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '6px' }}>
          <div style={{ color: '#94a3b8', fontSize: '9px' }}>شاخص تمرکز و استمرار</div>
          <div style={{ fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
            {data.averageFocus ? `${toPersianDigits(data.averageFocus)} از ۵` : '—'} | {toPersianDigits(data.streak)} روز
          </div>
        </div>
      </div>

      {/* Counselor Signature / Note space */}
      <div
        style={{
          marginTop: '6px',
          borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
          paddingTop: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9.5px',
          color: '#64748b',
        }}
      >
        <div>
          محل امضا و بازخورد مشاور تحصیلی: ................................................................
        </div>
        <div>
          تأییدیه سیستم هدف تو ✓
        </div>
      </div>
    </div>
  );
};
