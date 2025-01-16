import React from 'react';
import { WatermarkEffectConfig } from '../../../core/types';
import '../../EffectSettings.css';

interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<WatermarkEffectConfig>) => void;
}

export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="effect-settings">
      <div className="setting-group">
        <label>画像URL</label>
        <input
          type="text"
          value={config.imageUrl}
          onChange={(e) => onChange({ imageUrl: e.target.value })}
        />
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
        <label>サイズ</label>
        <div className="size-inputs">
          <div>
            <label>幅</label>
            <input
              type="number"
              value={config.size.width}
              onChange={(e) => onChange({
                size: {
                  width: Number(e.target.value),
                  height: config.size.height
                }
              })}
            />
          </div>
          <div>
            <label>高さ</label>
            <input
              type="number"
              value={config.size.height}
              onChange={(e) => onChange({
                size: {
                  width: config.size.width,
                  height: Number(e.target.value)
                }
              })}
            />
          </div>
        </div>
      </div>

      <div className="setting-group">
        <label>回転角度</label>
        <div className="range-input">
          <input
            type="range"
            min="0"
            max="360"
            value={config.rotation ?? 0}
            onChange={(e) => onChange({ rotation: Number(e.target.value) })}
          />
          <span>{config.rotation ?? 0}°</span>
        </div>
      </div>

      <div className="setting-group">
        <label>繰り返し</label>
        <div className="checkbox-group">
          <input
            type="checkbox"
            checked={config.repeat ?? false}
            onChange={(e) => onChange({ repeat: e.target.checked })}
          />
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