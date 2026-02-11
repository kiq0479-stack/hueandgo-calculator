// 엑셀 생성 유틸리티
// xlsx 라이브러리를 사용하여 견적서/거래명세서를 엑셀 파일로 다운로드

import * as XLSX from 'xlsx';
import type { QuoteItem } from '@/components/calculator/Calculator';
import type { QuoteTotals } from '@/hooks/useQuote';
import type { QuoteFormData, BusinessInfo } from '@/lib/quote/templates';
import { getTemplateById, BRANDIZ, HOTANGGAMTANG } from '@/lib/quote/templates';

// 숫자를 한글 금액으로 변환
function numberToKorean(num: number): string {
  if (num === 0) return '영';
  
  const units = ['', '만', '억', '조'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const smallUnits = ['', '십', '백', '천'];
  
  let result = '';
  let unitIndex = 0;
  
  while (num > 0) {
    const chunk = num % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      let tempChunk = chunk;
      let smallUnitIndex = 0;
      
      while (tempChunk > 0) {
        const digit = tempChunk % 10;
        if (digit > 0) {
          const digitStr = (digit === 1 && smallUnitIndex > 0) ? '' : digits[digit];
          chunkStr = digitStr + smallUnits[smallUnitIndex] + chunkStr;
        }
        tempChunk = Math.floor(tempChunk / 10);
        smallUnitIndex++;
      }
      
      result = chunkStr + units[unitIndex] + result;
    }
    num = Math.floor(num / 10000);
    unitIndex++;
  }
  
  return result;
}

// 날짜 형식 변환 (YYYY-MM-DD -> YYYY년 M월 D일)
function formatDateKorean(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
}

// 금액 재계산 (거래명세서용)
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

// 할인 적용 단가 계산 (거래명세서용)
function getItemDisplayPrice(unitPrice: number, discountRate: number): number {
  return Math.round(unitPrice * (1 - discountRate / 100));
}

// 품명 정리
function formatProductName(name: string, selectedOption?: string): string {
  let formatted = name.replace(/\s*\(파트너\s*전용\)\s*/gi, '').trim();
  if (selectedOption) {
    const sizeMatch = selectedOption.match(/(\d+)\s*mm/i);
    if (sizeMatch) {
      formatted = `${formatted} (${sizeMatch[1]}mm)`;
    }
  }
  return formatted;
}

interface ExcelQuoteOptions {
  items: QuoteItem[];
  totals: QuoteTotals;
  formData: QuoteFormData;
  fileName: string;
}

/**
 * 견적서를 엑셀 파일로 다운로드 (웹 견적서 양식과 동일)
 */
export function downloadQuoteExcel({
  items,
  totals,
  formData,
  fileName,
}: ExcelQuoteOptions): void {
  const template = formData.templateId === 'hotanggamtang' ? HOTANGGAMTANG : BRANDIZ;
  const grandTotal = Math.round(totals.grandTotal);
  const phone = formData.templateId === 'hotanggamtang' ? '010-8764-8950' : '010-2116-2349';

  const rows: (string | number)[][] = [];

  // Row 1: No.
  rows.push(['No.']);
  rows.push([]);
  
  // Row 3: 견 적 서 (중앙)
  rows.push(['', '', '', '견 적 서']);
  rows.push([]);
  
  // Row 5-8: 날짜/수신/참조 + 사업자정보
  rows.push([
    '날 짜 :', formatDateKorean(formData.date), '',
    '사업자소재지', template.address
  ]);
  rows.push([
    '수 신 :', formData.recipient || '', '',
    '상호', template.companyName
  ]);
  rows.push([
    '참 조 :', '', '',
    '대표자성명', template.representative
  ]);
  rows.push([
    '', '', '',
    '전화번호', phone
  ]);
  rows.push([]);
  
  // Row 10: 아래와 같이 견적합니다
  rows.push(['아래와 같이 견적합니다']);
  rows.push([]);
  
  // Row 12: 합계금액
  rows.push([
    '합계금액', '', `${numberToKorean(grandTotal)} 원정`, '', `(₩${grandTotal.toLocaleString()})`
  ]);
  rows.push(['(부가세 포함)']);
  rows.push([]);
  
  // Row 15: 품목 테이블 헤더
  rows.push(['No.', '품명', '규격', '수량', '단가', '견적가', '비고']);
  
  // 품목 행
  const MAX_ROWS = 9;
  for (let i = 0; i < MAX_ROWS; i++) {
    const rowNum = i + 1;
    const item = items[i];
    
    if (item) {
      const optionStr = Object.values(item.selectedOptions || {}).join(' ');
      const displayName = formatProductName(item.product.product_name, optionStr);
      const itemTotal = item.unitPrice * item.quantity;
      
      rows.push([
        rowNum,
        displayName,
        'EA',
        item.quantity.toLocaleString(),
        item.unitPrice.toLocaleString(),
        itemTotal.toLocaleString(),
        ''
      ]);
    } else {
      rows.push([
        rowNum,
        '',
        rowNum <= 6 ? 'EA' : '',
        '',
        '',
        '-',
        ''
      ]);
    }
  }
  
  // 합계 행
  rows.push(['', '', '', '', '합 계', grandTotal > 0 ? grandTotal.toLocaleString() : '-', '']);
  rows.push([]);
  
  // MEMO
  rows.push(['[MEMO]']);
  rows.push(['*배송은 택배시 무료입니다.']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // 열 너비 설정
  ws['!cols'] = [
    { wch: 10 }, // No / 날짜
    { wch: 25 }, // 품명 / 값
    { wch: 8 },  // 규격
    { wch: 10 }, // 수량 / 라벨
    { wch: 12 }, // 단가 / 값
    { wch: 14 }, // 견적가
    { wch: 8 },  // 비고
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
