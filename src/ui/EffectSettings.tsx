import React from 'react';
import { EffectBase } from '../core/EffectBase';
import { EffectType, EffectConfig, BackgroundEffectConfig, TextEffectConfig, WaveformEffectConfig, WatermarkEffectConfig } from '../core/types';
import { BackgroundSettings } from './features/background/BackgroundSettings';
import { TextSettings } from './features/text/TextSettings';
import { WaveformSettings } from './features/waveform/WaveformSettings';
import { WatermarkSettings } from './features/watermark/WatermarkSettings';
import './EffectSettings.css';

interface EffectSettingsProps {
  effect: EffectBase;
  onUpdate: (config: Partial<EffectConfig>) => void;
}

/**
 * エフェクト設定コンポーネント
 * 各エフェクトタイプに応じた設定UIを提供
 */
export const EffectSettings: React.FC<EffectSettingsProps> = ({ effect, onUpdate }) => {
  const config = effect.getConfig();

  const renderSettings = () => {
    switch (config.type) {
      case EffectType.Background:
        return <BackgroundSettings config={config as BackgroundEffectConfig} onChange={onUpdate} />;
      case EffectType.Text:
        return <TextSettings config={config as TextEffectConfig} onChange={onUpdate} />;
      case EffectType.Waveform:
        return <WaveformSettings config={config as WaveformEffectConfig} onChange={onUpdate} />;
      case EffectType.Watermark:
        return <WatermarkSettings config={config as WatermarkEffectConfig} onChange={onUpdate} />;
      default:
        return null;
    }
  };

  const getEffectTitle = () => {
    switch (config.type) {
      case EffectType.Background:
        return '背景設定';
      case EffectType.Text:
        return 'テキスト設定';
      case EffectType.Waveform:
        return '波形設定';
      case EffectType.Watermark:
        return 'ウォーターマーク設定';
      default:
        return 'エフェクト設定';
    }
  };

  return (
    <div className="effect-settings">
      <h3 className="effect-settings-title">{getEffectTitle()}</h3>
      <div className="effect-settings-content">
        {renderSettings()}
      </div>
    </div>
  );
}; 