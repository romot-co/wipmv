import React, { useCallback, useState, useEffect } from 'react';
import { BackgroundEffectSettings } from './BackgroundEffectSettings';
import { WatermarkEffectSettings } from './WatermarkEffectSettings';
import { WaveformEffectSettings } from './WaveformEffectSettings';
import { createBackgroundEffect } from '../../services/effects/createBackgroundEffect';
import { createWatermarkEffect } from '../../services/effects/createWatermarkEffect';
import { createWaveformEffect } from '../../services/effects/createWaveformEffect';
import { BackgroundEffectConfig, WaveformEffectConfig, CreateWatermarkEffectOptions } from '../../types/effects';
import { VisualEffect } from '../../services/effects/VisualEffect';
import './EffectManager.css';

export interface EffectManagerProps {
  onEffectsChange: (effects: VisualEffect[]) => void;
  initialEffects?: {
    background?: BackgroundEffectConfig;
    watermark?: CreateWatermarkEffectOptions;
    waveform?: WaveformEffectConfig;
  };
}

export const EffectManager: React.FC<EffectManagerProps> = ({
  onEffectsChange,
  initialEffects = {}
}) => {
  const [currentEffects, setCurrentEffects] = useState<{
    background?: BackgroundEffectConfig;
    watermark?: CreateWatermarkEffectOptions;
    waveform?: WaveformEffectConfig;
  }>(initialEffects);

  const updateEffects = useCallback(() => {
    const effects: VisualEffect[] = [];
    
    if (currentEffects.background) {
      if (!(currentEffects.background.type === 'image' && !currentEffects.background.image)) {
        effects.push(createBackgroundEffect(currentEffects.background));
      }
    }
    
    if (currentEffects.watermark?.image) {
      effects.push(createWatermarkEffect(currentEffects.watermark));
    }
    
    if (currentEffects.waveform) {
      effects.push(createWaveformEffect(currentEffects.waveform));
    }
    
    onEffectsChange(effects);
  }, [currentEffects, onEffectsChange]);

  useEffect(() => {
    updateEffects();
  }, [updateEffects]);

  const handleBackgroundChange = useCallback((config: BackgroundEffectConfig) => {
    setCurrentEffects(prev => ({
      ...prev,
      background: config
    }));
  }, []);

  const handleWatermarkChange = useCallback((config: CreateWatermarkEffectOptions) => {
    setCurrentEffects(prev => ({
      ...prev,
      watermark: config
    }));
  }, []);

  const handleWaveformChange = useCallback((config: WaveformEffectConfig) => {
    setCurrentEffects(prev => ({
      ...prev,
      waveform: config
    }));
  }, []);

  return (
    <div className="effect-manager">
      <div className="effect-section">
        <BackgroundEffectSettings 
          onChange={handleBackgroundChange}
          initialConfig={currentEffects.background}
        />
      </div>
      
      <div className="effect-section">
        <WatermarkEffectSettings 
          onChange={handleWatermarkChange}
          initialConfig={currentEffects.watermark}
        />
      </div>
      
      <div className="effect-section">
        <WaveformEffectSettings 
          onChange={handleWaveformChange}
          initialConfig={currentEffects.waveform}
        />
      </div>
    </div>
  );
}; 