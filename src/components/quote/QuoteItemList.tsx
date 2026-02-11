'use client';

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
  const rows = [...items];
  while (rows.length < MAX_ROWS) {
    rows.push(null as unknown as QuoteItemType);
  }

  const grandTotal = Math.round(totals.grandTotal);

  return (
    <div className="space-y-3">
      {/* 엑셀 견적서 양식 그대로 */}
      <div className="border border-gray-400 bg-white text-[11px] leading-tight">
        
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
        <div className="flex mx-2">
          {/* 왼쪽: 날짜, 수신, 참조 (밑줄이 사업자정보까지 연장) */}
          <div className="flex-1">
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">날 짜 :</div>
              <div className="flex-1 border-b border-gray-400"></div>
            </div>
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">수 신 :</div>
              <div className="flex-1 border-b border-gray-400"></div>
            </div>
            <div className="flex h-6">
              <div className="w-12 flex items-center shrink-0">참 조 :</div>
              <div className="flex-1 border-b border-gray-400"></div>
            </div>
            <div className="h-6"></div>
          </div>
          
          {/* 오른쪽: 사업자정보 테이블 */}
          <div className="w-[55%] shrink-0 border border-gray-400 text-[10px]">
            <div className="flex h-6 border-b border-gray-300">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-gray-300 shrink-0">사업자소재지</div>
              <div className="flex-1 px-1 flex items-center text-[9px]">울산광역시 울주군 웅촌면 웅촌로 575-7, 에이동</div>
            </div>
            <div className="flex h-8 border-b border-gray-300">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-gray-300 shrink-0">상호</div>
              <div className="flex-1 px-1 flex items-center justify-between">
                <span>주식회사 브랜디즈</span>
                <div className="w-7 h-7 rounded-full border-2 border-red-400 flex items-center justify-center text-red-500 font-bold shrink-0">
                  인
                </div>
              </div>
            </div>
            <div className="flex h-6 border-b border-gray-300">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-gray-300 shrink-0">대표자성명</div>
              <div className="flex-1 px-1 flex items-center">감민주</div>
            </div>
            <div className="flex h-6">
              <div className="w-[70px] px-1 flex items-center bg-gray-50 border-r border-gray-300 shrink-0">전화번호</div>
              <div className="flex-1 px-1 flex items-center">010-2116-2349</div>
            </div>
          </div>
        </div>
        
        {/* Row: 아래와 같이 견적합니다 */}
        <div className="px-2 py-2">아래와 같이 견적합니다</div>
        
        {/* Row: 빈 줄 */}
        <div className="h-1"></div>
        
        {/* 합계금액 테이블 */}
        <div className="mx-2 border border-gray-400">
          <div className="flex">
            <div className="w-28 border-r border-gray-400">
              <div className="px-2 py-1 text-center border-b border-gray-300">합계금액</div>
              <div className="px-2 py-1 text-center text-[10px] text-gray-600">(공급가액 +세액)</div>
            </div>
            <div className="flex-1 flex items-center justify-center py-2">
              <span className="text-sm font-medium tracking-wider">
                {numberToKorean(grandTotal)} 원정
              </span>
            </div>
            <div className="w-20 flex items-center justify-center border-l border-gray-400 py-2">
              <span className="text-sm">(₩{grandTotal.toLocaleString()})</span>
            </div>
          </div>
        </div>
        
        {/* 품목 테이블 */}
        <div className="mx-2 mt-1 border-t border-l border-r border-gray-400">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-r border-gray-400 px-1 py-1 text-center w-8 bg-gray-50">No.</th>
                <th className="border-b border-r border-gray-400 px-1 py-1 text-center bg-gray-50">품명</th>
                <th className="border-b border-r border-gray-400 px-1 py-1 text-center w-10 bg-gray-50">규격</th>
                <th className="border-b border-r border-gray-400 px-1 py-1 text-center w-12 bg-gray-50">수량</th>
                <th className="border-b border-r border-gray-400 px-1 py-1 text-center w-14 bg-gray-50">단가</th>
                <th className="border-b border-r border-gray-400 px-1 py-1 text-center w-24 bg-gray-50">견적가(부가세 포함)</th>
                <th className="border-b border-gray-400 px-1 py-1 text-center w-10 bg-gray-50">비고</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const rowNum = index + 1;
                const showEA = rowNum <= 6;
                
                if (!item) {
                  return (
                    <tr key={`empty-${index}`}>
                      <td className="border-b border-r border-gray-300 px-1 py-1.5 text-center">{rowNum}</td>
                      <td className="border-b border-r border-gray-300 px-1 py-1.5"></td>
                      <td className="border-b border-r border-gray-300 px-1 py-1.5 text-center">{showEA ? 'EA' : ''}</td>
                      <td className="border-b border-r border-gray-300 px-1 py-1.5"></td>
                      <td className="border-b border-r border-gray-300 px-1 py-1.5"></td>
                      <td className="border-b border-r border-gray-300 px-1 py-1.5 text-center">-</td>
                      <td className="border-b border-gray-300 px-1 py-1.5"></td>
                    </tr>
                  );
                }

                const itemTotal = calcItemTotal(item);
                // 카페24 가격이 이미 부가세 포함이므로 10% 추가 안 함
                const itemTotalWithVat = Math.round(itemTotal);

                return (
                  <tr key={item.id} className="hover:bg-blue-50">
                    <td className="border-b border-r border-gray-300 px-1 py-0.5 text-center">{rowNum}</td>
                    <td className="border-b border-r border-gray-300 px-1 py-0.5">
                      <div className="truncate max-w-[120px]" title={item.product.product_name}>
                        {item.product.product_name}
                      </div>
                    </td>
                    <td className="border-b border-r border-gray-300 px-1 py-0.5 text-center">EA</td>
                    <td className="border-b border-r border-gray-300 px-0.5 py-0.5 text-center">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => onUpdateQuantity(item.id, Math.max(1, Number(e.target.value)))}
                        min={1}
                        className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="border-b border-r border-gray-300 px-0.5 py-0.5 text-right">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => onUpdateUnitPrice(item.id, Math.max(0, Number(e.target.value)))}
                        min={0}
                        className="w-full text-right bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-[11px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="border-b border-r border-gray-300 px-1 py-0.5 text-right">
                      {itemTotalWithVat.toLocaleString()}
                    </td>
                    <td className="border-b border-gray-300 px-1 py-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="border-b border-r border-gray-400 px-1 py-1.5 text-center font-medium">
                  합 계
                </td>
                <td className="border-b border-r border-gray-400 px-1 py-1.5 text-right font-medium">
                  {grandTotal > 0 ? grandTotal.toLocaleString() : '-'}
                </td>
                <td className="border-b border-gray-400 px-1 py-1.5"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* [MEMO] */}
        <div className="mx-2 mt-1 border border-gray-400 px-2 py-1 min-h-[50px]">
          <div className="font-medium">[MEMO]</div>
          <div className="text-gray-600 mt-1">*배송은 택배시 무료입니다.</div>
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
