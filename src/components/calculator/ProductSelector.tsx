'use client';

import { useState, useEffect } from 'react';
import type { Cafe24Product } from '@/types/cafe24';

interface ProductSelectorProps {
  onSelect: (product: Cafe24Product) => void;
  selectedProductNo?: number;
}

export default function ProductSelector({ onSelect, selectedProductNo }: ProductSelectorProps) {
  const [products, setProducts] = useState<Cafe24Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '상품 조회 실패');
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '상품 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">제품 선택</label>

      {/* 검색 */}
      <input
        type="text"
        placeholder="상품명 또는 상품코드 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* 상태 표시 */}
      {loading && <p className="text-sm text-gray-500">상품 불러오는 중...</p>}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
          <button onClick={loadProducts} className="ml-2 underline">다시 시도</button>
        </div>
      )}

      {/* 상품 목록 */}
      {!loading && !error && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
          {filtered.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">
              {searchTerm ? '검색 결과가 없습니다.' : '상품이 없습니다.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((product) => (
                <li
                  key={product.product_no}
                  onClick={() => onSelect(product)}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50 ${
                    selectedProductNo === product.product_no ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''
                  }`}
                >
                  {product.small_image && (
                    <img
                      src={product.small_image}
                      alt={product.product_name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.product_code} · {Number(product.price).toLocaleString()}원
                    </p>
                  </div>
                  {selectedProductNo === product.product_no && (
                    <span className="text-blue-600">✓</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
