import React from 'react';
import { WatermarkConfig } from '../../../types/effects';
import { BoundingBox } from '../../preview/BoundingBox';
import './WatermarkPreview.css';

interface WatermarkPreviewProps {
  effect: WatermarkConfig;
  isSelected: boolean;
  onClick: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
}

type MixBlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export const WatermarkPreview: React.FC<WatermarkPreviewProps> = ({
  effect,
  isSelected,
  onClick,
  onPositionChange,
  onSizeChange
}) => {
  // GlobalCompositeOperationをCSSのmix-blend-modeに変換
  const convertBlendMode = (mode: GlobalCompositeOperation): MixBlendMode => {
    const modeMap: Record<GlobalCompositeOperation, MixBlendMode> = {
      'source-over': 'normal',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'darken': 'darken',
      'lighten': 'lighten',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'hard-light': 'hard-light',
      'soft-light': 'soft-light',
      'difference': 'difference',
      'exclusion': 'exclusion',
      'hue': 'hue',
      'saturation': 'saturation',
      'color': 'color',
      'luminosity': 'luminosity',
      'source-in': 'normal',
      'source-out': 'normal',
      'source-atop': 'normal',
      'destination-over': 'normal',
      'destination-in': 'normal',
      'destination-out': 'normal',
      'destination-atop': 'normal',
      'lighter': 'normal',
      'copy': 'normal',
      'xor': 'normal'
    };
    return modeMap[mode] || 'normal';
  };

  return (
    <div
      className={`watermark-preview ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="watermark-preview-content">
        <BoundingBox
          position={effect.position}
          size={effect.size}
          onPositionChange={onPositionChange}
          onSizeChange={onSizeChange}
        >
          <img
            src={effect.image.src}
            alt="ウォーターマーク"
            style={{
              width: '100%',
              height: '100%',
              opacity: effect.opacity,
              mixBlendMode: convertBlendMode(effect.blendMode)
            }}
          />
        </BoundingBox>
      </div>
      <div className="watermark-preview-info">
        <span>ウォーターマーク</span>
        <span>不透明度: {Math.round(effect.opacity * 100)}%</span>
      </div>
    </div>
  );
}; 