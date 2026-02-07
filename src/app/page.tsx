'use client';

import { useState } from 'react';
import Calculator from '@/components/calculator/Calculator';
import QuoteItemList from '@/components/quote/QuoteItemList';
import QuoteForm from '@/components/quote/QuoteForm';
import QuotePreview from '@/components/quote/QuotePreview';
import useQuote from '@/hooks/useQuote';
import { getDefaultFormData, type QuoteFormData } from '@/lib/quote/templates';

export default function Home() {
  const {
    items,
    discountRate,
    totals,
    addItem,
    removeItem,
    updateQuantity,
    updateUnitPrice,
    updateDiscountRate,
    clearAll,
  } = useQuote();

  // 견적서 폼 상태
  const [formData, setFormData] = useState<QuoteFormData>(getDefaultFormData());
  // 견적서 미리보기 표시 여부
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">휴앤고 단가계산기</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* 상단: 계산기 + 견적 항목 (2컬럼) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 왼쪽: 계산기 */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">단가 계산</h2>
            <Calculator onAddToQuote={addItem} />
          </section>

          {/* 오른쪽: 견적 항목 */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">
              견적 항목
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({items.length}건)
                </span>
              )}
            </h2>

            <QuoteItemList
              items={items}
              discountRate={discountRate}
              totals={totals}
              onRemove={removeItem}
              onUpdateQuantity={updateQuantity}
              onUpdateUnitPrice={updateUnitPrice}
              onDiscountChange={updateDiscountRate}
              onClearAll={clearAll}
            />
          </section>
        </div>

        {/* 하단: 견적서 정보 + 미리보기 */}
        {items.length > 0 && (
          <>
            {/* 견적서 정보 입력 */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  견적서 정보
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {showPreview ? '미리보기 닫기' : '견적서 미리보기'}
                </button>
              </div>
              <QuoteForm formData={formData} onChange={setFormData} />
            </section>

            {/* 견적서 미리보기 */}
            {showPreview && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-base font-semibold text-gray-800">
                  견적서 미리보기
                </h2>
                <div className="overflow-x-auto">
                  <QuotePreview
                    items={items}
                    totals={totals}
                    formData={formData}
                  />
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
