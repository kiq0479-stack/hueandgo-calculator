'use client';

import type { Cafe24ProductOption, Cafe24Variant } from '@/types/cafe24';

interface OptionSelectorProps {
  options: Cafe24ProductOption[];
  variants: Cafe24Variant[]; // 품절 체크용 variants 데이터
  selectedOptions: Record<string, string>; // { optionName: optionValue }
  onOptionChange: (optionName: string, optionValue: string, additionalAmount: string) => void;
}

// 특정 옵션값이 품절인지 확인
// 해당 옵션값을 포함하는 모든 variant가 품절(재고 0 또는 판매중지)이면 품절
function isOptionValueSoldOut(
  variants: Cafe24Variant[],
  optionName: string,
  optionValue: string,
  selectedOptions: Record<string, string>
): boolean {
  if (variants.length === 0) return false;
  
  // 해당 옵션값을 포함하고, 이미 선택된 다른 옵션도 일치하는 variant들 찾기
  const matchingVariants = variants.filter((variant) => {
    if (!variant.options) return false;
    
    // 해당 옵션값 포함 여부
    const hasThisOption = variant.options.some(
      (o) => o.name === optionName && o.value === optionValue
    );
    if (!hasThisOption) return false;
    
    // 이미 선택된 다른 옵션들과 일치하는지 확인
    for (const [selOptName, selOptValue] of Object.entries(selectedOptions)) {
      if (selOptName === optionName) continue; // 현재 확인 중인 옵션은 스킵
      const variantOpt = variant.options.find((o) => o.name === selOptName);
      if (variantOpt && variantOpt.value !== selOptValue) return false;
    }
    
    return true;
  });
  
  // 디버그: "화이트실버" 포함된 옵션 체크
  if (optionValue.includes('화이트실버')) {
    console.log(`[품절체크] "${optionValue}" 매칭 variants:`, matchingVariants.length);
    console.log(`[품절체크] 샘플:`, matchingVariants.slice(0, 3).map(v => ({
      qty: v.quantity,
      selling: v.selling,
      opts: v.options
    })));
  }
  
  // 매칭되는 variant가 없으면 품절 아님 (데이터 불완전)
  if (matchingVariants.length === 0) return false;
  
  // 모든 매칭 variant가 품절인지 확인
  return matchingVariants.every(
    (v) => v.quantity === 0 || v.selling === 'F'
  );
}

export default function OptionSelector({
  options,
  variants,
  selectedOptions,
  onOptionChange,
}: OptionSelectorProps) {
  // 디버그: variants 데이터 구조 상세 확인
  if (variants?.length > 0) {
    const sample = variants[0];
    console.log('[OptionSelector] variants 샘플:', {
      variant_code: sample.variant_code,
      quantity: sample.quantity,
      selling: sample.selling,
      options: sample.options,
    });
    // 품절인 variant 찾기
    const soldOutVariants = variants.filter(v => v.quantity === 0 || v.selling === 'F');
    console.log('[OptionSelector] 품절 variants:', soldOutVariants.length, '/', variants.length);
    if (soldOutVariants.length > 0) {
      console.log('[OptionSelector] 품절 샘플:', soldOutVariants.slice(0, 3).map(v => ({
        qty: v.quantity, selling: v.selling, opts: v.options
      })));
    }
  }
  
  if (options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700">옵션 선택</label>

      {options.map((option) => (
        <div key={option.option_code} className="space-y-1">
          <label className="block text-xs font-medium text-gray-600">
            {option.option_name}
            {option.required_option === 'T' && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </label>
          <select
            value={selectedOptions[option.option_name] || ''}
            onChange={(e) => {
              const selected = option.option_value.find(
                (v) => v.option_text === e.target.value
              );
              onOptionChange(
                option.option_name,
                e.target.value,
                selected?.additional_amount || '0'
              );
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">- [필수] 옵션을 선택해 주세요 -</option>
            {option.option_value.map((val, idx) => {
              const isSoldOut = isOptionValueSoldOut(
                variants,
                option.option_name,
                val.option_text,
                selectedOptions
              );
              
              // 디버그: 품절 체크 결과
              if (idx === 0) {
                console.log(`[OptionSelector] ${option.option_name}="${val.option_text}" → soldOut=${isSoldOut}`);
              }
              
              return (
                <option 
                  key={idx} 
                  value={val.option_text}
                  disabled={isSoldOut}
                >
                  {val.option_text}
                  {isSoldOut && ' [품절]'}
                  {!isSoldOut && Number(val.additional_amount) > 0 &&
                    ` (+${Number(val.additional_amount).toLocaleString()}원)`}
                </option>
              );
            })}
          </select>
        </div>
      ))}
    </div>
  );
}
