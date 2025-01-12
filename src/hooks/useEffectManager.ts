import { useCallback, useRef, useState } from 'react';
import { EffectManager } from '../core/EffectManager';
import { EffectBase } from '../core/EffectBase';

interface EffectManagerState {
  manager: EffectManager | null;
  error: Error | null;
  isReady: boolean;
  setManager: (manager: EffectManager) => void;
  addEffect: (effect: EffectBase, id: string) => void;
  removeEffect: (id: string) => void;
  dispose: () => void;
}

/**
 * エフェクトマネージャーを管理するフック
 * エフェクトの追加・削除・更新を行う
 */
export const useEffectManager = (): EffectManagerState => {
  const managerRef = useRef<EffectManager | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);

  const setManager = useCallback((manager: EffectManager) => {
    try {
      if (managerRef.current) {
        managerRef.current.dispose();
      }
      managerRef.current = manager;
      setIsReady(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to set manager'));
      setIsReady(false);
    }
  }, []);

  const addEffect = useCallback((effect: EffectBase, id: string) => {
    try {
      if (!managerRef.current) {
        throw new Error('Effect manager is not initialized');
      }
      managerRef.current.addEffect(effect, id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to add effect'));
    }
  }, []);

  const removeEffect = useCallback((id: string) => {
    try {
      if (!managerRef.current) {
        throw new Error('Effect manager is not initialized');
      }
      managerRef.current.removeEffect(id);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to remove effect'));
    }
  }, []);

  const dispose = useCallback(() => {
    try {
      if (!managerRef.current) return;
      managerRef.current.dispose();
      managerRef.current = null;
      setIsReady(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to dispose manager'));
    }
  }, []);

  return {
    manager: managerRef.current,
    error,
    isReady,
    setManager,
    addEffect,
    removeEffect,
    dispose,
  };
}; 