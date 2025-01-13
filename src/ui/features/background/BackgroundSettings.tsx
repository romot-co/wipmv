import React from 'react';
import { BackgroundEffectConfig, EffectConfig } from '../../../core/types';
import { ColorPicker } from '../../common/ColorPicker';
import { ImageUploader } from '../../common/ImageUploader';
import { RangeSlider } from '../../common/RangeSlider';

interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

/**
 * 背景エフェクトの設定UIコンポーネント
 * 背景タイプ（単色・画像・グラデーション）に応じた設定項目を提供
 */
export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ backgroundType: event.target.value as 'color' | 'image' | 'gradient' });
  };

  const handleColorChange = (color: string) => {
    onChange({ color });
  };

  const handleImageUrlChange = (url: string) => {
    onChange({ imageUrl: url });
  };

  const handleGradientChange = (colors: string[], angle: number) => {
    onChange({ gradient: { colors, angle } });
  };

  return (
    <div className="background-settings">
      <div className="setting-group">
        <label>
          背景タイプ:
          <select
            value={config.backgroundType}
            onChange={handleTypeChange}
          >
            <option value="color">単色</option>
            <option value="image">画像</option>
            <option value="gradient">グラデーション</option>
          </select>
        </label>
      </div>

      {config.backgroundType === 'color' && (
        <div className="setting-group">
          <ColorPicker
            label="色"
            value={config.color || '#000000'}
            onChange={handleColorChange}
          />
        </div>
      )}

      {config.backgroundType === 'image' && (
        <div className="setting-group">
          <ImageUploader
            label="画像"
            value={config.imageUrl || ''}
            onChange={handleImageUrlChange}
            accept="image/*"
            placeholder="https://example.com/image.jpg"
          />
        </div>
      )}

      {config.backgroundType === 'gradient' && (
        <div className="setting-group">
          <label>グラデーション設定</label>
          <div className="gradient-colors">
            {config.gradient?.colors.map((color, index) => (
              <div key={index} className="gradient-color">
                <ColorPicker
                  value={color}
                  onChange={(newColor) => {
                    const newColors = [...(config.gradient?.colors || [])];
                    newColors[index] = newColor;
                    handleGradientChange(newColors, config.gradient?.angle || 0);
                  }}
                />
                {index > 1 && (
                  <button
                    onClick={() => {
                      const newColors = [...(config.gradient?.colors || [])];
                      newColors.splice(index, 1);
                      handleGradientChange(newColors, config.gradient?.angle || 0);
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => {
                const newColors = [...(config.gradient?.colors || []), '#ffffff'];
                handleGradientChange(newColors, config.gradient?.angle || 0);
              }}
            >
              色を追加
            </button>
          </div>
          <RangeSlider
            label="角度"
            min={0}
            max={360}
            value={config.gradient?.angle || 0}
            onChange={(value) => {
              handleGradientChange(
                config.gradient?.colors || [],
                value
              );
            }}
            unit="°"
          />
        </div>
      )}
    </div>
  );
}; 