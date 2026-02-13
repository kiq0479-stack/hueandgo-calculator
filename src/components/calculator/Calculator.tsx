'use client';

import { useState, useCallback } from 'react';
import type { Cafe24Product, Cafe24ProductOption, Cafe24Variant, Cafe24AdditionalProduct } from '@/types/cafe24';
import ProductSelector from './ProductSelector';
import OptionSelector from './OptionSelector';
import QuantityTierSelector, { type QuantityTierItem } from './QuantityTierSelector';
import Cafe24AddonSelector, { type SelectedAddon } from './Cafe24AddonSelector';
import { cleanAddonName, cleanMainProductName } from '@/lib/product-addon-mapping';

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

// 미리보기 아이템 타입
interface PreviewItem {
  id: string;
  displayName: string;
  selectedOptions: Record<string, string>;
  quantity: number;
  unitPrice: number;
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
  
  // 미리보기 리스트 (견적 추가 전 여러 개 쌓아놓기)
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);

  // 제품 선택 시 상세정보 로드 (항상 옵션 조회 시도 - list API에 has_option 필드 없음)
  const handleProductSelect = useCallback(async (product: Cafe24Product) => {
    setSelectedProduct(product);
    setSelectedOptions({});
    setOptionAmounts({});
    setQuantity(1);
    setCafe24Addons([]);
    setPreviewItems([]); // 미리보기 리스트 초기화
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
  const cafe24AddonTotal = cafe24Addons.reduce(
    (sum, a) => {
      const addonBasePrice = Number(a.product.price) || 0;
      const optionAmount = a.optionAdditionalAmount || 0;
      return sum + (addonBasePrice + optionAmount) * a.quantity;
    },
    0
  );
  // totalPrice, totalItemCount는 canAddMainProduct 정의 후 계산 (아래에서)

  // 미리보기 리스트에 추가 (메인 상품)
  function handleAddToPreview() {
    if (!canAddMainProduct || !selectedProduct) return;
    
    // 품명 생성
    const optionStr = Object.values(selectedOptions).join(' ');
    let displayName = cleanMainProductName(selectedProduct.product_name);
    const sizeMatch = optionStr.match(/(\d+)\s*mm/i);
    if (sizeMatch) {
      displayName = `${displayName} (${sizeMatch[1]}mm)`;
    }
    
    const previewItem: PreviewItem = {
      id: crypto.randomUUID(),
      displayName,
      selectedOptions: { ...selectedOptions },
      quantity,
      unitPrice,
    };
    
    setPreviewItems(prev => [...prev, previewItem]);
    
    // 수량 옵션만 리셋 (다른 수량구간 추가 용이)
    const quantityOptionName = productOptions.find(
      (o) => o.option_name === '수량' || o.option_name.includes('수량')
    )?.option_name;
    
    if (quantityOptionName) {
      setSelectedOptions(prev => {
        const newOptions = { ...prev };
        delete newOptions[quantityOptionName];
        return newOptions;
      });
    }
    setQuantity(1);
  }
  
  // 미리보기 아이템 삭제
  function handleRemovePreviewItem(id: string) {
    setPreviewItems(prev => prev.filter(item => item.id !== id));
  }
  
  // 미리보기 아이템 수량 변경
  function handleUpdatePreviewQuantity(id: string, newQuantity: number) {
    setPreviewItems(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
    ));
  }

  // 견적에 추가 (미리보기 리스트 + 추가구성상품)
  function handleAddToQuote() {
    if (previewItems.length === 0 && cafe24Addons.length === 0) return;
    if (!selectedProduct) return;

    // 1. 미리보기 리스트의 모든 아이템 추가
    for (const preview of previewItems) {
      const mainItem: QuoteItem = {
        id: crypto.randomUUID(),
        product: { ...selectedProduct, product_name: preview.displayName },
        selectedOptions: preview.selectedOptions,
        optionAdditionalAmounts: {},
        quantity: preview.quantity,
        unitPrice: preview.unitPrice,
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
      
      const optionCount = addon.optionCount || 0;
      const mainProductName = selectedProduct?.product_name || '';
      
      let productName: string;
      if (optionCount > 1 && addon.selectedOption) {
        productName = addon.selectedOption;
      } else {
        productName = cleanAddonName(addon.product.product_name, mainProductName);
      }
      
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
    setPreviewItems([]);
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
  // 수량 옵션이 있으면 QuantityTierSelector 사용하므로 이 UI는 숨김
  const hasOptions = productOptions.length > 0;
  const hasQuantityOption = productOptions.some(
    (o) => o.option_name === '수량' || o.option_name.includes('수량')
  );
  const canAddMainProduct = selectedProduct && !loadingDetail && !hasQuantityOption && (
    !hasOptions || // 옵션 없는 상품
    (hasOptions && (requiredOptions.length === 0 || allRequiredSelected)) // 옵션 있는데 필수옵션 없거나 다 선택함
  );
  // 견적 추가 가능 여부: 미리보기 리스트나 추가구성상품이 있을 때
  const canAdd = previewItems.length > 0 || cafe24Addons.length > 0;

  // 수량 옵션 분리 (수량구간별 단가 비교용)
  const quantityOption = productOptions.find(
    (o) => o.option_name === '수량' || o.option_name.includes('수량')
  );
  const nonQuantityOptions = productOptions.filter(
    (o) => o.option_name !== '수량' && !o.option_name.includes('수량')
  );
  
  // 수량구간 표시 조건: 수량 외 필수옵션 모두 선택
  const nonQuantityRequiredOptions = nonQuantityOptions.filter((o) => o.required_option === 'T');
  const canShowQuantityTiers = quantityOption && (
    nonQuantityRequiredOptions.length === 0 ||
    nonQuantityRequiredOptions.every((o) => selectedOptions[o.option_name])
  );

  // 수량구간 미리보기 추가 핸들러
  function handleAddTierToPreview(tier: QuantityTierItem) {
    if (!selectedProduct) return;
    
    // 다른 옵션들 + 수량구간 옵션 합치기
    const allOptions = {
      ...selectedOptions,
      [quantityOption?.option_name || '수량']: tier.optionText,
    };
    
    // 표시 이름 생성
    const optionTexts = Object.values(allOptions).filter(Boolean).join(', ');
    const cleanedProductName = cleanMainProductName(selectedProduct.product_name);
    const displayName = optionTexts 
      ? `${cleanedProductName} (${optionTexts})`
      : cleanedProductName;
    
    const previewItem: PreviewItem = {
      id: crypto.randomUUID(),
      displayName,
      selectedOptions: allOptions,
      quantity: tier.quantity,
      unitPrice: tier.unitPrice,
    };
    
    setPreviewItems(prev => [...prev, previewItem]);
  }
  
  // 총 금액/수량 계산 (미리보기 리스트 기준)
  const previewTotal = previewItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalPrice = previewTotal + cafe24AddonTotal;
  const totalItemCount = previewItems.length + cafe24Addons.length;

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

      {/* 옵션 선택 (수량 옵션 제외) */}
      {!loadingDetail && nonQuantityOptions.length > 0 && (
        <OptionSelector
          options={nonQuantityOptions}
          variants={variants}
          selectedOptions={selectedOptions}
          onOptionChange={handleOptionChange}
        />
      )}

      {/* 수량구간별 단가 비교 (수량 옵션이 있고, 다른 필수옵션 다 선택했을 때) */}
      {!loadingDetail && quantityOption && canShowQuantityTiers && (
        <QuantityTierSelector
          productName={selectedProduct?.product_name || ''}
          basePrice={basePrice}
          quantityOption={quantityOption}
          otherSelectedOptions={selectedOptions}
          onAddToPreview={handleAddTierToPreview}
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

      {/* 현재 선택 + 리스트에 추가 버튼 */}
      {canAddMainProduct && (
        <div className="rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedProduct.product_name}
              </p>
              {Object.keys(selectedOptions).length > 0 && (
                <p className="text-xs text-gray-500 truncate">
                  - {Object.values(selectedOptions).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-600">
                {unitPrice.toLocaleString()}원
              </span>
              <button
                type="button"
                onClick={handleAddToPreview}
                className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded hover:bg-blue-600"
              >
                + 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 미리보기 리스트 + 추가구성상품 */}
      {(previewItems.length > 0 || cafe24Addons.length > 0) && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          {/* 미리보기 리스트 (메인 상품들) */}
          {previewItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.displayName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  - {Object.values(item.selectedOptions).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded w-[100px] justify-center">
                  <button
                    type="button"
                    onClick={() => handleUpdatePreviewQuantity(item.id, item.quantity - 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => {
                      const num = Number(e.target.value.replace(/,/g, ''));
                      if (!isNaN(num)) handleUpdatePreviewQuantity(item.id, num);
                    }}
                    className="w-[36px] text-center text-sm border-0 focus:ring-0 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdatePreviewQuantity(item.id, item.quantity + 1)}
                    className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm font-medium w-20 text-right">
                  {(item.unitPrice * item.quantity).toLocaleString()}원
                </span>
                <button
                  type="button"
                  onClick={() => handleRemovePreviewItem(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

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
                            ? { ...a, quantity: Math.max(0, a.quantity - 1) }
                            : a
                        ));
                      }}
                      className="px-2 py-1 text-gray-500 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      value={addon.quantity === 0 ? '' : addon.quantity}
                      onChange={(e) => {
                        const val = e.target.value.replace(/,/g, '');
                        if (val === '') {
                          setCafe24Addons(cafe24Addons.map((a, i) => 
                            i === index ? { ...a, quantity: 0 } : a
                          ));
                          return;
                        }
                        const num = Number(val);
                        if (!isNaN(num)) {
                          setCafe24Addons(cafe24Addons.map((a, i) => 
                            i === index ? { ...a, quantity: num } : a
                          ));
                        }
                      }}
                      className="w-[36px] text-center text-sm border-0 focus:ring-0 focus:outline-none bg-transparent"
                    />
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
