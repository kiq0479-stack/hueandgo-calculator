'use client';

import { useState, useEffect } from 'react';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals, TruncationType } from '@/hooks/useQuote';
import { calcItemTotal } from '@/hooks/useQuote';
import DiscountControl from './DiscountControl';
import { getTemplateById, BRANDIZ, HOTANGGAMTANG } from '@/lib/quote/templates';
import HotangQuoteForm from './HotangQuoteForm';

// 수동 입력 행 타입
type ManualRow = { id: string; name: string; qty: number; price: number };

interface QuoteItemListProps {
  items: QuoteItemType[];
  discountRate: number;
  truncation: TruncationType;
  totals: QuoteTotals;
  templateId?: 'brandiz' | 'hotanggamtang';
  documentType?: 'quote' | 'invoice';
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateUnitPrice: (id: string, unitPrice: number) => void;
  onUpdateName?: (id: string, name: string) => void;
  onDiscountChange: (rate: number) => void;
  onTruncationChange: (type: TruncationType) => void;
  onClearAll: () => void;
  // 수동 입력 행 (부모에서 관리)
  manualRows?: ManualRow[];
  onAddManualRow?: () => void;
  onUpdateManualRow?: (id: string, field: keyof ManualRow, value: string | number) => void;
  onRemoveManualRow?: (id: string) => void;
  // 공유 폼 상태 (견적서/거래명세서 동기화)
  quoteDate?: string;
  onQuoteDateChange?: (date: string) => void;
  recipient?: string;
  onRecipientChange?: (value: string) => void;
  reference?: string;
  onReferenceChange?: (value: string) => void;
  memoText?: string;
  onMemoTextChange?: (value: string) => void;
  // 사업자정보 동기화 (브랜디즈)
  bizAddress?: string;
  onBizAddressChange?: (value: string) => void;
  bizName?: string;
  onBizNameChange?: (value: string) => void;
  bizCeo?: string;
  onBizCeoChange?: (value: string) => void;
  bizPhone?: string;
  onBizPhoneChange?: (value: string) => void;
  // 호탱감탱 사업자정보 동기화
  hotangBizRegNo?: string;
  onHotangBizRegNoChange?: (value: string) => void;
  hotangBizName?: string;
  onHotangBizNameChange?: (value: string) => void;
  hotangBizCeo?: string;
  onHotangBizCeoChange?: (value: string) => void;
  hotangBizAddress?: string;
  onHotangBizAddressChange?: (value: string) => void;
  hotangBizType?: string;
  onHotangBizTypeChange?: (value: string) => void;
  hotangBizItem?: string;
  onHotangBizItemChange?: (value: string) => void;
  hotangBizPhone?: string;
  onHotangBizPhoneChange?: (value: string) => void;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 (input type="date"용)
function getTodayISO(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// YYYY-MM-DD를 YYYY년 M월 D일 형식으로 변환
function formatDateKorean(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
}

// 품명 정리: "(파트너 전용)" 제거 + 사이즈 추출해서 표기
function formatProductName(name: string, selectedOption?: string): string {
  // "(파트너 전용)" 제거
  let formatted = name.replace(/\s*\(파트너\s*전용\)\s*/gi, '').trim();
  
  // 옵션에서 사이즈 추출 (예: "80mm", "50mm" 등)
  if (selectedOption) {
    const sizeMatch = selectedOption.match(/(\d+)\s*mm/i);
    if (sizeMatch) {
      formatted = `${formatted} (${sizeMatch[1]}mm)`;
    }
  }
  
  return formatted;
}

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

const MAX_ROWS = 9;

export default function QuoteItemList({
  items,
  discountRate,
  truncation,
  totals,
  templateId = 'brandiz',
  documentType = 'quote',
  onRemove,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onUpdateName,
  onDiscountChange,
  onTruncationChange,
  onClearAll,
  manualRows: externalManualRows,
  onAddManualRow: externalAddManualRow,
  onUpdateManualRow: externalUpdateManualRow,
  onRemoveManualRow: externalRemoveManualRow,
  // 공유 폼 상태
  quoteDate: externalQuoteDate,
  onQuoteDateChange,
  recipient: externalRecipient,
  onRecipientChange,
  reference: externalReference,
  onReferenceChange,
  memoText: externalMemoText,
  onMemoTextChange,
  // 사업자정보 (브랜디즈)
  bizAddress: externalBizAddress,
  onBizAddressChange,
  bizName: externalBizName,
  onBizNameChange,
  bizCeo: externalBizCeo,
  onBizCeoChange,
  bizPhone: externalBizPhone,
  onBizPhoneChange,
  // 호탱감탱 사업자정보
  hotangBizRegNo,
  onHotangBizRegNoChange,
  hotangBizName,
  onHotangBizNameChange,
  hotangBizCeo,
  onHotangBizCeoChange,
  hotangBizAddress,
  onHotangBizAddressChange,
  hotangBizType,
  onHotangBizTypeChange,
  hotangBizItem,
  onHotangBizItemChange,
  hotangBizPhone,
  onHotangBizPhoneChange,
}: QuoteItemListProps) {
  // 현재 선택된 템플릿 정보
  const currentTemplate = templateId === 'hotanggamtang' ? HOTANGGAMTANG : BRANDIZ;

  // 날짜/수신/참조 상태 (외부 또는 내부)
  const [internalQuoteDate, setInternalQuoteDate] = useState('');
  const [internalRecipient, setInternalRecipient] = useState('');
  const [internalReference, setInternalReference] = useState('');
  const [internalMemoText, setInternalMemoText] = useState('*배송은 택배시 무료입니다.');
  
  // 외부 props 우선 사용
  const quoteDate = externalQuoteDate ?? internalQuoteDate;
  const setQuoteDate = onQuoteDateChange ?? setInternalQuoteDate;
  const recipient = externalRecipient ?? internalRecipient;
  const setRecipient = onRecipientChange ?? setInternalRecipient;
  const reference = externalReference ?? internalReference;
  const setReference = onReferenceChange ?? setInternalReference;
  const memoText = externalMemoText ?? internalMemoText;
  const setMemoText = onMemoTextChange ?? setInternalMemoText;

  // 사업자정보 상태 (외부 또는 내부)
  const [internalBizAddress, setInternalBizAddress] = useState(currentTemplate.address);
  const [internalBizName, setInternalBizName] = useState(currentTemplate.companyName);
  const [internalBizCeo, setInternalBizCeo] = useState(currentTemplate.representative);
  const [internalBizPhone, setInternalBizPhone] = useState('010-2116-2349');
  
  // 외부 props 우선 사용
  const bizAddress = externalBizAddress ?? internalBizAddress;
  const setBizAddress = onBizAddressChange ?? setInternalBizAddress;
  const bizName = externalBizName ?? internalBizName;
  const setBizName = onBizNameChange ?? setInternalBizName;
  const bizCeo = externalBizCeo ?? internalBizCeo;
  const setBizCeo = onBizCeoChange ?? setInternalBizCeo;
  const bizPhone = externalBizPhone ?? internalBizPhone;
  const setBizPhone = onBizPhoneChange ?? setInternalBizPhone;

  // 도장 위치/사이즈 상태
  const [stampTop, setStampTop] = useState(18);
  const [stampRight, setStampRight] = useState(8);
  const [stampSize, setStampSize] = useState(40);

  // 레이아웃 상태
  const [leftWidth, setLeftWidth] = useState(30); // 날짜/수신/참조 영역 너비 (%) - 사업자정보 영역 70%
  const [bizLabelWidth, setBizLabelWidth] = useState(55); // 사업자정보 라벨 너비 (px)
  const [colWidths, setColWidths] = useState({
    no: 26,      // No. 열 (px)
    spec: 32,    // 규격 열 (px)
    qty: 55,     // 수량 열 (px)
    price: 65,   // 단가 열 (px)
    total: 75,   // 견적가 열 (px)
    note: 28,    // 비고 열 (px)
  });

  // 수동 입력 행 상태 (외부 props 또는 내부 상태)
  const [internalManualRows, setInternalManualRows] = useState<ManualRow[]>([]);
  
  // 외부 props가 있으면 외부 것 사용, 없으면 내부 상태 사용
  const manualRows = externalManualRows ?? internalManualRows;
  const setManualRows = externalManualRows !== undefined 
    ? () => {} // 외부 관리 시 내부 setter 무시
    : setInternalManualRows;

  // 컴포넌트 마운트 시 저장된 양식 불러오기 + 오늘 날짜 설정
  useEffect(() => {
    // 외부 관리가 아닐 때만 내부 상태 초기화
    if (!externalQuoteDate) {
      setInternalQuoteDate(getTodayISO());
    }
    
    // localStorage에서 저장된 양식 불러오기
    const saved = localStorage.getItem('quoteFormSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.stampTop !== undefined) setStampTop(settings.stampTop);
        if (settings.stampRight !== undefined) setStampRight(settings.stampRight);
        if (settings.stampSize !== undefined) setStampSize(settings.stampSize);
        if (settings.leftWidth !== undefined) setLeftWidth(settings.leftWidth);
        if (settings.bizLabelWidth !== undefined) setBizLabelWidth(settings.bizLabelWidth);
        if (settings.colWidths) setColWidths(settings.colWidths);
        // 외부 관리가 아닐 때만 메모 불러오기
        if (settings.memoText && !externalMemoText) setInternalMemoText(settings.memoText);
      } catch (e) {
        console.error('Failed to load saved settings:', e);
      }
    }
  }, [externalQuoteDate, externalMemoText]);

  // 템플릿 변경 시 사업자 정보 업데이트 (외부 관리 아닐 때만)
  useEffect(() => {
    if (!externalBizAddress) setInternalBizAddress(currentTemplate.address);
    if (!externalBizName) setInternalBizName(currentTemplate.companyName);
    if (!externalBizCeo) setInternalBizCeo(currentTemplate.representative);
    if (!externalBizPhone) setInternalBizPhone(templateId === 'hotanggamtang' ? '010-8764-8950' : '010-2116-2349');
  }, [templateId, currentTemplate, externalBizAddress, externalBizName, externalBizCeo, externalBizPhone]);

  // 양식 저장 함수
  const saveFormSettings = () => {
    const settings = {
      bizAddress,
      bizName,
      bizCeo,
      bizPhone,
      stampTop,
      stampRight,
      stampSize,
      leftWidth,
      bizLabelWidth,
      colWidths,
      memoText,
    };
    localStorage.setItem('quoteFormSettings', JSON.stringify(settings));
    alert('브랜디즈 양식이 저장되었습니다!');
  };

  // 수동 행 추가 (외부 또는 내부)
  const addManualRow = externalAddManualRow ?? (() => {
    setInternalManualRows(prev => [...prev, { id: `manual-${Date.now()}`, name: '', qty: 1, price: 0 }]);
  });

  // 수동 행 업데이트 (외부 또는 내부)
  const updateManualRow = externalUpdateManualRow ?? ((id: string, field: keyof ManualRow, value: string | number) => {
    setInternalManualRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  });

  // 수동 행 삭제 (외부 또는 내부)
  const removeManualRow = externalRemoveManualRow ?? ((id: string) => {
    setInternalManualRows(prev => prev.filter(row => row.id !== id));
  });

  // 수동 행 합계
  const manualTotal = manualRows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const grandTotal = Math.round(totals.grandTotal) + manualTotal;

  // 전체 행 (API 아이템 + 수동 행 합쳐서 MAX_ROWS까지)
  const totalItemCount = items.length + manualRows.length;

  const previewId = documentType === 'invoice' ? 'invoice-preview' : 'quote-preview';
  const docTitle = documentType === 'invoice' ? '거 래 명 세 서' : '견 적 서';

  // 호탱감탱일 때는 별도 양식 사용 (공유 상태 전달)
  if (templateId === 'hotanggamtang') {
    return (
      <HotangQuoteForm
        items={items}
        totals={totals}
        documentType={documentType}
        discountRate={discountRate}
        truncation={truncation}
        onDiscountChange={onDiscountChange}
        onTruncationChange={onTruncationChange}
        onClearAll={onClearAll}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateUnitPrice={onUpdateUnitPrice}
        // 공유 상태 (견적서/거래명세서 동기화)
        manualRows={manualRows}
        onAddManualRow={addManualRow}
        onUpdateManualRow={updateManualRow}
        onRemoveManualRow={removeManualRow}
        quoteDate={quoteDate}
        onQuoteDateChange={setQuoteDate}
        recipient={recipient}
        onRecipientChange={setRecipient}
        memoText={memoText}
        onMemoTextChange={setMemoText}
        // 호탱감탱 사업자정보 동기화
        bizRegNo={hotangBizRegNo}
        onBizRegNoChange={onHotangBizRegNoChange}
        bizName={hotangBizName}
        onBizNameChange={onHotangBizNameChange}
        bizCeo={hotangBizCeo}
        onBizCeoChange={onHotangBizCeoChange}
        bizAddress={hotangBizAddress}
        onBizAddressChange={onHotangBizAddressChange}
        bizType={hotangBizType}
        onBizTypeChange={onHotangBizTypeChange}
        bizItem={hotangBizItem}
        onBizItemChange={onHotangBizItemChange}
        bizPhone={hotangBizPhone}
        onBizPhoneChange={onHotangBizPhoneChange}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* 엑셀 견적서 양식 그대로 */}
      <div id={previewId} className="border border-black bg-white text-[11px] leading-tight">
        
        {/* Row: No. */}
        <div className="px-2 py-1 text-gray-600">No.</div>
        
        {/* Row: 빈 줄 */}
        <div className="h-2"></div>
        
        {/* Row: 견적서/거래명세서 */}
        <div className="py-2 text-center">
          <span className="text-lg font-bold tracking-[1em]">{docTitle}</span>
        </div>
        
        {/* Row: 빈 줄 */}
        <div className="h-2"></div>
        
        {/* 날짜/수신/참조 + 사업자정보 테이블 */}
        <div className="flex mx-2">
          {/* 왼쪽: 날짜, 수신, 참조 (입력 가능) */}
          <div className="pr-3" style={{ width: `${leftWidth}%` }}>
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">날 짜 :</div>
              <div className="flex-1 border-b border-black relative">
                <span className="absolute inset-0 flex items-center px-1 text-[11px] pointer-events-none z-0">
                  {formatDateKorean(quoteDate)}
                </span>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="absolute inset-0 w-full h-full px-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px] cursor-pointer z-10"
                  style={{ color: 'transparent' }}
                />
              </div>
            </div>
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">수 신 :</div>
              <div className="flex-1 border-b border-black flex items-center">
                <input
                  id="quote-recipient"
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px] pb-0.5"
                />
              </div>
            </div>
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">참 조 :</div>
              <div className="flex-1 border-b border-black flex items-center">
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px] pb-0.5"
                />
              </div>
            </div>
            <div className="h-6"></div>
          </div>
          
          {/* 오른쪽: 사업자정보 테이블 */}
          <div className="border border-black relative text-[10px]" style={{ width: `${100 - leftWidth}%` }}>
            <div className="flex h-6 border-b border-black">
              <div className="px-1 flex items-center bg-gray-50 border-r border-black shrink-0 whitespace-nowrap" style={{ width: `${bizLabelWidth}px` }}>사업자소재지</div>
              <div className="flex-1 px-1 flex items-center min-w-0">
                <input
                  type="text"
                  value={bizAddress}
                  onChange={(e) => setBizAddress(e.target.value)}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[10px]"
                />
              </div>
            </div>
            <div className="flex h-6 border-b border-black">
              <div className="px-1 flex items-center bg-gray-50 border-r border-black shrink-0 whitespace-nowrap" style={{ width: `${bizLabelWidth}px` }}>상호</div>
              <div className="flex-1 px-1 flex items-center min-w-0">
                <input
                  type="text"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[10px]"
                />
              </div>
            </div>
            <div className="flex h-6 border-b border-black">
              <div className="px-1 flex items-center bg-gray-50 border-r border-black shrink-0 whitespace-nowrap" style={{ width: `${bizLabelWidth}px` }}>대표자성명</div>
              <div className="flex-1 px-1 flex items-center min-w-0">
                <input
                  type="text"
                  value={bizCeo}
                  onChange={(e) => setBizCeo(e.target.value)}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[10px]"
                />
              </div>
            </div>
            <div className="flex h-6">
              <div className="px-1 flex items-center bg-gray-50 border-r border-black shrink-0 whitespace-nowrap" style={{ width: `${bizLabelWidth}px` }}>전화번호</div>
              <div className="flex-1 px-1 flex items-center min-w-0">
                <input
                  type="text"
                  value={bizPhone}
                  onChange={(e) => setBizPhone(e.target.value)}
                  className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-[10px]"
                />
              </div>
            </div>
            {/* 도장 - 상호와 대표자성명 사이에 걸침 */}
            <img 
              src="/stamp-brandiz.png" 
              alt="인" 
              className="absolute object-contain"
              style={{ 
                top: `${stampTop}px`, 
                right: `${stampRight}px`, 
                width: `${stampSize}px`, 
                height: `${stampSize}px` 
              }}
            />
          </div>
        </div>
        
        {/* Row: 아래와 같이 견적합니다 */}
        <div className="px-2 py-2">아래와 같이 견적합니다</div>
        
        {/* Row: 빈 줄 */}
        <div className="h-1"></div>
        
        {/* 합계금액 테이블 */}
        <div className="mx-2 border border-black">
          <div className="flex">
            <div className="w-24 border-r border-black shrink-0">
              <div className="px-2 py-1 text-center border-b border-black">합계금액</div>
              <div className="px-2 py-1 text-center text-[10px]">(부가세 포함)</div>
            </div>
            <div className="w-1/2 flex items-center justify-center py-2 border-r border-black">
              <span className="text-sm font-medium tracking-wider">
                {numberToKorean(grandTotal)} 원정
              </span>
            </div>
            <div className="w-1/2 flex items-center justify-center py-2">
              <span className="text-sm">(₩{grandTotal.toLocaleString()})</span>
            </div>
          </div>
        </div>
        
        {/* 품목 테이블 */}
        <div className="mx-2 mt-1 border-t border-l border-r border-black">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-r border-black px-1 py-1 text-center bg-gray-50" style={{ width: `${colWidths.no}px` }}>No.</th>
                <th className="border-b border-r border-black px-1 py-1 text-center bg-gray-50">품명</th>
                <th className="border-b border-r border-black px-1 py-1 text-center bg-gray-50" style={{ width: `${colWidths.spec}px` }}>규격</th>
                <th className="border-b border-r border-black px-1 py-1 text-center bg-gray-50" style={{ width: `${colWidths.qty}px` }}>수량</th>
                <th className="border-b border-r border-black px-1 py-1 text-center bg-gray-50" style={{ width: `${colWidths.price}px` }}>단가</th>
                <th className="border-b border-r border-black px-1 py-1 text-center bg-gray-50" style={{ width: `${colWidths.total}px` }}>견적가</th>
                <th className="border-b border-black px-1 py-1 text-center bg-gray-50" style={{ width: `${colWidths.note}px` }}>비고</th>
              </tr>
            </thead>
            <tbody>
              {/* API 아이템 */}
              {items.map((item, index) => {
                const rowNum = index + 1;
                const itemTotal = calcItemTotal(item);
                const itemTotalWithVat = Math.round(itemTotal);
                const optionStr = Object.values(item.selectedOptions || {}).join(' ');
                const displayName = formatProductName(item.product.product_name, optionStr);

                return (
                  <tr key={item.id} className="group hover:bg-blue-50">
                    <td className="border-b border-r border-black px-1 py-1 text-center">{rowNum}</td>
                    <td className="border-b border-r border-black px-1 py-1">
                      <div className="flex items-center gap-1">
                        {onUpdateName ? (
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => onUpdateName(item.id, e.target.value)}
                            className="flex-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                          />
                        ) : (
                          <span title={displayName}>
                            {displayName}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                    <td className="border-b border-r border-black px-1 py-1 text-center">EA</td>
                    <td className="border-b border-r border-black px-0.5 py-1 text-center">
                      <input
                        type="text"
                        value={item.quantity.toLocaleString()}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/,/g, ''));
                          if (!isNaN(num)) onUpdateQuantity(item.id, Math.max(1, num));
                        }}
                        className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                      />
                    </td>
                    <td className="border-b border-r border-black px-0.5 py-1">
                      <input
                        type="text"
                        value={item.unitPrice.toLocaleString()}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/,/g, ''));
                          if (!isNaN(num)) onUpdateUnitPrice(item.id, Math.max(0, num));
                        }}
                        className="w-full text-right bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                      />
                    </td>
                    <td className="border-b border-r border-black px-1 py-1 text-right">
                      {itemTotalWithVat.toLocaleString()}
                    </td>
                    <td className="border-b border-black px-1 py-1"></td>
                  </tr>
                );
              })}
              {/* 수동 입력 행 */}
              {manualRows.map((row, index) => {
                const rowNum = items.length + index + 1;
                const rowTotal = row.qty * row.price;
                return (
                  <tr key={row.id} className="group hover:bg-green-50">
                    <td className="border-b border-r border-black px-1 py-1 text-center">{rowNum}</td>
                    <td className="border-b border-r border-black px-1 py-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateManualRow(row.id, 'name', e.target.value)}
                          placeholder="품명 입력"
                          className="flex-1 bg-transparent border-0 focus:ring-1 focus:ring-green-400 rounded text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => removeManualRow(row.id)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                    <td className="border-b border-r border-black px-1 py-1 text-center">EA</td>
                    <td className="border-b border-r border-black px-0.5 py-1 text-center">
                      <input
                        type="text"
                        value={row.qty.toLocaleString()}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/,/g, ''));
                          if (!isNaN(num)) updateManualRow(row.id, 'qty', Math.max(1, num));
                        }}
                        className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-green-400 rounded text-[11px]"
                      />
                    </td>
                    <td className="border-b border-r border-black px-0.5 py-1">
                      <input
                        type="text"
                        value={row.price.toLocaleString()}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/,/g, ''));
                          if (!isNaN(num)) updateManualRow(row.id, 'price', Math.max(0, num));
                        }}
                        className="w-full text-right bg-transparent border-0 focus:ring-1 focus:ring-green-400 rounded text-[11px]"
                      />
                    </td>
                    <td className="border-b border-r border-black px-1 py-1 text-right">
                      {rowTotal.toLocaleString()}
                    </td>
                    <td className="border-b border-black px-1 py-1"></td>
                  </tr>
                );
              })}
              {/* 빈 행 (최소 9행까지 채우기) */}
              {Array.from({ length: Math.max(0, MAX_ROWS - totalItemCount) }).map((_, index) => {
                const rowNum = totalItemCount + index + 1;
                const showEA = rowNum <= 6;
                return (
                  <tr key={`empty-${index}`}>
                    <td className="border-b border-r border-black px-1 py-1 text-center">{rowNum}</td>
                    <td className="border-b border-r border-black px-1 py-1"></td>
                    <td className="border-b border-r border-black px-1 py-1 text-center">{showEA ? 'EA' : ''}</td>
                    <td className="border-b border-r border-black px-1 py-1"></td>
                    <td className="border-b border-r border-black px-1 py-1"></td>
                    <td className="border-b border-r border-black px-1 py-1 text-center">-</td>
                    <td className="border-b border-black px-1 py-1"></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="border-b border-r border-black px-1 py-1 text-center font-medium">
                  합 계
                </td>
                <td className="border-b border-r border-black px-1 py-1 text-right font-medium">
                  {grandTotal > 0 ? grandTotal.toLocaleString() : '-'}
                </td>
                <td className="border-b border-black px-1 py-1"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* [MEMO] */}
        <div className="mx-2 mt-1 border border-black px-2 py-1">
          <div className="font-medium">[MEMO]</div>
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            className="w-full mt-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px] resize-none"
            rows={3}
            placeholder="메모 입력..."
          />
        </div>
        
        <div className="h-2"></div>
      </div>

      {/* 도장 위치/사이즈 설정 */}
      <details className="text-[11px]">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          도장 설정
        </summary>
        <div className="mt-2 p-2 bg-gray-50 rounded space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20">위치 (상하)</label>
            <input
              type="range"
              min={0}
              max={60}
              value={stampTop}
              onChange={(e) => setStampTop(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right">{stampTop}px</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20">위치 (좌우)</label>
            <input
              type="range"
              min={0}
              max={60}
              value={stampRight}
              onChange={(e) => setStampRight(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right">{stampRight}px</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20">크기</label>
            <input
              type="range"
              min={20}
              max={80}
              value={stampSize}
              onChange={(e) => setStampSize(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right">{stampSize}px</span>
          </div>
        </div>
      </details>

      {/* 레이아웃 설정 */}
      <details className="text-[11px]">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          레이아웃 설정
        </summary>
        <div className="mt-2 p-2 bg-gray-50 rounded space-y-2">
          <div className="font-medium text-gray-600 mb-1">영역 너비</div>
          <div className="flex items-center gap-2">
            <label className="w-28">날짜/수신/참조</label>
            <input
              type="range"
              min={30}
              max={55}
              value={leftWidth}
              onChange={(e) => setLeftWidth(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right">{leftWidth}%</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28">사업자 라벨</label>
            <input
              type="range"
              min={50}
              max={90}
              value={bizLabelWidth}
              onChange={(e) => setBizLabelWidth(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-10 text-right">{bizLabelWidth}px</span>
          </div>
          <div className="font-medium text-gray-600 mt-2 mb-1">표 열 너비</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <label className="w-12">No.</label>
              <input type="number" value={colWidths.no} onChange={(e) => setColWidths(p => ({...p, no: Number(e.target.value)}))} className="w-14 px-1 border rounded text-center" />
            </div>
            <div className="flex items-center gap-1">
              <label className="w-12">규격</label>
              <input type="number" value={colWidths.spec} onChange={(e) => setColWidths(p => ({...p, spec: Number(e.target.value)}))} className="w-14 px-1 border rounded text-center" />
            </div>
            <div className="flex items-center gap-1">
              <label className="w-12">수량</label>
              <input type="number" value={colWidths.qty} onChange={(e) => setColWidths(p => ({...p, qty: Number(e.target.value)}))} className="w-14 px-1 border rounded text-center" />
            </div>
            <div className="flex items-center gap-1">
              <label className="w-12">단가</label>
              <input type="number" value={colWidths.price} onChange={(e) => setColWidths(p => ({...p, price: Number(e.target.value)}))} className="w-14 px-1 border rounded text-center" />
            </div>
            <div className="flex items-center gap-1">
              <label className="w-12">견적가</label>
              <input type="number" value={colWidths.total} onChange={(e) => setColWidths(p => ({...p, total: Number(e.target.value)}))} className="w-14 px-1 border rounded text-center" />
            </div>
            <div className="flex items-center gap-1">
              <label className="w-12">비고</label>
              <input type="number" value={colWidths.note} onChange={(e) => setColWidths(p => ({...p, note: Number(e.target.value)}))} className="w-14 px-1 border rounded text-center" />
            </div>
          </div>
        </div>
      </details>

      {/* 수동 입력 추가 버튼 */}
      <button
        type="button"
        onClick={addManualRow}
        className="w-full rounded border border-green-300 bg-green-50 px-3 py-1 text-[11px] text-green-600 hover:bg-green-100"
      >
        ➕ 수동 항목 추가
      </button>

      {/* 양식 저장 버튼 */}
      <button
        type="button"
        onClick={saveFormSettings}
        className="w-full rounded border border-blue-300 bg-blue-50 px-3 py-1 text-[11px] text-blue-600 hover:bg-blue-100"
      >
        💾 현재 양식 저장
      </button>

      {/* 할인/절삭 설정 */}
      <details className="text-[11px]">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          할인/절삭 설정
        </summary>
        <div className="mt-2 p-2 bg-gray-50 rounded">
          <DiscountControl
            discountRate={discountRate}
            onDiscountChange={onDiscountChange}
            truncation={truncation}
            onTruncationChange={onTruncationChange}
            subtotal={totals.subtotal}
            truncationAmount={totals.truncationAmount}
          />
        </div>
      </details>

      {/* 전체 삭제 */}
      {(items.length > 0 || manualRows.length > 0) && (
        <button
          type="button"
          onClick={() => {
            onClearAll();
            // 외부 관리 시 onClearAll에서 이미 처리됨, 내부 관리 시에만 직접 비움
            if (!externalManualRows) {
              setInternalManualRows([]);
            }
          }}
          className="w-full rounded border border-red-200 px-3 py-1 text-[11px] text-red-500 hover:bg-red-50"
        >
          전체 삭제
        </button>
      )}
    </div>
  );
}
