// 엑셀 생성 유틸리티
// xlsx 라이브러리를 사용하여 견적서/거래명세서를 엑셀 파일로 다운로드

import * as XLSX from 'xlsx';
import type { QuoteItem } from '@/components/calculator/Calculator';
import type { QuoteTotals } from '@/hooks/useQuote';
import type { QuoteFormData, BusinessInfo } from '@/lib/quote/templates';
import { getTemplateById } from '@/lib/quote/templates';

// 금액 재계산 (QuotePreview와 동일한 로직)
function recalcTotals(
  totals: QuoteTotals,
  vatIncluded: boolean
): { supplyAmount: number; vat: number; grandTotal: number } {
  if (vatIncluded) {
    return {
      supplyAmount: totals.supplyAmount,
      vat: totals.vat,
      grandTotal: totals.grandTotal,
    };
  } else {
    const afterDiscount = totals.subtotal - totals.discountAmount;
    const supplyAmount = afterDiscount;
    const vat = Math.round(supplyAmount * 0.1);
    const grandTotal = supplyAmount + vat;
    return { supplyAmount, vat, grandTotal };
  }
}

// 할인 적용 단가 계산
function getItemDisplayPrice(unitPrice: number, discountRate: number): number {
  return Math.round(unitPrice * (1 - discountRate / 100));
}

interface ExcelQuoteOptions {
  items: QuoteItem[];
  totals: QuoteTotals;
  formData: QuoteFormData;
  fileName: string;
}

/**
 * 견적서를 엑셀 파일로 다운로드
 */
export function downloadQuoteExcel({
  items,
  totals,
  formData,
  fileName,
}: ExcelQuoteOptions): void {
  const template: BusinessInfo | undefined = getTemplateById(formData.templateId);
  if (!template) return;

  const { supplyAmount, vat, grandTotal } = recalcTotals(totals, formData.vatIncluded);

  const ws = XLSX.utils.aoa_to_sheet([]);

  // 견적서 헤더
  const rows: (string | number)[][] = [];

  rows.push(['견 적 서']);
  rows.push([]);
  rows.push(['상호', template.companyName, '', '등록번호', template.registrationNumber]);
  rows.push(['대표자', template.representative, '', '업태', template.businessType]);
  rows.push(['소재지', template.address, '', '종목', template.businessItem]);
  rows.push([]);
  rows.push(['수신', formData.recipient || '(미입력)']);
  rows.push(['견적일자', formData.date]);
  rows.push(['부가세', formData.vatIncluded ? '포함' : '별도']);
  rows.push([]);

  // 항목 테이블 헤더
  rows.push(['No', '품명', '규격', '수량', '단가', '금액', '비고']);

  // 항목
  let rowIdx = 1;
  items.forEach((item) => {
    const optionText = Object.entries(item.selectedOptions)
      .map(([, v]) => v)
      .join(', ');

    const displayUnitPrice = getItemDisplayPrice(item.unitPrice, totals.discountRate);
    const displayTotal = displayUnitPrice * item.quantity;

    rows.push([
      rowIdx,
      item.product.product_name,
      optionText || '-',
      item.quantity,
      displayUnitPrice,
      displayTotal,
      totals.discountRate > 0 ? `${totals.discountRate}% 할인` : '',
    ]);
    rowIdx++;

    // 추가상품
    item.addons.forEach((addon) => {
      const addonTotal = addon.unitPrice * addon.quantity;
      rows.push([
        '',
        `  +${addon.name}`,
        '추가상품',
        addon.quantity,
        addon.unitPrice,
        addonTotal,
        '',
      ]);
    });
  });

  rows.push([]);
  rows.push(['', '', '', '', '공급가액', supplyAmount]);
  rows.push(['', '', '', '', '부가세', vat]);
  rows.push(['', '', '', '', '합 계', grandTotal]);

  // 메모
  if (formData.memo) {
    rows.push([]);
    rows.push(['메모', formData.memo]);
  }

  XLSX.utils.sheet_add_aoa(ws, rows);

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 25 }, // 품명
    { wch: 20 }, // 규격
    { wch: 8 },  // 수량
    { wch: 12 }, // 단가
    { wch: 14 }, // 금액
    { wch: 12 }, // 비고
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '견적서');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * 거래명세서를 엑셀 파일로 다운로드
 */
export function downloadInvoiceExcel({
  items,
  totals,
  formData,
  fileName,
}: ExcelQuoteOptions): void {
  const template: BusinessInfo | undefined = getTemplateById(formData.templateId);
  if (!template) return;

  const { supplyAmount, vat, grandTotal } = recalcTotals(totals, formData.vatIncluded);

  const rows: (string | number)[][] = [];

  rows.push(['거 래 명 세 서']);
  rows.push([]);

  // 공급자 정보
  rows.push(['[공급자]']);
  rows.push(['상호', template.companyName, '', '등록번호', template.registrationNumber]);
  rows.push(['대표자', template.representative, '', '업태', template.businessType]);
  rows.push(['소재지', template.address, '', '종목', template.businessItem]);
  rows.push([]);

  // 공급받는자 정보
  rows.push(['[공급받는자]']);
  rows.push(['상호', formData.recipient || '(미입력)']);
  rows.push(['거래일자', formData.date]);
  rows.push([]);

  // 항목 테이블 헤더
  rows.push(['No', '월일', '품명', '규격', '수량', '단가', '공급가액', '세액', '비고']);

  // 거래일자에서 MM/DD 추출
  const [, mm, dd] = formData.date.split('-');
  const dateShort = `${mm}/${dd}`;

  // 항목
  let rowIdx = 1;
  items.forEach((item) => {
    const optionText = Object.entries(item.selectedOptions)
      .map(([, v]) => v)
      .join(', ');

    const displayUnitPrice = getItemDisplayPrice(item.unitPrice, totals.discountRate);
    const displayTotal = displayUnitPrice * item.quantity;
    const itemVat = formData.vatIncluded
      ? displayTotal - Math.round(displayTotal / 1.1)
      : Math.round(displayTotal * 0.1);
    const itemSupply = formData.vatIncluded
      ? Math.round(displayTotal / 1.1)
      : displayTotal;

    rows.push([
      rowIdx,
      dateShort,
      item.product.product_name,
      optionText || '-',
      item.quantity,
      displayUnitPrice,
      itemSupply,
      itemVat,
      totals.discountRate > 0 ? `${totals.discountRate}%` : '',
    ]);
    rowIdx++;

    // 추가상품
    item.addons.forEach((addon) => {
      const addonTotal = addon.unitPrice * addon.quantity;
      const addonVat = formData.vatIncluded
        ? addonTotal - Math.round(addonTotal / 1.1)
        : Math.round(addonTotal * 0.1);
      const addonSupply = formData.vatIncluded
        ? Math.round(addonTotal / 1.1)
        : addonTotal;
      rows.push([
        '',
        dateShort,
        `  +${addon.name}`,
        '추가상품',
        addon.quantity,
        addon.unitPrice,
        addonSupply,
        addonVat,
        '',
      ]);
    });
  });

  rows.push([]);
  rows.push(['', '', '', '', '', '공급가액', supplyAmount, '', '']);
  rows.push(['', '', '', '', '', '세 액', vat, '', '']);
  rows.push(['', '', '', '', '', '합 계', grandTotal, '', '']);

  // 비고
  if (formData.memo) {
    rows.push([]);
    rows.push(['비고', formData.memo]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 8 },  // 월일
    { wch: 22 }, // 품명
    { wch: 18 }, // 규격
    { wch: 8 },  // 수량
    { wch: 12 }, // 단가
    { wch: 14 }, // 공급가액
    { wch: 12 }, // 세액
    { wch: 10 }, // 비고
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '거래명세서');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
