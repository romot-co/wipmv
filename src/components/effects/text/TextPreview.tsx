import React from 'react';
import { TextEffectData } from '../../../types/effects';
import { BoundingBox } from '../../preview/BoundingBox';
import './TextPreview.css';

interface TextPreviewProps {
  effect: TextEffectData;
  isSelected: boolean;
  onClick: () => void;
  onPositionChange: (newPos: { x: number; y: number }) => void;
}

export const TextPreview: React.FC<TextPreviewProps> = ({
  effect,
  isSelected,
  onClick,
  onPositionChange
}) => {
  return (
    <div
      className={`text-preview-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <BoundingBox
        position={effect.position}
        size={{ width: effect.fontSize * effect.text.length, height: effect.fontSize }}
        onPositionChange={onPositionChange}
      >
        <div
          style={{
            fontFamily: effect.font,
            fontSize: `${effect.fontSize}px`,
            color: effect.color,
            opacity: effect.opacity
          }}
        >
          {effect.text}
        </div>
      </BoundingBox>
    </div>
  );
}; 