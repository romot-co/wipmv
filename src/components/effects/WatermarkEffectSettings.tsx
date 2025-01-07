import React, { useCallback } from 'react';
import { CreateWatermarkEffectOptions } from '../../types/effects';
import { BLEND_MODES } from '../../constants/blendModes';

interface WatermarkEffectSettingsProps {
  onChange: (config: CreateWatermarkEffectOptions) => void;
  initialConfig?: Partial<CreateWatermarkEffectOptions>;
}

export const WatermarkEffectSettings: React.FC<WatermarkEffectSettingsProps> = ({
  onChange,
  initialConfig = {}
}) => {
  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (typeof e.target?.result !== 'string') return;
      
      image.onload = () => {
        const newConfig: CreateWatermarkEffectOptions = {
          image,
          position: initialConfig.position ?? { x: 0.95, y: 0.95 },
          size: initialConfig.size ?? { width: 0.2, height: 0.1 },
          opacity: initialConfig.opacity ?? 0.8,
          blendMode: initialConfig.blendMode ?? 'source-over'
        };
        onChange(newConfig);
      };
      
      image.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }, [initialConfig, onChange]);

  const handlePositionChange = useCallback((axis: 'x' | 'y', value: number) => {
    const position = {
      ...(initialConfig.position ?? { x: 0.95, y: 0.95 }),
      [axis]: value
    };
    onChange({
      ...initialConfig,
      position
    } as CreateWatermarkEffectOptions);
  }, [initialConfig, onChange]);

  const handleSizeChange = useCallback((dimension: 'width' | 'height', value: number) => {
    const size = {
      ...(initialConfig.size ?? { width: 0.2, height: 0.1 }),
      [dimension]: value
    };
    onChange({
      ...initialConfig,
      size
    } as CreateWatermarkEffectOptions);
  }, [initialConfig, onChange]);

  const handleOpacityChange = useCallback((value: number) => {
    onChange({
      ...initialConfig,
      opacity: value
    } as CreateWatermarkEffectOptions);
  }, [initialConfig, onChange]);

  const handleBlendModeChange = useCallback((value: GlobalCompositeOperation) => {
    onChange({
      ...initialConfig,
      blendMode: value
    } as CreateWatermarkEffectOptions);
  }, [initialConfig, onChange]);

  return (
    <div className="effect-settings">
      <h3>ウォーターマーク設定</h3>
      
      <div className="setting-group">
        <label>
          画像:
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
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
            step="0.05"
            value={initialConfig.position?.x ?? 0.95}
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
            step="0.05"
            value={initialConfig.position?.y ?? 0.95}
            onChange={e => handlePositionChange('y', parseFloat(e.target.value))}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          幅:
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={initialConfig.size?.width ?? 0.2}
            onChange={e => handleSizeChange('width', parseFloat(e.target.value))}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          高さ:
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={initialConfig.size?.height ?? 0.1}
            onChange={e => handleSizeChange('height', parseFloat(e.target.value))}
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
            value={initialConfig.opacity ?? 0.8}
            onChange={e => handleOpacityChange(parseFloat(e.target.value))}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          ブレンドモード:
          <select
            value={initialConfig.blendMode ?? 'source-over'}
            onChange={e => handleBlendModeChange(e.target.value as GlobalCompositeOperation)}
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