'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { SettingsKey } from '@/lib/supabase';

interface UseSharedSettingsResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  save: (value: T) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * 공유 설정을 서버에서 로드/저장하는 훅
 * @param key 설정 키
 * @param defaultValue 기본값 (서버에 데이터가 없을 때)
 */
export function useSharedSettings<T>(
  key: SettingsKey,
  defaultValue: T
): UseSharedSettingsResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 저장 debounce를 위한 ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/settings?key=${key}`);
      if (!res.ok) throw new Error('Failed to fetch settings');

      const json = await res.json();
      setData(json.data ?? defaultValue);
    } catch (err) {
      console.error(`Failed to load ${key}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      // 서버 로드 실패 시 localStorage fallback
      const localData = localStorage.getItem(`hueandgo_${key}`);
      if (localData) {
        try {
          setData(JSON.parse(localData));
        } catch {
          setData(defaultValue);
        }
      } else {
        setData(defaultValue);
      }
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveToServer = useCallback(async (value: T) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      // localStorage도 업데이트 (오프라인 fallback용)
      localStorage.setItem(`hueandgo_${key}`, JSON.stringify(value));
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
      // 서버 저장 실패해도 localStorage는 저장
      localStorage.setItem(`hueandgo_${key}`, JSON.stringify(value));
      throw err;
    }
  }, [key]);

  const save = useCallback(async (value: T) => {
    // 즉시 로컬 상태 업데이트 (낙관적 업데이트)
    setData(value);
    pendingValueRef.current = value;

    // Debounce: 500ms 후 서버 저장
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (pendingValueRef.current !== null) {
        try {
          await saveToServer(pendingValueRef.current);
        } catch {
          // 에러는 이미 로깅됨
        }
      }
    }, 500);
  }, [saveToServer]);

  // 컴포넌트 언마운트 시 pending save 처리
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // 언마운트 시 즉시 저장
        if (pendingValueRef.current !== null) {
          saveToServer(pendingValueRef.current).catch(() => {});
        }
      }
    };
  }, [saveToServer]);

  return {
    data,
    loading,
    error,
    save,
    refresh: fetchData,
  };
}

// 브랜디즈 양식 설정 타입
export interface BrandizFormSettings {
  stampTop: number;
  stampRight: number;
  stampSize: number;
  leftWidth: number;
  bizLabelWidth: number;
  colWidths: {
    no: number;
    spec: number;
    qty: number;
    price: number;
    total: number;
    note: number;
  };
  memoText: string;
  bizAddress: string;
  bizName: string;
  bizCeo: string;
  bizPhone: string;
}

// 호탱감탱 양식 설정 타입
export interface HotangFormSettings {
  descLine1: string;
  descLine2: string;
  bizRegNo: string;
  bizName: string;
  bizCeo: string;
  bizAddress: string;
  bizType: string;
  bizItem: string;
  bizPhone: string;
  memoText: string;
  stampTop: number;
  stampRight: number;
  stampSize: number;
  leftWidth: number;
}

// 기본값들
export const DEFAULT_BRANDIZ_FORM: BrandizFormSettings = {
  stampTop: 18,
  stampRight: 8,
  stampSize: 40,
  leftWidth: 30,
  bizLabelWidth: 55,
  colWidths: { no: 26, spec: 32, qty: 55, price: 65, total: 75, note: 28 },
  memoText: '*배송은 택배시 무료입니다.',
  bizAddress: '경기도 화성시 효행로 590번길 12, 203동 701호',
  bizName: '브랜디즈',
  bizCeo: '강태호',
  bizPhone: '010-2116-2349',
};

export const DEFAULT_HOTANG_FORM: HotangFormSettings = {
  descLine1: '아크릴 굿즈 주문제작에 대하여',
  descLine2: '아래와 같이 견적합니다.',
  bizRegNo: '695-31-01497',
  bizName: '호탱감탱',
  bizCeo: '감민주',
  bizAddress: '강원특별자치도 강릉시 사천면 청솔길 48-61',
  bizType: '제조업',
  bizItem: '아크릴',
  bizPhone: '010-6255-7392',
  memoText: '*배송은 택배시 무료입니다.',
  stampTop: 0,
  stampRight: 0,
  stampSize: 40,
  leftWidth: 45,
};
