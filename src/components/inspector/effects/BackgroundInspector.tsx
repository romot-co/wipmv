import React from 'react';
import { BackgroundEffectConfig, VisualEffectConfig } from '../../../types/effects';

interface BackgroundInspectorProps {
  config: VisualEffectConfig;
  onUpdate: (config: Partial<VisualEffectConfig>) => void;
}

export const BackgroundInspector: React.FC<BackgroundInspectorProps> = ({
  config,
  onUpdate
}) => {
  const backgroundConfig = config as BackgroundEffectConfig;

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'color' | 'image';
    onUpdate({ type });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ color: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      onUpdate({ image });
    } catch (error) {
      console.error('画像の読み込みに失敗:', error);
    }
  };

  return (
    <div className="background-inspector">
      <div className="setting-group">
        <label>タイプ</label>
        <select value={backgroundConfig.type} onChange={handleTypeChange}>
          <option value="color">単色</option>
          <option value="image">画像</option>
        </select>
      </div>

      {backgroundConfig.type === 'color' ? (
        <div className="setting-group">
          <label>色</label>
          <input
            type="color"
            value={backgroundConfig.color}
            onChange={handleColorChange}
          />
        </div>
      ) : (
        <div className="setting-group">
          <label>画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>
      )}
    </div>
  );
}; 