import React, { useCallback } from 'react';
import { WaveformEffectConfig } from '../../types/effects';
import { BLEND_MODES } from '../../constants/blendModes';

interface WaveformEffectSettingsProps {
  onChange: (config: WaveformEffectConfig) => void;
  initialConfig?: Partial<WaveformEffectConfig>;
}

export const WaveformEffectSettings: React.FC<WaveformEffectSettingsProps> = ({
  onChange,
  initialConfig = {}
}) => {
  const handleChange = useCallback((updates: Partial<WaveformEffectConfig>) => {
    const newConfig: WaveformEffectConfig = {
      type: 'waveform',
      color: initialConfig.color ?? '#ffffff',
      lineWidth: initialConfig.lineWidth ?? 2,
      height: initialConfig.height ?? 100,
      verticalPosition: initialConfig.verticalPosition ?? 0.5,
      opacity: initialConfig.opacity ?? 1,
      blendMode: initialConfig.blendMode ?? 'source-over',
      ...updates
    };
    onChange(newConfig);
  }, [initialConfig, onChange]);

  return (
    <div className="effect-settings">
      <h3>波形設定</h3>
      
      <div className="setting-group">
        <label>
          色:
          <input
            type="color"
            value={initialConfig.color ?? '#ffffff'}
            onChange={e => handleChange({ color: e.target.value })}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          線幅:
          <input
            type="number"
            value={initialConfig.lineWidth ?? 2}
            onChange={e => handleChange({ lineWidth: parseInt(e.target.value, 10) })}
            min="1"
            max="10"
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          高さ:
          <input
            type="number"
            value={initialConfig.height ?? 100}
            onChange={e => handleChange({ height: parseInt(e.target.value, 10) })}
            min="10"
            max="300"
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          垂直位置:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={initialConfig.verticalPosition ?? 0.5}
            onChange={e => handleChange({ verticalPosition: parseFloat(e.target.value) })}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          不透明度:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={initialConfig.opacity ?? 1}
            onChange={e => handleChange({ opacity: parseFloat(e.target.value) })}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          ブレンドモード:
          <select
            value={initialConfig.blendMode ?? 'source-over'}
            onChange={e => handleChange({ blendMode: e.target.value as GlobalCompositeOperation })}
          >
            {BLEND_MODES.map(mode => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}; 