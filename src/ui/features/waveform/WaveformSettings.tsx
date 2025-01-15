import React from 'react';
import { WaveformEffectConfig } from '../../../core/types';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<WaveformEffectConfig>) => void;
}

export const WaveformSettings: React.FC<WaveformSettingsProps> = ({
  config,
  onChange
}) => {
  return (
    <div className="waveform-settings">
      <div className="setting-group">
        <label>波形タイプ</label>
        <select
          value={config.waveformType}
          onChange={(e) => onChange({ waveformType: e.target.value as WaveformEffectConfig['waveformType'] })}
        >
          <option value="line">ライン</option>
          <option value="bar">バー</option>
          <option value="circle">サークル</option>
        </select>
      </div>

      <div className="setting-group">
        <label>色</label>
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

      {config.waveformType === 'bar' && (
        <>
          <div className="setting-group">
            <label>バーの幅</label>
            <div className="range-input">
              <input
                type="range"
                min="1"
                max="20"
                value={config.barWidth ?? 2}
                onChange={(e) => onChange({ barWidth: Number(e.target.value) })}
              />
              <span>{config.barWidth ?? 2}px</span>
            </div>
          </div>

          <div className="setting-group">
            <label>バーの間隔</label>
            <div className="range-input">
              <input
                type="range"
                min="0"
                max="10"
                value={config.barSpacing ?? 1}
                onChange={(e) => onChange({ barSpacing: Number(e.target.value) })}
              />
              <span>{config.barSpacing ?? 1}px</span>
            </div>
          </div>
        </>
      )}

      <div className="setting-group">
        <label>感度</label>
        <div className="range-input">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.sensitivity ?? 1}
            onChange={(e) => onChange({ sensitivity: Number(e.target.value) })}
          />
          <span>{config.sensitivity ?? 1}</span>
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
        <input
          type="checkbox"
          checked={config.mirror ?? false}
          onChange={(e) => onChange({ mirror: e.target.checked })}
        />
      </div>

      <div className="setting-group">
        <label>カラーバンド</label>
        <input
          type="checkbox"
          checked={config.useColorBands ?? false}
          onChange={(e) => onChange({ useColorBands: e.target.checked })}
        />
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
.waveform-settings {
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

input[type="checkbox"] {
  width: 20px;
  height: 20px;
  margin: 0;
}
`;
document.head.appendChild(style); 