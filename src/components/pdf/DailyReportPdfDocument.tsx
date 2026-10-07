/**
 * Complete Multi-Page PDF Document Component
 * Renders discrete A4 pages determined by the pagination engine.
 */
import React from 'react';
import { DailyReportData } from './types.js';
import { computePagination } from './paginationEngine.js';
import {
  PdfPage,
  PdfKpiGrid,
  PdfProgressRings,
  PdfTimelineTable,
  PdfHabitsAndGoals,
  PdfTaskCard,
  PdfInsightsSection,
  PdfFinalSummary,
} from './PdfComponents.js';

interface Props {
  data: DailyReportData;
  containerRef?: React.Ref<HTMLDivElement>;
}

export const DailyReportPdfDocument: React.FC<Props> = ({ data, containerRef }) => {
  const pagination = computePagination(data);

  return (
    <div
      ref={containerRef}
      id="hadafeto-pdf-document"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        width: '794px',
        backgroundColor: 'transparent',
      }}
    >
      {pagination.pages.map((page) => (
        <PdfPage
          key={page.pageNumber}
          pageNumber={page.pageNumber}
          totalPages={pagination.totalPages}
          title={page.pageTitle}
          data={data}
        >
          {page.sections.map((section, sIdx) => {
            switch (section.type) {
              case 'KPI_GRID':
                return <PdfKpiGrid key={sIdx} data={data} />;

              case 'PROGRESS_RINGS':
                return <PdfProgressRings key={sIdx} data={data} />;

              case 'TIMELINE_OVERVIEW':
                return <PdfTimelineTable key={sIdx} data={data} />;

              case 'HABITS_AND_GOALS':
                return <PdfHabitsAndGoals key={sIdx} data={data} />;

              case 'TASK_CARD_LIST':
                return (
                  <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {section.tasks?.map((task) => (
                      <PdfTaskCard key={task.id} task={task} data={data} />
                    ))}
                  </div>
                );

              case 'INSIGHTS_SECTION':
                return <PdfInsightsSection key={sIdx} data={data} />;

              case 'FINAL_SUMMARY':
                return <PdfFinalSummary key={sIdx} data={data} />;

              default:
                return null;
            }
          })}
        </PdfPage>
      ))}
    </div>
  );
};
