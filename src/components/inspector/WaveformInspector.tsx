import React from 'react';
import { WaveformEffectConfig } from '../../types/effects';
import './Inspector.css';

interface WaveformInspectorProps {
  effect: WaveformEffectConfig;
  onEffectUpdate: (updatedEffect: WaveformEffectConfig) => void;
}

export const WaveformInspector: React.FC<WaveformInspectorProps> = ({
  effect,
  onEffectUpdate
}) => {
  const handleChange = (field: keyof WaveformEffectConfig, value: number | string) => {
    onEffectUpdate({
      ...effect,
      [field]: value
    });
  };

  return (
    <div className="inspector">
      <h3>波形エフェクト</h3>
      
      <div className="inspector-section">
        <label>色</label>
        <input
          type="color"
          value={effect.color}
          onChange={(e) => handleChange('color', e.target.value)}
        />
      </div>

      <div className="inspector-section">
        <label>線の太さ</label>
        <input
          type="number"
          value={effect.lineWidth}
          onChange={(e) => handleChange('lineWidth', Number(e.target.value))}
          min={1}
          max={10}
        />
      </div>

      <div className="inspector-section">
        <label>高さ</label>
        <input
          type="number"
          value={effect.height}
          onChange={(e) => handleChange('height', Number(e.target.value))}
          min={10}
          max={300}
        />
      </div>

      <div className="inspector-section">
        <label>垂直位置</label>
        <input
          type="number"
          value={effect.verticalPosition}
          onChange={(e) => handleChange('verticalPosition', Number(e.target.value))}
          min={0}
          max={100}
        />
      </div>

      <div className="inspector-section">
        <label>不透明度</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={effect.opacity}
          onChange={(e) => handleChange('opacity', Number(e.target.value))}
        />
        <span>{Math.round(effect.opacity * 100)}%</span>
      </div>

      <div className="inspector-section">
        <label>ブレンドモード</label>
        <select
          value={effect.blendMode}
          onChange={(e) => handleChange('blendMode', e.target.value)}
        >
          <option value="normal">通常</option>
          <option value="multiply">乗算</option>
          <option value="screen">スクリーン</option>
          <option value="overlay">オーバーレイ</option>
        </select>
      </div>
    </div>
  );
}; 