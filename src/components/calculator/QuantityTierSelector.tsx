'use client';

import { useState } from 'react';
import type { Cafe24ProductOption, Cafe24OptionValue } from '@/types/cafe24';

export interface QuantityTierItem {
  tierName: string; // "소량 제작", "10~49개" 등
  unitPrice: number;
  quantity: number;
  optionText: string; // 옵션값 전체 텍스트
}

interface QuantityTierSelectorProps {
  productName: string;
  basePrice: number;
  quantityOption: Cafe24ProductOption; // 수량 옵션
  otherSelectedOptions: Record<string, string>; // 수량 외 선택된 옵션들
  onAddToPreview: (item: QuantityTierItem) => void;
}

export default function QuantityTierSelector({
  productName,
  basePrice,
  quantityOption,
  otherSelectedOptions,
  onAddToPreview,
}: QuantityTierSelectorProps) {
  // 각 구간별 수량 입력 상태
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const tiers = quantityOption.option_value || [];

  // 다른 선택된 옵션들을 문자열로 (예: "투명, 자유형")
  const otherOptionsText = Object.values(otherSelectedOptions).filter(Boolean).join(', ');

  function handleQuantityChange(optionText: string, value: number) {
    setQuantities(prev => ({
      ...prev,
      [optionText]: Math.max(1, value),
    }));
  }

  function handleAddTier(tier: Cafe24OptionValue) {
    const additionalAmount = Number(tier.additional_amount) || 0;
    const unitPrice = basePrice + additionalAmount;
    const quantity = quantities[tier.option_text] || 1;

    onAddToPreview({
      tierName: tier.option_text,
      unitPrice,
      quantity,
      optionText: tier.option_text,
    });

    // 수량 리셋
    setQuantities(prev => ({
      ...prev,
      [tier.option_text]: 1,
    }));
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        수량구간별 단가 비교
      </label>
      
      <div className="space-y-2">
        {tiers.map((tier) => {
          const additionalAmount = Number(tier.additional_amount) || 0;
          const unitPrice = basePrice + additionalAmount;
          const qty = quantities[tier.option_text] || 1;
          const totalPrice = unitPrice * qty;

          return (
            <div
              key={tier.option_text}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              {/* 상품명 + 옵션 */}
              <div className="mb-2">
                <p className="text-sm font-medium text-gray-800">
                  {productName}
                </p>
                <p className="text-xs text-gray-500">
                  - {otherOptionsText}{otherOptionsText ? ', ' : ''}{tier.option_text}
                  {tier.option_text.includes('디자인') ? '' : ' (디자인 1개당 단가)'}
                </p>
              </div>

              {/* 수량 + 단가 + 버튼 */}
              <div className="flex items-center gap-2">
                {/* 수량 입력 */}
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(tier.option_text, qty - 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => handleQuantityChange(tier.option_text, Number(e.target.value))}
                    min={1}
                    className="w-12 text-center border-x border-gray-300 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(tier.option_text, qty + 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                {/* 단가 */}
                <span className="text-sm font-semibold text-gray-700">
                  {unitPrice.toLocaleString()}원
                </span>

                {/* X 버튼 (카페24 스타일) */}
                <span className="text-gray-400">×</span>

                {/* 총액 표시 */}
                <div className="flex-1 text-right">
                  <span className="text-sm text-gray-500">총 상품금액</span>{' '}
                  <span className="text-base font-bold text-blue-600">
                    {totalPrice.toLocaleString()}원
                  </span>
                  <span className="text-xs text-gray-400 ml-1">({qty}개)</span>
                </div>
              </div>

              {/* 견적에 추가 버튼 */}
              <button
                type="button"
                onClick={() => handleAddTier(tier)}
                className="mt-2 w-full rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                견적에 추가
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
