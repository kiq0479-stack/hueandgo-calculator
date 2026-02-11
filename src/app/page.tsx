'use client';

import { useState } from 'react';
import Calculator from '@/components/calculator/Calculator';
import QuoteItemList from '@/components/quote/QuoteItemList';
import QuoteForm from '@/components/quote/QuoteForm';
import QuotePreview from '@/components/quote/QuotePreview';
import InvoiceForm from '@/components/invoice/InvoiceForm';
import InvoicePreview from '@/components/invoice/InvoicePreview';
import ExportButtons from '@/components/quote/ExportButtons';
import useQuote from '@/hooks/useQuote';
import { getDefaultFormData, type QuoteFormData } from '@/lib/quote/templates';

export default function Home() {
  const {
    items,
    discountRate,
    truncation,
    totals,
    addItem,
    removeItem,
    updateQuantity,
    updateUnitPrice,
    updateDiscountRate,
    updateTruncation,
    clearAll,
  } = useQuote();

  // 견적서 폼 상태
  const [formData, setFormData] = useState<QuoteFormData>(getDefaultFormData());
  // 견적서 미리보기 표시 여부
  const [showPreview, setShowPreview] = useState(false);
  // 거래명세서 폼 상태
  const [invoiceFormData, setInvoiceFormData] = useState<QuoteFormData>(getDefaultFormData());
  // 거래명세서 미리보기 표시 여부
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">휴앤고 단가계산기</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* 상단: 계산기 + 견적 항목 (2컬럼) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 왼쪽: 계산기 */}
          <section className="rounded-xl border border-gray-200 bg-white p-8 min-h-[600px]">
            <h2 className="mb-6 text-lg font-semibold text-gray-800">단가 계산</h2>
            <Calculator onAddToQuote={addItem} />
          </section>

          {/* 오른쪽: 견적 항목 */}
          <section className="rounded-xl border border-gray-200 bg-white p-8 min-h-[600px]">
            <h2 className="mb-6 text-lg font-semibold text-gray-800">
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
              truncation={truncation}
              totals={totals}
              onRemove={removeItem}
              onUpdateQuantity={updateQuantity}
              onUpdateUnitPrice={updateUnitPrice}
              onDiscountChange={updateDiscountRate}
              onTruncationChange={updateTruncation}
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
                <div className="flex items-center gap-2">
                  <ExportButtons
                    documentType="quote"
                    previewElementId="quote-preview"
                    items={items}
                    totals={totals}
                    formData={formData}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {showPreview ? '미리보기 닫기' : '견적서 미리보기'}
                  </button>
                </div>
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

            {/* 거래명세서 정보 입력 */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  거래명세서 정보
                </h2>
                <div className="flex items-center gap-2">
                  <ExportButtons
                    documentType="invoice"
                    previewElementId="invoice-preview"
                    items={items}
                    totals={totals}
                    formData={invoiceFormData}
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvoicePreview(!showInvoicePreview)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                  >
                    {showInvoicePreview ? '미리보기 닫기' : '거래명세서 미리보기'}
                  </button>
                </div>
              </div>
              <InvoiceForm formData={invoiceFormData} onChange={setInvoiceFormData} />
            </section>

            {/* 거래명세서 미리보기 */}
            {showInvoicePreview && (
              <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-base font-semibold text-gray-800">
                  거래명세서 미리보기
                </h2>
                <div className="overflow-x-auto">
                  <InvoicePreview
                    items={items}
                    totals={totals}
                    formData={invoiceFormData}
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
