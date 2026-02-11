'use client';

import { useState } from 'react';
import Calculator from '@/components/calculator/Calculator';
import QuoteItemList from '@/components/quote/QuoteItemList';
import ExportButtons from '@/components/quote/ExportButtons';
import useQuote from '@/hooks/useQuote';
import { TEMPLATES, getDefaultFormData, type QuoteFormData } from '@/lib/quote/templates';

// 수동 입력 행 타입
type ManualRow = { id: string; name: string; qty: number; price: number };

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
  
  // 수동 입력 행 상태 (견적서/거래명세서 공유)
  const [manualRows, setManualRows] = useState<ManualRow[]>([]);
  
  // 공유 폼 상태 (견적서/거래명세서 동기화)
  const [quoteDate, setQuoteDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [recipient, setRecipient] = useState('');
  const [reference, setReference] = useState('');
  const [memoText, setMemoText] = useState('*배송은 택배시 무료입니다.');
  
  // 브랜디즈 사업자정보 공유 상태
  const [bizAddress, setBizAddress] = useState('울산광역시 울주군 웅촌면 웅촌로 575-7, 에이동');
  const [bizName, setBizName] = useState('주식회사 브랜디즈');
  const [bizCeo, setBizCeo] = useState('감민주');
  const [bizPhone, setBizPhone] = useState('010-2116-2349');
  
  // 호탱감탱 사업자정보 공유 상태
  const [hotangBizRegNo, setHotangBizRegNo] = useState('812-09-01666');
  const [hotangBizName, setHotangBizName] = useState('호탱감탱');
  const [hotangBizCeo, setHotangBizCeo] = useState('강태호');
  const [hotangBizAddress, setHotangBizAddress] = useState('울산광역시 동구 문현로 37, 3층(방어동)');
  const [hotangBizType, setHotangBizType] = useState('제조업');
  const [hotangBizItem, setHotangBizItem] = useState('인형 및 장난감 제조업');
  const [hotangBizPhone, setHotangBizPhone] = useState('010-6255-7392');
  
  // 수동 행 추가
  const addManualRow = () => {
    setManualRows(prev => [...prev, { id: `manual-${Date.now()}`, name: '', qty: 1, price: 0 }]);
  };
  
  // 수동 행 업데이트
  const updateManualRow = (id: string, field: keyof ManualRow, value: string | number) => {
    setManualRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };
  
  // 수동 행 삭제
  const removeManualRow = (id: string) => {
    setManualRows(prev => prev.filter(row => row.id !== id));
  };
  
  // 전체 삭제 (API 항목 + 수동 항목)
  const clearAllWithManual = () => {
    clearAll();
    setManualRows([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">휴앤고 단가계산기</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* 2컬럼: 왼쪽 단가계산 | 오른쪽 견적서+거래명세서 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 왼쪽: 단가 계산 (전체 높이) */}
          <section className="rounded-xl border border-gray-200 bg-white p-8">
            <h2 className="mb-6 text-lg font-semibold text-gray-800">단가 계산</h2>
            <Calculator onAddToQuote={addItem} />
          </section>

          {/* 오른쪽: 견적서 + 거래명세서 (세로 2개) */}
          <div className="flex flex-col gap-8">
            {/* 견적서 */}
            <section className="rounded-xl border border-gray-200 bg-white p-8">
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
                  <ExportButtons
                    documentType="quote"
                    previewElementId="quote-preview"
                    items={items}
                    totals={totals}
                    formData={formData}
                    manualRows={manualRows}
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
                onClearAll={clearAllWithManual}
                manualRows={manualRows}
                onAddManualRow={addManualRow}
                onUpdateManualRow={updateManualRow}
                onRemoveManualRow={removeManualRow}
                quoteDate={quoteDate}
                onQuoteDateChange={setQuoteDate}
                recipient={recipient}
                onRecipientChange={setRecipient}
                reference={reference}
                onReferenceChange={setReference}
                memoText={memoText}
                onMemoTextChange={setMemoText}
                bizAddress={bizAddress}
                onBizAddressChange={setBizAddress}
                bizName={bizName}
                onBizNameChange={setBizName}
                bizCeo={bizCeo}
                onBizCeoChange={setBizCeo}
                bizPhone={bizPhone}
                onBizPhoneChange={setBizPhone}
                // 호탱감탱 사업자정보
                hotangBizRegNo={hotangBizRegNo}
                onHotangBizRegNoChange={setHotangBizRegNo}
                hotangBizName={hotangBizName}
                onHotangBizNameChange={setHotangBizName}
                hotangBizCeo={hotangBizCeo}
                onHotangBizCeoChange={setHotangBizCeo}
                hotangBizAddress={hotangBizAddress}
                onHotangBizAddressChange={setHotangBizAddress}
                hotangBizType={hotangBizType}
                onHotangBizTypeChange={setHotangBizType}
                hotangBizItem={hotangBizItem}
                onHotangBizItemChange={setHotangBizItem}
                hotangBizPhone={hotangBizPhone}
                onHotangBizPhoneChange={setHotangBizPhone}
              />
            </section>

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
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={`invoice-${tmpl.id}`}
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
                  <ExportButtons
                    documentType="invoice"
                    previewElementId="invoice-preview"
                    items={items}
                    totals={totals}
                    formData={formData}
                    manualRows={manualRows}
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
                onClearAll={clearAllWithManual}
                documentType="invoice"
                manualRows={manualRows}
                onAddManualRow={addManualRow}
                onUpdateManualRow={updateManualRow}
                onRemoveManualRow={removeManualRow}
                quoteDate={quoteDate}
                onQuoteDateChange={setQuoteDate}
                recipient={recipient}
                onRecipientChange={setRecipient}
                reference={reference}
                onReferenceChange={setReference}
                memoText={memoText}
                onMemoTextChange={setMemoText}
                bizAddress={bizAddress}
                onBizAddressChange={setBizAddress}
                bizName={bizName}
                onBizNameChange={setBizName}
                bizCeo={bizCeo}
                onBizCeoChange={setBizCeo}
                bizPhone={bizPhone}
                onBizPhoneChange={setBizPhone}
                // 호탱감탱 사업자정보
                hotangBizRegNo={hotangBizRegNo}
                onHotangBizRegNoChange={setHotangBizRegNo}
                hotangBizName={hotangBizName}
                onHotangBizNameChange={setHotangBizName}
                hotangBizCeo={hotangBizCeo}
                onHotangBizCeoChange={setHotangBizCeo}
                hotangBizAddress={hotangBizAddress}
                onHotangBizAddressChange={setHotangBizAddress}
                hotangBizType={hotangBizType}
                onHotangBizTypeChange={setHotangBizType}
                hotangBizItem={hotangBizItem}
                onHotangBizItemChange={setHotangBizItem}
                hotangBizPhone={hotangBizPhone}
                onHotangBizPhoneChange={setHotangBizPhone}
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
