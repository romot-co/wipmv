import React from 'react';
import { WaveformEffectConfig, EffectConfig } from '../../../core/types';
import { ColorPicker, RangeSlider } from '../../common';

interface WaveformSettingsProps {
  config: WaveformEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

/**
 * 波形エフェクトの設定UIコンポーネント
 * 波形の色、高さ、スケールなどの設定を提供
 */
export const WaveformSettings: React.FC<WaveformSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleOptionsChange = (optionsUpdate: Partial<WaveformEffectConfig['options']>) => {
    onChange({
      options: {
        ...config.options,
        ...optionsUpdate
      }
    });
  };

  const handleColorsChange = (colorsUpdate: Partial<WaveformEffectConfig['colors']>) => {
    onChange({
      colors: {
        ...config.colors,
        ...colorsUpdate
      }
    });
  };

  return (
    <div className="waveform-settings">
      <div className="setting-group">
        <ColorPicker
          label="波形の色"
          value={config.colors.primary}
          onChange={(color) => handleColorsChange({ primary: color })}
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="バーの幅"
          value={config.options?.barWidth ?? 2}
          onChange={(value) => handleOptionsChange({ barWidth: value })}
          min={1}
          max={20}
          unit="px"
        />
      </div>

      <div className="setting-group">
        <RangeSlider
          label="バーの間隔"
          value={config.options?.barSpacing ?? 1}
          onChange={(value) => handleOptionsChange({ barSpacing: value })}
          min={0}
          max={10}
          unit="px"
        />
      </div>

      <div className="setting-group">
        <label>
          波形タイプ:
          <select
            value={config.options?.style ?? 'bar'}
            onChange={(e) => handleOptionsChange({ style: e.target.value as 'line' | 'bar' | 'mirror' })}
          >
            <option value="line">ライン</option>
            <option value="bar">バー</option>
            <option value="mirror">ミラー</option>
          </select>
        </label>
      </div>
    </div>
  );
}; 