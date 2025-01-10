import React from 'react';
import { WaveformEffectConfig, VisualEffectConfig } from '../../../types/effects';

interface WaveformInspectorProps {
  config: VisualEffectConfig;
  onUpdate: (config: Partial<VisualEffectConfig>) => void;
}

export const WaveformInspector: React.FC<WaveformInspectorProps> = ({
  config,
  onUpdate
}) => {
  const waveformConfig = config as WaveformEffectConfig;

  return (
    <div className="waveform-inspector">
      <div className="setting-group">
        <label>スタイル</label>
        <select
          value={waveformConfig.style}
          onChange={(e) => onUpdate({ style: e.target.value as 'line' | 'mirror' | 'bars' })}
        >
          <option value="line">ライン</option>
          <option value="mirror">ミラー</option>
          <option value="bars">バー</option>
        </select>
      </div>

      <div className="setting-group">
        <label>色</label>
        <input
          type="color"
          value={waveformConfig.color}
          onChange={(e) => onUpdate({ color: e.target.value })}
        />
      </div>

      <div className="setting-group">
        <label>線の太さ</label>
        <input
          type="range"
          min="1"
          max="10"
          value={waveformConfig.lineWidth}
          onChange={(e) => onUpdate({ lineWidth: parseInt(e.target.value) })}
        />
      </div>

      <div className="setting-group">
        <label>高さ (%)</label>
        <input
          type="range"
          min="1"
          max="100"
          value={waveformConfig.height}
          onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
        />
      </div>

      <div className="setting-group">
        <label>垂直位置 (%)</label>
        <input
          type="range"
          min="0"
          max="100"
          value={waveformConfig.verticalPosition}
          onChange={(e) => onUpdate({ verticalPosition: parseInt(e.target.value) })}
        />
      </div>

      {waveformConfig.style === 'mirror' && (
        <div className="setting-group">
          <label>ミラーギャップ (px)</label>
          <input
            type="range"
            min="0"
            max="50"
            value={waveformConfig.mirrorGap ?? 10}
            onChange={(e) => onUpdate({ mirrorGap: parseInt(e.target.value) })}
          />
        </div>
      )}

      {waveformConfig.style === 'bars' && (
        <>
          <div className="setting-group">
            <label>バーの幅 (px)</label>
            <input
              type="range"
              min="1"
              max="20"
              value={waveformConfig.barWidth ?? 4}
              onChange={(e) => onUpdate({ barWidth: parseInt(e.target.value) })}
            />
          </div>
          <div className="setting-group">
            <label>バーの間隔 (px)</label>
            <input
              type="range"
              min="0"
              max="10"
              value={waveformConfig.barSpacing ?? 2}
              onChange={(e) => onUpdate({ barSpacing: parseInt(e.target.value) })}
            />
          </div>
        </>
      )}

      <div className="setting-group">
        <label>増幅</label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={waveformConfig.amplification ?? 1}
          onChange={(e) => onUpdate({ amplification: parseFloat(e.target.value) })}
        />
      </div>

      <div className="setting-group">
        <label>スムージング</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={waveformConfig.smoothing ?? 0.5}
          onChange={(e) => onUpdate({ smoothing: parseFloat(e.target.value) })}
        />
      </div>
    </div>
  );
}; 