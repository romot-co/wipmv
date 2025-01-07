import React, { useCallback } from 'react';
import { BackgroundEffectConfig } from '../../types/effects';
import { BLEND_MODES } from '../../constants/blendModes';

interface BackgroundEffectSettingsProps {
  onChange: (config: BackgroundEffectConfig) => void;
  initialConfig?: Partial<BackgroundEffectConfig>;
}

export const BackgroundEffectSettings: React.FC<BackgroundEffectSettingsProps> = ({
  onChange,
  initialConfig = {}
}) => {
  const handleChange = useCallback((updates: Partial<BackgroundEffectConfig>) => {
    if (updates.type === 'image' && !updates.image) {
      onChange({
        ...initialConfig,
        type: 'image',
        opacity: initialConfig.opacity ?? 1,
        blendMode: initialConfig.blendMode ?? 'source-over'
      } as BackgroundEffectConfig);
      return;
    }

    const newConfig: BackgroundEffectConfig = {
      type: initialConfig.type ?? 'color',
      color: initialConfig.color ?? '#000000',
      opacity: initialConfig.opacity ?? 1,
      blendMode: initialConfig.blendMode ?? 'source-over',
      ...updates
    };
    onChange(newConfig);
  }, [initialConfig, onChange]);

  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result !== 'string') return;
      
      image.onload = () => {
        handleChange({
          type: 'image',
          image,
          opacity: initialConfig.opacity ?? 1,
          blendMode: initialConfig.blendMode ?? 'source-over'
        });
      };
      
      image.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }, [handleChange, initialConfig.opacity]);

  return (
    <div className="effect-settings">
      <h3>背景設定</h3>
      
      <div className="setting-group">
        <label>
          タイプ:
          <select
            value={initialConfig.type ?? 'color'}
            onChange={e => handleChange({ type: e.target.value as 'color' | 'image' })}
          >
            <option value="color">カラー</option>
            <option value="image">画像</option>
          </select>
        </label>
      </div>

      {(initialConfig.type ?? 'color') === 'color' && (
        <div className="setting-group">
          <label>
            色:
            <input
              type="color"
              value={initialConfig.color ?? '#000000'}
              onChange={e => handleChange({ color: e.target.value })}
            />
          </label>
        </div>
      )}

      {(initialConfig.type ?? 'color') === 'image' && (
        <div className="setting-group">
          <label>
            画像:
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
          {!initialConfig.image && (
            <p className="error-message">画像を選択してください</p>
          )}
        </div>
      )}

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