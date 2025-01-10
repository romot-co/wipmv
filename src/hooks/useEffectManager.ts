import { useState, useCallback, useRef } from 'react';
import { VisualEffect, VisualEffectManager } from '../services/effects/core';
import { VisualEffectConfig } from '../types';

export interface EffectManagerOperations {
  addEffect: (effect: VisualEffect) => void;
  removeEffect: (effect: VisualEffect) => void;
  updateEffect: (effect: VisualEffect, config: Partial<VisualEffectConfig>) => void;
  getEffects: () => VisualEffect[];
  clearEffects: () => void;
}

/**
 * エフェクトの基本的なCRUD操作を提供するフック
 * UIに依存しない低レベルな操作のみを扱う
 */
export const useEffectManager = (): EffectManagerOperations => {
  const managerRef = useRef<VisualEffectManager>(new VisualEffectManager());
  const [effects, setEffects] = useState<VisualEffect[]>([]);

  const addEffect = useCallback((effect: VisualEffect) => {
    managerRef.current.registerEffect(effect);
    setEffects(prev => [...prev, effect]);
  }, []);

  const removeEffect = useCallback((effect: VisualEffect) => {
    managerRef.current.unregisterEffect(effect);
    setEffects(prev => prev.filter(e => e !== effect));
  }, []);

  const updateEffect = useCallback((effect: VisualEffect, config: Partial<VisualEffectConfig>) => {
    effect.updateConfig(config);
    setEffects(prev => [...prev]); // トリガー再レンダリング
  }, []);

  const getEffects = useCallback(() => {
    return effects;
  }, [effects]);

  const clearEffects = useCallback(() => {
    effects.forEach(effect => managerRef.current.unregisterEffect(effect));
    setEffects([]);
  }, [effects]);

  return {
    addEffect,
    removeEffect,
    updateEffect,
    getEffects,
    clearEffects,
  };
}; 