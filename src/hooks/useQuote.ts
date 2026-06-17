'use client';

import { useState, useCallback, useMemo } from 'react';
import type { QuoteItem } from '@/components/calculator/Calculator';

// 절삭 타입: 'none' | '1' | '10' | '100' (일/십/백의자리 절삭)
export type TruncationType = 'none' | '1' | '10' | '100';

// 견적 전체 상태
export interface QuoteState {
  items: QuoteItem[];
  discountRate: number; // 0~100 (퍼센트)
  truncation: TruncationType;
}

// 견적 합계 정보
export interface QuoteTotals {
  /** 항목별 소계 합산 (할인 전) */
  subtotal: number;
  /** 할인 금액 */
  discountAmount: number;
  /** 할인율 (0~100) */
  discountRate: number;
  /** 절삭 타입 */
  truncation: TruncationType;
  /** 절삭 금액 */
  truncationAmount: number;
  /** 공급가액 (부가세 제외) */
  supplyAmount: number;
  /** 부가세 */
  vat: number;
  /** 총 합계 (부가세 포함) */
  grandTotal: number;
  /** 항목 수 */
  itemCount: number;
}

// 절삭 적용 함수
function applyTruncation(amount: number, truncation: TruncationType): number {
  switch (truncation) {
    case '1': // 일의자리 절삭 (10원 단위)
      return Math.floor(amount / 10) * 10;
    case '10': // 십의자리 절삭 (100원 단위)
      return Math.floor(amount / 100) * 100;
    case '100': // 백의자리 절삭 (1000원 단위)
      return Math.floor(amount / 1000) * 1000;
    default:
      return amount;
  }
}

// 할인 적용된 표시 단가 (반올림)
export function getDisplayUnitPrice(
  unitPrice: number,
  discountRate: number,
): number {
  return Math.round(unitPrice * (1 - discountRate / 100));
}

// 할인 적용된 단가로부터 원본 단가 역산 (사용자가 표시 단가에 직접 입력했을 때)
export function reverseUnitPrice(
  displayUnitPrice: number,
  discountRate: number,
): number {
  const factor = 1 - discountRate / 100;
  if (factor <= 0) return displayUnitPrice;
  return displayUnitPrice / factor;
}

// 개별 항목의 소계 (할인 미적용, 절대 원본)
export function calcItemTotal(item: QuoteItem): number {
  const addonTotal = item.addons.reduce(
    (sum, a) => sum + a.unitPrice * a.quantity,
    0
  );
  return item.unitPrice * item.quantity + addonTotal;
}

// 할인 적용된 표시 견적가 (행 단위)
export function calcItemDisplayTotal(item: QuoteItem, discountRate: number): number {
  const unitDisplay = getDisplayUnitPrice(item.unitPrice, discountRate);
  const addonTotal = item.addons.reduce(
    (sum, a) => sum + getDisplayUnitPrice(a.unitPrice, discountRate) * a.quantity,
    0
  );
  return unitDisplay * item.quantity + addonTotal;
}

export default function useQuote() {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discountRate, setDiscountRate] = useState(0);
  const [truncation, setTruncation] = useState<TruncationType>('none');

  // 항목 추가
  const addItem = useCallback((item: QuoteItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  // 항목 삭제
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // 항목 수량 변경 (0 허용 - 빈 칸 입력 시)
  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, quantity) } : item
      )
    );
  }, []);

  // 항목 단가 수동 변경
  // 입력값은 "사용자가 화면에서 본 표시 단가" (할인 적용된 값)
  // → 역산해서 원본 단가(state.unitPrice)에 저장
  const updateUnitPrice = useCallback((id: string, displayUnitPrice: number) => {
    const original = reverseUnitPrice(Math.max(0, displayUnitPrice), discountRate);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unitPrice: original } : item
      )
    );
  }, [discountRate]);

  // 항목 품명 변경
  const updateName = useCallback((id: string, name: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, product: { ...item.product, product_name: name } }
          : item
      )
    );
  }, []);

  // 할인율 변경 (0~100)
  const updateDiscountRate = useCallback((rate: number) => {
    setDiscountRate(Math.max(0, Math.min(100, rate)));
  }, []);

  // 절삭 타입 변경
  const updateTruncation = useCallback((type: TruncationType) => {
    setTruncation(type);
  }, []);

  // 전체 초기화
  const clearAll = useCallback(() => {
    setItems([]);
    setDiscountRate(0);
    setTruncation('none');
  }, []);

  // 합계 계산
  // - 할인은 행별 단가에 먼저 적용되고 (반올림), 그 후 합산하는 방식
  // - 표시되는 행별 견적가의 단순 합 = 합계 (검산 일관성 우선)
  const totals: QuoteTotals = useMemo(() => {
    // 원본 합계 (참고용)
    const originalSubtotal = items.reduce(
      (sum, item) => sum + calcItemTotal(item),
      0,
    );
    // 행별 할인 적용 후 견적가 합 = 실제 청구액
    const subtotal = items.reduce(
      (sum, item) => sum + calcItemDisplayTotal(item, discountRate),
      0,
    );
    const discountAmount = originalSubtotal - subtotal;
    const afterDiscount = subtotal;

    // 절삭 적용
    const afterTruncation = applyTruncation(afterDiscount, truncation);
    const truncationAmount = afterDiscount - afterTruncation;
    
    // 부가세 포함 기준: 총액 = 공급가액 + 부가세, 총액이 afterTruncation
    // 공급가액 = afterTruncation / 1.1 (소수점 반올림)
    // 부가세 = afterTruncation - 공급가액
    const supplyAmount = Math.round(afterTruncation / 1.1);
    const vat = afterTruncation - supplyAmount;

    return {
      subtotal,
      discountAmount,
      discountRate,
      truncation,
      truncationAmount,
      supplyAmount,
      vat,
      grandTotal: afterTruncation,
      itemCount: items.length,
    };
  }, [items, discountRate, truncation]);

  return {
    items,
    discountRate,
    truncation,
    totals,
    addItem,
    removeItem,
    updateQuantity,
    updateUnitPrice,
    updateName,
    updateDiscountRate,
    updateTruncation,
    clearAll,
  };
}
