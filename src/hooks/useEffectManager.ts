// src/hooks/useEffectManager.ts

import { useRef, useEffect } from 'react';
import { EffectManager } from '../core/EffectManager';
import { Renderer } from '../core/Renderer';
import { EffectBase } from '../core/EffectBase';
import { AudioVisualParameters } from '../core/types';

interface UseEffectManagerReturn {
  renderFrame: (params: AudioVisualParameters) => void;
  addEffect: (effect: EffectBase) => void;
  removeEffect: (effectOrId: EffectBase | string) => void;
  getManager: () => EffectManager | null;
}

/**
 * エフェクトマネージャーを管理するフック
 * - キャンバスの初期化
 * - エフェクトの追加・削除
 * - レンダリング制御
 */
export function useEffectManager(canvasRef: React.RefObject<HTMLCanvasElement>): UseEffectManagerReturn {
  const managerRef = useRef<EffectManager | null>(null);

  // 初期化
  useEffect(() => {
    if (canvasRef.current) {
      const renderer = new Renderer(canvasRef.current);
      managerRef.current = new EffectManager(renderer);
    }
    return () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    };
  }, [canvasRef]);

  const renderFrame = (params: AudioVisualParameters) => {
    if (managerRef.current) {
      managerRef.current.updateParams(params);
      managerRef.current.render();
    }
  };

  const addEffect = (effect: EffectBase) => {
    managerRef.current?.addEffect(effect);
  };

  const removeEffect = (effectOrId: EffectBase | string) => {
    managerRef.current?.removeEffect(effectOrId);
  };

  return {
    renderFrame,
    addEffect,
    removeEffect,
    getManager: () => managerRef.current,
  };
}