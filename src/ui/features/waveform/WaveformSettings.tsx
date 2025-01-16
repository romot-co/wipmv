import React from 'react';
import { WaveformEffectConfig, EffectType } from '../../../core/types';
import '../../EffectSettings.css';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<WaveformEffectConfig>) => void;
}

export const WaveformSettings: React.FC<WaveformSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="effect-settings">
      <div className="setting-group">
        <label>波形種別</label>
        <select
          value={config.waveformType}
          onChange={(e) => onChange({ waveformType: e.target.value as WaveformEffectConfig['waveformType'] })}
        >
          <option value="bar">バー</option>
          <option value="line">ライン</option>
          <option value="circle">サークル</option>
        </select>
      </div>

      <div className="setting-group">
        <label>バーの幅</label>
        <div className="range-input">
          <input
            type="range"
            min="1"
            max="50"
            value={config.barWidth}
            onChange={(e) => onChange({ barWidth: Number(e.target.value) })}
          />
          <span>{config.barWidth}px</span>
        </div>
      </div>

      <div className="setting-group">
        <label>バーの間隔</label>
        <div className="range-input">
          <input
            type="range"
            min="0"
            max="20"
            value={config.barGap}
            onChange={(e) => onChange({ barGap: Number(e.target.value) })}
          />
          <span>{config.barGap}px</span>
        </div>
      </div>

      <div className="setting-group">
        <label>感度</label>
        <div className="range-input">
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={config.sensitivity}
            onChange={(e) => onChange({ sensitivity: Number(e.target.value) })}
          />
          <span>{config.sensitivity}</span>
        </div>
      </div>

      <div className="setting-group">
        <label>波形の色</label>
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
        <label>スムージング</label>
        <div className="range-input">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.smoothingFactor ?? 0.5}
            onChange={(e) => onChange({ smoothingFactor: Number(e.target.value) })}
          />
          <span>{config.smoothingFactor ?? 0.5}</span>
        </div>
      </div>

      <div className="setting-group">
        <label>ミラーモード</label>
        <div className="checkbox-group">
          <input
            type="checkbox"
            checked={config.mirror ?? false}
            onChange={(e) => onChange({ mirror: e.target.checked })}
          />
        </div>
      </div>

      <div className="setting-group">
        <label>カラーバンド</label>
        <div className="checkbox-group">
          <input
            type="checkbox"
            checked={config.useColorBands ?? false}
            onChange={(e) => onChange({ useColorBands: e.target.checked })}
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