'use client';

import { useState } from 'react';

interface DiscountControlProps {
  discountRate: number;
  onDiscountChange: (rate: number) => void;
  subtotal: number;
}

// 빠른 할인율 프리셋
const PRESETS = [0, 5, 10, 15, 20, 30];

export default function DiscountControl({
  discountRate,
  onDiscountChange,
  subtotal,
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
    </div>
  );
}
