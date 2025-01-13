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
  const handleOptionsChange = (
    key: keyof WaveformEffectConfig['options'],
    value: string | number
  ) => {
    onChange({
      options: {
        ...config.options,
        [key]: value
      }
    });
  };

  const handlePositionChange = (
    key: keyof WaveformEffectConfig['position'],
    value: number
  ) => {
    onChange({
      position: {
        ...config.position,
        [key]: value
      }
    });
  };

  const handleColorChange = (
    key: keyof WaveformEffectConfig['colors'],
    value: string
  ) => {
    onChange({
      colors: {
        ...config.colors,
        [key]: value
      }
    });
  };

  return (
    <div className="waveform-settings">
      <div className="setting-group">
        <label>表示スタイル</label>
        <select
          value={config.options.style}
          onChange={(e) => handleOptionsChange('style', e.target.value)}
        >
          <option value="bar">バー</option>
          <option value="line">ライン</option>
          <option value="mirror">ミラー</option>
        </select>
      </div>

      <div className="setting-group">
        <label>解析モード</label>
        <select
          value={config.options.analysisMode}
          onChange={(e) => handleOptionsChange('analysisMode', e.target.value)}
        >
          <option value="realtime">リアルタイム</option>
          <option value="offline">オフライン</option>
        </select>
      </div>

      <div className="setting-group">
        <label>バーの幅</label>
        <input
          type="number"
          value={config.options.barWidth}
          onChange={(e) => handleOptionsChange('barWidth', Number(e.target.value))}
          min={1}
          max={20}
        />
      </div>

      <div className="setting-group">
        <label>バーの間隔</label>
        <input
          type="number"
          value={config.options.barSpacing}
          onChange={(e) => handleOptionsChange('barSpacing', Number(e.target.value))}
          min={0}
          max={10}
        />
      </div>

      <div className="setting-group">
        <label>スムージング</label>
        <input
          type="range"
          value={config.options.smoothing}
          onChange={(e) => handleOptionsChange('smoothing', Number(e.target.value))}
          min={0}
          max={1}
          step={0.1}
        />
        <span>{config.options.smoothing}</span>
      </div>

      <div className="setting-group">
        <label>セグメント数</label>
        <input
          type="number"
          value={config.options.segmentCount}
          onChange={(e) => handleOptionsChange('segmentCount', Number(e.target.value))}
          min={64}
          max={4096}
          step={64}
        />
      </div>

      <div className="setting-group">
        <label>メインカラー</label>
        <input
          type="color"
          value={config.colors.primary}
          onChange={(e) => handleColorChange('primary', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>セカンダリカラー</label>
        <input
          type="color"
          value={config.colors.secondary || '#000000'}
          onChange={(e) => handleColorChange('secondary', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>背景色</label>
        <input
          type="color"
          value={config.colors.background || '#ffffff'}
          onChange={(e) => handleColorChange('background', e.target.value)}
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

.setting-group select,
.setting-group input[type="number"] {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.setting-group input[type="color"] {
  width: 100%;
  height: 40px;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
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