'use client';

import { useState } from 'react';
import Calculator, { type QuoteItem } from '@/components/calculator/Calculator';

export default function Home() {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  function handleAddToQuote(item: QuoteItem) {
    setQuoteItems((prev) => [...prev, item]);
  }

  function handleRemoveItem(id: string) {
    setQuoteItems((prev) => prev.filter((i) => i.id !== id));
  }

  const grandTotal = quoteItems.reduce((sum, item) => {
    const addonTotal = item.addons.reduce((s, a) => s + a.unitPrice * a.quantity, 0);
    return sum + item.unitPrice * item.quantity + addonTotal;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">휴앤고 단가계산기</h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* 왼쪽: 계산기 */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">단가 계산</h2>
            <Calculator onAddToQuote={handleAddToQuote} />
          </section>

          {/* 오른쪽: 견적 항목 */}
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-gray-800">
              견적 항목
              {quoteItems.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({quoteItems.length}건)
                </span>
              )}
            </h2>

            {quoteItems.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                계산기에서 제품을 선택하고 &quot;견적에 추가&quot; 버튼을 눌러주세요.
              </p>
            ) : (
              <div className="space-y-3">
                {quoteItems.map((item) => {
                  const addonTotal = item.addons.reduce(
                    (s, a) => s + a.unitPrice * a.quantity,
                    0
                  );
                  const itemTotal = item.unitPrice * item.quantity + addonTotal;

                  return (
                    <div
                      key={item.id}
                      className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.product.product_name}
                          </p>
                          {Object.keys(item.selectedOptions).length > 0 && (
                            <p className="mt-1 text-xs text-gray-500">
                              {Object.entries(item.selectedOptions)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' / ')}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-gray-500">
                            {item.unitPrice.toLocaleString()}원 x {item.quantity.toLocaleString()}개
                          </p>
                          {item.addons.length > 0 && (
                            <p className="mt-1 text-xs text-gray-400">
                              + 추가상품 {item.addons.length}건 ({addonTotal.toLocaleString()}원)
                            </p>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-gray-900">
                            {itemTotal.toLocaleString()}원
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 총합계 */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>총 합계</span>
                    <span>{grandTotal.toLocaleString()}원</span>
                  </div>
                  <p className="mt-1 text-right text-xs text-gray-400">
                    (부가세 포함)
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
