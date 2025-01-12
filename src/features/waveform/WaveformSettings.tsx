import React from 'react';
import { WaveformEffectConfig } from '../../core/types';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (config: Partial<WaveformEffectConfig>) => void;
}

type ColorKey = 'primary' | 'secondary' | 'background';
type OptionKey = 'barWidth' | 'barSpacing' | 'smoothing' | 'mirror';

export function WaveformSettings({ config, onChange }: WaveformSettingsProps) {
  const handleStyleChange = (style: 'line' | 'bar') => {
    onChange({ style });
  };

  const handleColorChange = (key: ColorKey, value: string) => {
    onChange({
      colors: {
        ...config.colors,
        [key]: value
      }
    });
  };

  const handleOptionChange = (key: OptionKey, value: number | boolean) => {
    onChange({
      options: {
        ...config.options,
        [key]: value
      }
    });
  };

  return (
    <div className="waveform-settings">
      <h3>波形設定</h3>
      
      <div className="setting-group">
        <label>スタイル</label>
        <select
          value={config.style}
          onChange={(e) => handleStyleChange(e.target.value as 'line' | 'bar')}
        >
          <option value="line">ライン</option>
          <option value="bar">バー</option>
        </select>
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
        <label>サブカラー</label>
        <input
          type="color"
          value={config.colors.secondary || '#888888'}
          onChange={(e) => handleColorChange('secondary', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>背景色</label>
        <input
          type="color"
          value={config.colors.background || '#000000'}
          onChange={(e) => handleColorChange('background', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>バー幅</label>
        <input
          type="range"
          min="1"
          max="10"
          value={config.options?.barWidth || 2}
          onChange={(e) => handleOptionChange('barWidth', Number(e.target.value))}
        />
      </div>

      <div className="setting-group">
        <label>バー間隔</label>
        <input
          type="range"
          min="0"
          max="5"
          value={config.options?.barSpacing || 1}
          onChange={(e) => handleOptionChange('barSpacing', Number(e.target.value))}
        />
      </div>

      <div className="setting-group">
        <label>スムージング</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.options?.smoothing || 0.5}
          onChange={(e) => handleOptionChange('smoothing', Number(e.target.value))}
        />
      </div>

      <div className="setting-group">
        <label>ミラー表示</label>
        <input
          type="checkbox"
          checked={config.options?.mirror || false}
          onChange={(e) => handleOptionChange('mirror', e.target.checked)}
        />
      </div>
    </div>
  );
} 