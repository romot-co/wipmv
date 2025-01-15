import React from 'react';
import { WatermarkEffectConfig, Size2D } from '../../../core/types';

interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<WatermarkEffectConfig>) => void;
}

export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  config,
  onChange
}) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onChange({ imageUrl: dataUrl });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to load watermark image:', error);
    }
  };

  const handleSizeChange = (
    key: keyof Size2D,
    value: number
  ) => {
    if (!config.size) return;
    const newSize: Size2D = {
      width: key === 'width' ? value : config.size.width,
      height: key === 'height' ? value : config.size.height
    };
    onChange({ size: newSize });
  };

  return (
    <div className="watermark-settings">
      <div className="setting-group">
        <label>ウォーターマーク画像</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file-input"
        />
        {config.imageUrl && (
          <div className="image-preview">
            <img src={config.imageUrl} alt="ウォーターマークプレビュー" />
          </div>
        )}
      </div>

      <div className="setting-group">
        <label>位置</label>
        <div className="position-inputs">
          <div>
            <label>X座標</label>
            <input
              type="number"
              value={config.position.x}
              onChange={(e) => onChange({
                position: {
                  ...config.position,
                  x: Number(e.target.value)
                }
              })}
            />
          </div>
          <div>
            <label>Y座標</label>
            <input
              type="number"
              value={config.position.y}
              onChange={(e) => onChange({
                position: {
                  ...config.position,
                  y: Number(e.target.value)
                }
              })}
            />
          </div>
        </div>
      </div>

      {config.size && (
        <div className="setting-group">
          <label>サイズ</label>
          <div className="size-inputs">
            <div>
              <label>幅</label>
              <input
                type="number"
                value={config.size.width}
                onChange={(e) => handleSizeChange('width', Number(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <label>高さ</label>
              <input
                type="number"
                value={config.size.height}
                onChange={(e) => handleSizeChange('height', Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
        </div>
      )}

      <div className="setting-group">
        <label>回転角度</label>
        <div className="range-input">
          <input
            type="range"
            min="-180"
            max="180"
            value={config.rotation ?? 0}
            onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          />
          <span>{config.rotation ?? 0}°</span>
        </div>
      </div>

      <div className="setting-group">
        <label>タイル表示</label>
        <div className="checkbox-group">
          <input
            type="checkbox"
            checked={config.tiled ?? false}
            onChange={(e) => onChange({ tiled: e.target.checked })}
          />
          {config.tiled && (
            <div className="tile-spacing">
              <label>タイル間隔</label>
              <input
                type="number"
                value={config.tileSpacing ?? 0}
                onChange={(e) => onChange({ tileSpacing: Number(e.target.value) })}
                min={0}
              />
            </div>
          )}
        </div>
      </div>

      <div className="setting-group">
        <label>不透明度</label>
        <div className="range-input">
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

.position-inputs,
.size-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.position-inputs input[type="number"],
.size-inputs input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
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

select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.checkbox-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.checkbox-group input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin: 0;
}

.tile-spacing {
  flex: 1;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tile-spacing label {
  margin: 0;
}

.tile-spacing input[type="number"] {
  width: 80px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
`;
document.head.appendChild(style); 