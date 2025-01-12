import { FC } from 'react';
import { BackgroundEffectConfig, EffectConfig } from '../../core/types';

interface BackgroundSettingsProps {
  config: BackgroundEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

export const BackgroundSettings: FC<BackgroundSettingsProps> = ({ config, onChange }) => {
  return (
    <div className="settings">
      <div className="setting-group">
        <label>背景タイプ</label>
        <select
          value={config.backgroundType}
          onChange={(e) => onChange({ backgroundType: e.target.value as 'color' | 'image' | 'gradient' })}
        >
          <option value="color">単色</option>
          <option value="image">画像</option>
          <option value="gradient">グラデーション</option>
        </select>
      </div>

      {config.backgroundType === 'color' && (
        <div className="setting-group">
          <label>背景色</label>
          <input
            type="color"
            value={config.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </div>
      )}

      {config.backgroundType === 'image' && (
        <div className="setting-group">
          <label>背景画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  onChange({ imageUrl: event.target?.result as string });
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      )}

      {config.backgroundType === 'gradient' && (
        <>
          <div className="setting-group">
            <label>グラデーション色</label>
            <div className="gradient-colors">
              {config.gradient?.colors.map((color, index) => (
                <div key={index} className="gradient-color">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...(config.gradient?.colors || [])];
                      newColors[index] = e.target.value;
                      onChange({
                        gradient: {
                          colors: newColors,
                          angle: config.gradient?.angle ?? 0,
                        }
                      });
                    }}
                  />
                  <button
                    onClick={() => {
                      const newColors = [...(config.gradient?.colors || [])];
                      newColors.splice(index, 1);
                      onChange({
                        gradient: {
                          colors: newColors,
                          angle: config.gradient?.angle ?? 0,
                        }
                      });
                    }}
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newColors = [...(config.gradient?.colors || []), '#000000'];
                  onChange({
                    gradient: {
                      colors: newColors,
                      angle: config.gradient?.angle ?? 0,
                    }
                  });
                }}
              >
                色を追加
              </button>
            </div>
          </div>

          <div className="setting-group">
            <label>グラデーション角度</label>
            <input
              type="range"
              min="0"
              max="360"
              value={config.gradient?.angle ?? 0}
              onChange={(e) => {
                onChange({
                  gradient: {
                    colors: config.gradient?.colors || [],
                    angle: parseInt(e.target.value),
                  }
                });
              }}
            />
            <span>{config.gradient?.angle ?? 0}°</span>
          </div>
        </>
      )}
    </div>
  );
}; 