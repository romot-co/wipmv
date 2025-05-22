import React from 'react';

export interface RangeSliderProps {
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
 * 数値の範囲入力を提供
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
  return (
    <label>
      {label}:
      <div className="range-slider">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="range-value">
          {value}{unit}
        </span>
      </div>
    </label>
  );
};
