/**
 * Smart Pagination Engine for Daily PDF Report
 * Calculates explicit page budgets and partitions content into discrete A4 pages.
 * Prevents splitting task cards or section blocks across pages.
 */
import { DailyReportData, PaginationResult, PdfPageContent } from './types.js';
import { PlanTask } from '../../types/index.js';

// Safe available content height per A4 page in pixels (1123px total - 72px padding - 75px header - 45px footer)
const PAGE_CONTENT_BUDGET = 930;

function estimateTaskCardHeight(task: PlanTask, data: DailyReportData): number {
  const report = data.reportsByTaskId[task.id];
  let height = 110; // Base task card with header, subject, time, duration

  if (report) {
    height += 65; // Quality ratings: satisfaction, focus, difficulty
    if (report.testsCount && report.testsCount > 0) {
      height += 75; // Test result stats grid & percentage
    }
    if (report.reflectionNote && report.reflectionNote.trim().length > 0) {
      const noteLen = report.reflectionNote.trim().length;
      height += Math.min(140, 50 + Math.ceil(noteLen / 70) * 22); // Wrapping text lines
    }
  }

  return height + 14; // margin gap
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

      // If adding this card exceeds the budget and we already have cards on this page, flush page
      if (currentHeight + cardHeight > PAGE_CONTENT_BUDGET && currentPageTasks.length > 0) {
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

  // Summary & Insights Page (or appended if last page has ample room)
  const lastPage = pages[pages.length - 1];
  const summaryHeight = 420; // Insights + Final Summary box

  // Check if last page has enough remaining room to hold the summary
  const lastPageTasks = lastPage.sections.find((s) => s.type === 'TASK_CARD_LIST')?.tasks || [];
  const lastPageUsedHeight = lastPageTasks.reduce(
    (acc, t) => acc + estimateTaskCardHeight(t, data),
    0
  );

  if (lastPage.pageNumber > 1 && lastPageUsedHeight + summaryHeight <= PAGE_CONTENT_BUDGET) {
    // Append to last page safely
    lastPage.sections.push({ type: 'INSIGHTS_SECTION' });
    lastPage.sections.push({ type: 'FINAL_SUMMARY' });
  } else {
    // Create dedicated final summary page
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

  // Re-index page numbers
  pages.forEach((p, idx) => {
    p.pageNumber = idx + 1;
  });

  return {
    pages,
    totalPages: pages.length,
  };
}
