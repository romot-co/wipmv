import React from 'react';
import { WatermarkConfig, VisualEffectConfig } from '../../../types/effects';

interface WatermarkInspectorProps {
  config: VisualEffectConfig;
  onUpdate: (config: Partial<VisualEffectConfig>) => void;
}

export const WatermarkInspector: React.FC<WatermarkInspectorProps> = ({
  config,
  onUpdate
}) => {
  const watermarkConfig = config as WatermarkConfig;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const image = new Image();
      image.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });
      onUpdate({ image });
    } catch (error) {
      console.error('画像の読み込みに失敗:', error);
    }
  };

  return (
    <div className="watermark-inspector">
      <div className="setting-group">
        <label>画像</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
      </div>

      <div className="setting-group">
        <label>位置 X (%)</label>
        <input
          type="range"
          min="0"
          max="100"
          value={watermarkConfig.position.x * 100}
          onChange={(e) => onUpdate({
            position: {
              ...watermarkConfig.position,
              x: parseInt(e.target.value) / 100
            }
          })}
        />
      </div>

      <div className="setting-group">
        <label>位置 Y (%)</label>
        <input
          type="range"
          min="0"
          max="100"
          value={watermarkConfig.position.y * 100}
          onChange={(e) => onUpdate({
            position: {
              ...watermarkConfig.position,
              y: parseInt(e.target.value) / 100
            }
          })}
        />
      </div>

      <div className="setting-group">
        <label>幅 (px)</label>
        <input
          type="number"
          min="1"
          value={watermarkConfig.size.width}
          onChange={(e) => onUpdate({
            size: {
              ...watermarkConfig.size,
              width: parseInt(e.target.value)
            }
          })}
        />
      </div>

      <div className="setting-group">
        <label>高さ (px)</label>
        <input
          type="number"
          min="1"
          value={watermarkConfig.size.height}
          onChange={(e) => onUpdate({
            size: {
              ...watermarkConfig.size,
              height: parseInt(e.target.value)
            }
          })}
        />
      </div>

      <div className="setting-group">
        <label>アスペクト比を維持</label>
        <input
          type="checkbox"
          checked={watermarkConfig.maintainAspectRatio}
          onChange={(e) => onUpdate({ maintainAspectRatio: e.target.checked })}
        />
      </div>

      <div className="setting-group">
        <label>配置</label>
        <select
          value={watermarkConfig.alignment}
          onChange={(e) => onUpdate({ alignment: e.target.value as 'left' | 'center' | 'right' })}
        >
          <option value="left">左</option>
          <option value="center">中央</option>
          <option value="right">右</option>
        </select>
      </div>

      <div className="setting-group">
        <label>回転 (度)</label>
        <input
          type="range"
          min="-180"
          max="180"
          value={watermarkConfig.rotation ?? 0}
          onChange={(e) => onUpdate({ rotation: parseInt(e.target.value) })}
        />
      </div>

      <div className="setting-group">
        <label>水平反転</label>
        <input
          type="checkbox"
          checked={watermarkConfig.flip?.horizontal ?? false}
          onChange={(e) => onUpdate({
            flip: {
              horizontal: e.target.checked,
              vertical: watermarkConfig.flip?.vertical ?? false
            }
          })}
        />
      </div>

      <div className="setting-group">
        <label>垂直反転</label>
        <input
          type="checkbox"
          checked={watermarkConfig.flip?.vertical ?? false}
          onChange={(e) => onUpdate({
            flip: {
              horizontal: watermarkConfig.flip?.horizontal ?? false,
              vertical: e.target.checked
            }
          })}
        />
      </div>
    </div>
  );
}; 