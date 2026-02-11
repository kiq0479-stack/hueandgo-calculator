'use client';

import { useState, useEffect } from 'react';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals, TruncationType } from '@/hooks/useQuote';
import { HOTANGGAMTANG } from '@/lib/quote/templates';
import DiscountControl from './DiscountControl';

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
}: HotangQuoteFormProps) {
  // 날짜/수신처
  const [quoteDate, setQuoteDate] = useState('');
  const [recipient, setRecipient] = useState('');
  
  // 설명 텍스트 (수정 가능)
  const [descLine1, setDescLine1] = useState('아크릴 굿즈 주문제작에 대하여');
  const [descLine2, setDescLine2] = useState('아래와 같이 견적합니다.');
  
  // 사업자정보 (수정 가능)
  const [bizRegNo, setBizRegNo] = useState(HOTANGGAMTANG.registrationNumber);
  const [bizName, setBizName] = useState(HOTANGGAMTANG.companyName);
  const [bizCeo, setBizCeo] = useState(HOTANGGAMTANG.representative);
  const [bizAddress, setBizAddress] = useState(HOTANGGAMTANG.address);
  const [bizType, setBizType] = useState(HOTANGGAMTANG.businessType);
  const [bizItem, setBizItem] = useState(HOTANGGAMTANG.businessItem);
  const [bizPhone, setBizPhone] = useState('010-6255-7392');
  
  // 메모
  const [memoText, setMemoText] = useState('*배송은 택배시 무료입니다.');
  
  // 도장 설정
  const [stampTop, setStampTop] = useState(0);
  const [stampRight, setStampRight] = useState(0);
  const [stampSize, setStampSize] = useState(40);
  
  // 레이아웃 설정
  const [leftWidth, setLeftWidth] = useState(45);
  
  // 수동 입력 행 상태
  type ManualRow = { id: string; name: string; qty: number; price: number };
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);

  useEffect(() => {
    setQuoteDate(getTodayISO());
    
    // localStorage에서 저장된 설정 불러오기
    const saved = localStorage.getItem('hotangFormSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        if (settings.descLine1) setDescLine1(settings.descLine1);
        if (settings.descLine2) setDescLine2(settings.descLine2);
        if (settings.bizRegNo) setBizRegNo(settings.bizRegNo);
        if (settings.bizName) setBizName(settings.bizName);
        if (settings.bizCeo) setBizCeo(settings.bizCeo);
        if (settings.bizAddress) setBizAddress(settings.bizAddress);
        if (settings.bizType) setBizType(settings.bizType);
        if (settings.bizItem) setBizItem(settings.bizItem);
        if (settings.bizPhone) setBizPhone(settings.bizPhone);
        if (settings.memoText) setMemoText(settings.memoText);
        if (settings.stampTop !== undefined) setStampTop(settings.stampTop);
        if (settings.stampRight !== undefined) setStampRight(settings.stampRight);
        if (settings.stampSize !== undefined) setStampSize(settings.stampSize);
        if (settings.leftWidth !== undefined) setLeftWidth(settings.leftWidth);
      } catch (e) {
        console.error('Failed to load saved settings:', e);
      }
    }
  }, []);

  // 양식 저장 함수
  const saveFormSettings = () => {
    const settings = {
      descLine1, descLine2,
      bizRegNo, bizName, bizCeo, bizAddress, bizType, bizItem, bizPhone,
      memoText,
      stampTop, stampRight, stampSize,
      leftWidth,
    };
    localStorage.setItem('hotangFormSettings', JSON.stringify(settings));
    alert('호탱감탱 양식이 저장되었습니다!');
  };

  const previewId = documentType === 'invoice' ? 'invoice-preview' : 'quote-preview';
  const docTitle = documentType === 'invoice' ? '거 래 명 세 서' : '견 적 서';

  // 수동 행 합계
  const manualTotal = manualRows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const grandTotal = Math.round(totals.grandTotal) + manualTotal;

  // 수동 행 추가/삭제
  const addManualRow = () => {
    if (items.length + manualRows.length >= MAX_ROWS) return;
    setManualRows(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: 1, price: 0 }]);
  };

  const removeManualRow = (id: string) => {
    setManualRows(prev => prev.filter(r => r.id !== id));
  };

  const updateManualRow = (id: string, field: keyof ManualRow, value: string | number) => {
    setManualRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
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
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="flex-1 mr-1 border-b border-black bg-transparent focus:outline-none text-[11px]"
                placeholder="수신처 입력"
              />
              <span>귀하</span>
            </div>
          </div>
          
          {/* 오른쪽: 사업자정보 테이블 */}
          <div className="border-l border-black" style={{ width: `${100 - leftWidth}%` }}>
            <table className="w-full text-[10px] border-collapse">
              <tbody>
                <tr className="border-b border-black h-6">
                  <td className="border-r border-black px-1 bg-gray-50 w-16">사업자 번호</td>
                  <td className="px-1" colSpan={3}>
                    <input type="text" value={bizRegNo} onChange={(e) => setBizRegNo(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                </tr>
                <tr className="border-b border-black h-6">
                  <td className="border-r border-black px-1 bg-gray-50">상호</td>
                  <td className="border-r border-black px-1">
                    <input type="text" value={bizName} onChange={(e) => setBizName(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                  <td className="border-r border-black px-1 bg-gray-50 w-12">대표자</td>
                  <td className="px-1 relative pr-10">
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
                <tr className="border-b border-black h-6">
                  <td className="border-r border-black px-1 bg-gray-50">소재지</td>
                  <td className="px-1" colSpan={3}>
                    <input type="text" value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                </tr>
                <tr className="border-b border-black h-6">
                  <td className="border-r border-black px-1 bg-gray-50">업태</td>
                  <td className="border-r border-black px-1">
                    <input type="text" value={bizType} onChange={(e) => setBizType(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                  <td className="border-r border-black px-1 bg-gray-50">업종</td>
                  <td className="px-1">
                    <input type="text" value={bizItem} onChange={(e) => setBizItem(e.target.value)} className="w-full bg-transparent border-0 focus:outline-none text-[10px]" />
                  </td>
                </tr>
                <tr className="h-6">
                  <td className="border-r border-black px-1 bg-gray-50">전화번호</td>
                  <td className="px-1" colSpan={3}>
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
            {/* API 아이템 */}
            {items.map((item, idx) => {
              const rowNum = idx + 1;
              const optionStr = Object.values(item.selectedOptions || {}).join(' ');
              const displayName = formatProductName(item.product.product_name, optionStr);
              const itemTotal = item.unitPrice * item.quantity;
              
              return (
                <tr key={`item-${idx}`} className="border-b border-black group hover:bg-blue-50">
                  <td className="border-r border-black px-1 py-1 text-center">{rowNum}</td>
                  <td className="border-r border-black px-1 py-1 text-center">
                    <input
                      type="text"
                      value={item.quantity.toLocaleString()}
                      onChange={(e) => {
                        const num = Number(e.target.value.replace(/,/g, ''));
                        if (!isNaN(num) && onUpdateQuantity) onUpdateQuantity(item.id, Math.max(1, num));
                      }}
                      className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                    />
                  </td>
                  <td className="border-r border-black px-1 py-1 text-center">EA</td>
                  <td className="border-r border-black px-1 py-1">{displayName}</td>
                  <td className="border-r border-black px-1 py-1">
                    <input
                      type="text"
                      value={item.unitPrice.toLocaleString()}
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
        onClick={saveFormSettings}
        className="w-full rounded border border-blue-300 bg-blue-50 px-3 py-1 text-[11px] text-blue-600 hover:bg-blue-100"
      >
        💾 현재 양식 저장
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
            setManualRows([]);
          }}
          className="w-full rounded border border-red-200 px-3 py-1 text-[11px] text-red-500 hover:bg-red-50"
        >
          전체 삭제
        </button>
      )}
    </div>
  );
}
