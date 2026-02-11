// 엑셀 생성 유틸리티
// exceljs 라이브러리를 사용하여 견적서/거래명세서를 엑셀 파일로 다운로드 (테두리/스타일 지원)

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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

// 테두리 스타일
const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

const headerFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF0F0F0' },
};

interface ExcelQuoteOptions {
  items: QuoteItem[];
  totals: QuoteTotals;
  formData: QuoteFormData;
  fileName: string;
}

/**
 * 견적서를 엑셀 파일로 다운로드 (테두리/스타일 포함)
 */
export async function downloadQuoteExcel({
  items,
  totals,
  formData,
  fileName,
}: ExcelQuoteOptions): Promise<void> {
  const template = formData.templateId === 'hotanggamtang' ? HOTANGGAMTANG : BRANDIZ;
  const grandTotal = Math.round(totals.grandTotal);
  const phone = formData.templateId === 'hotanggamtang' ? '010-6255-7392' : '010-2116-2349';

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('견적서');

  // 열 너비 설정
  ws.columns = [
    { width: 6 },   // A: No
    { width: 28 },  // B: 품명
    { width: 8 },   // C: 규격
    { width: 10 },  // D: 수량
    { width: 12 },  // E: 단가
    { width: 14 },  // F: 견적가
    { width: 10 },  // G: 비고
  ];

  let row = 1;

  // Row 1: No.
  ws.getCell(`A${row}`).value = 'No.';
  row += 2;

  // Row 3: 견적서 제목 (병합)
  ws.mergeCells(`A${row}:G${row}`);
  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = '견 적 서';
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.font = { size: 16, bold: true };
  row += 2;

  // Row 5-8: 날짜/수신/참조 + 사업자정보
  // 날짜
  ws.getCell(`A${row}`).value = '날 짜 :';
  ws.getCell(`B${row}`).value = formatDateKorean(formData.date);
  ws.getCell(`D${row}`).value = '사업자소재지';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = template.address;
  ws.getCell(`E${row}`).border = thinBorder;
  row++;

  // 수신
  ws.getCell(`A${row}`).value = '수 신 :';
  ws.getCell(`B${row}`).value = formData.recipient || '';
  ws.getCell(`D${row}`).value = '상호';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = template.companyName;
  ws.getCell(`E${row}`).border = thinBorder;
  row++;

  // 참조
  ws.getCell(`A${row}`).value = '참 조 :';
  ws.getCell(`D${row}`).value = '대표자성명';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = template.representative;
  ws.getCell(`E${row}`).border = thinBorder;
  row++;

  // 전화번호
  ws.getCell(`D${row}`).value = '전화번호';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = phone;
  ws.getCell(`E${row}`).border = thinBorder;
  row += 2;

  // 아래와 같이 견적합니다
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = '아래와 같이 견적합니다';
  row += 2;

  // 합계금액 행
  ws.getCell(`A${row}`).value = '합계금액';
  ws.getCell(`A${row}`).fill = headerFill;
  ws.getCell(`A${row}`).border = thinBorder;
  ws.mergeCells(`B${row}:D${row}`);
  ws.getCell(`B${row}`).value = `${numberToKorean(grandTotal)} 원정`;
  ws.getCell(`B${row}`).border = thinBorder;
  ws.getCell(`B${row}`).alignment = { horizontal: 'center' };
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = `(₩${grandTotal.toLocaleString()})`;
  ws.getCell(`E${row}`).border = thinBorder;
  ws.getCell(`E${row}`).alignment = { horizontal: 'center' };
  row++;

  ws.getCell(`A${row}`).value = '(부가세 포함)';
  ws.getCell(`A${row}`).font = { size: 9 };
  row += 2;

  // 품목 테이블 헤더
  const headers = ['No.', '품명', '규격', '수량', '단가', '견적가', '비고'];
  const headerRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { bold: true };
  });
  row++;

  // 품목 행
  const MAX_ROWS = 9;
  for (let i = 0; i < MAX_ROWS; i++) {
    const rowNum = i + 1;
    const item = items[i];
    const dataRow = ws.getRow(row);

    if (item) {
      const optionStr = Object.values(item.selectedOptions || {}).join(' ');
      const displayName = formatProductName(item.product.product_name, optionStr);
      const itemTotal = item.unitPrice * item.quantity;
      
      const values = [
        rowNum,
        displayName,
        'EA',
        item.quantity.toLocaleString(),
        item.unitPrice.toLocaleString(),
        itemTotal.toLocaleString(),
        ''
      ];
      values.forEach((v, idx) => {
        const cell = dataRow.getCell(idx + 1);
        cell.value = v;
        cell.border = thinBorder;
        if (idx === 0 || idx === 2 || idx === 3) cell.alignment = { horizontal: 'center' };
        if (idx === 4 || idx === 5) cell.alignment = { horizontal: 'right' };
      });
    } else {
      const values = [rowNum, '', rowNum <= 6 ? 'EA' : '', '', '', '-', ''];
      values.forEach((v, idx) => {
        const cell = dataRow.getCell(idx + 1);
        cell.value = v;
        cell.border = thinBorder;
        if (idx === 0 || idx === 2 || idx === 5) cell.alignment = { horizontal: 'center' };
      });
    }
    row++;
  }

  // 합계 행
  const sumRow = ws.getRow(row);
  ws.mergeCells(`A${row}:E${row}`);
  sumRow.getCell(1).value = '합 계';
  sumRow.getCell(1).alignment = { horizontal: 'center' };
  sumRow.getCell(1).border = thinBorder;
  sumRow.getCell(1).fill = headerFill;
  sumRow.getCell(1).font = { bold: true };
  sumRow.getCell(6).value = grandTotal > 0 ? grandTotal.toLocaleString() : '-';
  sumRow.getCell(6).border = thinBorder;
  sumRow.getCell(6).alignment = { horizontal: 'right' };
  sumRow.getCell(6).font = { bold: true };
  sumRow.getCell(7).value = '';
  sumRow.getCell(7).border = thinBorder;
  row += 2;

  // MEMO
  ws.getCell(`A${row}`).value = '[MEMO]';
  ws.getCell(`A${row}`).font = { bold: true };
  row++;
  ws.getCell(`A${row}`).value = '*배송은 택배시 무료입니다.';

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}

/**
 * 거래명세서를 엑셀 파일로 다운로드
 */
export async function downloadInvoiceExcel({
  items,
  totals,
  formData,
  fileName,
}: ExcelQuoteOptions): Promise<void> {
  const template: BusinessInfo | undefined = getTemplateById(formData.templateId);
  if (!template) return;

  const { supplyAmount, vat, grandTotal } = recalcTotals(totals, formData.vatIncluded);

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('거래명세서');

  // 열 너비 설정
  ws.columns = [
    { width: 5 },   // No
    { width: 8 },   // 월일
    { width: 22 },  // 품명
    { width: 18 },  // 규격
    { width: 8 },   // 수량
    { width: 12 },  // 단가
    { width: 14 },  // 공급가액
    { width: 12 },  // 세액
    { width: 10 },  // 비고
  ];

  let row = 1;

  // 제목
  ws.mergeCells(`A${row}:I${row}`);
  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = '거 래 명 세 서';
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.font = { size: 16, bold: true };
  row += 2;

  // 공급자 정보
  ws.getCell(`A${row}`).value = '[공급자]';
  ws.getCell(`A${row}`).font = { bold: true };
  row++;

  // 공급자 테이블
  const supplierData = [
    ['상호', template.companyName, '등록번호', template.registrationNumber],
    ['대표자', template.representative, '업태', template.businessType],
    ['소재지', template.address, '종목', template.businessItem],
  ];
  
  supplierData.forEach((rowData) => {
    ws.getCell(`A${row}`).value = rowData[0];
    ws.getCell(`A${row}`).fill = headerFill;
    ws.getCell(`A${row}`).border = thinBorder;
    ws.mergeCells(`B${row}:C${row}`);
    ws.getCell(`B${row}`).value = rowData[1];
    ws.getCell(`B${row}`).border = thinBorder;
    ws.getCell(`D${row}`).value = rowData[2];
    ws.getCell(`D${row}`).fill = headerFill;
    ws.getCell(`D${row}`).border = thinBorder;
    ws.mergeCells(`E${row}:F${row}`);
    ws.getCell(`E${row}`).value = rowData[3];
    ws.getCell(`E${row}`).border = thinBorder;
    row++;
  });
  row++;

  // 공급받는자 정보
  ws.getCell(`A${row}`).value = '[공급받는자]';
  ws.getCell(`A${row}`).font = { bold: true };
  row++;

  ws.getCell(`A${row}`).value = '상호';
  ws.getCell(`A${row}`).fill = headerFill;
  ws.getCell(`A${row}`).border = thinBorder;
  ws.mergeCells(`B${row}:D${row}`);
  ws.getCell(`B${row}`).value = formData.recipient || '(미입력)';
  ws.getCell(`B${row}`).border = thinBorder;
  row++;

  ws.getCell(`A${row}`).value = '거래일자';
  ws.getCell(`A${row}`).fill = headerFill;
  ws.getCell(`A${row}`).border = thinBorder;
  ws.mergeCells(`B${row}:D${row}`);
  ws.getCell(`B${row}`).value = formData.date;
  ws.getCell(`B${row}`).border = thinBorder;
  row += 2;

  // 항목 테이블 헤더
  const headers = ['No', '월일', '품명', '규격', '수량', '단가', '공급가액', '세액', '비고'];
  const headerRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { bold: true };
  });
  row++;

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

    const dataRow = ws.getRow(row);
    const values = [
      rowIdx,
      dateShort,
      item.product.product_name,
      optionText || '-',
      item.quantity,
      displayUnitPrice.toLocaleString(),
      itemSupply.toLocaleString(),
      itemVat.toLocaleString(),
      totals.discountRate > 0 ? `${totals.discountRate}%` : '',
    ];
    values.forEach((v, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = v;
      cell.border = thinBorder;
      if (idx === 0 || idx === 1 || idx === 4) cell.alignment = { horizontal: 'center' };
      if (idx >= 5 && idx <= 7) cell.alignment = { horizontal: 'right' };
    });
    row++;
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
      
      const addonRow = ws.getRow(row);
      const addonValues = [
        '',
        dateShort,
        `  +${addon.name}`,
        '추가상품',
        addon.quantity,
        addon.unitPrice.toLocaleString(),
        addonSupply.toLocaleString(),
        addonVat.toLocaleString(),
        '',
      ];
      addonValues.forEach((v, idx) => {
        const cell = addonRow.getCell(idx + 1);
        cell.value = v;
        cell.border = thinBorder;
        if (idx === 1 || idx === 4) cell.alignment = { horizontal: 'center' };
        if (idx >= 5 && idx <= 7) cell.alignment = { horizontal: 'right' };
      });
      row++;
    });
  });

  row++;

  // 합계 부분
  const summaryData = [
    ['공급가액', supplyAmount],
    ['세 액', vat],
    ['합 계', grandTotal],
  ];

  summaryData.forEach((sd) => {
    ws.mergeCells(`A${row}:E${row}`);
    ws.getCell(`A${row}`).border = thinBorder;
    ws.getCell(`F${row}`).value = sd[0];
    ws.getCell(`F${row}`).fill = headerFill;
    ws.getCell(`F${row}`).border = thinBorder;
    ws.getCell(`F${row}`).alignment = { horizontal: 'center' };
    ws.getCell(`F${row}`).font = sd[0] === '합 계' ? { bold: true } : {};
    ws.getCell(`G${row}`).value = (sd[1] as number).toLocaleString();
    ws.getCell(`G${row}`).border = thinBorder;
    ws.getCell(`G${row}`).alignment = { horizontal: 'right' };
    ws.getCell(`G${row}`).font = sd[0] === '합 계' ? { bold: true } : {};
    ws.mergeCells(`H${row}:I${row}`);
    ws.getCell(`H${row}`).border = thinBorder;
    row++;
  });

  // 비고
  if (formData.memo) {
    row++;
    ws.getCell(`A${row}`).value = '비고';
    ws.getCell(`A${row}`).font = { bold: true };
    row++;
    ws.getCell(`A${row}`).value = formData.memo;
  }

  // 파일 다운로드
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}
