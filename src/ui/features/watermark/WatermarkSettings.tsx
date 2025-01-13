import React from 'react';
import { WatermarkEffectConfig } from '../../../core/types';

interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<WatermarkEffectConfig>) => void;
}

export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  config,
  onChange
}) => {
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ imageUrl: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          onChange({ imageUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePositionChange = (
    key: keyof WatermarkEffectConfig['position'],
    value: number
  ) => {
    onChange({
      position: {
        ...config.position,
        [key]: value
      }
    });
  };

  const handleStyleChange = (
    key: keyof WatermarkEffectConfig['style'],
    value: number | string
  ) => {
    onChange({
      style: {
        ...config.style,
        [key]: value
      }
    });
  };

  return (
    <div className="watermark-settings">
      <div className="setting-group">
        <label>画像アップロード</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>

      <div className="setting-group">
        <label>画像URL</label>
        <input
          type="text"
          value={config.imageUrl}
          onChange={handleImageUrlChange}
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="setting-group">
        <label>位置 X</label>
        <input
          type="number"
          value={config.position.x}
          onChange={(e) => handlePositionChange('x', Number(e.target.value))}
        />
      </div>

      <div className="setting-group">
        <label>位置 Y</label>
        <input
          type="number"
          value={config.position.y}
          onChange={(e) => handlePositionChange('y', Number(e.target.value))}
        />
      </div>

      <div className="setting-group">
        <label>幅</label>
        <input
          type="number"
          value={config.position.width}
          onChange={(e) => handlePositionChange('width', Number(e.target.value))}
          min={1}
        />
      </div>

      <div className="setting-group">
        <label>高さ</label>
        <input
          type="number"
          value={config.position.height}
          onChange={(e) => handlePositionChange('height', Number(e.target.value))}
          min={1}
        />
      </div>

      <div className="setting-group">
        <label>不透明度</label>
        <input
          type="range"
          value={config.style.opacity}
          onChange={(e) => handleStyleChange('opacity', Number(e.target.value))}
          min={0}
          max={1}
          step={0.1}
        />
        <span>{config.style.opacity}</span>
      </div>

      <div className="setting-group">
        <label>ブレンドモード</label>
        <select
          value={config.style.blendMode}
          onChange={(e) => handleStyleChange('blendMode', e.target.value)}
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
.watermark-settings {
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

.setting-group input[type="text"],
.setting-group input[type="number"],
.setting-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.setting-group input[type="file"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
}

.setting-group input[type="file"]::-webkit-file-upload-button {
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

.setting-group input[type="file"]::-webkit-file-upload-button:hover {
  background-color: #0056b3;
}

.setting-group input[type="range"] {
  width: 100%;
  margin-right: 1rem;
}

.setting-group input[type="number"] {
  width: 100px;
}

.setting-group span {
  font-size: 0.9rem;
  color: #666;
}
`;
document.head.appendChild(style); 