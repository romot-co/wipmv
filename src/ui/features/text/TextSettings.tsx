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
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ text: e.target.value });
  };

  const handleStyleChange = (
    key: keyof TextEffectConfig['style'],
    value: string | number
  ) => {
    onChange({
      style: {
        ...config.style,
        [key]: value
      }
    });
  };

  const handlePositionChange = (
    key: keyof TextEffectConfig['position'],
    value: number
  ) => {
    onChange({
      position: {
        ...config.position,
        [key]: value
      }
    });
  };

  return (
    <div className="text-settings">
      <div className="setting-group">
        <label>テキスト</label>
        <textarea
          value={config.text}
          onChange={handleTextChange}
          rows={3}
          placeholder="テキストを入力..."
        />
      </div>

      <div className="setting-group">
        <label>フォント設定</label>
        <select
          value={config.style.fontFamily}
          onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>

      <div className="setting-group">
        <label>フォントサイズ</label>
        <input
          type="number"
          value={config.style.fontSize}
          onChange={(e) => handleStyleChange('fontSize', Number(e.target.value))}
          min={1}
          max={200}
        />
      </div>

      <div className="setting-group">
        <label>フォントウェイト</label>
        <select
          value={config.style.fontWeight}
          onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
        >
          <option value="normal">Normal</option>
          <option value="bold">Bold</option>
          <option value="lighter">Lighter</option>
        </select>
      </div>

      <div className="setting-group">
        <label>テキストカラー</label>
        <input
          type="color"
          value={config.style.color}
          onChange={(e) => handleStyleChange('color', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>ストロークカラー</label>
        <input
          type="color"
          value={config.style.strokeColor || '#000000'}
          onChange={(e) => handleStyleChange('strokeColor', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>ストローク幅</label>
        <input
          type="number"
          value={config.style.strokeWidth}
          onChange={(e) => handleStyleChange('strokeWidth', Number(e.target.value))}
          min={0}
          max={20}
        />
      </div>

      <div className="setting-group">
        <label>テキストの配置</label>
        <select
          value={config.style.align}
          onChange={(e) => handleStyleChange('align', e.target.value)}
        >
          <option value="left">左揃え</option>
          <option value="center">中央揃え</option>
          <option value="right">右揃え</option>
        </select>
      </div>

      <div className="setting-group">
        <label>ベースライン</label>
        <select
          value={config.style.baseline}
          onChange={(e) => handleStyleChange('baseline', e.target.value)}
        >
          <option value="top">上</option>
          <option value="middle">中央</option>
          <option value="bottom">下</option>
        </select>
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

.setting-group textarea,
.setting-group select,
.setting-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.setting-group textarea {
  resize: vertical;
  min-height: 80px;
}

.setting-group input[type="color"] {
  width: 100%;
  height: 40px;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.setting-group input[type="number"] {
  width: 100px;
}
`;
document.head.appendChild(style); 