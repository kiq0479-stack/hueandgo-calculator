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
      prefix = `${val} `;
      break;
    }
  }

  // 2. 사이즈(mm) suffix
  const optionStr = Object.values(selectedOptions).join(' ');
  const sizeMatch = optionStr.match(/(\d+)\s*mm/i);
  const suffix = sizeMatch ? ` (${sizeMatch[1]}mm)` : '';

  return `${prefix}${base}${suffix}`;
}
