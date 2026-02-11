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
  
  return result + '원정';
}

// 최대 9행 고정 테이블
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
  // 빈 행 포함해서 9행 만들기
  const rows = [...items];
  while (rows.length < MAX_ROWS) {
    rows.push(null as unknown as QuoteItemType);
  }

  return (
    <div className="space-y-4">
      {/* 합계금액 헤더 */}
      <div className="flex items-center justify-between border-b-2 border-gray-800 pb-2">
        <div className="text-sm text-gray-600">
          합계금액<br />
          <span className="text-xs text-gray-400">(공급가액 +세액)</span>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-gray-900">
            {numberToKorean(Math.round(totals.grandTotal))}
          </span>
          <span className="ml-2 text-lg text-gray-600">
            (₩{Math.round(totals.grandTotal).toLocaleString()})
          </span>
        </div>
      </div>

      {/* 견적 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-center w-10">No.</th>
              <th className="border border-gray-300 px-2 py-2 text-center min-w-[180px]">품명</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-14">규격</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-20">수량</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-24">단가</th>
              <th className="border border-gray-300 px-2 py-2 text-center w-28">견적가<br/><span className="text-xs font-normal">(부가세 포함)</span></th>
              <th className="border border-gray-300 px-2 py-2 text-center w-16">비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => {
              if (!item) {
                // 빈 행
                return (
                  <tr key={`empty-${index}`} className="h-10">
                    <td className="border border-gray-300 px-2 py-1 text-center text-gray-400">{index + 1}</td>
                    <td className="border border-gray-300 px-2 py-1"></td>
                    <td className="border border-gray-300 px-2 py-1"></td>
                    <td className="border border-gray-300 px-2 py-1"></td>
                    <td className="border border-gray-300 px-2 py-1"></td>
                    <td className="border border-gray-300 px-2 py-1 text-center text-gray-300">-</td>
                    <td className="border border-gray-300 px-2 py-1"></td>
                  </tr>
                );
              }

              const itemTotal = calcItemTotal(item);
              const itemTotalWithVat = Math.round(itemTotal * 1.1); // 부가세 포함

              return (
                <tr key={item.id} className="hover:bg-blue-50">
                  <td className="border border-gray-300 px-2 py-1 text-center">{index + 1}</td>
                  <td className="border border-gray-300 px-2 py-1">
                    <div className="truncate" title={item.product.product_name}>
                      {item.product.product_name}
                    </div>
                    {/* 옵션 표시 */}
                    {Object.keys(item.selectedOptions).length > 0 && (
                      <div className="text-xs text-gray-500 truncate">
                        {Object.entries(item.selectedOptions)
                          .map(([k, v]) => v)
                          .join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-center">EA</td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, Math.max(1, Number(e.target.value)))}
                      min={1}
                      className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateUnitPrice(item.id, Math.max(0, Number(e.target.value)))}
                      min={0}
                      className="w-full text-right bg-transparent border-0 focus:ring-1 focus:ring-blue-500 rounded [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right font-medium">
                    {itemTotalWithVat.toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* 합계 행 */}
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td colSpan={5} className="border border-gray-300 px-2 py-2 text-center">
                합 계
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right">
                {Math.round(totals.grandTotal).toLocaleString()}
              </td>
              <td className="border border-gray-300 px-2 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* MEMO 섹션 */}
      <div className="border border-gray-300 rounded p-3 bg-gray-50">
        <p className="text-xs text-gray-500 font-medium mb-1">[MEMO]</p>
        <p className="text-xs text-gray-600">*배송은 택배시 무료입니다.</p>
      </div>

      {/* 할인율 + 절삭 (접을 수 있게) */}
      <details className="text-sm">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          할인/절삭 설정 ▾
        </summary>
        <div className="mt-2">
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

      {/* 전체 삭제 버튼 */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          전체 삭제
        </button>
      )}
    </div>
  );
}
