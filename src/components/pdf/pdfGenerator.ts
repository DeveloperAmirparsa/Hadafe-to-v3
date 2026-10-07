/**
 * Production PDF Generation Engine
 * Coordinates font loading, element measuring, multi-page canvas capture, and jsPDF export.
 */
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DailyReportData } from './types.js';

export interface GeneratePdfOptions {
  onProgress?: (progress: { step: string; current: number; total: number }) => void;
}

export interface GeneratePdfResult {
  success: boolean;
  pageCount: number;
  filename: string;
  error?: string;
}

/**
 * Ensures all custom web fonts (Estedad, JetBrains Mono) are completely loaded.
 */
export async function ensureFontsReady(): Promise<void> {
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check timed out or failed, proceeding with fallback:', e);
    }
  }
}

/**
 * Waits for layout stability and image decodes.
 */
export async function waitLayoutReady(ms = 150): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  if (typeof window !== 'undefined') {
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
  }
}

/**
 * Generates and downloads a multi-page PDF from a rendered container of A4 pages.
 */
export async function exportDailyReportToPdf(
  containerElement: HTMLElement,
  data: DailyReportData,
  options?: GeneratePdfOptions
): Promise<GeneratePdfResult> {
  const filename = `hadafeto-daily-report-${data.fileDateString}.pdf`;

  try {
    options?.onProgress?.({ step: 'در حال بارگذاری قلم‌ها و چیدمان...', current: 0, total: 100 });

    // 1. Ensure fonts are loaded
    await ensureFontsReady();
    await waitLayoutReady(150);

    // 2. Locate all pages rendered inside the container
    const pageElements = Array.from(
      containerElement.querySelectorAll<HTMLElement>('[data-pdf-page]')
    );

    if (pageElements.length === 0) {
      throw new Error('هیچ صفحه‌ای برای ساخت خروجی یافت نشد.');
    }

    const totalPages = pageElements.length;
    options?.onProgress?.({
      step: `آماده‌سازی صفحات (${totalPages} صفحه)...`,
      current: 10,
      total: totalPages,
    });

    // 3. Initialize jsPDF (A4 Portrait in mm: 210 x 297)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // 4. Capture each page sequentially with high-resolution canvas
    for (let index = 0; index < totalPages; index++) {
      const pageEl = pageElements[index];

      options?.onProgress?.({
        step: `پردازش صفحه ${index + 1} از ${totalPages}...`,
        current: index + 1,
        total: totalPages,
      });

      // Verification of content bounds
      const scrollHeight = pageEl.scrollHeight;
      const clientHeight = pageEl.clientHeight;
      if (scrollHeight > clientHeight + 5) {
        console.warn(`[PDF Warning] Page ${index + 1} content overflow detected: scroll=${scrollHeight}, client=${clientHeight}`);
      }

      // High-res canvas capture (scale 2 gives crisp 192 DPI print sharpness)
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#090b17',
        windowWidth: 794,
        windowHeight: 1123,
      });

      // Convert to image data
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (index > 0) {
        pdf.addPage('a4', 'portrait');
      }

      // 210mm x 297mm full-bleed A4 placement
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

      // Free canvas memory
      canvas.width = 1;
      canvas.height = 1;
    }

    options?.onProgress?.({ step: 'در حال ذخیره‌سازی فایل...', current: totalPages, total: totalPages });

    // 5. Download the PDF file
    pdf.save(filename);

    return {
      success: true,
      pageCount: totalPages,
      filename,
    };
  } catch (error) {
    console.error('Failed to generate daily report PDF:', error);
    return {
      success: false,
      pageCount: 0,
      filename,
      error: error instanceof Error ? error.message : 'خطای نامشخص در تولید فایل',
    };
  }
}
