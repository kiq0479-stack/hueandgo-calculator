'use client';

import { useState, useEffect } from 'react';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals, TruncationType } from '@/hooks/useQuote';
import { calcItemTotal } from '@/hooks/useQuote';
import DiscountControl from './DiscountControl';

interface QuoteItemListProps {
  items: QuoteItemType[];
  discountRate: number;
  truncation: TruncationType;
  totals: QuoteTotals;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateUnitPrice: (id: string, unitPrice: number) => void;
  onDiscountChange: (rate: number) => void;
  onTruncationChange: (type: TruncationType) => void;
  onClearAll: () => void;
}

// 오늘 날짜를 YYYY년 M월 D일 형식으로
function getTodayFormatted(): string {
  const today = new Date();
  return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
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
  onRemove,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onDiscountChange,
  onTruncationChange,
  onClearAll,
}: QuoteItemListProps) {
  // 날짜/수신/참조 상태
  const [quoteDate, setQuoteDate] = useState('');
  const [recipient, setRecipient] = useState('');
  const [reference, setReference] = useState('');

  // 컴포넌트 마운트 시 오늘 날짜로 초기화
  useEffect(() => {
    setQuoteDate(getTodayFormatted());
  }, []);

  const rows = [...items];
  while (rows.length < MAX_ROWS) {
    rows.push(null as unknown as QuoteItemType);
  }

  const grandTotal = Math.round(totals.grandTotal);

  return (
    <div className="space-y-3">
      {/* 엑셀 견적서 양식 그대로 */}
      <div className="border border-black bg-white text-[11px] leading-tight">
        
        {/* Row: No. */}
        <div className="px-2 py-1 text-gray-600">No.</div>
        
        {/* Row: 빈 줄 */}
        <div className="h-2"></div>
        
        {/* Row: 견 적 서 */}
        <div className="py-2 text-center">
          <span className="text-lg font-bold tracking-[1em]">견 적 서</span>
        </div>
        
        {/* Row: 빈 줄 */}
        <div className="h-2"></div>
        
        {/* 날짜/수신/참조 + 사업자정보 테이블 */}
        <div className="flex mx-2 gap-4">
          {/* 왼쪽: 날짜, 수신, 참조 (입력 가능) */}
          <div className="w-[38%]">
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">날 짜 :</div>
              <div className="flex-1 border-b border-black">
                <input
                  type="text"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="w-full h-full px-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px]"
                  placeholder="2026년 2월 11일"
                />
              </div>
            </div>
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">수 신 :</div>
              <div className="flex-1 border-b border-black">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full h-full px-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px]"
                  placeholder="수신자 입력"
                />
              </div>
            </div>
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">참 조 :</div>
              <div className="flex-1 border-b border-black">
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full h-full px-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[11px]"
                  placeholder="참조 입력"
                />
              </div>
            </div>
            <div className="h-6"></div>
          </div>
          
          {/* 오른쪽: 사업자정보 테이블 (왼쪽과 gap으로 떨어짐) */}
          <div className="w-[55%] shrink-0 border border-black text-[10px]">
            <div className="flex h-6 border-b border-black">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-black shrink-0">사업자소재지</div>
              <div className="flex-1 px-1 flex items-center text-[9px]">울산광역시 울주군 웅촌면 웅촌로 575-7, 에이동</div>
            </div>
            <div className="flex h-8 border-b border-black">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-black shrink-0">상호</div>
              <div className="flex-1 px-1 flex items-center justify-between">
                <span>주식회사 브랜디즈</span>
                <div className="w-7 h-7 rounded-full border-2 border-red-500 flex items-center justify-center text-red-500 font-bold shrink-0">
                  인
                </div>
              </div>
            </div>
            <div className="flex h-6 border-b border-black">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-black shrink-0">대표자성명</div>
              <div className="flex-1 px-1 flex items-center">감민주</div>
            </div>
            <div className="flex h-6">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-black shrink-0">전화번호</div>
              <div className="flex-1 px-1 flex items-center">010-2116-2349</div>
            </div>
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
              <div className="px-2 py-1 text-center text-[10px]">(공급가액 +세액)</div>
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
                <th className="border-b border-r border-black px-1 py-1 text-center w-8 bg-gray-50">No.</th>
                <th className="border-b border-r border-black px-1 py-1 text-center bg-gray-50">품명</th>
                <th className="border-b border-r border-black px-1 py-1 text-center w-10 bg-gray-50">규격</th>
                <th className="border-b border-r border-black px-1 py-1 text-center w-12 bg-gray-50">수량</th>
                <th className="border-b border-r border-black px-1 py-1 text-center w-16 bg-gray-50">단가</th>
                <th className="border-b border-r border-black px-1 py-1 text-center w-20 bg-gray-50">견적가</th>
                <th className="border-b border-black px-1 py-1 text-center w-10 bg-gray-50">비고</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const rowNum = index + 1;
                const showEA = rowNum <= 6;
                
                if (!item) {
                  return (
                    <tr key={`empty-${index}`}>
                      <td className="border-b border-r border-black px-1 py-1.5 text-center">{rowNum}</td>
                      <td className="border-b border-r border-black px-1 py-1.5"></td>
                      <td className="border-b border-r border-black px-1 py-1.5 text-center">{showEA ? 'EA' : ''}</td>
                      <td className="border-b border-r border-black px-1 py-1.5"></td>
                      <td className="border-b border-r border-black px-1 py-1.5"></td>
                      <td className="border-b border-r border-black px-1 py-1.5 text-center">-</td>
                      <td className="border-b border-black px-1 py-1.5"></td>
                    </tr>
                  );
                }

                const itemTotal = calcItemTotal(item);
                const itemTotalWithVat = Math.round(itemTotal);
                const displayName = formatProductName(item.product.product_name, item.selectedOption);

                return (
                  <tr key={item.id} className="group hover:bg-blue-50">
                    <td className="border-b border-r border-black px-1 py-0.5 text-center">{rowNum}</td>
                    <td className="border-b border-r border-black px-1 py-0.5">
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[100px]" title={displayName}>
                          {displayName}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemove(item.id)}
                          className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                    <td className="border-b border-r border-black px-1 py-0.5 text-center">EA</td>
                    <td className="border-b border-r border-black px-0.5 py-0.5 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.id, Math.max(1, Number(e.target.value)))}
                        min={1}
                        className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="border-b border-r border-black px-0.5 py-0.5 text-center">
                      <input
                        type="text"
                        value={item.unitPrice.toLocaleString()}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/,/g, ''));
                          if (!isNaN(num)) onUpdateUnitPrice(item.id, Math.max(0, num));
                        }}
                        className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px]"
                      />
                    </td>
                    <td className="border-b border-r border-black px-1 py-0.5 text-center">
                      {itemTotalWithVat.toLocaleString()}
                    </td>
                    <td className="border-b border-black px-1 py-0.5"></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="border-b border-r border-black px-1 py-1.5 text-center font-medium">
                  합 계
                </td>
                <td className="border-b border-r border-black px-1 py-1.5 text-center font-medium">
                  {grandTotal > 0 ? grandTotal.toLocaleString() : '-'}
                </td>
                <td className="border-b border-black px-1 py-1.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* [MEMO] */}
        <div className="mx-2 mt-1 border border-black px-2 py-1 min-h-[50px]">
          <div className="font-medium">[MEMO]</div>
          <div className="mt-1">*배송은 택배시 무료입니다.</div>
        </div>
        
        <div className="h-2"></div>
      </div>

      {/* 할인/절삭 설정 */}
      <details className="text-[11px]">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          ▸ 할인/절삭 설정
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
      {items.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="w-full rounded border border-red-200 px-3 py-1 text-[11px] text-red-500 hover:bg-red-50"
        >
          전체 삭제
        </button>
      )}
    </div>
  );
}
