import React, { useState, useEffect } from 'react';
import { Flex } from '@radix-ui/themes';

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
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

export const ColorInput: React.FC<ColorInputProps> = ({
  value,
  onChange,
  className
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      />
      <input
        type="text"
        value={inputValue}
        onChange={handleTextChange}
        className={`color-input ${!isValid ? 'invalid' : ''} ${className || ''}`}
        style={{ borderColor: isValid ? undefined : 'red' }}
      />
    </Flex>
  );
}; 