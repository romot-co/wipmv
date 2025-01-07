import { useState, useCallback, useRef } from 'react';
import { VisualEffect } from '../services/effects/VisualEffect';
import { VisualEffectManager } from '../services/effects/VisualEffectManager';
import { VisualEffectConfig } from '../types';

export const useEffectManager = () => {
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

  const updateEffectConfig = useCallback((effect: VisualEffect, config: Partial<VisualEffectConfig>) => {
    const currentConfig = effect.getConfig();
    Object.assign(currentConfig, config);
    setEffects(prev => [...prev]); // 再レンダリングのトリガー
  }, []);

  return {
    manager: managerRef.current,
    effects,
    addEffect,
    removeEffect,
    updateEffectConfig,
  };
}; 