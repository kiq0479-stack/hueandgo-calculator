'use client';

import { useState, useEffect, useCallback } from 'react';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals, TruncationType } from '@/hooks/useQuote';
import { HOTANGGAMTANG } from '@/lib/quote/templates';
import DiscountControl from './DiscountControl';
import { useSharedSettings, DEFAULT_HOTANG_FORM, type HotangFormSettings } from '@/hooks/useSharedSettings';

// 수동 입력 행 타입
type ManualRow = { id: string; name: string; qty: number; price: number };

// 호탱감탱 오버라이드 타입 (브랜디즈와 독립적으로 수정 가능)
type HotangOverride = { quantity?: number; unitPrice?: number; name?: string };

interface HotangQuoteFormProps {
  items: QuoteItemType[];
  totals: QuoteTotals;
  documentType?: 'quote' | 'invoice';
  discountRate?: number;
  truncation?: TruncationType;
  onDiscountChange?: (rate: number) => void;
  onTruncationChange?: (type: TruncationType) => void;
  onClearAll?: () => void;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onUpdateUnitPrice?: (id: string, unitPrice: number) => void;
  // 호탱감탱 독립 오버라이드 (브랜디즈에 영향 없이 수정)
  hotangOverrides?: Record<string, HotangOverride>;
  onUpdateName?: (id: string, name: string) => void;
  onRemoveItem?: (id: string) => void; // 호탱감탱에서 아이템 숨기기
  // 공유 상태 (견적서/거래명세서 동기화)
  manualRows?: ManualRow[];
  onAddManualRow?: () => void;
  onUpdateManualRow?: (id: string, field: keyof ManualRow, value: string | number) => void;
  onRemoveManualRow?: (id: string) => void;
  quoteDate?: string;
  onQuoteDateChange?: (date: string) => void;
  recipient?: string;
  onRecipientChange?: (value: string) => void;
  memoText?: string;
  onMemoTextChange?: (value: string) => void;
  // 사업자정보 동기화
  bizRegNo?: string;
  onBizRegNoChange?: (value: string) => void;
  bizName?: string;
  onBizNameChange?: (value: string) => void;
  bizCeo?: string;
  onBizCeoChange?: (value: string) => void;
  bizAddress?: string;
  onBizAddressChange?: (value: string) => void;
  bizType?: string;
  onBizTypeChange?: (value: string) => void;
  bizItem?: string;
  onBizItemChange?: (value: string) => void;
  bizPhone?: string;
  onBizPhoneChange?: (value: string) => void;
}

// 오늘 날짜를 YYYY-MM-DD 형식으로
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

// 품명 정리 (호탱감탱용: 괄호 대신 - 사용)
// Calculator에서 이미 품명에 사이즈가 추가되어 있으므로, 여기서는 형식만 변환
function formatProductNameForHotang(name: string): string {
  let formatted = name.replace(/\s*\(파트너\s*전용\)\s*/gi, '').trim();
  
  // 기존 괄호 내용을 - 형식으로 변환
  // 예: "아크릴 키링 (130mm)" → "아크릴 키링 - 130mm"
  // 예: "하트 고리(로즈골드)" → "하트 고리 - 로즈골드"
  formatted = formatted.replace(/\s*\(([^)]+)\)/g, ' - $1');
  
  return formatted;
}

const MAX_ROWS = 9;

export default function HotangQuoteForm({
  items,
  totals,
  documentType = 'quote',
  discountRate = 0,
  truncation = 'none',
  onDiscountChange,
  onTruncationChange,
  onClearAll,
  onUpdateQuantity,
  onUpdateUnitPrice,
  // 호탱감탱 독립 오버라이드
  hotangOverrides = {},
  onUpdateName,
  onRemoveItem,
  // 공유 상태 props
  manualRows: externalManualRows,
  onAddManualRow: externalAddManualRow,
  onUpdateManualRow: externalUpdateManualRow,
  onRemoveManualRow: externalRemoveManualRow,
  quoteDate: externalQuoteDate,
  onQuoteDateChange: externalQuoteDateChange,
  recipient: externalRecipient,
  onRecipientChange: externalRecipientChange,
  memoText: externalMemoText,
  onMemoTextChange: externalMemoTextChange,
  bizRegNo: externalBizRegNo,
  onBizRegNoChange: externalBizRegNoChange,
  bizName: externalBizName,
  onBizNameChange: externalBizNameChange,
  bizCeo: externalBizCeo,
  onBizCeoChange: externalBizCeoChange,
  bizAddress: externalBizAddress,
  onBizAddressChange: externalBizAddressChange,
  bizType: externalBizType,
  onBizTypeChange: externalBizTypeChange,
  bizItem: externalBizItem,
  onBizItemChange: externalBizItemChange,
  bizPhone: externalBizPhone,
  onBizPhoneChange: externalBizPhoneChange,
}: HotangQuoteFormProps) {
  // 내부 fallback 상태 (props 없을 때 사용)
  const [internalQuoteDate, setInternalQuoteDate] = useState('');
  const [internalRecipient, setInternalRecipient] = useState('');
  const [internalMemoText, setInternalMemoText] = useState('*배송은 택배시 무료입니다.');
  const [internalBizRegNo, setInternalBizRegNo] = useState(HOTANGGAMTANG.registrationNumber);
  const [internalBizName, setInternalBizName] = useState(HOTANGGAMTANG.companyName);
  const [internalBizCeo, setInternalBizCeo] = useState(HOTANGGAMTANG.representative);
  const [internalBizAddress, setInternalBizAddress] = useState(HOTANGGAMTANG.address);
  const [internalBizType, setInternalBizType] = useState(HOTANGGAMTANG.businessType);
  const [internalBizItem, setInternalBizItem] = useState(HOTANGGAMTANG.businessItem);
  const [internalBizPhone, setInternalBizPhone] = useState('010-6255-7392');
  const [internalManualRows, setInternalManualRows] = useState<ManualRow[]>([]);
  
  // props 우선, 없으면 내부 상태 사용
  const quoteDate = externalQuoteDate ?? internalQuoteDate;
  const setQuoteDate = externalQuoteDateChange ?? setInternalQuoteDate;
  const recipient = externalRecipient ?? internalRecipient;
  const setRecipient = externalRecipientChange ?? setInternalRecipient;
  const memoText = externalMemoText ?? internalMemoText;
  const setMemoText = externalMemoTextChange ?? setInternalMemoText;
  const bizRegNo = externalBizRegNo ?? internalBizRegNo;
  const setBizRegNo = externalBizRegNoChange ?? setInternalBizRegNo;
  const bizName = externalBizName ?? internalBizName;
  const setBizName = externalBizNameChange ?? setInternalBizName;
  const bizCeo = externalBizCeo ?? internalBizCeo;
  const setBizCeo = externalBizCeoChange ?? setInternalBizCeo;
  const bizAddress = externalBizAddress ?? internalBizAddress;
  const setBizAddress = externalBizAddressChange ?? setInternalBizAddress;
  const bizType = externalBizType ?? internalBizType;
  const setBizType = externalBizTypeChange ?? setInternalBizType;
  const bizItem = externalBizItem ?? internalBizItem;
  const setBizItem = externalBizItemChange ?? setInternalBizItem;
  const bizPhone = externalBizPhone ?? internalBizPhone;
  const setBizPhone = externalBizPhoneChange ?? setInternalBizPhone;
  const manualRows = externalManualRows ?? internalManualRows;
  
  // 서버에서 양식 설정 로드
  const { data: formSettings, save: saveFormToServer, loading: formLoading } = useSharedSettings<HotangFormSettings>(
    'hotang_form',
    DEFAULT_HOTANG_FORM
  );

  // 설명 텍스트 (내부 상태)
  const [descLine1, setDescLine1] = useState(DEFAULT_HOTANG_FORM.descLine1);
  const [descLine2, setDescLine2] = useState(DEFAULT_HOTANG_FORM.descLine2);
  
  // 도장 설정 (내부 상태)
  const [stampTop, setStampTop] = useState(DEFAULT_HOTANG_FORM.stampTop);
  const [stampRight, setStampRight] = useState(DEFAULT_HOTANG_FORM.stampRight);
  const [stampSize, setStampSize] = useState(DEFAULT_HOTANG_FORM.stampSize);
  
  // 레이아웃 설정 (내부 상태)
  const [leftWidth, setLeftWidth] = useState(DEFAULT_HOTANG_FORM.leftWidth);

  // 서버 데이터 로드되면 로컬 상태 업데이트
  useEffect(() => {
    if (formSettings) {
      setDescLine1(formSettings.descLine1);
      setDescLine2(formSettings.descLine2);
      setStampTop(formSettings.stampTop);
      setStampRight(formSettings.stampRight);
      setStampSize(formSettings.stampSize);
      setLeftWidth(formSettings.leftWidth);
      // 사업자정보 (props가 없을 때만)
      if (!externalBizRegNo && formSettings.bizRegNo) setInternalBizRegNo(formSettings.bizRegNo);
      if (!externalBizName && formSettings.bizName) setInternalBizName(formSettings.bizName);
      if (!externalBizCeo && formSettings.bizCeo) setInternalBizCeo(formSettings.bizCeo);
      if (!externalBizAddress && formSettings.bizAddress) setInternalBizAddress(formSettings.bizAddress);
      if (!externalBizType && formSettings.bizType) setInternalBizType(formSettings.bizType);
      if (!externalBizItem && formSettings.bizItem) setInternalBizItem(formSettings.bizItem);
      if (!externalBizPhone && formSettings.bizPhone) setInternalBizPhone(formSettings.bizPhone);
      if (!externalMemoText && formSettings.memoText) setInternalMemoText(formSettings.memoText);
    }
  }, [formSettings]);

  useEffect(() => {
    // 날짜 초기화 (props가 없을 때만)
    if (!externalQuoteDate) {
      setInternalQuoteDate(getTodayISO());
    }
  }, [externalQuoteDate]);

  // 양식 저장 함수 (서버에 저장)
  const handleSaveFormSettings = useCallback(() => {
    const settings: HotangFormSettings = {
      descLine1, descLine2,
      bizRegNo, bizName, bizCeo, bizAddress, bizType, bizItem, bizPhone,
      memoText,
      stampTop, stampRight, stampSize,
      leftWidth,
    };
    saveFormToServer(settings);
    alert('호탱감탱 양식이 저장되었습니다!');
  }, [descLine1, descLine2, bizRegNo, bizName, bizCeo, bizAddress, bizType, bizItem, bizPhone, memoText, stampTop, stampRight, stampSize, leftWidth, saveFormToServer]);

  const previewId = documentType === 'invoice' ? 'invoice-preview' : 'quote-preview';
  const docTitle = documentType === 'invoice' ? '거 래 명 세 서' : '견 적 서';

  // 호탱감탱 오버라이드 적용한 아이템 합계 계산
  const itemsTotal = items.reduce((sum, item) => {
    const override = hotangOverrides[item.id] || {};
    const qty = override.quantity ?? item.quantity;
    const price = override.unitPrice ?? item.unitPrice;
    return sum + (qty * price);
  }, 0);
  
  // 수동 행 합계
  const manualTotal = manualRows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const grandTotal = Math.round(itemsTotal) + manualTotal;

  // 수동 행 추가/삭제 (props 우선, 없으면 내부 상태)
  const addManualRow = () => {
    if (items.length + manualRows.length >= MAX_ROWS) return;
    if (externalAddManualRow) {
      externalAddManualRow();
    } else {
      setInternalManualRows(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: 1, price: 0 }]);
    }
  };

  const removeManualRow = (id: string) => {
    if (externalRemoveManualRow) {
      externalRemoveManualRow(id);
    } else {
      setInternalManualRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateManualRow = (id: string, field: keyof ManualRow, value: string | number) => {
    if (externalUpdateManualRow) {
      externalUpdateManualRow(id, field, value);
    } else {
      setInternalManualRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    }
  };

  return (
    <div className="space-y-3">
      {/* 호탱감탱 견적서 양식 */}
      <div id={previewId} className="border border-black bg-white text-[11px] leading-tight">
        
        {/* Row: No. */}
        <div className="px-2 py-1 text-gray-600 border-b border-black">No.</div>
        
        {/* Row: 견적서 제목 */}
        <div className="py-3 text-center border-b border-black">
          <span className="text-lg font-bold tracking-[1em]">{docTitle}</span>
        </div>
        
        {/* 설명 + 사업자정보 영역 */}
        <div className="flex border-b border-black">
          {/* 왼쪽: 설명 텍스트 */}
          <div className="p-2 flex flex-col justify-center" style={{ width: `${leftWidth}%` }}>
            <input
              type="text"
              value={descLine1}
              onChange={(e) => setDescLine1(e.target.value)}
              className="mb-1 bg-transparent border-0 focus:outline-none text-[11px] w-full"
            />
            <input
              type="text"
              value={descLine2}
              onChange={(e) => setDescLine2(e.target.value)}
              className="mb-1 bg-transparent border-0 focus:outline-none text-[11px] w-full"
            />
            <div className="mb-2 relative cursor-pointer" style={{ width: 'fit-content' }}>
              <span className="pointer-events-none">{formatDateKorean(quoteDate)}</span>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="absolute inset-0 w-full h-full cursor-pointer z-10"
                style={{ opacity: 0 }}
              />
            </div>
            <div className="flex items-center">
              <input
                id="quote-recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="flex-1 mr-1 border-b border-black bg-transparent focus:outline-none text-[11px]"
                placeholder="수신처 입력"
              />
              <span>귀하</span>
            </div>
          </div>
          
          {/* 오른쪽: 사업자정보 테이블 - inline style로 테두리 통일 */}
          <div style={{ width: `${100 - leftWidth}%`, borderLeft: '1px solid black' }}>
            <table className="w-full text-[10px]" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ height: '24px' }}>
                  <td className="px-1 bg-gray-50" style={{ border: '1px solid black', width: '64px' }}>사업자 번호</td>
                  <td className="px-1" colSpan={3} style={{ border: '1px solid black' }}>
                    <input type="text" value={bizRegNo} onChange={(e) => setBizRegNo(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                </tr>
                <tr style={{ height: '24px' }}>
                  <td className="px-1 bg-gray-50" style={{ border: '1px solid black' }}>상호</td>
                  <td className="px-1" style={{ border: '1px solid black' }}>
                    <input type="text" value={bizName} onChange={(e) => setBizName(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                  <td className="px-1 bg-gray-50" style={{ border: '1px solid black', width: '48px' }}>대표자</td>
                  <td className="px-1 relative pr-10" style={{ border: '1px solid black' }}>
                    <input type="text" value={bizCeo} onChange={(e) => setBizCeo(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                    {/* 호탱감탱 도장 */}
                    <img 
                      src="/stamp-hotang.png" 
                      alt="호탱감탱 도장" 
                      className="absolute object-contain"
                      style={{
                        top: `${stampTop}px`,
                        right: `${stampRight}px`,
                        width: `${stampSize}px`,
                        height: `${stampSize}px`,
                        transform: 'translate(50%, -50%)',
                      }}
                    />
                  </td>
                </tr>
                <tr style={{ height: '24px' }}>
                  <td className="px-1 bg-gray-50" style={{ border: '1px solid black' }}>소재지</td>
                  <td className="px-1" colSpan={3} style={{ border: '1px solid black' }}>
                    <input type="text" value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                </tr>
                <tr style={{ height: '24px' }}>
                  <td className="px-1 bg-gray-50" style={{ border: '1px solid black' }}>업태</td>
                  <td className="px-1" style={{ border: '1px solid black' }}>
                    <input type="text" value={bizType} onChange={(e) => setBizType(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                  <td className="px-1 bg-gray-50" style={{ border: '1px solid black', width: '48px' }}>업종</td>
                  <td className="px-1" style={{ border: '1px solid black' }}>
                    <input type="text" value={bizItem} onChange={(e) => setBizItem(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                </tr>
                <tr style={{ height: '24px' }}>
                  <td className="px-1 bg-gray-50" style={{ border: '1px solid black' }}>전화번호</td>
                  <td className="px-1" colSpan={3} style={{ border: '1px solid black' }}>
                    <input type="text" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* 합계금액 */}
        <div className="border-b border-black">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="border-r border-black px-1 py-1 bg-gray-50 w-24 text-center text-[10px]">
                  합계금액<br/>(공급가액+부가세)
                </td>
                <td className="px-2 py-1 text-center font-medium">
                  {numberToKorean(grandTotal)} 원정
                </td>
                <td className="border-l border-black px-2 py-1 text-center w-32">
                  (₩{grandTotal.toLocaleString()})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* 품목 테이블 */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-black">
              <th className="border-r border-black px-1 py-1 w-8">No.</th>
              <th className="border-r border-black px-1 py-1 w-14">수량</th>
              <th className="border-r border-black px-1 py-1 w-10">규격</th>
              <th className="border-r border-black px-1 py-1">품명</th>
              <th className="border-r border-black px-1 py-1 w-16">단가</th>
              <th className="border-r border-black px-1 py-1 w-20">견적가</th>
              <th className="px-1 py-1 w-12">비고</th>
            </tr>
          </thead>
          <tbody>
            {/* API 아이템 (호탱감탱 오버라이드 적용) */}
            {items.map((item, idx) => {
              const rowNum = idx + 1;
              // Calculator에서 이미 사이즈 추가된 품명을 호탱감탱 형식(괄호→-)으로 변환
              const originalName = formatProductNameForHotang(item.product.product_name);
              // 호탱감탱 오버라이드 적용 (있으면 사용, 없으면 원본)
              const override = hotangOverrides[item.id] || {};
              const displayQuantity = override.quantity ?? item.quantity;
              const displayUnitPrice = override.unitPrice ?? item.unitPrice;
              const displayName = override.name ?? originalName;
              const itemTotal = displayUnitPrice * displayQuantity;
              
              return (
                <tr key={`item-${idx}`} className="border-b border-black group hover:bg-blue-50">
                  <td className="border-r border-black px-1 py-1 text-center">{rowNum}</td>
                  <td className="border-r border-black px-1 py-1 text-center">
                    <input
                      type="text"
                      value={displayQuantity.toLocaleString()}
                      onChange={(e) => {
                        const num = Number(e.target.value.replace(/,/g, ''));
                        if (!isNaN(num) && onUpdateQuantity) onUpdateQuantity(item.id, Math.max(1, num));
                      }}
                      className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                    />
                  </td>
                  <td className="border-r border-black px-1 py-1 text-center">EA</td>
                  <td className="border-r border-black px-1 py-1">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                          if (onUpdateName) onUpdateName(item.id, e.target.value);
                        }}
                        className="flex-1 bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                      />
                      {onRemoveItem && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="border-r border-black px-1 py-1">
                    <input
                      type="text"
                      value={displayUnitPrice.toLocaleString()}
                      onChange={(e) => {
                        const num = Number(e.target.value.replace(/,/g, ''));
                        if (!isNaN(num) && onUpdateUnitPrice) onUpdateUnitPrice(item.id, Math.max(0, num));
                      }}
                      className="w-full text-right bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                    />
                  </td>
                  <td className="border-r border-black px-1 py-1 text-right">{itemTotal.toLocaleString()}</td>
                  <td className="px-1 py-1"></td>
                </tr>
              );
            })}
            {/* 수동 입력 행 */}
            {manualRows.map((row, index) => {
              const rowNum = items.length + index + 1;
              const rowTotal = row.qty * row.price;
              return (
                <tr key={row.id} className="border-b border-black group hover:bg-green-50">
                  <td className="border-r border-black px-1 py-1 text-center">{rowNum}</td>
                  <td className="border-r border-black px-1 py-1">
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
                  <td className="border-r border-black px-1 py-1 text-center">EA</td>
                  <td className="border-r border-black px-1 py-1">
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
                  <td className="border-r border-black px-1 py-1">
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
                  <td className="border-r border-black px-1 py-1 text-right">{rowTotal > 0 ? rowTotal.toLocaleString() : '-'}</td>
                  <td className="px-1 py-1"></td>
                </tr>
              );
            })}
            {/* 빈 행 */}
            {Array.from({ length: Math.max(0, MAX_ROWS - items.length - manualRows.length) }).map((_, idx) => {
              const rowNum = items.length + manualRows.length + idx + 1;
              const showEA = rowNum <= 6;
              return (
                <tr key={`empty-${idx}`} className="border-b border-black">
                  <td className="border-r border-black px-1 py-1 text-center">{rowNum}</td>
                  <td className="border-r border-black px-1 py-1"></td>
                  <td className="border-r border-black px-1 py-1 text-center">{showEA ? 'EA' : ''}</td>
                  <td className="border-r border-black px-1 py-1"></td>
                  <td className="border-r border-black px-1 py-1"></td>
                  <td className="border-r border-black px-1 py-1 text-center">-</td>
                  <td className="px-1 py-1"></td>
                </tr>
              );
            })}
            {/* 합계 행 */}
            <tr className="bg-gray-100">
              <td colSpan={5} className="border-r border-black px-1 py-1 text-center font-medium">합 계</td>
              <td className="border-r border-black px-1 py-1 text-right font-medium">{grandTotal > 0 ? grandTotal.toLocaleString() : '-'}</td>
              <td className="px-1 py-1"></td>
            </tr>
          </tbody>
        </table>
        
        {/* MEMO */}
        <div className="border-t border-black p-2">
          <p className="font-medium">[MEMO]</p>
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            className="w-full bg-transparent border-0 focus:outline-none text-[11px] resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* 도장 설정 */}
      <details className="text-[11px]">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">도장 설정</summary>
        <div className="mt-2 p-2 bg-gray-50 rounded space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-20">위치 (상하)</label>
            <input type="range" min={-20} max={40} value={stampTop} onChange={(e) => setStampTop(Number(e.target.value))} className="flex-1" />
            <span className="w-10 text-right">{stampTop}px</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20">위치 (좌우)</label>
            <input type="range" min={-20} max={40} value={stampRight} onChange={(e) => setStampRight(Number(e.target.value))} className="flex-1" />
            <span className="w-10 text-right">{stampRight}px</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20">크기</label>
            <input type="range" min={20} max={80} value={stampSize} onChange={(e) => setStampSize(Number(e.target.value))} className="flex-1" />
            <span className="w-10 text-right">{stampSize}px</span>
          </div>
        </div>
      </details>

      {/* 레이아웃 설정 */}
      <details className="text-[11px]">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">레이아웃 설정</summary>
        <div className="mt-2 p-2 bg-gray-50 rounded space-y-2">
          <div className="flex items-center gap-2">
            <label className="w-28">왼쪽 영역 너비</label>
            <input type="range" min={30} max={55} value={leftWidth} onChange={(e) => setLeftWidth(Number(e.target.value))} className="flex-1" />
            <span className="w-10 text-right">{leftWidth}%</span>
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
        onClick={handleSaveFormSettings}
        className="w-full rounded border border-blue-300 bg-blue-50 px-3 py-1 text-[11px] text-blue-600 hover:bg-blue-100"
      >
        💾 현재 양식 저장 (서버)
      </button>

      {/* 할인/절삭 설정 */}
      {onDiscountChange && onTruncationChange && (
        <details className="text-[11px]">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">할인/절삭 설정</summary>
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
      )}

      {/* 전체 삭제 */}
      {(items.length > 0 || manualRows.length > 0) && onClearAll && (
        <button
          type="button"
          onClick={() => {
            onClearAll();
            // manualRows는 page.tsx의 clearAllWithManual에서 함께 초기화됨
            // 내부 상태만 사용하는 경우를 위해 fallback
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
