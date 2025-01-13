import React from 'react';
import { WatermarkEffectConfig, EffectConfig, WatermarkStyle, WatermarkPosition } from '../../../core/types';
import { ImageUploader, RangeSlider } from '../../common';

interface WatermarkSettingsProps {
  config: WatermarkEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

/**
 * ウォーターマークエフェクトの設定UIコンポーネント
 * 画像、位置、透明度などの設定を提供
 */
export const WatermarkSettings: React.FC<WatermarkSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleStyleChange = (styleUpdate: Partial<WatermarkStyle>) => {
    onChange({
      style: {
        ...config.style,
        ...styleUpdate
      }
    });
  };

  const handlePositionChange = (positionUpdate: Partial<WatermarkPosition>) => {
    onChange({
      position: {
        ...config.position,
        ...positionUpdate
      }
    });
  };

  return (
    <div className="watermark-settings">
      <div className="setting-group">
        <ImageUploader
          label="ウォーターマーク画像"
          value={config.imageUrl}
          onChange={(url) => onChange({ imageUrl: url })}
          accept="image/*"
          placeholder="画像URLを入力またはファイルを選択"
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="透明度"
          value={config.style.opacity}
          onChange={(value) => handleStyleChange({ opacity: value })}
          min={0}
          max={1}
          step={0.1}
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="X座標"
          value={config.position.x}
          onChange={(value) => handlePositionChange({ x: value })}
          min={0}
          max={1000}
          unit="px"
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="Y座標"
          value={config.position.y}
          onChange={(value) => handlePositionChange({ y: value })}
          min={0}
          max={1000}
          unit="px"
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="幅"
          value={config.position.width ?? 100}
          onChange={(value) => handlePositionChange({ width: value })}
          min={10}
          max={1000}
          unit="px"
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="高さ"
          value={config.position.height ?? 100}
          onChange={(value) => handlePositionChange({ height: value })}
          min={10}
          max={1000}
          unit="px"
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="回転"
          value={config.position.rotation ?? 0}
          onChange={(value) => handlePositionChange({ rotation: value })}
          min={0}
          max={360}
          unit="°"
        />
      </div>
    </div>
  );
}; 