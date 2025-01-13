import { FC } from 'react';
import { WaveformEffectConfig, EffectConfig, WaveformStyle } from '../../core/types';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

export const WaveformSettings: FC<WaveformSettingsProps> = ({ config, onChange }) => {
  const defaultColors = {
    primary: '#ffffff',
    secondary: '#00ff00',
    background: '#000000'
  };

  return (
    <div className="settings">
      <div className="setting-group">
        <label>スタイル</label>
        <select
          value={config.options.style ?? 'bar'}
          onChange={(e) => onChange({ options: { ...config.options, style: e.target.value as WaveformStyle } })}
        >
          <option value="line">ライン</option>
          <option value="bar">バー</option>
          <option value="mirror">ミラー</option>
        </select>
      </div>

      <div className="setting-group">
        <label>メインカラー</label>
        <input
          type="color"
          value={config.colors.primary || defaultColors.primary}
          onChange={(e) => onChange({ colors: { ...config.colors, primary: e.target.value } })}
        />
      </div>

      <div className="setting-group">
        <label>セカンダリカラー</label>
        <input
          type="color"
          value={config.colors.secondary || defaultColors.secondary}
          onChange={(e) => onChange({ colors: { ...config.colors, secondary: e.target.value } })}
        />
      </div>

      <div className="setting-group">
        <label>背景色</label>
        <input
          type="color"
          value={config.colors.background || defaultColors.background}
          onChange={(e) => onChange({ colors: { ...config.colors, background: e.target.value } })}
        />
      </div>

      <div className="setting-group">
        <label>X座標</label>
        <input
          type="number"
          value={config.position.x}
          onChange={(e) => onChange({ position: { ...config.position, x: parseInt(e.target.value) } })}
        />
      </div>

      <div className="setting-group">
        <label>Y座標</label>
        <input
          type="number"
          value={config.position.y}
          onChange={(e) => onChange({ position: { ...config.position, y: parseInt(e.target.value) } })}
        />
      </div>

      <div className="setting-group">
        <label>幅</label>
        <input
          type="number"
          value={config.position.width}
          onChange={(e) => onChange({ position: { ...config.position, width: parseInt(e.target.value) } })}
          min={1}
        />
      </div>

      <div className="setting-group">
        <label>高さ</label>
        <input
          type="number"
          value={config.position.height}
          onChange={(e) => onChange({ position: { ...config.position, height: parseInt(e.target.value) } })}
          min={1}
        />
      </div>

      {config.options.style === 'bar' && (
        <>
          <div className="setting-group">
            <label>バー幅</label>
            <input
              type="number"
              value={config.options.barWidth ?? 2}
              onChange={(e) => onChange({ options: { ...config.options, barWidth: parseInt(e.target.value) } })}
              min={1}
            />
          </div>

          <div className="setting-group">
            <label>バー間隔</label>
            <input
              type="number"
              value={config.options.barSpacing ?? 1}
              onChange={(e) => onChange({ options: { ...config.options, barSpacing: parseInt(e.target.value) } })}
              min={0}
            />
          </div>
        </>
      )}

      <div className="setting-group">
        <label>スムージング</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={config.options.smoothing ?? 0.5}
          onChange={(e) => onChange({ options: { ...config.options, smoothing: parseFloat(e.target.value) } })}
        />
      </div>
    </div>
  );
}; 