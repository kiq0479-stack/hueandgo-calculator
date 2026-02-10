'use client';

import { useState, useCallback } from 'react';
import type { Cafe24Product, Cafe24ProductOption, Cafe24Variant } from '@/types/cafe24';
import ProductSelector from './ProductSelector';
import OptionSelector from './OptionSelector';
import QuantityInput from './QuantityInput';
import AddonSelector, { type AddonItem } from './AddonSelector';

// 견적에 추가할 아이템
export interface QuoteItem {
  id: string;
  product: Cafe24Product;
  selectedOptions: Record<string, string>;
  optionAdditionalAmounts: Record<string, number>;
  quantity: number;
  unitPrice: number; // 기본가 + 옵션추가금
  addons: AddonItem[];
}

interface CalculatorProps {
  onAddToQuote?: (item: QuoteItem) => void;
}

export default function Calculator({ onAddToQuote }: CalculatorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Cafe24Product | null>(null);
  const [productOptions, setProductOptions] = useState<Cafe24ProductOption[]>([]);
  const [variants, setVariants] = useState<Cafe24Variant[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [optionAmounts, setOptionAmounts] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 제품 선택 시 상세정보 로드 (항상 옵션 조회 시도 - list API에 has_option 필드 없음)
  const handleProductSelect = useCallback(async (product: Cafe24Product) => {
    setSelectedProduct(product);
    setSelectedOptions({});
    setOptionAmounts({});
    setQuantity(1);
    setAddons([]);
    setLoadingDetail(true);

    try {
      const res = await fetch(`/api/products?product_no=${product.product_no}`);
      if (res.ok) {
        const data = await res.json();
        setProductOptions(data.options || []);
        setVariants(data.variants || []);
      } else {
        setProductOptions([]);
        setVariants([]);
      }
    } catch {
      // 옵션 로드 실패 시 빈 상태로 유지
      setProductOptions([]);
      setVariants([]);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // 옵션 변경
  function handleOptionChange(optionName: string, optionValue: string, additionalAmount: string) {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: optionValue }));
    setOptionAmounts((prev) => ({ ...prev, [optionName]: Number(additionalAmount) }));
  }

  // 단가 계산
  const basePrice = selectedProduct ? Number(selectedProduct.price) : 0;
  const optionExtra = Object.values(optionAmounts).reduce((sum, amt) => sum + amt, 0);
  const unitPrice = basePrice + optionExtra;
  const addonTotal = addons.reduce((sum, a) => sum + a.unitPrice * a.quantity, 0);
  const totalPrice = unitPrice * quantity + addonTotal;

  // 견적에 추가
  function handleAddToQuote() {
    if (!selectedProduct) return;

    const item: QuoteItem = {
      id: crypto.randomUUID(),
      product: selectedProduct,
      selectedOptions: { ...selectedOptions },
      optionAdditionalAmounts: { ...optionAmounts },
      quantity,
      unitPrice,
      addons: [...addons],
    };

    onAddToQuote?.(item);

    // 리셋
    setSelectedOptions({});
    setOptionAmounts({});
    setQuantity(1);
    setAddons([]);
  }

  // 필수옵션 모두 선택했는지 확인
  const requiredOptions = productOptions.filter((o) => o.required_option === 'T');
  const allRequiredSelected = requiredOptions.every(
    (o) => selectedOptions[o.option_name]
  );
  const canAdd = selectedProduct && (requiredOptions.length === 0 || allRequiredSelected);

  return (
    <div className="space-y-6">
      {/* 제품 선택 */}
      <ProductSelector
        onSelect={handleProductSelect}
        selectedProductNo={selectedProduct?.product_no}
      />

      {/* 선택된 제품 정보 */}
      {selectedProduct && (
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">
            {selectedProduct.product_name}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            기본가: {basePrice.toLocaleString()}원
          </p>
        </div>
      )}

      {/* 옵션 로딩 */}
      {loadingDetail && (
        <p className="text-sm text-gray-500">옵션 정보 불러오는 중...</p>
      )}

      {/* DEBUG: 옵션/variants 개수 표시 */}
      {selectedProduct && !loadingDetail && (
        <div className="text-xs text-gray-400 bg-yellow-50 p-2 rounded">
          [DEBUG] options: {productOptions.length}개, variants: {variants.length}개
          {productOptions.length === 0 && variants.length > 0 && ' → variants에서 옵션 추출 필요'}
        </div>
      )}

      {/* 옵션 선택 */}
      {!loadingDetail && productOptions.length > 0 && (
        <OptionSelector
          options={productOptions}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
        />
      )}

      {/* 수량 */}
      {selectedProduct && (
        <QuantityInput quantity={quantity} onChange={setQuantity} />
      )}

      {/* 추가상품 */}
      {selectedProduct && (
        <AddonSelector addons={addons} onAddonsChange={setAddons} />
      )}

      {/* 가격 요약 */}
      {selectedProduct && (
        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>단가</span>
            <span>{unitPrice.toLocaleString()}원</span>
          </div>
          {optionExtra > 0 && (
            <div className="flex justify-between text-xs text-gray-400">
              <span className="ml-2">└ 기본가 {basePrice.toLocaleString()}원 + 옵션 {optionExtra.toLocaleString()}원</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>수량</span>
            <span>{quantity.toLocaleString()}개</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>소계</span>
            <span>{(unitPrice * quantity).toLocaleString()}원</span>
          </div>
          {addonTotal > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>추가상품</span>
              <span>+{addonTotal.toLocaleString()}원</span>
            </div>
          )}
          <hr className="border-gray-200" />
          <div className="flex justify-between text-base font-bold text-gray-900">
            <span>합계</span>
            <span>{totalPrice.toLocaleString()}원</span>
          </div>
        </div>
      )}

      {/* 견적 추가 버튼 */}
      {selectedProduct && (
        <button
          type="button"
          onClick={handleAddToQuote}
          disabled={!canAdd}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          견적에 추가
        </button>
      )}
    </div>
  );
}
