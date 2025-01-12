import { useState, useCallback } from 'react';
import { EffectType } from '../types/effects/base';
import { VisualEffect, VisualEffectConfig } from '../types/effects';

/**
 * エフェクト管理フックの戻り値
 */
interface UseEffectsReturn {
  /** エフェクトリスト */
  effects: VisualEffect[];
  /** 選択中のエフェクト */
  selectedEffect: VisualEffectConfig | null;
  /** 選択中のエフェクトタイプ */
  selectedEffectType: EffectType | null;
  /** エフェクトの選択 */
  selectEffect: (type: EffectType | null) => void;
  /** エフェクトの作成 */
  createEffect: (type: EffectType, config: VisualEffectConfig) => void;
  /** エフェクトの更新 */
  updateEffect: (type: EffectType, config: Partial<VisualEffectConfig>) => void;
  /** エフェクトの削除 */
  removeEffect: (type: EffectType) => void;
  /** エフェクトのクリア */
  clearEffects: () => void;
}

/**
 * エフェクトを管理するフック
 */
export function useEffects(): UseEffectsReturn {
  // エフェクトリスト
  const [effects, setEffects] = useState<VisualEffect[]>([]);
  // 選択中のエフェクトタイプ
  const [selectedEffectType, setSelectedEffectType] = useState<EffectType | null>(null);

  // エフェクトの選択
  const selectEffect = useCallback((type: EffectType | null) => {
    setSelectedEffectType(type);
  }, []);

  // 選択中のエフェクトを取得
  const selectedEffect = useCallback(() => {
    if (!selectedEffectType) return null;
    return effects.find(effect => effect.type === selectedEffectType)?.config ?? null;
  }, [effects, selectedEffectType])();

  // エフェクトの作成
  const createEffect = useCallback((type: EffectType, config: VisualEffectConfig) => {
    setEffects(prev => [...prev, { type, config }]);
  }, []);

  // エフェクトの更新
  const updateEffect = useCallback((type: EffectType, config: Partial<VisualEffectConfig>) => {
    setEffects(prev => prev.map(effect => 
      effect.type === type
        ? { ...effect, config: { ...effect.config, ...config } }
        : effect
    ));
  }, []);

  // エフェクトの削除
  const removeEffect = useCallback((type: EffectType) => {
    setEffects(prev => prev.filter(effect => effect.type !== type));
    if (selectedEffectType === type) {
      setSelectedEffectType(null);
    }
  }, [selectedEffectType]);

  // エフェクトのクリア
  const clearEffects = useCallback(() => {
    setEffects([]);
    setSelectedEffectType(null);
  }, []);

  return {
    effects,
    selectedEffect,
    selectedEffectType,
    selectEffect,
    createEffect,
    updateEffect,
    removeEffect,
    clearEffects
  };
} 