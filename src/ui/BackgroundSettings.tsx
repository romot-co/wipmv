import React from 'react';
import { BackgroundEffect } from '../features/background/BackgroundEffect';
import { BackgroundEffectConfig } from '../core/types';

interface BackgroundSettingsProps {
  effect: BackgroundEffect;
  onUpdate: (config: Partial<BackgroundEffectConfig>) => void;
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  effect,
  onUpdate,
}) => {
  const config = effect.getConfig();

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ backgroundType: event.target.value as 'color' | 'image' });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ color: event.target.value });
  };

  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ imageUrl: event.target.value });
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
          </select>
        </label>
      </div>

      {config.backgroundType === 'color' && (
        <div className="setting-group">
          <label>
            色:
            <input
              type="color"
              value={config.color}
              onChange={handleColorChange}
            />
          </label>
        </div>
      )}

      {config.backgroundType === 'image' && (
        <div className="setting-group">
          <label>
            画像URL:
            <input
              type="text"
              value={config.imageUrl || ''}
              onChange={handleImageUrlChange}
              placeholder="https://example.com/image.jpg"
            />
          </label>
        </div>
      )}
    </div>
  );
}; 