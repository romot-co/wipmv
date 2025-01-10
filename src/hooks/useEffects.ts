import { useState, useCallback } from 'react';
import { VisualEffect } from '../services/effects/VisualEffect';
import { BackgroundEffectConfig, WaveformEffectConfig, VisualEffectConfig } from '../types/effects';
import { createBackgroundEffect } from '../services/effects/createBackgroundEffect';
import { createWaveformEffect } from '../services/effects/createWaveformEffect';

export type EffectType = 'background' | 'waveform';

export const useEffects = () => {
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  const [selectedEffectType, setSelectedEffectType] = useState<EffectType | null>(null);

  // デフォルトのエフェクトを初期化
  const initializeDefaultEffects = useCallback(() => {
    const defaultBackground = createBackgroundEffect({
      type: 'color',
      color: '#666666',
      opacity: 1,
      blendMode: 'source-over' as GlobalCompositeOperation
    });

    const defaultWaveform = createWaveformEffect({
      color: '#ffffff',
      lineWidth: 2,
      height: 100,
      verticalPosition: 50,
      opacity: 1,
      blendMode: 'source-over' as GlobalCompositeOperation
    });

    setEffects([defaultBackground, defaultWaveform]);
  }, []);

  // エフェクトの更新
  const updateEffect = useCallback((type: EffectType, config: VisualEffectConfig) => {
    setEffects(prev => prev.map(effect => {
      if (effect.getName() === type) {
        if (type === 'background') {
          const bgConfig = config as BackgroundEffectConfig;
          return createBackgroundEffect(bgConfig);
        }
        const waveformConfig = config as WaveformEffectConfig;
        return createWaveformEffect({
          color: waveformConfig.color,
          lineWidth: waveformConfig.lineWidth,
          height: waveformConfig.height,
          verticalPosition: waveformConfig.verticalPosition,
          opacity: waveformConfig.opacity,
          blendMode: waveformConfig.blendMode
        });
      }
      return effect;
    }));
  }, []);

  // エフェクトの取得
  const getEffect = useCallback((type: EffectType) => {
    return effects.find(effect => effect.getName() === type);
  }, [effects]);

  // エフェクトの設定を取得
  const getEffectConfig = useCallback((type: EffectType): VisualEffectConfig | null => {
    const effect = getEffect(type);
    if (!effect) return null;
    return effect.getConfig() as VisualEffectConfig;
  }, [getEffect]);

  return {
    effects,
    selectedEffectType,
    setSelectedEffectType,
    initializeDefaultEffects,
    updateEffect,
    getEffect,
    getEffectConfig
  };
}; 