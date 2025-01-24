import React, { useState, useEffect, memo } from 'react';
import { Flex } from '@radix-ui/themes';

/**
 * カラー入力のプロパティ
 */
interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

// カラーコードのバリデーション
const isValidColorCode = (color: string): boolean => {
  // #RGB, #RRGGBB, #RGBA, #RRGGBBAのいずれかの形式をサポート
  const colorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  return colorRegex.test(color);
};

// 3桁のカラーコードを6桁に変換
const expandShorthandColor = (color: string): string => {
  if (color.length === 4) { // #RGB
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  if (color.length === 5) { // #RGBA
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}${color[4]}${color[4]}`;
  }
  return color;
};

/**
 * カラー入力コンポーネント
 * - カラーピッカーとテキスト入力の組み合わせ
 * - #RGB, #RRGGBB, #RGBA, #RRGGBBAA形式をサポート
 * - バリデーション機能付き
 */
export const ColorInput = memo<ColorInputProps>(({
  value,
  onChange,
  className,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = e.target.value;
    setInputValue(newValue);

    if (isValidColorCode(newValue)) {
      setIsValid(true);
      onChange(expandShorthandColor(newValue));
    } else {
      setIsValid(false);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValid(true);
    onChange(newValue);
  };

  return (
    <Flex gap="3" align="center">
      <input
        type="color"
        value={value}
        onChange={handleColorChange}
        className={`color-picker ${className || ''}`}
        disabled={disabled}
      />
      <input
        type="text"
        value={inputValue}
        onChange={handleTextChange}
        className={`color-input ${!isValid ? 'invalid' : ''} ${className || ''}`}
        style={{ borderColor: isValid ? undefined : 'red' }}
        disabled={disabled}
      />
    </Flex>
  );
});

ColorInput.displayName = 'ColorInput'; 