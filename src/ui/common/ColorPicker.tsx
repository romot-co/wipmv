import React from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  alpha?: boolean;
}

/**
 * カラーピッカーコンポーネント
 * 色の選択とアルファ値の調整が可能
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  alpha = false,
}) => {
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = value.startsWith('#')
      ? value
      : value.replace(/[^,]+(?=\))/, e.target.value);
    onChange(color);
  };

  const getAlphaValue = (): number => {
    if (value.startsWith('rgba')) {
      const match = value.match(/[^,]+(?=\))/);
      return match ? parseFloat(match[0]) : 1;
    }
    return 1;
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="color"
            value={value.startsWith('#') ? value : '#000000'}
            onChange={handleColorChange}
            className="w-full"
          />
        </div>
        {alpha && (
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={getAlphaValue()}
              onChange={handleAlphaChange}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}; 