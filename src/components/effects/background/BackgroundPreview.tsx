import React from 'react';
import { BackgroundEffectConfig } from '../../../types/effects';
import './BackgroundPreview.css';

interface BackgroundPreviewProps {
  effect: BackgroundEffectConfig;
  isSelected: boolean;
  onClick: () => void;
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

export const BackgroundPreview: React.FC<BackgroundPreviewProps> = ({
  effect,
  isSelected,
  onClick
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
      className={`background-preview ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div
        className="background-preview-content"
        style={{
          backgroundColor: effect.type === 'color' ? effect.color : undefined,
          backgroundImage: effect.type === 'image' ? `url(${effect.image.src})` : undefined,
          opacity: effect.opacity,
          mixBlendMode: convertBlendMode(effect.blendMode)
        }}
      />
      <div className="background-preview-info">
        <span>{effect.type === 'color' ? '色背景' : '画像背景'}</span>
        <span>不透明度: {Math.round(effect.opacity * 100)}%</span>
      </div>
    </div>
  );
}; 