import React, { useCallback } from 'react';
import { BackgroundEffectSettings } from './effects/BackgroundEffectSettings';
import { WatermarkEffectSettings } from './effects/WatermarkEffectSettings';
import { WaveformEffectSettings } from './effects/WaveformEffectSettings';
import { TextEffectSettings } from './effects/TextEffectSettings';
import { createBackgroundEffect } from '../services/effects/createBackgroundEffect';
import { createWatermarkEffect } from '../services/effects/createWatermarkEffect';
import { createWaveformEffect } from '../services/effects/createWaveformEffect';
import { createTextEffect } from '../services/effects/createTextEffect';
import { BackgroundEffectConfig, WaveformEffectConfig, TextEffectConfig, CreateWatermarkEffectOptions } from '../types/effects';
import { VisualEffect } from '../services/effects/VisualEffect';
import './EffectManager.css';

interface EffectManagerProps {
  onEffectsChange: (effects: VisualEffect[]) => void;
  initialEffects?: {
    background?: BackgroundEffectConfig;
    watermark?: CreateWatermarkEffectOptions;
    waveform?: WaveformEffectConfig;
    text?: TextEffectConfig;
  };
}

export const EffectManager: React.FC<EffectManagerProps> = ({
  onEffectsChange,
  initialEffects = {}
}) => {
  const handleBackgroundChange = useCallback((config: BackgroundEffectConfig) => {
    onEffectsChange([createBackgroundEffect(config)]);
  }, [onEffectsChange]);

  const handleWatermarkChange = useCallback((config: CreateWatermarkEffectOptions) => {
    onEffectsChange([createWatermarkEffect(config)]);
  }, [onEffectsChange]);

  const handleWaveformChange = useCallback((config: WaveformEffectConfig) => {
    onEffectsChange([createWaveformEffect(config)]);
  }, [onEffectsChange]);

  const handleTextChange = useCallback((config: TextEffectConfig) => {
    onEffectsChange([createTextEffect(config)]);
  }, [onEffectsChange]);

  return (
    <div className="effect-manager">
      <div className="effect-section">
        <BackgroundEffectSettings onChange={handleBackgroundChange} />
      </div>
      
      <div className="effect-section">
        <WatermarkEffectSettings onChange={handleWatermarkChange} />
      </div>
      
      <div className="effect-section">
        <WaveformEffectSettings onChange={handleWaveformChange} />
      </div>

      <div className="effect-section">
        <TextEffectSettings 
          onChange={handleTextChange}
          initialConfig={initialEffects.text}
        />
      </div>
    </div>
  );
}; 