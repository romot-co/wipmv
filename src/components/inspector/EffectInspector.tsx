import React from 'react';
import { EffectType } from '../../hooks/useEffects';
import { BackgroundInspector } from './effects/BackgroundInspector';
import { WaveformInspector } from './effects/WaveformInspector';
import { TextInspector } from './effects/TextInspector';
import { WatermarkInspector } from './effects/WatermarkInspector';
import { VisualEffectConfig } from '../../types/effects';

interface EffectInspectorProps {
  type: EffectType;
  config: VisualEffectConfig;
  onUpdate: (config: Partial<VisualEffectConfig>) => void;
  onDelete?: () => void;
}

export const EffectInspector: React.FC<EffectInspectorProps> = ({
  type,
  config,
  onUpdate,
  onDelete
}) => {
  const renderInspector = () => {
    switch (type) {
      case 'background':
        return (
          <BackgroundInspector
            config={config}
            onUpdate={onUpdate}
          />
        );
      case 'waveform':
        return (
          <WaveformInspector
            config={config}
            onUpdate={onUpdate}
          />
        );
      case 'text':
        return (
          <TextInspector
            config={config}
            onUpdate={onUpdate}
          />
        );
      case 'watermark':
        return (
          <WatermarkInspector
            config={config}
            onUpdate={onUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="effect-inspector">
      <div className="effect-header">
        <h3>{type}エフェクト</h3>
        {onDelete && (
          <button onClick={onDelete} className="delete-button">
            削除
          </button>
        )}
      </div>
      <div className="effect-content">
        {renderInspector()}
      </div>
      <div className="common-settings">
        <div className="setting-group">
          <label>不透明度</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.opacity ?? 1}
            onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          />
        </div>
        <div className="setting-group">
          <label>ブレンドモード</label>
          <select
            value={config.blendMode ?? 'source-over'}
            onChange={(e) => onUpdate({ blendMode: e.target.value as GlobalCompositeOperation })}
          >
            <option value="source-over">通常</option>
            <option value="multiply">乗算</option>
            <option value="screen">スクリーン</option>
            <option value="overlay">オーバーレイ</option>
            <option value="darken">暗く</option>
            <option value="lighten">明るく</option>
          </select>
        </div>
        <div className="setting-group">
          <label>重なり順序</label>
          <input
            type="number"
            value={config.zIndex ?? 0}
            onChange={(e) => onUpdate({ zIndex: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}; 