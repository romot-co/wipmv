import React from 'react';
import { TextEffectConfig } from '../../../core/types';
import '../../EffectSettings.css';

interface TextSettingsProps {
  config: TextEffectConfig;
  onChange: (newConfig: Partial<TextEffectConfig>) => void;
}

export const TextSettings: React.FC<TextSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="effect-settings">
      <div className="setting-group">
        <label>テキスト</label>
        <textarea
          value={config.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={3}
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
          <option value="Meiryo">メイリオ</option>
          <option value="MS Gothic">ＭＳ ゴシック</option>
          <option value="MS Mincho">ＭＳ 明朝</option>
          <option value="Yu Gothic">游ゴシック</option>
          <option value="Yu Mincho">游明朝</option>
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
        <label>フォントの太さ</label>
        <select
          value={config.fontWeight}
          onChange={(e) => onChange({ fontWeight: e.target.value })}
        >
          <option value="normal">通常</option>
          <option value="bold">太字</option>
          <option value="100">Thin (100)</option>
          <option value="300">Light (300)</option>
          <option value="400">Regular (400)</option>
          <option value="500">Medium (500)</option>
          <option value="700">Bold (700)</option>
          <option value="900">Black (900)</option>
        </select>
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
                  x: Number(e.target.value),
                  y: config.position.y
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
                  x: config.position.x,
                  y: Number(e.target.value)
                }
              })}
            />
          </div>
        </div>
      </div>

      <div className="setting-group">
        <label>テキストの配置</label>
        <select
          value={config.alignment ?? 'left'}
          onChange={(e) => onChange({ alignment: e.target.value as 'left' | 'center' | 'right' })}
        >
          <option value="left">左揃え</option>
          <option value="center">中央揃え</option>
          <option value="right">右揃え</option>
        </select>
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