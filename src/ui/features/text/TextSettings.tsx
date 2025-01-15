import React from 'react';
import { TextEffectConfig } from '../../../core/types';

interface TextSettingsProps {
  config: TextEffectConfig;
  onChange: (newConfig: Partial<TextEffectConfig>) => void;
}

export const TextSettings: React.FC<TextSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="text-settings">
      <div className="setting-group">
        <label>テキスト</label>
        <textarea
          value={config.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
          className="text-input"
        />
      </div>

      <div className="setting-group">
        <label>フォント</label>
        <select
          value={config.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
        </select>
      </div>

      <div className="setting-group">
        <label>フォントサイズ</label>
        <div className="range-input">
          <input
            type="range"
            min="8"
            max="72"
            value={config.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
          <span>{config.fontSize}px</span>
        </div>
      </div>

      <div className="setting-group">
        <label>テキストカラー</label>
        <div className="color-picker">
          <input
            type="color"
            value={config.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
          <input
            type="text"
            value={config.color}
            onChange={(e) => onChange({ color: e.target.value })}
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </div>

      <div className="setting-group">
        <label>テキストの位置</label>
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
.text-settings {
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

.text-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
}

.setting-group select {
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
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.position-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.position-inputs input[type="number"] {
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
`;
document.head.appendChild(style); 