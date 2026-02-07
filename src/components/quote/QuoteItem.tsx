'use client';

import { useState } from 'react';
import type { QuoteItem as QuoteItemType } from '@/components/calculator/Calculator';
import { calcItemTotal } from '@/hooks/useQuote';

interface QuoteItemProps {
  item: QuoteItemType;
  index: number;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateUnitPrice: (id: string, unitPrice: number) => void;
}

export default function QuoteItem({
  item,
  index,
  onRemove,
  onUpdateQuantity,
  onUpdateUnitPrice,
}: QuoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(item.quantity);
  const [editUnitPrice, setEditUnitPrice] = useState(item.unitPrice);

  const addonTotal = item.addons.reduce(
    (sum, a) => sum + a.unitPrice * a.quantity,
    0
  );
  const itemTotal = calcItemTotal(item);

  // 편집 시작
  function startEdit() {
    setEditQuantity(item.quantity);
    setEditUnitPrice(item.unitPrice);
    setEditing(true);
  }

  // 편집 저장
  function saveEdit() {
    onUpdateQuantity(item.id, editQuantity);
    onUpdateUnitPrice(item.id, editUnitPrice);
    setEditing(false);
  }

  // 편집 취소
  function cancelEdit() {
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      {/* 상단: 번호, 상품명, 금액 */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900">
            <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              {index + 1}
            </span>
            {item.product.product_name}
          </p>

          {/* 선택된 옵션 표시 */}
          {Object.keys(item.selectedOptions).length > 0 && (
            <p className="mt-1 ml-7 text-xs text-gray-500">
              {Object.entries(item.selectedOptions)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' / ')}
            </p>
          )}
        </div>

        <span className="ml-4 text-sm font-semibold text-gray-900">
          {itemTotal.toLocaleString()}원
        </span>
      </div>

      {/* 상세: 수량/단가 (편집모드 or 표시모드) */}
      {editing ? (
        <div className="mt-3 ml-7 space-y-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-12">단가</label>
            <input
              type="number"
              value={editUnitPrice}
              onChange={(e) => setEditUnitPrice(Number(e.target.value) || 0)}
              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs text-gray-400">원</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500 w-12">수량</label>
            <input
              type="number"
              value={editQuantity}
              onChange={(e) => setEditQuantity(Number(e.target.value) || 1)}
              min={1}
              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm text-right focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs text-gray-400">개</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              저장
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-2 ml-7 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {item.unitPrice.toLocaleString()}원 x {item.quantity.toLocaleString()}개
            {addonTotal > 0 && (
              <span className="ml-2 text-gray-400">
                + 추가상품 {item.addons.length}건 ({addonTotal.toLocaleString()}원)
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startEdit}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              수정
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
