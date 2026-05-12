// 견적서 품명 생성 로직
// - 옵션명 화이트리스트 기반 prefix (예: "투명" 아크릴 키링)
// - mm 사이즈 suffix (예: 아크릴 키링 "(90mm)")

import { cleanMainProductName } from '@/lib/product-addon-mapping';

// 품명 앞에 prefix로 붙일 옵션 (옵션명 화이트리스트)
// 운영하면서 패턴 보이면 추가
export const PREFIX_OPTION_NAMES = [
  '아크릴 종류',
  '집게 종류',
] as const;

// prefix에서 제외할 옵션값 패턴 (이벤트성/행사성 옵션값)
export const PREFIX_VALUE_EXCLUDE = /이벤트|★|행사/;

// 옵션값의 마지막 단어가 본명의 마지막 단어와 같으면 중복어 제거
// 예: "한쪽 집게" + "아크릴 집게" → "한쪽" (→ "한쪽 아크릴 집게")
// 예: "원형 뱃지" + "아크릴 뱃지" → "원형" (→ "원형 아크릴 뱃지")
// 예: "오로라 (하프미러-블루)" + "오로라 아크릴 키링" → 마지막 단어 다름 → 그대로 유지
function stripDuplicateSuffix(optionValue: string, baseName: string): string {
  const vWords = optionValue.trim().split(/\s+/);
  const bWords = baseName.trim().split(/\s+/);
  if (
    vWords.length >= 2 &&
    bWords.length >= 1 &&
    vWords[vWords.length - 1] === bWords[bWords.length - 1]
  ) {
    return vWords.slice(0, -1).join(' ');
  }
  return optionValue;
}

export function buildDisplayName(
  productName: string,
  selectedOptions: Record<string, string>,
): string {
  const base = cleanMainProductName(productName);

  // 1. prefix (아크릴 종류 등)
  let prefix = '';
  for (const optName of PREFIX_OPTION_NAMES) {
    const val = selectedOptions[optName];
    if (val && !PREFIX_VALUE_EXCLUDE.test(val)) {
      prefix = `${stripDuplicateSuffix(val, base)} `;
      break;
    }
  }

  // 2. 사이즈(mm) suffix
  const optionStr = Object.values(selectedOptions).join(' ');
  const sizeMatch = optionStr.match(/(\d+)\s*mm/i);
  const suffix = sizeMatch ? ` (${sizeMatch[1]}mm)` : '';

  return `${prefix}${base}${suffix}`;
}
