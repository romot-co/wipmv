import React from 'react';

interface RangeSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

/**
 * レンジスライダーコンポーネント
 * 数値の範囲選択が可能
 */
export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium">{label}</label>
        <span className="text-sm text-gray-500">
          {value}
          {unit}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{min}</span>
        <input
          type="range"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="flex-1"
        />
        <span className="text-xs text-gray-500">{max}</span>
      </div>
    </div>
  );
}; 