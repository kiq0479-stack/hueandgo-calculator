'use client';

import { useState } from 'react';
import type { TruncationType } from '@/hooks/useQuote';

interface DiscountControlProps {
  discountRate: number;
  onDiscountChange: (rate: number) => void;
  truncation: TruncationType;
  onTruncationChange: (type: TruncationType) => void;
  subtotal: number;
  truncationAmount: number;
}

// 빠른 할인율 프리셋
const PRESETS = [0, 5, 10, 15, 20, 30];

// 절삭 옵션
const TRUNCATION_OPTIONS: { value: TruncationType; label: string }[] = [
  { value: 'none', label: '절삭없음' },
  { value: '1', label: '일의자리 (10원 단위)' },
  { value: '10', label: '십의자리 (100원 단위)' },
  { value: '100', label: '백의자리 (1000원 단위)' },
];

export default function DiscountControl({
  discountRate,
  onDiscountChange,
  truncation,
  onTruncationChange,
  subtotal,
  truncationAmount,
}: DiscountControlProps) {
  const [customInput, setCustomInput] = useState(false);
  const discountAmount = Math.round(subtotal * (discountRate / 100));

  function handleCustomInput(value: string) {
    const num = Number(value);
    if (isNaN(num)) return;
    onDiscountChange(Math.max(0, Math.min(100, num)));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">할인율</label>
        {discountRate > 0 && (
          <span className="text-xs text-red-500">
            -{discountAmount.toLocaleString()}원
          </span>
        )}
      </div>

      {/* 프리셋 버튼 */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => {
              onDiscountChange(rate);
              setCustomInput(false);
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              discountRate === rate && !customInput
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {rate === 0 ? '할인없음' : `${rate}%`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomInput(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            customInput
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          직접입력
        </button>
      </div>

      {/* 직접 입력 */}
      {customInput && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={discountRate}
            onChange={(e) => handleCustomInput(e.target.value)}
            min={0}
            max={100}
            step={1}
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>
      )}

      {/* 절삭 옵션 */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">금액 절삭</label>
          {truncationAmount > 0 && (
            <span className="text-xs text-orange-500">
              -{truncationAmount.toLocaleString()}원
            </span>
          )}
        </div>
        <select
          value={truncation}
          onChange={(e) => onTruncationChange(e.target.value as TruncationType)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {TRUNCATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          기관에서 &ldquo;60만원 맞춰주세요&rdquo; 요청 시 사용
        </p>
      </div>
    </div>
  );
}
