'use client';

import type { QuoteTotals } from '@/hooks/useQuote';

interface QuoteSummaryProps {
  totals: QuoteTotals;
}

export default function QuoteSummary({ totals }: QuoteSummaryProps) {
  const {
    subtotal,
    discountRate,
    discountAmount,
    truncation,
    truncationAmount,
    supplyAmount,
    vat,
    grandTotal,
  } = totals;

  return (
    <div className="rounded-lg bg-gray-50 p-4 space-y-2">
      {/* 소계 */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>소계</span>
        <span>{subtotal.toLocaleString()}원</span>
      </div>

      {/* 할인 */}
      {discountRate > 0 && (
        <div className="flex justify-between text-sm text-red-500">
          <span>할인 ({discountRate}%)</span>
          <span>-{discountAmount.toLocaleString()}원</span>
        </div>
      )}

      {/* 절삭 */}
      {truncation !== 'none' && truncationAmount > 0 && (
        <div className="flex justify-between text-sm text-orange-500">
          <span>절삭 ({truncation === '1' ? '일의자리' : truncation === '10' ? '십의자리' : '백의자리'})</span>
          <span>-{truncationAmount.toLocaleString()}원</span>
        </div>
      )}

      <hr className="border-gray-200" />

      {/* 공급가액 / 부가세 */}
      <div className="flex justify-between text-xs text-gray-400">
        <span>공급가액</span>
        <span>{supplyAmount.toLocaleString()}원</span>
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>부가세 (10%)</span>
        <span>{vat.toLocaleString()}원</span>
      </div>

      <hr className="border-gray-200" />

      {/* 총 합계 */}
      <div className="flex justify-between text-base font-bold text-gray-900">
        <span>총 합계</span>
        <span>{grandTotal.toLocaleString()}원</span>
      </div>
      <p className="text-right text-xs text-gray-400">(부가세 포함)</p>
    </div>
  );
}
