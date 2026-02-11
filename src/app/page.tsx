'use client';

import { useState } from 'react';
import Calculator from '@/components/calculator/Calculator';
import QuoteItemList from '@/components/quote/QuoteItemList';
import ExportButtons from '@/components/quote/ExportButtons';
import useQuote from '@/hooks/useQuote';
import { TEMPLATES, getDefaultFormData, type QuoteFormData } from '@/lib/quote/templates';

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

          {/* 오른쪽: 견적서 */}
          <section className="rounded-xl border border-gray-200 bg-white p-8 min-h-[600px]">
            {/* 헤더: 제목 + 사업자 선택 + 내보내기 버튼 */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                견적서
                {items.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({items.length}건)
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {/* 사업자 선택 */}
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, templateId: tmpl.id }))}
                    className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                      formData.templateId === tmpl.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tmpl.label}
                  </button>
                ))}
                {/* PDF / 엑셀 */}
                <ExportButtons
                  documentType="quote"
                  previewElementId="quote-preview"
                  items={items}
                  totals={totals}
                  formData={formData}
                />
              </div>
            </div>

            <QuoteItemList
              items={items}
              discountRate={discountRate}
              truncation={truncation}
              totals={totals}
              templateId={formData.templateId}
              onRemove={removeItem}
              onUpdateQuantity={updateQuantity}
              onUpdateUnitPrice={updateUnitPrice}
              onDiscountChange={updateDiscountRate}
              onTruncationChange={updateTruncation}
              onClearAll={clearAll}
            />
          </section>
        </div>

        {/* 거래명세서 */}
        <section className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-800">
              거래명세서
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({items.length}건)
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {/* 사업자 선택 */}
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, templateId: tmpl.id }))}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                    formData.templateId === tmpl.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tmpl.label}
                </button>
              ))}
              {/* PDF / 엑셀 */}
              <ExportButtons
                documentType="invoice"
                previewElementId="invoice-preview"
                items={items}
                totals={totals}
                formData={formData}
              />
            </div>
          </div>

          <QuoteItemList
            items={items}
            discountRate={discountRate}
            truncation={truncation}
            totals={totals}
            templateId={formData.templateId}
            onRemove={removeItem}
            onUpdateQuantity={updateQuantity}
            onUpdateUnitPrice={updateUnitPrice}
            onDiscountChange={updateDiscountRate}
            onTruncationChange={updateTruncation}
            onClearAll={clearAll}
            documentType="invoice"
          />
        </section>
      </main>
    </div>
  );
}
