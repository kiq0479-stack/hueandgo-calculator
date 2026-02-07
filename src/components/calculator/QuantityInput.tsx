'use client';

interface QuantityInputProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityInput({
  quantity,
  onChange,
  min = 1,
  max = 99999,
}: QuantityInputProps) {
  function handleChange(value: number) {
    const clamped = Math.max(min, Math.min(max, value));
    onChange(clamped);
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-gray-700">수량</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleChange(quantity - 1)}
          disabled={quantity <= min}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          -
        </button>
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleChange(Number(e.target.value) || min)}
          min={min}
          max={max}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => handleChange(quantity + 1)}
          disabled={quantity >= max}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
        <span className="text-sm text-gray-500">개</span>
      </div>
    </div>
  );
}
