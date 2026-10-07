import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { normalizeDailyReportData } from '../src/components/pdf/dataNormalizer.js';
import { computePagination } from '../src/components/pdf/paginationEngine.js';
import { DailyReportPdfDocument } from '../src/components/pdf/DailyReportPdfDocument.js';
import { Student, PlanTask, SessionReport } from '../src/types/index.js';

async function verify() {
  console.log('🧪 Starting Full Real-World PDF Verification...');

  const dbData = JSON.parse(fs.readFileSync('data/database.json', 'utf8'));
  const student: Student = dbData.students.find((s: Student) => s.id === 'student_1');
  const date = '2026-10-07';

  // Realistic Tasks and Reports with Educational test and Exam test
  const testTasks: PlanTask[] = [
    {
      id: 'task_study',
      studentId: student.id,
      date,
      courseName: 'زیست‌شناسی ۳ - فصل ۵ (ماده و انرژی)',
      activityType: 'مطالعه',
      testMode: 'ندارد',
      minTests: 0,
      durationMinutes: 75,
      actualDurationMinutes: 75,
      order: 1,
      isCompleted: true,
    },
    {
      id: 'task_exam',
      studentId: student.id,
      date,
      courseName: 'زیست‌شناسی ۳ - تنفس نوری و ژنتیک',
      activityType: 'تست',
      testMode: 'آزمونی',
      minTests: 40,
      durationMinutes: 90,
      actualDurationMinutes: 85,
      order: 2,
      isCompleted: true,
    },
    {
      id: 'task_edu',
      studentId: student.id,
      date,
      courseName: 'شیمی دوازدهم - تعادل‌های یونی',
      activityType: 'تست',
      testMode: 'آموزشی',
      minTests: 25,
      durationMinutes: 60,
      actualDurationMinutes: 60,
      order: 3,
      isCompleted: true,
    },
    {
      id: 'task_unreported_test',
      studentId: student.id,
      date,
      courseName: 'فیزیک ۳ - دینامیک دایره‌ای',
      activityType: 'تست',
      testMode: 'آزمونی',
      minTests: 30,
      durationMinutes: 60,
      order: 4,
      isCompleted: false,
    },
    {
      id: 'task_review',
      studentId: student.id,
      date,
      courseName: 'ادبیات فارسی - قرابت معنایی',
      activityType: 'مرور',
      testMode: 'ندارد',
      minTests: 0,
      durationMinutes: 45,
      actualDurationMinutes: 45,
      order: 5,
      isCompleted: true,
    },
  ];

  const testReports: SessionReport[] = [
    {
      id: 'rep_study',
      studentId: student.id,
      taskId: 'task_study',
      date,
      courseName: 'زیست‌شناسی ۳ - فصل ۵ (ماده و انرژی)',
      isCompleted: true,
      satisfaction: 5,
      focus: 5,
      difficulty: 3,
      testsCount: 0,
      reflectionNote: 'مطالعه کامل متن کتاب و یادداشت نکات کلیدی چرخه کربس.',
      focusPointsEarned: 20,
      createdAt: '2026-10-07T09:15:00Z',
    },
    {
      id: 'rep_exam',
      studentId: student.id,
      taskId: 'task_exam',
      date,
      courseName: 'زیست‌شناسی ۳ - تنفس نوری و ژنتیک',
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
        percentage: 79.2,
      },
      reflectionNote: 'تست‌های زمان‌دار عالی بود، ۴ غلط در بخش محاسبات تنفس نوری نیاز به بازخوانی دارد.',
      focusPointsEarned: 60,
      createdAt: '2026-10-07T11:00:00Z',
    },
    {
      id: 'rep_edu',
      studentId: student.id,
      taskId: 'task_edu',
      date,
      courseName: 'شیمی دوازدهم - تعادل‌های یونی',
      isCompleted: true,
      satisfaction: 4,
      focus: 4,
      difficulty: 3,
      testsCount: 20, // Educational test count without fake correct/wrong/blank!
      reflectionNote: '۲۰ تست آموزشی بررسی و تمام پاسخنامه‌های تشریحی تحلیل شد.',
      focusPointsEarned: 30,
      createdAt: '2026-10-07T12:30:00Z',
    },
  ];

  const reportData = normalizeDailyReportData(
    student,
    date,
    testTasks,
    testReports,
    dbData.habits || [],
    [],
    []
  );

  const pagination = computePagination(reportData);
  console.log(`📊 Total Pages Calculated: ${pagination.totalPages}`);
  pagination.pages.forEach((p) => {
    const sectionTypes = p.sections.map((s) => s.type).join(', ');
    const taskCount = p.sections.find((s) => s.type === 'TASK_CARD_LIST')?.tasks?.length || 0;
    console.log(` - Page ${p.pageNumber}: "${p.pageTitle}" | Tasks: ${taskCount} | Sections: [${sectionTypes}]`);
  });

  // Verify TEST C: No artificial page explosion (5 tasks + overview fit in exactly 2 pages)
  if (pagination.totalPages !== 2) {
    throw new Error(`Expected exactly 2 pages for 5 tasks and overview, got ${pagination.totalPages}`);
  }
  console.log('✅ TEST C Passed: 5 tasks cleanly packed without artificial blank space breaks!');

  // Render HTML markup
  const documentMarkup = renderToStaticMarkup(
    React.createElement(DailyReportPdfDocument, { data: reportData })
  );

  // Check TEST A: Educational test shows "تعداد تست: ۲۰"
  if (!documentMarkup.includes('تعداد تست: ۲۰')) {
    throw new Error('TEST A Failed: Educational test count not found in rendered HTML');
  }
  console.log('✅ TEST A Passed: Educational test shows "تعداد تست: ۲۰"!');

  // Check TEST B: Exam test shows کل تست: ۴۰, صحیح: ۳۳, غلط: ۴, نزده: ۳, درصد: ۷۹.۲٪
  if (
    !documentMarkup.includes('کل تست: ۴۰') ||
    !documentMarkup.includes('صحیح: ۳۳') ||
    !documentMarkup.includes('غلط: ۴') ||
    !documentMarkup.includes('نزده: ۳') ||
    !documentMarkup.includes('درصد: ۷۹.۲٪')
  ) {
    throw new Error('TEST B Failed: Exam test details not fully displayed in rendered HTML');
  }
  console.log('✅ TEST B Passed: Exam test displays complete statistics (کل, صحیح, غلط, نزده, درصد)!');

  // Check uncompleted test task shows "اطلاعات تست ثبت نشده است"
  if (!documentMarkup.includes('اطلاعات تست ثبت نشده است')) {
    throw new Error('Failed: Unrecorded test task should display "اطلاعات تست ثبت نشده است"');
  }
  console.log('✅ Unreported test handled gracefully with "اطلاعات تست ثبت نشده است"!');

  // Check TEST D: Header on Page 1 is simple (no chips), Page 2 has compact minimal header
  const pagesHtml = documentMarkup.split('data-pdf-page');
  const page1Html = pagesHtml[1] || '';
  const page2Html = pagesHtml[2] || '';

  if (page1Html.includes('رشته علوم تجربی') || page1Html.includes('پایه دوازدهم')) {
    throw new Error('TEST D Failed: Page 1 Header still contains clutter chips (رشته/پایه)');
  }
  if (page2Html.includes(student.fullName)) {
    throw new Error('TEST D Failed: Page 2 Header should NOT repeat student name');
  }
  console.log('✅ TEST D Passed: Header is lightweight, Page 1 has no chips, Page 2 is ultra-minimal!');

  // Now perform actual Puppeteer PDF generation
  console.log('\n🖨️ Generating real PDF via Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.emulateMediaType('print');

  const fullHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Estedad:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { margin: 0; padding: 0; background-color: #090b17; color: #f8fafc; font-family: 'Estedad', sans-serif; direction: rtl; }
    #hadafeto-pdf-document { margin: 0; padding: 0; gap: 0; width: 794px; display: block; }
    [data-pdf-page] { width: 794px; min-width: 794px; max-width: 794px; height: 1123px; min-height: 1123px; max-height: 1123px; box-sizing: border-box; margin: 0 !important; page-break-after: always; break-after: page; page-break-inside: avoid; break-inside: avoid; overflow: hidden; position: relative; }
    [data-pdf-page]:last-child { page-break-after: auto; break-after: auto; }
  </style>
</head>
<body style="background-color: #090b17; color: #f8fafc; margin: 0; padding: 0;">
  ${documentMarkup}
</body>
</html>`;

  await page.setContent(fullHtml, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(async () => {
    if ('fonts' in document) {
      await document.fonts.ready;
    }
  });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log(`📄 Real PDF Generated! Byte Size: ${pdfBuffer.length} bytes`);
  fs.writeFileSync('test-output-verified.pdf', pdfBuffer);
  await browser.close();

  console.log('🎉 ALL TESTS (A, B, C, D) PASSED AND VERIFIED WITH REAL OUTPUT!');
}

verify().catch((err) => {
  console.error('❌ Verification Error:', err);
  process.exit(1);
});
