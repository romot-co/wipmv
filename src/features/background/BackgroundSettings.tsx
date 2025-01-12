import React from 'react';
import { BackgroundEffectConfig, BackgroundType } from '../../core/types';

interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<BackgroundEffectConfig>) => void;
}

/**
 * 背景エフェクトの設定UI
 */
export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleTypeChange = (backgroundType: BackgroundType) => {
    onChange({ backgroundType });
  };

  const handleColorChange = (color: string) => {
    onChange({ color });
  };

  const handleImageUrlChange = (imageUrl: string) => {
    onChange({ imageUrl });
  };

  const handleGradientChange = (colors: string[], angle: number) => {
    onChange({ gradient: { colors, angle } });
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">背景タイプ</label>
        <select
          value={config.backgroundType}
          onChange={(e) => handleTypeChange(e.target.value as BackgroundType)}
          className="w-full p-2 border rounded"
        >
          <option value="color">単色</option>
          <option value="image">画像</option>
          <option value="gradient">グラデーション</option>
        </select>
      </div>

      {config.backgroundType === 'color' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">色</label>
          <input
            type="color"
            value={config.color || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {config.backgroundType === 'image' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">画像URL</label>
          <input
            type="text"
            value={config.imageUrl || ''}
            onChange={(e) => handleImageUrlChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full p-2 border rounded"
          />
        </div>
      )}

      {config.backgroundType === 'gradient' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">グラデーション</label>
          <div className="space-y-2">
            <div>
              <label className="block text-xs mb-1">開始色</label>
              <input
                type="color"
                value={config.gradient?.colors[0] || '#000000'}
                onChange={(e) => handleGradientChange(
                  [e.target.value, config.gradient?.colors[1] || '#ffffff'],
                  config.gradient?.angle || 0
                )}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">終了色</label>
              <input
                type="color"
                value={config.gradient?.colors[1] || '#ffffff'}
                onChange={(e) => handleGradientChange(
                  [config.gradient?.colors[0] || '#000000', e.target.value],
                  config.gradient?.angle || 0
                )}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs mb-1">角度 ({config.gradient?.angle || 0}°)</label>
              <input
                type="range"
                min="0"
                max="360"
                value={config.gradient?.angle || 0}
                onChange={(e) => handleGradientChange(
                  config.gradient?.colors || ['#000000', '#ffffff'],
                  parseInt(e.target.value)
                )}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 