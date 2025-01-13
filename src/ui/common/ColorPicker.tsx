import React from 'react';

export interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

/**
 * カラーピッカーコンポーネント
 * ラベル付きのカラー入力を提供
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <label>
      {label}:
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}; 