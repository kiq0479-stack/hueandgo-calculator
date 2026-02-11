'use client';

import type { Cafe24AdditionalProduct } from '@/types/cafe24';

export interface SelectedAddon {
  product: Cafe24AdditionalProduct;
  quantity: number;
  // 추후 옵션 지원 시 확장
  selectedOption?: string;
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
  if (!additionalProducts || additionalProducts.length === 0) {
    return null;
  }

  // 상품이 선택되었는지 확인
  function isSelected(productNo: number): boolean {
    return selectedAddons.some((a) => a.product.product_no === productNo);
  }

  // 선택된 상품의 수량 가져오기
  function getQuantity(productNo: number): number {
    const addon = selectedAddons.find((a) => a.product.product_no === productNo);
    return addon?.quantity || 1;
  }

  // 토글 (선택/해제)
  function handleToggle(product: Cafe24AdditionalProduct) {
    if (isSelected(product.product_no)) {
      // 해제
      onAddonsChange(selectedAddons.filter((a) => a.product.product_no !== product.product_no));
    } else {
      // 선택
      onAddonsChange([...selectedAddons, { product, quantity: 1 }]);
    }
  }

  // 수량 변경
  function handleQuantityChange(productNo: number, quantity: number) {
    onAddonsChange(
      selectedAddons.map((a) =>
        a.product.product_no === productNo
          ? { ...a, quantity: Math.max(1, quantity) }
          : a
      )
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        추가구성상품 ({additionalProducts.length}개)
      </label>

      <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
        {additionalProducts.map((product) => {
          const selected = isSelected(product.product_no);
          const price = Number(product.price);
          const qty = getQuantity(product.product_no);

          return (
            <div
              key={product.product_no}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                selected
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {/* 체크박스 */}
              <input
                type="checkbox"
                checked={selected}
                onChange={() => handleToggle(product)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              {/* 이미지 (있으면) */}
              {product.small_image && (
                <img
                  src={product.small_image}
                  alt={product.product_name}
                  className="h-10 w-10 rounded object-cover"
                />
              )}

              {/* 상품명 + 가격 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {product.product_name}
                </p>
                <p className="text-xs text-gray-500">
                  {price.toLocaleString()}원
                  {product.has_option === 'T' && (
                    <span className="ml-1 text-orange-500">(옵션있음)</span>
                  )}
                </p>
              </div>

              {/* 수량 (선택된 경우만) */}
              {selected && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(product.product_no, qty - 1)}
                    disabled={qty <= 1}
                    className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) =>
                      handleQuantityChange(product.product_no, Number(e.target.value))
                    }
                    min={1}
                    className="w-12 rounded border border-gray-300 px-1 py-0.5 text-center text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(product.product_no, qty + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              )}

              {/* 소계 (선택된 경우만) */}
              {selected && (
                <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
                  {(price * qty).toLocaleString()}원
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 추가구성상품 합계 */}
      {selectedAddons.length > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">추가구성상품 소계</span>
          <span className="font-semibold text-blue-600">
            +{selectedAddons
              .reduce((sum, a) => sum + Number(a.product.price) * a.quantity, 0)
              .toLocaleString()}원
          </span>
        </div>
      )}
    </div>
  );
}
