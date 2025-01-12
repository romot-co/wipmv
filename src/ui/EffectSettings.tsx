import React from 'react';
import { EffectBase } from '../core/EffectBase';
import { EffectType, EffectConfig, BackgroundEffectConfig, TextEffectConfig, WaveformEffectConfig, WatermarkEffectConfig } from '../core/types';
import { BackgroundSettings } from '../features/background/BackgroundSettings';
import { TextSettings } from '../features/text/TextSettings';
import { WaveformSettings } from '../features/waveform/WaveformSettings';
import { WatermarkSettings } from '../features/watermark/WatermarkSettings';
import './EffectSettings.css';

interface EffectSettingsProps {
  effect: EffectBase;
  onUpdate: (config: Partial<EffectConfig>) => void;
}

export const EffectSettings: React.FC<EffectSettingsProps> = ({ effect, onUpdate }) => {
  const effectType = effect.getConfig().type;

  const renderSettings = () => {
    switch (effectType) {
      case EffectType.Background:
        return <BackgroundSettings config={effect.getConfig() as BackgroundEffectConfig} onChange={onUpdate} />;
      case EffectType.Text:
        return <TextSettings config={effect.getConfig() as TextEffectConfig} onChange={onUpdate} />;
      case EffectType.Waveform:
        return <WaveformSettings config={effect.getConfig() as WaveformEffectConfig} onChange={onUpdate} />;
      case EffectType.Watermark:
        return <WatermarkSettings config={effect.getConfig() as WatermarkEffectConfig} onChange={onUpdate} />;
      default:
        return null;
    }
  };

  return (
    <div className="effect-settings">
      <h3 className="effect-settings-title">
        {effectType === EffectType.Background && '背景設定'}
        {effectType === EffectType.Text && 'テキスト設定'}
        {effectType === EffectType.Waveform && '波形設定'}
        {effectType === EffectType.Watermark && 'ウォーターマーク設定'}
      </h3>
      <div className="effect-settings-content">
        {renderSettings()}
      </div>
    </div>
  );
}; 