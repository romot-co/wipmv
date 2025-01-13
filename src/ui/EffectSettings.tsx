import React, { useState, useEffect } from 'react';
import { EffectBase } from '../core/EffectBase';
import { 
  BaseEffectConfig, 
  EffectType,
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig
} from '../core/types';
import { EffectTimeSettings } from './EffectTimeSettings';
import { BackgroundSettings } from './features/background/BackgroundSettings';
import { TextSettings } from './features/text/TextSettings';
import { WaveformSettings } from './features/waveform/WaveformSettings';
import { WatermarkSettings } from './features/watermark/WatermarkSettings';
import './EffectSettings.css';

interface EffectSettingsProps {
  effect: EffectBase;
  onUpdate: (config: Partial<BaseEffectConfig>) => void;
  duration: number;
}

export const EffectSettings: React.FC<EffectSettingsProps> = ({
  effect,
  onUpdate,
  duration,
}) => {
  const [config, setConfig] = useState(effect.getConfig());

  // エフェクトが変更された場合に設定を更新
  useEffect(() => {
    setConfig(effect.getConfig());
  }, [effect]);

  const handleTimeChange = (startTime: number, endTime: number) => {
    onUpdate({
      startTime,
      endTime,
    });
  };

  const handleConfigChange = (newConfig: Partial<BaseEffectConfig>) => {
    onUpdate(newConfig);
    // 設定を即座に更新
    setConfig({
      ...config,
      ...newConfig
    });
  };

  const renderEffectSpecificSettings = () => {
    switch (config.type) {
      case EffectType.Background:
        return (
          <BackgroundSettings
            config={config as BackgroundEffectConfig}
            onChange={handleConfigChange}
          />
        );
      case EffectType.Text:
        return (
          <TextSettings
            config={config as TextEffectConfig}
            onChange={handleConfigChange}
          />
        );
      case EffectType.Waveform:
        return (
          <WaveformSettings
            config={config as WaveformEffectConfig}
            onChange={handleConfigChange}
          />
        );
      case EffectType.Watermark:
        return (
          <WatermarkSettings
            config={config as WatermarkEffectConfig}
            onChange={handleConfigChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="effect-settings">
      <h3>エフェクト設定</h3>

      {/* 時間設定 */}
      <div className="settings-section">
        <h4>表示時間</h4>
        <EffectTimeSettings
          startTime={config.startTime ?? 0}
          endTime={config.endTime ?? duration}
          duration={duration}
          onTimeChange={handleTimeChange}
        />
      </div>

      {/* エフェクト固有の設定 */}
      <div className="settings-section">
        <h4>エフェクト設定</h4>
        {renderEffectSpecificSettings()}
      </div>

      {/* 表示/非表示切り替え */}
      <div className="settings-section">
        <label className="visibility-toggle">
          <input
            type="checkbox"
            checked={config.visible}
            onChange={(e) => handleConfigChange({ visible: e.target.checked })}
          />
          表示
        </label>
      </div>

      {/* zIndex設定 */}
      <div className="settings-section">
        <label>
          レイヤー順序
          <input
            type="number"
            value={config.zIndex}
            onChange={(e) => handleConfigChange({ zIndex: parseInt(e.target.value, 10) })}
            min={0}
          />
        </label>
      </div>
    </div>
  );
}; 