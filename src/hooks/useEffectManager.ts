// src/hooks/useEffectManager.ts

import { useRef, useEffect } from 'react';
import { EffectManager } from '../core/EffectManager';

export function useEffectManager(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const managerRef = useRef<EffectManager | null>(null);

  // 初期化
  useEffect(() => {
    if (canvasRef.current) {
      managerRef.current = new EffectManager(canvasRef.current);
    }
    return () => {
      managerRef.current?.dispose();
      managerRef.current = null;
    };
  }, [canvasRef]);

  const renderFrame = (time: number, waveData?: Float32Array, freqData?: Uint8Array) => {
    managerRef.current?.render(time, waveData, freqData);
  };

  const addEffect = (effect: any) => {
    managerRef.current?.addEffect(effect);
  };

  const removeEffect = (id: string) => {
    managerRef.current?.removeEffect(id);
  };

  return {
    renderFrame,
    addEffect,
    removeEffect,
    getManager: () => managerRef.current,
  };
}