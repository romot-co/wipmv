import { useState, useCallback } from 'react';
import { VisualEffect } from '../services/effects/core';
import { 
  BackgroundEffectConfig, 
  WaveformEffectConfig, 
  TextEffectConfig,
  WatermarkConfig,
  VisualEffectConfig 
} from '../types/effects';
import {
  createBackgroundEffect,
  createWaveformEffect,
  createTextEffect,
  createWatermarkEffect
} from '../services/effects/factories';
import { useEffectManager } from './useEffectManager';

export type EffectType = 'background' | 'waveform' | 'text' | 'watermark';

/**
 * エフェクトのUI状態管理と高レベルな操作を提供するフック
 * useEffectManagerを利用して基本的なCRUD操作を行い、
 * その上でUI特有の状態管理と操作を提供する
 */
export const useEffects = () => {
  const manager = useEffectManager();
  const [selectedEffectType, setSelectedEffectType] = useState<EffectType | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<VisualEffect | null>(null);

  // エフェクトの選択
  const selectEffect = useCallback((effect: VisualEffect | null) => {
    setSelectedEffect(effect);
    if (effect) {
      // エフェクトタイプの判定ロジックを実装
      // 例: effect.type に基づいて setSelectedEffectType を呼び出す
    } else {
      setSelectedEffectType(null);
    }
  }, []);

  // 新しいエフェクトの作成
  const createEffect = useCallback((type: EffectType, config: VisualEffectConfig) => {
    let effect: VisualEffect | null = null;

    switch (type) {
      case 'background':
        effect = createBackgroundEffect(config as BackgroundEffectConfig);
        break;
      case 'waveform':
        effect = createWaveformEffect(config as WaveformEffectConfig);
        break;
      case 'text':
        effect = createTextEffect(config as TextEffectConfig);
        break;
      case 'watermark':
        effect = createWatermarkEffect(config as WatermarkConfig);
        break;
    }

    if (effect) {
      manager.addEffect(effect);
      selectEffect(effect);
    }

    return effect;
  }, [manager, selectEffect]);

  // 選択中のエフェクトの更新
  const updateSelectedEffect = useCallback((config: Partial<VisualEffectConfig>) => {
    if (selectedEffect) {
      manager.updateEffect(selectedEffect, config);
    }
  }, [manager, selectedEffect]);

  // 選択中のエフェクトの削除
  const removeSelectedEffect = useCallback(() => {
    if (selectedEffect) {
      manager.removeEffect(selectedEffect);
      selectEffect(null);
    }
  }, [manager, selectedEffect, selectEffect]);

  return {
    // 基本的なCRUD操作（managerから継承）
    ...manager,
    
    // UI状態
    selectedEffectType,
    selectedEffect,
    
    // UI操作
    selectEffect,
    createEffect,
    updateSelectedEffect,
    removeSelectedEffect,
  };
}; 