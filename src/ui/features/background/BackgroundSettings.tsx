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
        newConfig.gradientColors = ['#000000', '#ffffff'];
        newConfig.gradientDirection = 'horizontal';
        break;
    }

    onChange(newConfig);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!config.gradientColors) return;
    const newColors = [...config.gradientColors];
    newColors[index] = color;
    onChange({
      gradientColors: newColors
    });
  };

  const handleGradientDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      gradientDirection: e.target.value as 'horizontal' | 'vertical' | 'radial'
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

      {config.backgroundType === 'gradient' && config.gradientColors && (
        <>
          <div className="setting-group">
            <label>グラデーション開始色</label>
            <div className="color-picker">
              <input
                type="color"
                value={config.gradientColors[0]}
                onChange={(e) => handleGradientChange(0, e.target.value)}
              />
              <input
                type="text"
                value={config.gradientColors[0]}
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
                value={config.gradientColors[1]}
                onChange={(e) => handleGradientChange(1, e.target.value)}
              />
              <input
                type="text"
                value={config.gradientColors[1]}
                onChange={(e) => handleGradientChange(1, e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>
          <div className="setting-group">
            <label>グラデーション方向</label>
            <select
              value={config.gradientDirection}
              onChange={handleGradientDirectionChange}
            >
              <option value="horizontal">水平</option>
              <option value="vertical">垂直</option>
              <option value="radial">放射状</option>
            </select>
          </div>
        </>
      )}

      <div className="setting-group">
        <label>不透明度</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.opacity ?? 1}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
        />
        <span>{config.opacity ?? 1}</span>
      </div>

      <div className="setting-group">
        <label>ブレンドモード</label>
        <select
          value={config.blendMode ?? 'source-over'}
          onChange={(e) => onChange({ blendMode: e.target.value as GlobalCompositeOperation })}
        >
          <option value="source-over">通常</option>
          <option value="multiply">乗算</option>
          <option value="screen">スクリーン</option>
          <option value="overlay">オーバーレイ</option>
          <option value="darken">暗く</option>
          <option value="lighten">明るく</option>
        </select>
      </div>
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