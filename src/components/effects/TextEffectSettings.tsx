import React, { useCallback } from 'react';
import { TextEffectConfig } from '../../types/effects';
import { BLEND_MODES } from '../../constants/blendModes';

interface TextEffectSettingsProps {
  onChange: (config: TextEffectConfig) => void;
  initialConfig?: Partial<TextEffectConfig>;
}

export const TextEffectSettings: React.FC<TextEffectSettingsProps> = ({
  onChange,
  initialConfig = {}
}) => {
  const handleChange = useCallback((updates: Partial<TextEffectConfig>) => {
    const newConfig: TextEffectConfig = {
      type: 'text',
      text: initialConfig.text ?? '',
      font: initialConfig.font ?? 'Arial',
      fontSize: initialConfig.fontSize ?? 24,
      position: initialConfig.position ?? { x: 0.5, y: 0.5 },
      color: initialConfig.color ?? '#ffffff',
      opacity: initialConfig.opacity ?? 1,
      blendMode: initialConfig.blendMode ?? 'source-over',
      textAlign: initialConfig.textAlign ?? 'center',
      textBaseline: initialConfig.textBaseline ?? 'middle',
      ...updates
    };
    onChange(newConfig);
  }, [initialConfig, onChange]);

  const handlePositionChange = useCallback((axis: 'x' | 'y', value: number) => {
    handleChange({
      position: {
        ...(initialConfig.position ?? { x: 0.5, y: 0.5 }),
        [axis]: value
      }
    });
  }, [handleChange, initialConfig.position]);

  return (
    <div className="effect-settings">
      <h3>テキスト設定</h3>
      
      <div className="setting-group">
        <label>
          テキスト:
          <input
            type="text"
            value={initialConfig.text ?? ''}
            onChange={e => handleChange({ text: e.target.value })}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          フォント:
          <select
            value={initialConfig.font ?? 'Arial'}
            onChange={e => handleChange({ font: e.target.value })}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label>
          サイズ:
          <input
            type="number"
            value={initialConfig.fontSize ?? 24}
            onChange={e => handleChange({ fontSize: parseInt(e.target.value, 10) })}
            min="1"
            max="200"
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          X位置:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={initialConfig.position?.x ?? 0.5}
            onChange={e => handlePositionChange('x', parseFloat(e.target.value))}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          Y位置:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={initialConfig.position?.y ?? 0.5}
            onChange={e => handlePositionChange('y', parseFloat(e.target.value))}
          />
        </label>
      </div>

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

      <div className="setting-group">
        <label>
          テキストの配置:
          <select
            value={initialConfig.textAlign ?? 'center'}
            onChange={e => handleChange({ textAlign: e.target.value as CanvasTextAlign })}
          >
            <option value="left">左揃え</option>
            <option value="center">中央揃え</option>
            <option value="right">右揃え</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <label>
          テキストのベースライン:
          <select
            value={initialConfig.textBaseline ?? 'middle'}
            onChange={e => handleChange({ textBaseline: e.target.value as CanvasTextBaseline })}
          >
            <option value="top">上</option>
            <option value="middle">中央</option>
            <option value="bottom">下</option>
          </select>
        </label>
      </div>
    </div>
  );
}; 