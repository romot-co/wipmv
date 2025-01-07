import React from 'react';

interface BackgroundColorPickerProps {
  onColorChange: (color: string) => void;
  className?: string;
}

export const BackgroundColorPicker: React.FC<BackgroundColorPickerProps> = ({ onColorChange, className }) => {
  return (
    <div className={className}>
      <h3>背景色を選択</h3>
      <input
        type="color"
        defaultValue="#000000"
        onChange={(e) => onColorChange(e.target.value)}
      />
    </div>
  );
}; 