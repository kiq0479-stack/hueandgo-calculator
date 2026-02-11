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
  
  return result + ' 원정';
}

// 오늘 날짜 (YYYY.MM.DD)
function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
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

  const grandTotalDisplay = Math.round(totals.grandTotal);

  return (
    <div className="space-y-3">
      {/* 전체 견적서 양식 */}
      <div className="border border-gray-400 bg-white text-xs">
        {/* 상단 No. */}
        <div className="border-b border-gray-300 px-2 py-1 text-left text-gray-500">
          No.
        </div>

        {/* 제목: 견 적 서 */}
        <div className="border-b border-gray-300 py-3 text-center">
          <h2 className="text-xl font-bold tracking-[0.5em]">견 적 서</h2>
        </div>

        {/* 헤더 정보: 왼쪽(날짜/수신/참조) | 오른쪽(사업자정보) */}
        <div className="flex border-b border-gray-300">
          {/* 왼쪽 */}
          <div className="flex-1 border-r border-gray-300">
            <div className="flex border-b border-gray-200">
              <div className="w-16 border-r border-gray-200 px-2 py-1 bg-gray-50">날 짜 :</div>
              <div className="flex-1 px-2 py-1">{getTodayDate()}</div>
            </div>
            <div className="flex border-b border-gray-200">
              <div className="w-16 border-r border-gray-200 px-2 py-1 bg-gray-50">수 신 :</div>
              <div className="flex-1 px-2 py-1"></div>
            </div>
            <div className="flex">
              <div className="w-16 border-r border-gray-200 px-2 py-1 bg-gray-50">참 조 :</div>
              <div className="flex-1 px-2 py-1"></div>
            </div>
          </div>
          
          {/* 오른쪽: 사업자 정보 */}
          <div className="w-[280px]">
            <div className="flex border-b border-gray-200">
              <div className="w-20 border-r border-gray-200 px-2 py-1 bg-gray-50">사업자소재지</div>
              <div className="flex-1 px-2 py-1 text-[10px]">울산광역시 울주군 웅촌면 웅촌로 575-7, 에이동</div>
            </div>
            <div className="flex border-b border-gray-200">
              <div className="w-20 border-r border-gray-200 px-2 py-1 bg-gray-50">상호</div>
              <div className="flex-1 px-2 py-1 flex items-center justify-between">
                <span>주식회사 브랜디즈</span>
                <div className="w-10 h-10 rounded-full border border-red-300 flex items-center justify-center text-red-400 text-[8px]">
                  (인)
                </div>
              </div>
            </div>
            <div className="flex border-b border-gray-200">
              <div className="w-20 border-r border-gray-200 px-2 py-1 bg-gray-50">대표자성명</div>
              <div className="flex-1 px-2 py-1">감민주</div>
            </div>
            <div className="flex">
              <div className="w-20 border-r border-gray-200 px-2 py-1 bg-gray-50">전화번호</div>
              <div className="flex-1 px-2 py-1">010-2116-2349</div>
            </div>
          </div>
        </div>

        {/* 아래와 같이 견적합니다 */}
        <div className="border-b border-gray-300 px-2 py-2 text-gray-700">
          아래와 같이 견적합니다
        </div>

        {/* 합계금액 */}
        <div className="flex border-b border-gray-300">
          <div className="w-28 border-r border-gray-300 px-2 py-2 bg-gray-50 text-center">
            합계금액<br />
            <span className="text-[10px] text-gray-500">(공급가액 +세액)</span>
          </div>
          <div className="flex-1 px-4 py-2 flex items-center justify-center">
            <span className="text-base font-bold">
              {grandTotalDisplay > 0 ? numberToKorean(grandTotalDisplay) : '영 원정'}
            </span>
          </div>
          <div className="w-28 px-4 py-2 flex items-center justify-center">
            <span className="text-base">
              (₩{grandTotalDisplay.toLocaleString()})
            </span>
          </div>
        </div>

        {/* 품목 테이블 */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border-b border-r border-gray-300 px-1 py-1.5 text-center w-8">No.</th>
              <th className="border-b border-r border-gray-300 px-1 py-1.5 text-center">품명</th>
              <th className="border-b border-r border-gray-300 px-1 py-1.5 text-center w-10">규격</th>
              <th className="border-b border-r border-gray-300 px-1 py-1.5 text-center w-14">수량</th>
              <th className="border-b border-r border-gray-300 px-1 py-1.5 text-center w-16">단가</th>
              <th className="border-b border-r border-gray-300 px-1 py-1.5 text-center w-24">견적가<span className="text-[9px] font-normal">(부가세 포함)</span></th>
              <th className="border-b border-gray-300 px-1 py-1.5 text-center w-10">비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item, index) => {
              if (!item) {
                // 빈 행
                return (
                  <tr key={`empty-${index}`} className="h-8">
                    <td className="border-b border-r border-gray-200 px-1 py-1 text-center text-gray-400">{index + 1}</td>
                    <td className="border-b border-r border-gray-200 px-1 py-1"></td>
                    <td className="border-b border-r border-gray-200 px-1 py-1 text-center text-gray-400">{index < 6 ? 'EA' : ''}</td>
                    <td className="border-b border-r border-gray-200 px-1 py-1"></td>
                    <td className="border-b border-r border-gray-200 px-1 py-1"></td>
                    <td className="border-b border-r border-gray-200 px-1 py-1 text-center text-gray-300">-</td>
                    <td className="border-b border-gray-200 px-1 py-1"></td>
                  </tr>
                );
              }

              const itemTotal = calcItemTotal(item);
              const itemTotalWithVat = Math.round(itemTotal * 1.1);

              return (
                <tr key={item.id} className="h-8 hover:bg-blue-50">
                  <td className="border-b border-r border-gray-200 px-1 py-1 text-center">{index + 1}</td>
                  <td className="border-b border-r border-gray-200 px-1 py-1">
                    <div className="truncate max-w-[150px]" title={item.product.product_name}>
                      {item.product.product_name}
                    </div>
                  </td>
                  <td className="border-b border-r border-gray-200 px-1 py-1 text-center">EA</td>
                  <td className="border-b border-r border-gray-200 px-0.5 py-0.5 text-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, Math.max(1, Number(e.target.value)))}
                      min={1}
                      className="w-full text-center bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="border-b border-r border-gray-200 px-0.5 py-0.5 text-right">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateUnitPrice(item.id, Math.max(0, Number(e.target.value)))}
                      min={0}
                      className="w-full text-right bg-transparent border-0 focus:ring-1 focus:ring-blue-400 rounded text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </td>
                  <td className="border-b border-r border-gray-200 px-1 py-1 text-right">
                    {itemTotalWithVat.toLocaleString()}
                  </td>
                  <td className="border-b border-gray-200 px-1 py-1 text-center">
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="text-red-400 hover:text-red-600"
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
            <tr className="bg-gray-50 h-8">
              <td colSpan={5} className="border-b border-r border-gray-300 px-1 py-1.5 text-center font-medium">
                합 계
              </td>
              <td className="border-b border-r border-gray-300 px-1 py-1.5 text-right font-medium">
                {grandTotalDisplay > 0 ? grandTotalDisplay.toLocaleString() : '-'}
              </td>
              <td className="border-b border-gray-300 px-1 py-1.5"></td>
            </tr>
          </tfoot>
        </table>

        {/* MEMO */}
        <div className="px-2 py-2 min-h-[40px]">
          <span className="font-medium">[MEMO]</span>
          <div className="text-gray-600 mt-1">*배송은 택배시 무료입니다.</div>
        </div>
      </div>

      {/* 할인/절삭 설정 (접기) */}
      <details className="text-xs">
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
          className="w-full rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
        >
          전체 삭제
        </button>
      )}
    </div>
  );
}
