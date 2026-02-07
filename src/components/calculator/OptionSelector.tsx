'use client';

import type { Cafe24ProductOption, Cafe24OptionValue } from '@/types/cafe24';

interface OptionSelectorProps {
  options: Cafe24ProductOption[];
  selectedOptions: Record<string, string>; // { optionName: optionValue }
  onOptionChange: (optionName: string, optionValue: string, additionalAmount: string) => void;
}

export default function OptionSelector({
  options,
  selectedOptions,
  onOptionChange,
}: OptionSelectorProps) {
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
            <option value="">선택하세요</option>
            {option.option_value.map((val, idx) => (
              <option key={idx} value={val.option_text}>
                {val.option_text}
                {Number(val.additional_amount) > 0 &&
                  ` (+${Number(val.additional_amount).toLocaleString()}원)`}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
