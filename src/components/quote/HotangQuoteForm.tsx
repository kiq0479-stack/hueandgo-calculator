'use client';

import { useState, useEffect } from 'react';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals, TruncationType } from '@/hooks/useQuote';
import { HOTANGGAMTANG } from '@/lib/quote/templates';

interface HotangQuoteFormProps {
  items: QuoteItemType[];
  totals: QuoteTotals;
  documentType?: 'quote' | 'invoice';
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
}: HotangQuoteFormProps) {
  const [quoteDate, setQuoteDate] = useState('');
  const [recipient, setRecipient] = useState('');
  
  // 수동 입력 행 상태
  type ManualRow = { id: string; name: string; qty: number; price: number };
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);

  useEffect(() => {
    setQuoteDate(getTodayISO());
  }, []);

  const previewId = documentType === 'invoice' ? 'invoice-preview' : 'quote-preview';
  const docTitle = documentType === 'invoice' ? '거 래 명 세 서' : '견 적 서';

  // 수동 행 합계
  const manualTotal = manualRows.reduce((sum, row) => sum + (row.qty * row.price), 0);
  const grandTotal = Math.round(totals.grandTotal) + manualTotal;

  // 수동 행 추가
  const addManualRow = () => {
    if (items.length + manualRows.length >= MAX_ROWS) return;
    setManualRows(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: 1, price: 0 }]);
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
          <div className="w-[45%] p-2 flex flex-col justify-center">
            <p className="mb-1">아크릴 굿즈 주문제작에 대하여</p>
            <p className="mb-1">아래와 같이 견적합니다.</p>
            <p className="mb-2">{formatDateKorean(quoteDate)}</p>
            <div className="flex items-center">
              <span>㈜</span>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="flex-1 mx-1 border-b border-black bg-transparent focus:outline-none text-[11px]"
                placeholder="수신처 입력"
              />
              <span>귀하</span>
            </div>
          </div>
          
          {/* 오른쪽: 사업자정보 테이블 */}
          <div className="w-[55%] border-l border-black">
            <table className="w-full text-[10px]">
              <tbody>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5 bg-gray-50 w-20">사업자 번호</td>
                  <td className="px-1 py-0.5" colSpan={3}>{HOTANGGAMTANG.registrationNumber}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5 bg-gray-50">상호</td>
                  <td className="border-r border-black px-1 py-0.5">{HOTANGGAMTANG.companyName}</td>
                  <td className="border-r border-black px-1 py-0.5 bg-gray-50 w-14">대표자</td>
                  <td className="px-1 py-0.5 relative">
                    {HOTANGGAMTANG.representative}
                    {/* 도장 */}
                    <img 
                      src="/stamp-hotang.png" 
                      alt="호탱감탱 도장" 
                      className="absolute -top-1 -right-1 w-8 h-8"
                    />
                  </td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5 bg-gray-50">소재지</td>
                  <td className="px-1 py-0.5" colSpan={3}>{HOTANGGAMTANG.address}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5 bg-gray-50">업태</td>
                  <td className="border-r border-black px-1 py-0.5">{HOTANGGAMTANG.businessType}</td>
                  <td className="border-r border-black px-1 py-0.5 bg-gray-50">업종</td>
                  <td className="px-1 py-0.5">{HOTANGGAMTANG.businessItem}</td>
                </tr>
                <tr>
                  <td className="border-r border-black px-1 py-0.5 bg-gray-50">전화번호</td>
                  <td className="px-1 py-0.5" colSpan={3}>010-8764-8950</td>
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
                <td className="border-r border-black px-2 py-1 bg-gray-50 w-20 text-center">
                  합계금액<br/><span className="text-[9px]">(공급가액)</span>
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
        
        {/* 품목 테이블 - 호탱감탱 양식: No, 수량, 규격, 품명, 단가, 견적가, 비고 */}
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
            {Array.from({ length: MAX_ROWS }).map((_, idx) => {
              const rowNum = idx + 1;
              const item = items[idx];
              const manualIdx = idx - items.length;
              const manual = manualIdx >= 0 ? manualRows[manualIdx] : null;
              
              if (item) {
                const optionStr = Object.values(item.selectedOptions || {}).join(' ');
                const displayName = formatProductName(item.product.product_name, optionStr);
                const itemTotal = item.unitPrice * item.quantity;
                
                return (
                  <tr key={`item-${idx}`} className="border-b border-black">
                    <td className="border-r border-black px-1 py-1 text-center">{rowNum}</td>
                    <td className="border-r border-black px-1 py-1 text-center">{item.quantity.toLocaleString()}</td>
                    <td className="border-r border-black px-1 py-1 text-center">EA</td>
                    <td className="border-r border-black px-1 py-1">{displayName}</td>
                    <td className="border-r border-black px-1 py-1 text-right">{item.unitPrice.toLocaleString()}</td>
                    <td className="border-r border-black px-1 py-1 text-right">{itemTotal.toLocaleString()}</td>
                    <td className="px-1 py-1"></td>
                  </tr>
                );
              } else if (manual) {
                const manualItemTotal = manual.qty * manual.price;
                return (
                  <tr key={`manual-${manual.id}`} className="border-b border-black">
                    <td className="border-r border-black px-1 py-1 text-center">{rowNum}</td>
                    <td className="border-r border-black px-1 py-1">
                      <input
                        type="number"
                        value={manual.qty || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setManualRows(prev => prev.map(r => r.id === manual.id ? { ...r, qty: val } : r));
                        }}
                        className="w-full bg-transparent border-0 focus:outline-none text-center text-[11px]"
                      />
                    </td>
                    <td className="border-r border-black px-1 py-1 text-center">EA</td>
                    <td className="border-r border-black px-1 py-1">
                      <input
                        type="text"
                        value={manual.name}
                        onChange={(e) => {
                          setManualRows(prev => prev.map(r => r.id === manual.id ? { ...r, name: e.target.value } : r));
                        }}
                        className="w-full bg-transparent border-0 focus:outline-none text-[11px]"
                        placeholder="품명 입력"
                      />
                    </td>
                    <td className="border-r border-black px-1 py-1">
                      <input
                        type="number"
                        value={manual.price || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setManualRows(prev => prev.map(r => r.id === manual.id ? { ...r, price: val } : r));
                        }}
                        className="w-full bg-transparent border-0 focus:outline-none text-right text-[11px]"
                      />
                    </td>
                    <td className="border-r border-black px-1 py-1 text-right">{manualItemTotal > 0 ? manualItemTotal.toLocaleString() : '-'}</td>
                    <td className="px-1 py-1"></td>
                  </tr>
                );
              } else {
                return (
                  <tr key={`empty-${idx}`} className="border-b border-black">
                    <td className="border-r border-black px-1 py-1 text-center">{rowNum}</td>
                    <td className="border-r border-black px-1 py-1"></td>
                    <td className="border-r border-black px-1 py-1 text-center">{rowNum <= 6 ? 'EA' : ''}</td>
                    <td className="border-r border-black px-1 py-1"></td>
                    <td className="border-r border-black px-1 py-1"></td>
                    <td className="border-r border-black px-1 py-1 text-center">-</td>
                    <td className="px-1 py-1"></td>
                  </tr>
                );
              }
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
            className="w-full bg-transparent border-0 focus:outline-none text-[11px] resize-none"
            rows={2}
            defaultValue="*배송은 택배시 무료입니다."
          />
        </div>
      </div>
      
      {/* 수동 행 추가 버튼 */}
      {items.length + manualRows.length < MAX_ROWS && (
        <button
          type="button"
          onClick={addManualRow}
          className="text-xs text-blue-600 hover:underline"
        >
          ➕ 수동 항목 추가
        </button>
      )}
    </div>
  );
}
