'use client';

import { useState } from 'react';
import type { QuoteItem } from '@/components/calculator/Calculator';
import type { QuoteTotals } from '@/hooks/useQuote';
import type { QuoteFormData } from '@/lib/quote/templates';

interface ExportButtonsProps {
  /** 문서 종류: 견적서 or 거래명세서 */
  documentType: 'quote' | 'invoice';
  /** 캡처할 미리보기 DOM 요소 id */
  previewElementId: string;
  /** 견적 항목 */
  items: QuoteItem[];
  /** 합계 정보 */
  totals: QuoteTotals;
  /** 폼 데이터 */
  formData: QuoteFormData;
}

export default function ExportButtons({
  documentType,
  previewElementId,
  items,
  totals,
  formData,
}: ExportButtonsProps) {
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);

  const label = documentType === 'quote' ? '견적서' : '거래명세서';
  const docType = documentType === 'quote' ? '견적서' : '거래명세서';
  // 날짜 형식: YY.MM.DD
  const dateParts = formData.date.split('-');
  const dateStr = dateParts.length === 3 
    ? `${dateParts[0].slice(2)}.${dateParts[1]}.${dateParts[2]}` 
    : formData.date.replace(/-/g, '');
  // 파일명: (휴앤고) 수신명 굿즈 주문제작 견적서_날짜
  const recipientName = formData.recipient || '미입력';
  const fileName = `(휴앤고) ${recipientName} 굿즈 주문제작 ${docType}_${dateStr}`;

  // PDF 다운로드
  async function handlePdfDownload() {
    setDownloading('pdf');
    try {
      const { downloadPdf } = await import('@/lib/pdf/generator');
      await downloadPdf({
        elementId: previewElementId,
        fileName,
      });
    } catch (err) {
      console.error('PDF 다운로드 실패:', err);
      alert('PDF 다운로드에 실패했습니다.');
    } finally {
      setDownloading(null);
    }
  }

  // 엑셀 다운로드
  async function handleExcelDownload() {
    setDownloading('excel');
    try {
      if (documentType === 'quote') {
        const { downloadQuoteExcel } = await import('@/lib/excel/generator');
        downloadQuoteExcel({ items, totals, formData, fileName });
      } else {
        const { downloadInvoiceExcel } = await import('@/lib/excel/generator');
        downloadInvoiceExcel({ items, totals, formData, fileName });
      }
    } catch (err) {
      console.error('엑셀 다운로드 실패:', err);
      alert('엑셀 다운로드에 실패했습니다.');
    } finally {
      setDownloading(null);
    }
  }

  // PDF는 DOM 요소만 있으면 다운로드 가능 (수동 입력도 포함)
  const isDownloading = downloading !== null;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={handlePdfDownload}
        disabled={isDownloading}
        className="inline-flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {downloading === 'pdf' ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {label} PDF
      </button>

      <button
        type="button"
        onClick={handleExcelDownload}
        disabled={isDownloading}
        className="inline-flex items-center justify-center gap-1 rounded px-2 py-1 text-xs font-medium border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {downloading === 'excel' ? (
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        {label} 엑셀
      </button>
    </div>
  );
}
