import { FC } from 'react';
import { WatermarkEffectConfig, EffectConfig } from '../../core/types';

interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

export const WatermarkSettings: FC<WatermarkSettingsProps> = ({ config, onChange }) => {
  return (
    <div className="settings">
      <div className="setting-group">
        <label>画像</label>
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

      <div className="setting-group">
        <label>スケール</label>
        <input
          type="number"
          value={config.position.scale}
          onChange={(e) => onChange({ position: { ...config.position, scale: parseFloat(e.target.value) } })}
          min={0.1}
          step={0.1}
        />
      </div>

      <div className="setting-group">
        <label>回転 (度)</label>
        <input
          type="number"
          value={config.position.rotation}
          onChange={(e) => onChange({ position: { ...config.position, rotation: parseInt(e.target.value) } })}
          min={0}
          max={360}
        />
      </div>

      <div className="setting-group">
        <label>不透明度</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={config.style.opacity}
          onChange={(e) => onChange({ style: { ...config.style, opacity: parseFloat(e.target.value) } })}
        />
      </div>

      <div className="setting-group">
        <label>ブレンドモード</label>
        <select
          value={config.style.blendMode}
          onChange={(e) => onChange({ style: { ...config.style, blendMode: e.target.value as GlobalCompositeOperation } })}
        >
          <option value="source-over">通常</option>
          <option value="multiply">乗算</option>
          <option value="screen">スクリーン</option>
          <option value="overlay">オーバーレイ</option>
          <option value="darken">暗く</option>
          <option value="lighten">明るく</option>
          <option value="color-dodge">覆い焼き</option>
          <option value="color-burn">焼き込み</option>
          <option value="hard-light">ハードライト</option>
          <option value="soft-light">ソフトライト</option>
          <option value="difference">差の絶対値</option>
          <option value="exclusion">除外</option>
          <option value="hue">色相</option>
          <option value="saturation">彩度</option>
          <option value="color">カラー</option>
          <option value="luminosity">輝度</option>
        </select>
      </div>
    </div>
  );
}; 