'use client';

import { useState, useCallback } from 'react';
import type { Cafe24AdditionalProduct, Cafe24ProductOption, Cafe24Variant } from '@/types/cafe24';

// 선택된 추가구성상품 아이템 (옵션 포함)
export interface SelectedAddonItem {
  id: string; // 고유 ID (같은 상품 다른 옵션 구분)
  product: Cafe24AdditionalProduct;
  selectedOption?: string; // 선택한 옵션값
  optionAdditionalAmount: number; // 옵션 추가금액
  quantity: number;
}

// 기존 SelectedAddon 타입 호환용 (Calculator.tsx에서 사용)
export interface SelectedAddon {
  product: Cafe24AdditionalProduct;
  quantity: number;
  selectedOption?: string;
  optionAdditionalAmount?: number;
  optionCount?: number; // 해당 추가상품의 옵션 개수 (1개면 상품명 정제, 2개 이상이면 옵션명 사용)
}

interface Cafe24AddonSelectorProps {
  additionalProducts: Cafe24AdditionalProduct[];
  selectedAddons: SelectedAddon[];
  onAddonsChange: (addons: SelectedAddon[]) => void;
}

export default function Cafe24AddonSelector({
  additionalProducts,
  selectedAddons,
  onAddonsChange,
}: Cafe24AddonSelectorProps) {
  // 현재 선택 중인 상품 (옵션 로드용)
  const [activeProduct, setActiveProduct] = useState<Cafe24AdditionalProduct | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [productOptions, setProductOptions] = useState<Cafe24ProductOption[]>([]);
  const [productVariants, setProductVariants] = useState<Cafe24Variant[]>([]);
  
  // 현재 입력 중인 옵션/수량
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [inputQuantity, setInputQuantity] = useState<number>(1);

  // 추가구성상품 옵션 품절 체크
  function isAddonOptionSoldOut(optionValue: string): boolean {
    if (productVariants.length === 0) return false;
    
    // 해당 옵션값을 포함하는 variant 찾기
    const matchingVariants = productVariants.filter((variant) => {
      if (!variant.options) return false;
      return variant.options.some((o) => o.value === optionValue);
    });
    
    // 매칭되는 variant가 없으면 품절 아님
    if (matchingVariants.length === 0) return false;
    
    // 모든 매칭 variant가 품절인지 확인
    // 주의: quantity === 0은 "재고 관리 안 함" 설정일 수 있음
    // selling === 'F' (판매중지)만 품절로 판단
    return matchingVariants.every(
      (v) => v.selling === 'F'
    );
  }

  if (!additionalProducts || additionalProducts.length === 0) {
    return null;
  }

  // 상품 클릭 → 옵션 로드 또는 자동 추가 (옵션 없으면)
  const handleProductClick = useCallback(async (product: Cafe24AdditionalProduct) => {
    // 이미 선택된 상품이면 닫기
    if (activeProduct?.product_code === product.product_code) {
      setActiveProduct(null);
      setProductOptions([]);
      setProductVariants([]);
      return;
    }

    // 옵션 로드 (product_code로 API 호출)
    if (product.product_code) {
      setLoadingOptions(true);
      try {
        const res = await fetch(`/api/products?product_code=${product.product_code}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          const options = data.options || [];
          const variants = data.variants || [];
          
          // 옵션이 없으면 바로 자동 추가
          if (options.length === 0 || (options[0]?.option_value?.length || 0) === 0) {
            const newAddon: SelectedAddon = {
              product,
              quantity: 1,
              selectedOption: undefined,
              optionAdditionalAmount: 0,
              optionCount: 0,
            };
            onAddonsChange([...selectedAddons, newAddon]);
            setActiveProduct(null);
            return;
          }
          
          // 옵션이 있으면 패널 열기
          setActiveProduct(product);
          setSelectedOption('');
          setInputQuantity(1);
          setProductOptions(options);
          setProductVariants(variants);
        }
      } catch (err) {
        console.error('옵션 로드 실패:', err);
      } finally {
        setLoadingOptions(false);
      }
    } else {
      // product_code 없으면 바로 추가
      const newAddon: SelectedAddon = {
        product,
        quantity: 1,
        selectedOption: undefined,
        optionAdditionalAmount: 0,
        optionCount: 0,
      };
      onAddonsChange([...selectedAddons, newAddon]);
    }
  }, [activeProduct, selectedAddons, onAddonsChange]);

  // 옵션 선택 시 추가금액 계산
  function getOptionAdditionalAmount(optionValue: string): number {
    // variants에서 해당 옵션의 추가금액 찾기
    if (productVariants.length > 0) {
      const variant = productVariants.find(v => 
        v.options?.some(opt => opt.value === optionValue)
      );
      if (variant) {
        return Number(variant.additional_amount) || 0;
      }
    }
    // options에서 찾기
    for (const opt of productOptions) {
      const val = opt.option_value?.find(v => v.option_text === optionValue);
      if (val) {
        return Number(val.additional_amount) || 0;
      }
    }
    return 0;
  }

  // 옵션 선택 시 자동 추가
  function handleOptionSelect(optionValue: string) {
    if (!activeProduct || !optionValue) return;
    
    const optionAmount = getOptionAdditionalAmount(optionValue);
    const optionCount = optionValues.length;

    const newAddon: SelectedAddon = {
      product: activeProduct,
      quantity: 1,
      selectedOption: optionValue,
      optionAdditionalAmount: optionAmount,
      optionCount,
    };

    onAddonsChange([...selectedAddons, newAddon]);
    
    // 패널 닫기 (다른 상품 선택 가능하게)
    setActiveProduct(null);
    setProductOptions([]);
    setProductVariants([]);
    setSelectedOption('');
  }

  // 수량 변경
  function handleQuantityChange(index: number, quantity: number) {
    const updated = [...selectedAddons];
    updated[index] = { ...updated[index], quantity: Math.max(1, quantity) };
    onAddonsChange(updated);
  }

  // 삭제
  function handleRemove(index: number) {
    onAddonsChange(selectedAddons.filter((_, i) => i !== index));
  }

  // 총 금액 계산
  const totalAmount = selectedAddons.reduce((sum, addon) => {
    const basePrice = Number(addon.product.price) || 0;
    const optionAmount = addon.optionAdditionalAmount || 0;
    return sum + (basePrice + optionAmount) * addon.quantity;
  }, 0);

  // 옵션 목록 (첫번째 옵션의 값들)
  const firstOption = productOptions[0];
  const optionValues = firstOption?.option_value || [];
  // 옵션명 (드롭다운 라벨에 표시용)
  const optionName = firstOption?.option_name || '옵션';

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">
        추가구성상품 ({additionalProducts.length}개)
      </label>

      {/* 추가구성상품 선택 */}
      <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
        {additionalProducts.map((product) => {
          const isActive = activeProduct?.product_code === product.product_code;
          const basePrice = Number(product.price);

          return (
            <div key={product.product_code} className="space-y-2">
              {/* 상품 버튼 */}
              <button
                type="button"
                onClick={() => handleProductClick(product)}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 transition-colors text-left ${
                  isActive
                    ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-400'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* 이미지 */}
                {product.small_image && (
                  <img
                    src={product.small_image}
                    alt={product.product_name}
                    className="h-10 w-10 rounded object-cover flex-shrink-0"
                  />
                )}

                {/* 상품명 + 가격 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {product.product_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {basePrice.toLocaleString()}원~
                  </p>
                </div>

                {/* 화살표 */}
                <span className={`text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`}>
                  ▶
                </span>
              </button>

              {/* 옵션 선택 패널 (확장) */}
              {isActive && (
                <div className="ml-4 p-3 rounded-lg bg-white border border-gray-200 space-y-3">
                  {loadingOptions ? (
                    <p className="text-sm text-gray-500">옵션 불러오는 중...</p>
                  ) : optionValues.length > 0 ? (
                    <>
                      {/* 옵션 드롭다운 - 선택하면 자동 추가 */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          옵션 선택 <span className="text-gray-400">(선택 시 자동 추가)</span>
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleOptionSelect(e.target.value);
                            }
                          }}
                          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">- 옵션을 선택해 주세요 -</option>
                          {optionValues.map((opt) => {
                            const amount = Number(opt.additional_amount) || 0;
                            const amountText = amount > 0 ? ` (+${amount.toLocaleString()}원)` : 
                                               amount < 0 ? ` (${amount.toLocaleString()}원)` : '';
                            const isSoldOut = isAddonOptionSoldOut(opt.option_text);
                            return (
                              <option 
                                key={opt.option_text} 
                                value={opt.option_text}
                                disabled={isSoldOut}
                              >
                                {isSoldOut ? '[품절] ' : ''}{opt.option_text}{amountText}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </>
                  ) : (
                    /* 옵션 없는 상품은 클릭 시 자동 추가됨 - 여기 도달 안 함 */
                    <p className="text-xs text-gray-500">옵션이 없는 상품입니다. (자동 추가됨)</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
