'use client';

import { useState } from 'react';

export interface AddonItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface AddonSelectorProps {
  addons: AddonItem[];
  onAddonsChange: (addons: AddonItem[]) => void;
}

export default function AddonSelector({ addons, onAddonsChange }: AddonSelectorProps) {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  function handleAdd() {
    const name = newName.trim();
    const price = Number(newPrice);
    if (!name || !price) return;

    const addon: AddonItem = {
      id: crypto.randomUUID(),
      name,
      unitPrice: price,
      quantity: 1,
    };
    onAddonsChange([...addons, addon]);
    setNewName('');
    setNewPrice('');
  }

  function handleRemove(id: string) {
    onAddonsChange(addons.filter((a) => a.id !== id));
  }

  function handleQuantityChange(id: string, quantity: number) {
    onAddonsChange(
      addons.map((a) => (a.id === id ? { ...a, quantity: Math.max(1, quantity) } : a))
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">추가상품</label>

      {/* 추가상품 목록 */}
      {addons.length > 0 && (
        <ul className="space-y-2">
          {addons.map((addon) => (
            <li
              key={addon.id}
              className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"
            >
              <span className="flex-1 text-sm text-gray-700">{addon.name}</span>
              <span className="text-xs text-gray-500">
                @{addon.unitPrice.toLocaleString()}원
              </span>
              <input
                type="number"
                value={addon.quantity}
                onChange={(e) => handleQuantityChange(addon.id, Number(e.target.value))}
                min={1}
                className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="text-xs font-medium text-gray-700">
                {(addon.unitPrice * addon.quantity).toLocaleString()}원
              </span>
              <button
                type="button"
                onClick={() => handleRemove(addon.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 새 추가상품 입력 */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="추가상품명"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="w-28">
          <input
            type="number"
            placeholder="단가"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim() || !Number(newPrice)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          추가
        </button>
      </div>
    </div>
  );
}
