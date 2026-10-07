/**
 * Smart Pagination Engine for Daily PDF Report
 * Calculates explicit page budgets and partitions content into discrete A4 pages.
 * Packs task cards dynamically based on real rendered block heights without arbitrary breaks.
 */
import { DailyReportData, PaginationResult, PdfPageContent } from './types.js';
import { PlanTask } from '../../types/index.js';

// Safe available content height per A4 page in pixels for Page 2+
// (1123px total A4 height - 44px vertical padding - 32px compact header - 38px footer)
const PAGE_2_CONTENT_BUDGET = 990;

export function estimateTaskCardHeight(task: PlanTask, data: DailyReportData): number {
  const report = data.reportsByTaskId[task.id];
  // Base header height: 32px + container borders & padding: ~14px = 46px
  let height = 46;

  if (report) {
    // Quality ratings grid (focus, satisfaction, difficulty)
    height += 30;

    // Test results section
    const isExam = task.testMode === 'آزمونی';
    const isEducational = task.testMode === 'آموزشی';
    const isTestActivity = task.activityType === 'تست';
    const isTestTask = isExam || isEducational || isTestActivity || (task.minTests || 0) > 0;

    if (isTestTask) {
      height += 32;
    }

    // Reflection note
    if (report.reflectionNote && report.reflectionNote.trim().length > 0) {
      const len = report.reflectionNote.trim().length;
      const lines = Math.ceil(len / 85);
      height += 16 + lines * 16;
    }
  } else {
    // No report registered yet: test task shows "اطلاعات تست ثبت نشده است"
    const isTestTask =
      task.activityType === 'تست' ||
      task.testMode === 'آموزشی' ||
      task.testMode === 'آزمونی' ||
      (task.minTests || 0) > 0;
    if (isTestTask) {
      height += 28;
    }
  }

  return height + 8; // Card height + gap
}

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

  // Pages 2+: Detailed Task Reports paginated by item heights
  if (hasTasks) {
    let currentPageTasks: PlanTask[] = [];
    let currentHeight = 0;
    let pageIndex = 2;

    for (let i = 0; i < data.tasks.length; i++) {
      const task = data.tasks[i];
      const cardHeight = estimateTaskCardHeight(task, data);

      // If adding this card exceeds the budget and we already have cards on this page:
      // move the card to the next page
      if (currentHeight + cardHeight > PAGE_2_CONTENT_BUDGET && currentPageTasks.length > 0) {
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

    if (currentPageTasks.length > 0) {
      pages.push({
        pageNumber: pageIndex,
        pageTitle: `جزئیات پارت‌های مطالعه (بخش ${pageIndex - 1})`,
        sections: [{ type: 'TASK_CARD_LIST', tasks: currentPageTasks }],
      });
      pageIndex++;
    }
  }

  // Summary & Insights Sections (Insights ~110px + Final Summary ~80px = ~190px)
  const SUMMARY_HEIGHT = 195;
  const lastPage = pages[pages.length - 1];

  if (lastPage && lastPage.pageNumber >= 2) {
    const lastPageTasks = lastPage.sections.find((s) => s.type === 'TASK_CARD_LIST')?.tasks || [];
    const lastPageUsedHeight = lastPageTasks.reduce(
      (acc, t) => acc + estimateTaskCardHeight(t, data),
      0
    );

    // If last page has ample room, append summary to it!
    if (lastPageUsedHeight + SUMMARY_HEIGHT <= PAGE_2_CONTENT_BUDGET) {
      lastPage.sections.push({ type: 'INSIGHTS_SECTION' });
      lastPage.sections.push({ type: 'FINAL_SUMMARY' });
    } else {
      // Otherwise, put summary on dedicated page
      const finalPageNum = pages.length + 1;
      pages.push({
        pageNumber: finalPageNum,
        pageTitle: 'جمع‌بندی تحلیلی و بازخورد روزانه',
        sections: [
          { type: 'INSIGHTS_SECTION' },
          { type: 'FINAL_SUMMARY' },
        ],
      });
    }
  } else if (!hasTasks) {
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
