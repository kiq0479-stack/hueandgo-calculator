'use client';

import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import type { QuoteTotals } from '@/hooks/useQuote';
import QuoteItem from './QuoteItem';
import DiscountControl from './DiscountControl';
import QuoteSummary from './QuoteSummary';

interface QuoteItemListProps {
  items: QuoteItemType[];
  discountRate: number;
  totals: QuoteTotals;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateUnitPrice: (id: string, unitPrice: number) => void;
  onDiscountChange: (rate: number) => void;
  onClearAll: () => void;
}

export default function QuoteItemList({
  items,
  discountRate,
  totals,
  onRemove,
  onUpdateQuantity,
  onUpdateUnitPrice,
  onDiscountChange,
  onClearAll,
}: QuoteItemListProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-gray-400">
          계산기에서 제품을 선택하고
          <br />
          &quot;견적에 추가&quot; 버튼을 눌러주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 항목 목록 */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <QuoteItem
            key={item.id}
            item={item}
            index={index}
            onRemove={onRemove}
            onUpdateQuantity={onUpdateQuantity}
            onUpdateUnitPrice={onUpdateUnitPrice}
          />
        ))}
      </div>

      {/* 할인율 */}
      <DiscountControl
        discountRate={discountRate}
        onDiscountChange={onDiscountChange}
        subtotal={totals.subtotal}
      />

      {/* 합계 */}
      <QuoteSummary totals={totals} />

      {/* 전체 삭제 버튼 */}
      <button
        type="button"
        onClick={onClearAll}
        className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
      >
        전체 삭제
      </button>
    </div>
  );
}
