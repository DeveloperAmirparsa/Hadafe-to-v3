/**
 * Production PDF Generation Engine
 * Uses server-side Chromium/Puppeteer to print the exact same rendered DOM and CSS as the Preview.
 */
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
 * Generates and downloads a multi-page PDF via Chromium/Puppeteer
 * printing the exact same rendered HTML and CSS as the Preview.
 */
export async function exportDailyReportToPdf(
  containerElement: HTMLElement,
  data: DailyReportData,
  options?: GeneratePdfOptions
): Promise<GeneratePdfResult> {
  const filename = `hadafeto-daily-report-${data.fileDateString}.pdf`;

  try {
    options?.onProgress?.({ step: 'در حال آماده‌سازی قالب و قلم‌های فارسی...', current: 15, total: 100 });

    // 1. Ensure fonts are loaded and layout is stable
    await ensureFontsReady();
    await waitLayoutReady(150);

    // 2. Count pages rendered in the DOM
    const pageElements = Array.from(
      containerElement.querySelectorAll<HTMLElement>('[data-pdf-page]')
    );

    if (pageElements.length === 0) {
      throw new Error('هیچ صفحه‌ای برای ساخت خروجی یافت نشد.');
    }

    const totalPages = pageElements.length;

    options?.onProgress?.({
      step: `ارسال ساختار به موتور چاپگر مرورگر (${totalPages} صفحه)...`,
      current: 40,
      total: 100,
    });

    // 3. Extract all style declarations currently present in the document
    const styles = Array.from(document.querySelectorAll('style'))
      .map((s) => s.innerHTML)
      .join('\n');

    // 4. Capture the rendered document DOM directly
    const documentHtml = containerElement.outerHTML;

    // 5. Construct full standalone HTML document with strict A4 styling and fonts
    const fullHtml = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=794, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Estedad:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
${styles}
  </style>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background-color: #090b17 !important;
      color: #f8fafc !important;
      width: 794px !important;
      min-width: 794px !important;
      max-width: 794px !important;
      font-family: 'Estedad', -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Arial, sans-serif !important;
      direction: rtl !important;
      overflow: visible !important;
    }
    #hadafeto-pdf-document {
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
      width: 794px !important;
      min-width: 794px !important;
      max-width: 794px !important;
      background-color: transparent !important;
      display: block !important;
    }
    [data-pdf-page] {
      width: 794px !important;
      min-width: 794px !important;
      max-width: 794px !important;
      height: 1123px !important;
      min-height: 1123px !important;
      max-height: 1123px !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      page-break-after: always !important;
      break-after: page !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      overflow: hidden !important;
      position: relative !important;
    }
    [data-pdf-page]:last-child {
      page-break-after: auto !important;
      break-after: auto !important;
    }
  </style>
</head>
<body style="background-color: #090b17; color: #f8fafc; margin: 0; padding: 0;">
  ${documentHtml}
</body>
</html>`;

    options?.onProgress?.({
      step: 'تولید خروجی PDF با موتور اختصاصی Chromium...',
      current: 70,
      total: 100,
    });

    // 6. Request backend Chromium to render the PDF
    const response = await fetch('/api/pdf/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: fullHtml,
        filename,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'خطا در ارتباط با سرور ساخت PDF';
      try {
        const errorJson = await response.json();
        if (errorJson?.error) errorMessage = errorJson.error;
      } catch {
        // ignore parse error
      }
      throw new Error(errorMessage);
    }

    options?.onProgress?.({ step: 'در حال ذخیره‌سازی فایل...', current: 95, total: 100 });

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

    return {
      success: true,
      pageCount: totalPages,
      filename,
    };
  } catch (error) {
    console.error('Failed to generate daily report PDF via Chromium:', error);
    return {
      success: false,
      pageCount: 0,
      filename,
      error: error instanceof Error ? error.message : 'خطای نامشخص در تولید فایل',
    };
  }
}

