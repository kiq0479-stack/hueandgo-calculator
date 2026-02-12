'use client';

import { useState, useEffect } from 'react';
import type { Cafe24Product } from '@/types/cafe24';

interface ProductSelectorProps {
  onSelect: (product: Cafe24Product) => void;
  selectedProductNo?: number;
}

// 핀 고정 상품 localStorage 키
const PINNED_PRODUCTS_KEY = 'hueandgo_pinned_products';

export default function ProductSelector({ onSelect, selectedProductNo }: ProductSelectorProps) {
  const [products, setProducts] = useState<Cafe24Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);

  // 핀 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem(PINNED_PRODUCTS_KEY);
    if (saved) {
      try {
        setPinnedIds(JSON.parse(saved));
      } catch {
        // 무시
      }
    }
  }, []);

  // 핀 상태 저장
  function savePinned(ids: number[]) {
    setPinnedIds(ids);
    localStorage.setItem(PINNED_PRODUCTS_KEY, JSON.stringify(ids));
  }

  // 핀 토글
  function togglePin(productNo: number, e: React.MouseEvent) {
    e.stopPropagation(); // 상품 선택 방지
    if (pinnedIds.includes(productNo)) {
      savePinned(pinnedIds.filter((id) => id !== productNo));
    } else {
      savePinned([...pinnedIds, productNo]);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products', { credentials: 'include' });
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

  // 제외할 상품 코드 목록
  const excludedProductCodes = [
    'P00000OE', // (파트너 전용_에디터) 아크릴 키링
    'P00000NQ', // (파트너 전용) 추가금 결제
    'P00000ID', // (파트너 전용) 뒷대지 제작
    'P00000EH', // (파트너 전용) 페어 참여용 굿즈 세트
  ];

  // 필터링: "파트너 전용" 포함 + 제외 목록 제외 + 검색어
  const filtered = products
    .filter((p) => p.product_name.includes('파트너 전용'))
    .filter((p) => !excludedProductCodes.includes(p.product_code))
    .filter((p) =>
      p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.product_code.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // 정렬: 핀 고정 → 나머지
  const sorted = [...filtered].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.product_no);
    const bPinned = pinnedIds.includes(b.product_no);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">제품 선택</label>
        <span className="text-xs text-gray-400">파트너 전용 {filtered.length}개</span>
      </div>

      {/* 검색 */}
      <input
        type="text"
        placeholder="상품명 또는 상품코드 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      {/* 상태 표시 */}
      {loading && <p className="text-sm text-gray-500">상품 불러오는 중...</p>}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
          {error.includes('인증') ? (
            <a href="/api/auth/cafe24" className="ml-2 underline text-blue-600">카페24 로그인</a>
          ) : (
            <button onClick={loadProducts} className="ml-2 underline">다시 시도</button>
          )}
        </div>
      )}

      {/* 상품 목록 */}
      {!loading && !error && (
        <div className="max-h-[400px] overflow-y-auto rounded-lg border border-gray-200">
          {sorted.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-400">
              {searchTerm ? '검색 결과가 없습니다.' : '상품이 없습니다.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sorted.map((product) => {
                const isPinned = pinnedIds.includes(product.product_no);
                return (
                  <li
                    key={product.product_no}
                    onClick={() => onSelect(product)}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-blue-50 ${
                      selectedProductNo === product.product_no ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : ''
                    } ${isPinned ? 'bg-yellow-50' : ''}`}
                  >
                    {/* 핀 버튼 */}
                    <button
                      onClick={(e) => togglePin(product.product_no, e)}
                      className={`flex-shrink-0 text-lg ${isPinned ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                      title={isPinned ? '고정 해제' : '상단 고정'}
                    >
                      {isPinned ? '⭐' : '☆'}
                    </button>
                    
                    {product.small_image && (
                      <img
                        src={product.small_image}
                        alt={product.product_name}
                        className="h-12 w-12 rounded object-cover"
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
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
