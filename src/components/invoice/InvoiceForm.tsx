'use client';

import { TEMPLATES, type QuoteFormData } from '@/lib/quote/templates';

interface InvoiceFormProps {
  formData: QuoteFormData;
  onChange: (data: QuoteFormData) => void;
}

/** 거래명세서 정보 입력 폼 (브랜디즈 양식 기반) */
export default function InvoiceForm({ formData, onChange }: InvoiceFormProps) {
  function handleChange(field: keyof QuoteFormData, value: string | boolean) {
    onChange({ ...formData, [field]: value });
  }

  return (
    <div className="space-y-4">
      {/* 양식 선택 */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          거래명세서 양식
        </label>
        <div className="flex gap-2">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleChange('templateId', tmpl.id)}
              className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                formData.templateId === tmpl.id
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* 거래일자 */}
      <div>
        <label
          htmlFor="invoice-date"
          className="mb-1 block text-sm font-semibold text-gray-700"
        >
          거래일자
        </label>
        <input
          id="invoice-date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* 수신 */}
      <div>
        <label
          htmlFor="invoice-recipient"
          className="mb-1 block text-sm font-semibold text-gray-700"
        >
          수신 (거래처)
        </label>
        <input
          id="invoice-recipient"
          type="text"
          value={formData.recipient}
          onChange={(e) => handleChange('recipient', e.target.value)}
          placeholder="예: 주식회사 OOO 귀중"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      {/* 부가세 포함/제외 토글 */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          부가세
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleChange('vatIncluded', true)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              formData.vatIncluded
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            부가세 포함
          </button>
          <button
            type="button"
            onClick={() => handleChange('vatIncluded', false)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              !formData.vatIncluded
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            부가세 별도
          </button>
        </div>
      </div>

      {/* 비고 */}
      <div>
        <label
          htmlFor="invoice-memo"
          className="mb-1 block text-sm font-semibold text-gray-700"
        >
          비고
        </label>
        <textarea
          id="invoice-memo"
          value={formData.memo}
          onChange={(e) => handleChange('memo', e.target.value)}
          placeholder="특이사항을 입력하세요"
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>
    </div>
  );
}
