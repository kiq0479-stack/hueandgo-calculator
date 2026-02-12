'use client';

import { useState, useCallback } from 'react';
import type { Cafe24Product, Cafe24ProductOption, Cafe24Variant, Cafe24AdditionalProduct } from '@/types/cafe24';
import ProductSelector from './ProductSelector';
import OptionSelector from './OptionSelector';
import Cafe24AddonSelector, { type SelectedAddon } from './Cafe24AddonSelector';

// AddonItem은 이제 사용 안 함 (수동 추가상품 제거)
export interface AddonItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

// 견적에 추가할 아이템
export interface QuoteItem {
  id: string;
  product: Cafe24Product;
  selectedOptions: Record<string, string>;
  optionAdditionalAmounts: Record<string, number>;
  quantity: number;
  unitPrice: number; // 기본가 + 옵션추가금
  addons: AddonItem[];
  cafe24Addons: SelectedAddon[]; // Cafe24 추가구성상품
}

interface CalculatorProps {
  onAddToQuote?: (item: QuoteItem) => void;
}

export default function Calculator({ onAddToQuote }: CalculatorProps) {
  const [selectedProduct, setSelectedProduct] = useState<Cafe24Product | null>(null);
  const [productOptions, setProductOptions] = useState<Cafe24ProductOption[]>([]);
  const [variants, setVariants] = useState<Cafe24Variant[]>([]);
  const [additionalProducts, setAdditionalProducts] = useState<Cafe24AdditionalProduct[]>([]);
  const [optionsApiError, setOptionsApiError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [optionAmounts, setOptionAmounts] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [cafe24Addons, setCafe24Addons] = useState<SelectedAddon[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 제품 선택 시 상세정보 로드 (항상 옵션 조회 시도 - list API에 has_option 필드 없음)
  const handleProductSelect = useCallback(async (product: Cafe24Product) => {
    setSelectedProduct(product);
    setSelectedOptions({});
    setOptionAmounts({});
    setQuantity(1);
    setCafe24Addons([]);
    setOptionsApiError(null);
    setLoadingDetail(true);

    try {
      const res = await fetch(`/api/products?product_no=${product.product_no}`, {
        credentials: 'include', // 쿠키 포함
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[CLIENT DEBUG] API response:', JSON.stringify(data._debug || {}));
        console.log('[CLIENT DEBUG] additionalProducts:', data.additionalProducts);
        setProductOptions(data.options || []);
        setVariants(data.variants || []);
        setAdditionalProducts(data.additionalProducts || []);
        setOptionsApiError(data.optionsApiError || null);
        setDebugInfo(data._debug || null);
      } else {
        setProductOptions([]);
        setVariants([]);
        setAdditionalProducts([]);
        setOptionsApiError('API 호출 실패');
      }
    } catch {
      // 옵션 로드 실패 시 빈 상태로 유지
      setProductOptions([]);
      setVariants([]);
      setAdditionalProducts([]);
      setOptionsApiError('네트워크 에러');
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  // 옵션 변경 (additionalAmount는 이제 사용 안 함 - variants에서 계산)
  function handleOptionChange(optionName: string, optionValue: string, _additionalAmount: string) {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: optionValue }));
  }

  // variants에서 선택된 옵션 조합에 해당하는 variant 찾기
  function findMatchingVariant() {
    if (!variants.length || Object.keys(selectedOptions).length === 0) return null;
    
    return variants.find((variant) => {
      if (!variant.options) return false;
      // 모든 선택된 옵션이 variant의 옵션과 일치하는지 확인
      return Object.entries(selectedOptions).every(([optName, optValue]) => {
        const variantOpt = variant.options.find((o) => o.name === optName);
        return variantOpt && variantOpt.value === optValue;
      });
    });
  }

  // 단가 계산 (variants에서 정확한 가격 찾기)
  const basePrice = selectedProduct ? Number(selectedProduct.price) : 0;
  const matchingVariant = findMatchingVariant();
  const optionExtra = matchingVariant ? Number(matchingVariant.additional_amount) : 0;
  const unitPrice = basePrice + optionExtra;
  const mainProductTotal = selectedProduct ? unitPrice * quantity : 0;
  const cafe24AddonTotal = cafe24Addons.reduce(
    (sum, a) => {
      const addonBasePrice = Number(a.product.price) || 0;
      const optionAmount = a.optionAdditionalAmount || 0;
      return sum + (addonBasePrice + optionAmount) * a.quantity;
    },
    0
  );
  const totalPrice = mainProductTotal + cafe24AddonTotal;
  const totalItemCount = (selectedProduct ? 1 : 0) + cafe24Addons.length;

  // 견적에 추가 (메인 상품 + 추가구성상품 각각 별도 행으로)
  function handleAddToQuote() {
    // 메인상품이나 추가상품 중 하나라도 있어야 함
    if (!selectedProduct && cafe24Addons.length === 0) return;

    // 1. 메인 상품 추가 (선택한 경우에만)
    if (selectedProduct) {
      const mainItem: QuoteItem = {
        id: crypto.randomUUID(),
        product: selectedProduct,
        selectedOptions: { ...selectedOptions },
        optionAdditionalAmounts: { ...optionAmounts },
        quantity,
        unitPrice,
        addons: [],
        cafe24Addons: [],
      };
      onAddToQuote?.(mainItem);
    }

    // 2. Cafe24 추가구성상품 각각 별도 항목으로 추가
    for (const addon of cafe24Addons) {
      const addonBasePrice = Number(addon.product.price) || 0;
      const optionAmount = addon.optionAdditionalAmount || 0;
      const addonUnitPrice = addonBasePrice + optionAmount;
      
      // 상품명에 옵션 정보 포함
      const productName = addon.selectedOption 
        ? `${addon.product.product_name} (${addon.selectedOption})`
        : addon.product.product_name;
      
      // addon.product를 Cafe24Product로 변환 (타입 단언 사용)
      const addonProduct = {
        ...(selectedProduct || {} as Cafe24Product),
        product_no: addon.product.product_no,
        product_code: addon.product.product_code,
        product_name: productName,
        price: String(addonUnitPrice),
      } as Cafe24Product;
      
      const addonItem: QuoteItem = {
        id: crypto.randomUUID(),
        product: addonProduct,
        selectedOptions: addon.selectedOption ? { '옵션': addon.selectedOption } : {},
        optionAdditionalAmounts: addon.selectedOption ? { '옵션': optionAmount } : {},
        quantity: addon.quantity,
        unitPrice: addonUnitPrice,
        addons: [],
        cafe24Addons: [],
      };
      onAddToQuote?.(addonItem);
    }

    // 리셋
    setSelectedOptions({});
    setOptionAmounts({});
    setQuantity(1);
    setCafe24Addons([]);
  }

  // 필수옵션 모두 선택했는지 확인
  const requiredOptions = productOptions.filter((o) => o.required_option === 'T');
  const allRequiredSelected = requiredOptions.every(
    (o) => selectedOptions[o.option_name]
  );
  // 옵션이 있는 상품이면 필수옵션 선택 필요, 옵션 없는 상품이면 바로 추가 가능
  // 옵션 로딩 중이거나 옵션이 있는데 필수옵션 미선택이면 메인상품 표시 안 함
  const hasOptions = productOptions.length > 0;
  const canAddMainProduct = selectedProduct && !loadingDetail && (
    !hasOptions || // 옵션 없는 상품
    (hasOptions && (requiredOptions.length === 0 || allRequiredSelected)) // 옵션 있는데 필수옵션 없거나 다 선택함
  );
  const canAdd = canAddMainProduct || cafe24Addons.length > 0;

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

      {/* DEBUG: 옵션/variants/추가구성상품 개수 표시 */}
      {selectedProduct && !loadingDetail && (
        <div className="text-xs text-gray-400 bg-yellow-50 p-2 rounded space-y-1">
          <div>[DEBUG] options: {productOptions.length}개, variants: {variants.length}개, 추가구성상품: {additionalProducts.length}개</div>
          {debugInfo && (
            <div className="text-blue-500">
              [서버] productHasAdditionalproducts: {String(debugInfo.productHasAdditionalproducts)}, 
              productAdditionalproductsCount: {String(debugInfo.productAdditionalproductsCount)}
            </div>
          )}
          {optionsApiError && <div className="text-red-500">Options API 에러: {optionsApiError}</div>}
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

      {/* Cafe24 추가구성상품 (API에서 가져온 것) */}
      {!loadingDetail && additionalProducts.length > 0 && (
        <Cafe24AddonSelector
          additionalProducts={additionalProducts}
          selectedAddons={cafe24Addons}
          onAddonsChange={setCafe24Addons}
        />
      )}

      {/* 가격 요약 - 상품별 리스트 형태 */}
      {(canAddMainProduct || cafe24Addons.length > 0) && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {/* 메인 상품 (필수옵션 선택 완료 시에만 표시) */}
          {canAddMainProduct && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedProduct.product_name}
                </p>
                {Object.keys(selectedOptions).length > 0 && (
                  <p className="text-xs text-gray-500 truncate">
                    - {Object.values(selectedOptions).join(', ')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded w-[100px] justify-center">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <span className="px-2 py-1 text-sm w-[36px] text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-medium w-20 text-right">
                  {(unitPrice * quantity).toLocaleString()}원
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // 메인상품만 삭제, 추가구성상품은 유지
                    setSelectedProduct(null);
                    setSelectedOptions({});
                    setOptionAmounts({});
                    setQuantity(1);
                    setProductOptions([]);
                    setVariants([]);
                    // additionalProducts와 cafe24Addons는 유지
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* 추가구성상품 각각 */}
          {cafe24Addons.map((addon, index) => {
            const addonBasePrice = Number(addon.product.price) || 0;
            const optionAmount = addon.optionAdditionalAmount || 0;
            const addonUnitPrice = addonBasePrice + optionAmount;
            const addonTotalPrice = addonUnitPrice * addon.quantity;
            
            return (
              <div key={`${addon.product.product_code}-${addon.selectedOption || ''}-${index}`} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {addon.product.product_name}
                  </p>
                  {addon.selectedOption && (
                    <p className="text-xs text-gray-500 truncate">
                      - {addon.selectedOption}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded w-[100px] justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCafe24Addons(cafe24Addons.map((a, i) => 
                          i === index 
                            ? { ...a, quantity: Math.max(1, a.quantity - 1) }
                            : a
                        ));
                      }}
                      className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <span className="px-2 py-1 text-sm w-[36px] text-center">{addon.quantity}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCafe24Addons(cafe24Addons.map((a, i) => 
                          i === index 
                            ? { ...a, quantity: a.quantity + 1 }
                            : a
                        ));
                      }}
                      className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm font-medium w-20 text-right">
                    {addonTotalPrice.toLocaleString()}원
                  </span>
                  <button
                    type="button"
                    onClick={() => setCafe24Addons(cafe24Addons.filter((_, i) => i !== index))}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}

          {/* 총 상품금액 */}
          <div className="flex justify-end items-center px-4 py-3 bg-gray-50">
            <span className="text-sm text-gray-600 mr-2">총 상품금액</span>
            <span className="text-lg font-bold text-gray-900">
              {totalPrice.toLocaleString()}원
            </span>
            <span className="text-sm text-gray-500 ml-1">
              ({totalItemCount}개)
            </span>
          </div>
        </div>
      )}

      {/* 견적 추가 버튼 */}
      {(selectedProduct || cafe24Addons.length > 0) && (
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
