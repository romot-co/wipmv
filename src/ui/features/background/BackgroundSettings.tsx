import React from 'react';
import { BackgroundEffectConfig } from '../../../core/types';

interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<BackgroundEffectConfig>) => void;
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({
  config,
  onChange
}) => {
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('BackgroundSettings: handleTypeChange', e.target.value);
    const newType = e.target.value as BackgroundEffectConfig['backgroundType'];
    const newConfig: Partial<BackgroundEffectConfig> = {
      backgroundType: newType
    };

    // 新しいタイプに応じてデフォルト値を設定
    switch (newType) {
      case 'color':
        newConfig.color = '#000000';
        break;
      case 'image':
        newConfig.imageUrl = '';
        break;
      case 'gradient':
        newConfig.gradient = {
          colors: ['#000000', '#ffffff'],
          angle: 0
        };
        break;
    }

    console.log('BackgroundSettings: handleTypeChange - newConfig', newConfig);
    onChange(newConfig);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('BackgroundSettings: handleColorChange', e.target.value);
    onChange({ color: e.target.value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // FileをData URLに変換
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onChange({ imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  };

  const handleGradientChange = (
    index: number,
    color: string
  ) => {
    if (!config.gradient) return;
    const newColors = [...config.gradient.colors];
    newColors[index] = color;
    onChange({
      gradient: {
        ...config.gradient,
        colors: newColors
      }
    });
  };

  const handleGradientAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config.gradient) return;
    onChange({
      gradient: {
        ...config.gradient,
        angle: Number(e.target.value)
      }
    });
  };

  return (
    <div className="background-settings">
      <div className="setting-group">
        <label>背景タイプ</label>
        <select value={config.backgroundType} onChange={handleTypeChange}>
          <option value="color">単色</option>
          <option value="image">画像</option>
          <option value="gradient">グラデーション</option>
        </select>
      </div>

      {config.backgroundType === 'color' && (
        <div className="setting-group">
          <label>背景色</label>
          <div className="color-picker">
            <input
              type="color"
              value={config.color || '#000000'}
              onChange={handleColorChange}
            />
            <input
              type="text"
              value={config.color || '#000000'}
              onChange={(e) => onChange({ color: e.target.value })}
              pattern="^#[0-9A-Fa-f]{6}$"
            />
          </div>
        </div>
      )}

      {config.backgroundType === 'image' && (
        <div className="setting-group">
          <label>画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
          {config.imageUrl && (
            <div className="image-preview">
              <img src={config.imageUrl} alt="背景プレビュー" />
            </div>
          )}
        </div>
      )}

      {config.backgroundType === 'gradient' && config.gradient && (
        <>
          <div className="setting-group">
            <label>グラデーション開始色</label>
            <div className="color-picker">
              <input
                type="color"
                value={config.gradient.colors[0]}
                onChange={(e) => handleGradientChange(0, e.target.value)}
              />
              <input
                type="text"
                value={config.gradient.colors[0]}
                onChange={(e) => handleGradientChange(0, e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
          <div className="setting-group">
            <label>グラデーション終了色</label>
            <div className="color-picker">
              <input
                type="color"
                value={config.gradient.colors[1]}
                onChange={(e) => handleGradientChange(1, e.target.value)}
              />
              <input
                type="text"
                value={config.gradient.colors[1]}
                onChange={(e) => handleGradientChange(1, e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
          <div className="setting-group">
            <label>グラデーション角度</label>
            <div className="range-input">
              <input
                type="range"
                min="0"
                max="360"
                value={config.gradient.angle}
                onChange={handleGradientAngleChange}
              />
              <span>{config.gradient.angle}°</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// スタイルの追加
const style = document.createElement('style');
style.textContent = `
.background-settings {
  padding: 1rem;
}

.setting-group {
  margin-bottom: 1rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.setting-group select,
.setting-group input[type="text"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.color-picker input[type="color"] {
  width: 50px;
  height: 40px;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.color-picker input[type="text"] {
  flex: 1;
}

.file-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
}

.image-preview {
  margin-top: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  max-width: 100%;
  height: auto;
  display: block;
}

.range-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.range-input input[type="range"] {
  flex: 1;
}

.range-input span {
  min-width: 3em;
  text-align: right;
  font-size: 0.9rem;
  color: #666;
}
`;
document.head.appendChild(style); 