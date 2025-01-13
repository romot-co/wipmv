import React from 'react';
import { TextEffectConfig, EffectConfig, TextStyle } from '../../../core/types';
import { ColorPicker, RangeSlider } from '../../common';

interface TextSettingsProps {
  config: TextEffectConfig;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

/**
 * テキストエフェクトの設定UIコンポーネント
 * テキスト内容、フォント、サイズ、色などの設定を提供
 */
export const TextSettings: React.FC<TextSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleStyleChange = (styleUpdate: Partial<TextStyle>) => {
    onChange({
      style: {
        ...config.style,
        ...styleUpdate
      }
    });
  };

  return (
    <div className="text-settings">
      <div className="setting-group">
        <label>
          テキスト:
          <input
            type="text"
            value={config.text}
            onChange={(e) => onChange({ text: e.target.value })}
            placeholder="テキストを入力"
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          フォント:
          <select
            value={config.style.fontFamily}
            onChange={(e) => handleStyleChange({ fontFamily: e.target.value })}
          >
            <option value="sans-serif">Sans-serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </label>
      </div>

      <div className="setting-group">
        <RangeSlider
          label="フォントサイズ"
          value={config.style.fontSize}
          onChange={(value) => handleStyleChange({ fontSize: value })}
          min={8}
          max={128}
          unit="px"
        />
      </div>

      <div className="setting-group">
        <ColorPicker
          label="テキスト色"
          value={config.style.color}
          onChange={(color) => handleStyleChange({ color })}
        />
      </div>
    </div>
  );
}; 