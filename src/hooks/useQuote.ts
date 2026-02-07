'use client';

import { useState, useCallback, useMemo } from 'react';
import type { QuoteItem } from '@/components/calculator/Calculator';

// 견적 전체 상태
export interface QuoteState {
  items: QuoteItem[];
  discountRate: number; // 0~100 (퍼센트)
}

// 견적 합계 정보
export interface QuoteTotals {
  /** 항목별 소계 합산 (할인 전) */
  subtotal: number;
  /** 할인 금액 */
  discountAmount: number;
  /** 할인율 (0~100) */
  discountRate: number;
  /** 공급가액 (부가세 제외) */
  supplyAmount: number;
  /** 부가세 */
  vat: number;
  /** 총 합계 (부가세 포함) */
  grandTotal: number;
  /** 항목 수 */
  itemCount: number;
}

// 개별 항목의 소계 계산
export function calcItemTotal(item: QuoteItem): number {
  const addonTotal = item.addons.reduce(
    (sum, a) => sum + a.unitPrice * a.quantity,
    0
  );
  return item.unitPrice * item.quantity + addonTotal;
}

export default function useQuote() {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discountRate, setDiscountRate] = useState(0);

  // 항목 추가
  const addItem = useCallback((item: QuoteItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  // 항목 삭제
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // 항목 수량 변경
  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  }, []);

  // 항목 단가 수동 변경 (수동 조정이 필요한 경우)
  const updateUnitPrice = useCallback((id: string, unitPrice: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unitPrice: Math.max(0, unitPrice) } : item
      )
    );
  }, []);

  // 할인율 변경 (0~100)
  const updateDiscountRate = useCallback((rate: number) => {
    setDiscountRate(Math.max(0, Math.min(100, rate)));
  }, []);

  // 전체 초기화
  const clearAll = useCallback(() => {
    setItems([]);
    setDiscountRate(0);
  }, []);

  // 합계 계산
  const totals: QuoteTotals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + calcItemTotal(item), 0);
    const discountAmount = Math.round(subtotal * (discountRate / 100));
    const afterDiscount = subtotal - discountAmount;
    // 부가세 포함 기준: 총액 = 공급가액 + 부가세, 총액이 afterDiscount
    // 공급가액 = afterDiscount / 1.1 (소수점 반올림)
    // 부가세 = afterDiscount - 공급가액
    const supplyAmount = Math.round(afterDiscount / 1.1);
    const vat = afterDiscount - supplyAmount;

    return {
      subtotal,
      discountAmount,
      discountRate,
      supplyAmount,
      vat,
      grandTotal: afterDiscount,
      itemCount: items.length,
    };
  }, [items, discountRate]);

  return {
    items,
    discountRate,
    totals,
    addItem,
    removeItem,
    updateQuantity,
    updateUnitPrice,
    updateDiscountRate,
    clearAll,
  };
}
