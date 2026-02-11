// 엑셀 생성 유틸리티
// exceljs 라이브러리를 사용하여 견적서/거래명세서를 엑셀 파일로 다운로드 (웹과 동일한 양식)

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
  fgColor: { argb: 'FFF5F5F5' },
};

interface ExcelQuoteOptions {
  items: QuoteItem[];
  totals: QuoteTotals;
  formData: QuoteFormData;
  fileName: string;
}

/**
 * 견적서를 엑셀 파일로 다운로드 (웹 견적서와 동일한 양식)
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
  const stampUrl = formData.templateId === 'hotanggamtang' ? '/stamp-hotang.png' : '/stamp-brandiz.png';

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('견적서');
  
  // 도장 이미지 로드
  let stampImageId: number | null = null;
  try {
    const response = await fetch(stampUrl);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    stampImageId = workbook.addImage({
      base64: base64.split(',')[1],
      extension: 'png',
    });
  } catch (e) {
    console.warn('도장 이미지 로드 실패:', e);
  }

  // 열 너비 설정 (A~H)
  // A: No/날짜라벨, B: 품명/날짜값, C: 규격, D: 수량/사업자라벨, E: 단가/사업자값, F: 견적가, G: 비고
  ws.columns = [
    { width: 6 },   // A
    { width: 30 },  // B
    { width: 8 },   // C
    { width: 12 },  // D
    { width: 20 },  // E
    { width: 14 },  // F
    { width: 8 },   // G
  ];

  let row = 1;

  // Row 1: No.
  ws.getCell(`A${row}`).value = 'No.';
  ws.getCell(`A${row}`).font = { size: 9 }; // 검정색 통일
  row += 2;

  // Row 3: 견적서 제목
  ws.mergeCells(`A${row}:G${row}`);
  const titleCell = ws.getCell(`A${row}`);
  titleCell.value = '견    적    서';
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.font = { size: 16, bold: true };
  row += 2;

  // Row 5-8: 날짜/수신/참조 (왼쪽) + 사업자정보 (오른쪽)
  // 날짜 행
  ws.getCell(`A${row}`).value = '날 짜 :';
  ws.getCell(`A${row}`).font = { size: 10 };
  ws.getCell(`B${row}`).value = formatDateKorean(formData.date);
  ws.getCell(`B${row}`).font = { size: 10 };
  ws.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
  // 사업자소재지
  ws.getCell(`D${row}`).value = '사업자소재지';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.getCell(`D${row}`).font = { size: 9 };
  ws.getCell(`D${row}`).alignment = { vertical: 'middle' };
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = template.address;
  ws.getCell(`E${row}`).border = thinBorder;
  ws.getCell(`E${row}`).font = { size: 9 };
  ws.getCell(`E${row}`).alignment = { vertical: 'middle', wrapText: true };
  row++;

  // 수신 행
  ws.getCell(`A${row}`).value = '수 신 :';
  ws.getCell(`A${row}`).font = { size: 10 };
  ws.getCell(`B${row}`).value = formData.recipient || '';
  ws.getCell(`B${row}`).font = { size: 10 };
  ws.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
  // 상호
  ws.getCell(`D${row}`).value = '상호';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.getCell(`D${row}`).font = { size: 9 };
  ws.getCell(`D${row}`).alignment = { vertical: 'middle' };
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = template.companyName;
  ws.getCell(`E${row}`).border = thinBorder;
  ws.getCell(`E${row}`).font = { size: 9 };
  ws.getCell(`E${row}`).alignment = { vertical: 'middle' };
  row++;

  // 참조 행
  ws.getCell(`A${row}`).value = '참 조 :';
  ws.getCell(`A${row}`).font = { size: 10 };
  ws.getCell(`B${row}`).value = '';
  ws.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
  // 대표자성명
  ws.getCell(`D${row}`).value = '대표자성명';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.getCell(`D${row}`).font = { size: 9 };
  ws.getCell(`D${row}`).alignment = { vertical: 'middle' };
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = template.representative;
  ws.getCell(`E${row}`).border = thinBorder;
  ws.getCell(`E${row}`).font = { size: 9 };
  ws.getCell(`E${row}`).alignment = { vertical: 'middle' };
  row++;

  // 빈 행 (왼쪽) + 전화번호
  ws.getCell(`D${row}`).value = '전화번호';
  ws.getCell(`D${row}`).fill = headerFill;
  ws.getCell(`D${row}`).border = thinBorder;
  ws.getCell(`D${row}`).font = { size: 9 };
  ws.getCell(`D${row}`).alignment = { vertical: 'middle' };
  ws.mergeCells(`E${row}:G${row}`);
  ws.getCell(`E${row}`).value = phone;
  ws.getCell(`E${row}`).border = thinBorder;
  ws.getCell(`E${row}`).font = { size: 9 };
  ws.getCell(`E${row}`).alignment = { vertical: 'middle' };
  
  // 도장 이미지 추가 (대표자성명 옆)
  if (stampImageId !== null) {
    ws.addImage(stampImageId, {
      tl: { col: 6.2, row: 5.5 }, // G열, 6행 근처
      ext: { width: 45, height: 45 },
    });
  }
  row += 2;

  // 아래와 같이 견적합니다
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = '아래와 같이 견적합니다';
  ws.getCell(`A${row}`).font = { size: 10 };
  row += 2;

  // 합계금액 테이블 - 행 높이 설정
  ws.getRow(row).height = 18;
  ws.getRow(row + 1).height = 18;
  
  ws.mergeCells(`A${row}:A${row + 1}`);
  ws.getCell(`A${row}`).value = '합계금액\n(부가세 포함)';
  ws.getCell(`A${row}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  ws.getCell(`A${row}`).border = thinBorder;
  ws.getCell(`A${row}`).font = { size: 8 };
  
  ws.mergeCells(`B${row}:D${row + 1}`);
  ws.getCell(`B${row}`).value = `${numberToKorean(grandTotal)} 원정`;
  ws.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(`B${row}`).border = thinBorder;
  ws.getCell(`B${row}`).font = { size: 12 };
  
  ws.mergeCells(`E${row}:G${row + 1}`);
  ws.getCell(`E${row}`).value = `(₩${grandTotal.toLocaleString()})`;
  ws.getCell(`E${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell(`E${row}`).border = thinBorder;
  ws.getCell(`E${row}`).font = { size: 12 };
  row += 3;

  // 품목 테이블 헤더
  const headers = ['No.', '품명', '규격', '수량', '단가', '견적가', '비고'];
  const headerRow = ws.getRow(row);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = headerFill;
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { bold: true, size: 9 };
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
      
      // No.
      dataRow.getCell(1).value = rowNum;
      dataRow.getCell(1).border = thinBorder;
      dataRow.getCell(1).font = { size: 9 };
      dataRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // 품명
      dataRow.getCell(2).value = displayName;
      dataRow.getCell(2).border = thinBorder;
      dataRow.getCell(2).font = { size: 9 };
      
      // 규격
      dataRow.getCell(3).value = 'EA';
      dataRow.getCell(3).border = thinBorder;
      dataRow.getCell(3).font = { size: 9 };
      dataRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // 수량 (숫자 형식)
      dataRow.getCell(4).value = item.quantity;
      dataRow.getCell(4).border = thinBorder;
      dataRow.getCell(4).font = { size: 9 };
      dataRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      dataRow.getCell(4).numFmt = '#,##0';
      
      // 단가 (숫자 형식)
      dataRow.getCell(5).value = item.unitPrice;
      dataRow.getCell(5).border = thinBorder;
      dataRow.getCell(5).font = { size: 9 };
      dataRow.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };
      dataRow.getCell(5).numFmt = '#,##0';
      
      // 견적가 (숫자 형식)
      dataRow.getCell(6).value = itemTotal;
      dataRow.getCell(6).border = thinBorder;
      dataRow.getCell(6).font = { size: 9 };
      dataRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
      dataRow.getCell(6).numFmt = '#,##0';
      
      // 비고
      dataRow.getCell(7).value = '';
      dataRow.getCell(7).border = thinBorder;
      dataRow.getCell(7).font = { size: 9 };
    } else {
      const values = [rowNum, '', rowNum <= 6 ? 'EA' : '', '', '', '-', ''];
      values.forEach((v, idx) => {
        const cell = dataRow.getCell(idx + 1);
        cell.value = v;
        cell.border = thinBorder;
        cell.font = { size: 9 };
        if (idx === 0 || idx === 2 || idx === 5) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    }
    row++;
  }

  // 합계 행
  const sumRow = ws.getRow(row);
  ws.mergeCells(`A${row}:E${row}`);
  sumRow.getCell(1).value = '합 계';
  sumRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  sumRow.getCell(1).border = thinBorder;
  sumRow.getCell(1).fill = headerFill;
  sumRow.getCell(1).font = { bold: true, size: 9 };
  // 합계 숫자 형식
  sumRow.getCell(6).value = grandTotal > 0 ? grandTotal : '-';
  sumRow.getCell(6).border = thinBorder;
  sumRow.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };
  sumRow.getCell(6).font = { bold: true, size: 9 };
  if (grandTotal > 0) sumRow.getCell(6).numFmt = '#,##0';
  sumRow.getCell(7).value = '';
  sumRow.getCell(7).border = thinBorder;
  row += 2;

  // MEMO
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = '[MEMO]';
  ws.getCell(`A${row}`).font = { bold: true, size: 9 };
  ws.getCell(`A${row}`).border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  row++;
  
  ws.mergeCells(`A${row}:G${row}`);
  ws.getCell(`A${row}`).value = '*배송은 택배시 무료입니다.';
  ws.getCell(`A${row}`).font = { size: 9 };
  ws.getCell(`A${row}`).border = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

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

  const grandTotal = Math.round(totals.grandTotal);
  const supplyAmount = Math.round(grandTotal / 1.1);
  const vat = grandTotal - supplyAmount;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('거래명세서');

  ws.columns = [
    { width: 5 },
    { width: 8 },
    { width: 22 },
    { width: 18 },
    { width: 8 },
    { width: 12 },
    { width: 14 },
    { width: 12 },
    { width: 10 },
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
  ws.getCell(`A${row}`).font = { bold: true, size: 10 };
  row++;

  const supplierData = [
    ['상호', template.companyName, '등록번호', template.registrationNumber],
    ['대표자', template.representative, '업태', template.businessType],
    ['소재지', template.address, '종목', template.businessItem],
  ];
  
  supplierData.forEach((rowData) => {
    ws.getCell(`A${row}`).value = rowData[0];
    ws.getCell(`A${row}`).fill = headerFill;
    ws.getCell(`A${row}`).border = thinBorder;
    ws.getCell(`A${row}`).font = { size: 9 };
    ws.mergeCells(`B${row}:C${row}`);
    ws.getCell(`B${row}`).value = rowData[1];
    ws.getCell(`B${row}`).border = thinBorder;
    ws.getCell(`B${row}`).font = { size: 9 };
    ws.getCell(`D${row}`).value = rowData[2];
    ws.getCell(`D${row}`).fill = headerFill;
    ws.getCell(`D${row}`).border = thinBorder;
    ws.getCell(`D${row}`).font = { size: 9 };
    ws.mergeCells(`E${row}:F${row}`);
    ws.getCell(`E${row}`).value = rowData[3];
    ws.getCell(`E${row}`).border = thinBorder;
    ws.getCell(`E${row}`).font = { size: 9 };
    row++;
  });
  row++;

  // 공급받는자 정보
  ws.getCell(`A${row}`).value = '[공급받는자]';
  ws.getCell(`A${row}`).font = { bold: true, size: 10 };
  row++;

  ws.getCell(`A${row}`).value = '상호';
  ws.getCell(`A${row}`).fill = headerFill;
  ws.getCell(`A${row}`).border = thinBorder;
  ws.getCell(`A${row}`).font = { size: 9 };
  ws.mergeCells(`B${row}:D${row}`);
  ws.getCell(`B${row}`).value = formData.recipient || '(미입력)';
  ws.getCell(`B${row}`).border = thinBorder;
  ws.getCell(`B${row}`).font = { size: 9 };
  row++;

  ws.getCell(`A${row}`).value = '거래일자';
  ws.getCell(`A${row}`).fill = headerFill;
  ws.getCell(`A${row}`).border = thinBorder;
  ws.getCell(`A${row}`).font = { size: 9 };
  ws.mergeCells(`B${row}:D${row}`);
  ws.getCell(`B${row}`).value = formData.date;
  ws.getCell(`B${row}`).border = thinBorder;
  ws.getCell(`B${row}`).font = { size: 9 };
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
    cell.font = { bold: true, size: 9 };
  });
  row++;

  const [, mm, dd] = formData.date.split('-');
  const dateShort = `${mm}/${dd}`;

  let rowIdx = 1;
  items.forEach((item) => {
    const optionText = Object.entries(item.selectedOptions)
      .map(([, v]) => v)
      .join(', ');

    const itemTotal = item.unitPrice * item.quantity;
    const itemSupply = Math.round(itemTotal / 1.1);
    const itemVat = itemTotal - itemSupply;

    const dataRow = ws.getRow(row);
    const values = [
      rowIdx,
      dateShort,
      formatProductName(item.product.product_name, optionText),
      optionText || '-',
      item.quantity,
      item.unitPrice.toLocaleString(),
      itemSupply.toLocaleString(),
      itemVat.toLocaleString(),
      '',
    ];
    values.forEach((v, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = v;
      cell.border = thinBorder;
      cell.font = { size: 9 };
      if (idx === 0 || idx === 1 || idx === 4) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (idx >= 5 && idx <= 7) cell.alignment = { horizontal: 'right', vertical: 'middle' };
    });
    row++;
    rowIdx++;
  });

  row++;

  // 합계
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
    ws.getCell(`F${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell(`F${row}`).font = sd[0] === '합 계' ? { bold: true, size: 9 } : { size: 9 };
    ws.getCell(`G${row}`).value = (sd[1] as number).toLocaleString();
    ws.getCell(`G${row}`).border = thinBorder;
    ws.getCell(`G${row}`).alignment = { horizontal: 'right', vertical: 'middle' };
    ws.getCell(`G${row}`).font = sd[0] === '합 계' ? { bold: true, size: 9 } : { size: 9 };
    ws.mergeCells(`H${row}:I${row}`);
    ws.getCell(`H${row}`).border = thinBorder;
    row++;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
}
