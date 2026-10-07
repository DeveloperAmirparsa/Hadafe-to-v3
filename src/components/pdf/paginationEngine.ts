/**
 * Smart Dynamic Pagination Engine for Daily PDF Report
 * Calculates atomic block heights for individual report cards and sections.
 * Dynamically packs cards into A4 pages based on available budget without arbitrary breaks.
 */
import { DailyReportData, PaginationResult, PdfPageContent } from './types.js';
import { PlanTask } from '../../types/index.js';

// Safe available content height per A4 page in pixels for Page 2+
// (1123px total A4 height - 34px vertical padding - 30px compact header - 32px footer - 6px margin)
export const PAGE_2_CONTENT_BUDGET = 1010;

/**
 * Calculates the exact rendered height of an individual report card as an atomic block.
 */
export function calculateTaskCardHeight(task: PlanTask, data: DailyReportData): number {
  const report = data.reportsByTaskId[task.id];

  // Base card outer border (2px) + header (31px) + body padding (16px) = 49px
  let height = 49;

  if (report) {
    // Quality ratings grid (focus, satisfaction, difficulty): ~22px
    const hasRatings =
      typeof report.focus === 'number' ||
      typeof report.satisfaction === 'number' ||
      typeof report.difficulty === 'number';
    if (hasRatings) {
      height += 22;
    }

    // Determine test characteristics
    const testRes = report.testResult;
    const isExamTest =
      task.testMode === 'آزمونی' ||
      (testRes && (typeof testRes.correct === 'number' || typeof testRes.wrong === 'number'));
    const isEducationalOrGeneralTest =
      !isExamTest &&
      (task.testMode === 'آموزشی' ||
       task.activityType === 'تست' ||
       (task.minTests || 0) > 0 ||
       typeof report.testsCount === 'number' ||
       !!testRes);

    const totalTests = typeof testRes?.total === 'number'
      ? testRes.total
      : typeof report.testsCount === 'number'
      ? report.testsCount
      : null;

    if (isExamTest) {
      if (totalTests !== null) {
        // Exam test with registered questions: padding 12px + text 14px + border 2px + gap 6px = 34px
        const correct = typeof testRes?.correct === 'number' ? testRes.correct : null;
        const wrong = typeof testRes?.wrong === 'number' ? testRes.wrong : null;
        const unanswered = typeof testRes?.unanswered === 'number' ? testRes.unanswered : null;
        const isSumMismatch =
          correct !== null && wrong !== null && unanswered !== null && correct + wrong + unanswered !== totalTests;

        height += isSumMismatch ? 46 : 34;
      } else {
        // Exam test with no test info registered: fallback banner ~24px + gap 6px = 30px
        height += 30;
      }
    } else if (isEducationalOrGeneralTest) {
      if (totalTests !== null) {
        // Educational test with registered count: ~28px + gap 6px = 34px
        height += 34;
      } else if (task.activityType === 'تست' || task.testMode === 'آموزشی' || (task.minTests || 0) > 0) {
        // Designated test task with no test data: fallback banner ~24px + gap 6px = 30px
        height += 30;
      }
    }

    // Reflection note (dynamic line count)
    if (report.reflectionNote && report.reflectionNote.trim().length > 0) {
      const text = report.reflectionNote.trim();
      const lines = Math.max(1, Math.ceil(text.length / 80));
      // Label 14px + padding 10px + lines * 15px + gap 6px
      height += 14 + 10 + lines * 15 + 6;
    }
  } else {
    // No session report registered:
    const isTestTask =
      task.activityType === 'تست' ||
      task.testMode === 'آموزشی' ||
      task.testMode === 'آزمونی' ||
      (task.minTests || 0) > 0;

    if (isTestTask) {
      // Shows fallback "اطلاعات تست ثبت نشده است": ~22px
      height += 22;
    } else {
      // Shows subtle notice: ~18px
      height += 18;
    }
  }

  // Card gap in the list: 8px
  return height + 8;
}

// Export backwards-compatible alias
export const estimateTaskCardHeight = calculateTaskCardHeight;

/**
 * Calculates height of Insights section (Strengths & Areas for attention)
 */
export function calculateInsightsHeight(data: DailyReportData): number {
  const maxItems = Math.max(data.strengths.length || 1, data.areasForAttention.length || 1);
  return 24 + 16 + (maxItems * 18) + 10;
}

/**
 * Calculates height of Final Summary section
 */
export function calculateFinalSummaryHeight(): number {
  return 125;
}

/**
 * Dynamic pagination algorithm
 */
export function computePagination(data: DailyReportData): PaginationResult {
  const pages: PdfPageContent[] = [];

  const hasTasks = data.tasks.length > 0;
  const isSuperCompact = data.tasks.length <= 2 && data.notes.length <= 1;

  if (isSuperCompact) {
    // Single Page Layout: Fits all overview, compact tasks, habits, and summary
    pages.push({
      pageNumber: 1,
      pageTitle: 'گزارش عملکرد روزانه',
      sections: [
        { type: 'OVERVIEW_HEADER' },
        { type: 'KPI_GRID' },
        { type: 'PROGRESS_RINGS' },
        { type: 'HABITS_AND_GOALS' },
        ...(hasTasks ? [{ type: 'TASK_CARD_LIST' as const, tasks: data.tasks }] : []),
        { type: 'INSIGHTS_SECTION' },
        { type: 'FINAL_SUMMARY' },
      ],
    });

    return {
      pages,
      totalPages: 1,
    };
  }

  // Multi-Page Layout:
  // Page 1: Daily Overview, KPIs, Rings, Habits/Goals, and Daily Timeline Overview
  pages.push({
    pageNumber: 1,
    pageTitle: 'گزارش عملکرد روزانه',
    sections: [
      { type: 'OVERVIEW_HEADER' },
      { type: 'KPI_GRID' },
      { type: 'PROGRESS_RINGS' },
      { type: 'TIMELINE_OVERVIEW' },
      { type: 'HABITS_AND_GOALS' },
    ],
  });

  // Pages 2+: Detailed Task Reports paginated dynamically as atomic blocks
  if (hasTasks) {
    let currentPageTasks: PlanTask[] = [];
    let currentHeight = 0;
    let pageIndex = 2;

    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];
      const cardHeight = calculateTaskCardHeight(task, data);

      if (currentHeight + cardHeight <= PAGE_2_CONTENT_BUDGET) {
        currentPageTasks.push(task);
        currentHeight += cardHeight;
      } else {
        if (currentPageTasks.length > 0) {
          pages.push({
            pageNumber: pageIndex,
            pageTitle: `جزئیات پارت‌های مطالعه (بخش ${pageIndex - 1})`,
            sections: [{ type: 'TASK_CARD_LIST', tasks: currentPageTasks }],
          });
          pageIndex++;
          currentPageTasks = [task];
          currentHeight = cardHeight;
        } else {
          currentPageTasks.push(task);
          currentHeight += cardHeight;
        }
      }
    }

    // Now check if Insights & Final Summary can fit on the last page of tasks
    const summaryNeededHeight = calculateInsightsHeight(data) + calculateFinalSummaryHeight() + 10;

    if (currentHeight + summaryNeededHeight <= PAGE_2_CONTENT_BUDGET) {
      // Append right on the current page to eliminate empty pages
      pages.push({
        pageNumber: pageIndex,
        pageTitle: pageIndex === 2 ? 'جزئیات پارت‌ها و جمع‌بندی روزانه' : `جزئیات پارت‌های مطالعه (بخش ${pageIndex - 1})`,
        sections: [
          { type: 'TASK_CARD_LIST', tasks: currentPageTasks },
          { type: 'INSIGHTS_SECTION' },
          { type: 'FINAL_SUMMARY' },
        ],
      });
    } else {
      // Close the task cards page and allocate summary to a new page
      if (currentPageTasks.length > 0) {
        pages.push({
          pageNumber: pageIndex,
          pageTitle: `جزئیات پارت‌های مطالعه (بخش ${pageIndex - 1})`,
          sections: [{ type: 'TASK_CARD_LIST', tasks: currentPageTasks }],
        });
        pageIndex++;
      }
      pages.push({
        pageNumber: pageIndex,
        pageTitle: 'جمع‌بندی تحلیلی و بازخورد روزانه',
        sections: [
          { type: 'INSIGHTS_SECTION' },
          { type: 'FINAL_SUMMARY' },
        ],
      });
    }
  } else {
    // No tasks at all: Page 2 gets insights & summary
    pages.push({
      pageNumber: 2,
      pageTitle: 'جمع‌بندی تحلیلی و بازخورد روزانه',
      sections: [
        { type: 'INSIGHTS_SECTION' },
        { type: 'FINAL_SUMMARY' },
      ],
    });
  }

  // Normalize page numbers
  pages.forEach((p, idx) => {
    p.pageNumber = idx + 1;
  });

  return {
    pages,
    totalPages: pages.length,
  };
}
