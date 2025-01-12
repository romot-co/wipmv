import { useCallback, useState, useEffect } from 'react';
import { EffectManager } from '../core/EffectManager';
import { EffectBase } from '../core/EffectBase';

interface EffectManagerState {
  manager: EffectManager | null;
  error: Error | null;
  isReady: boolean;
  updateTrigger: number;
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
  const [manager, setManagerState] = useState<EffectManager | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // managerの状態を更新する際のユーティリティ関数
  const updateManagerState = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  const setManager = useCallback((newManager: EffectManager) => {
    try {
      if (manager) {
        manager.dispose();
      }
      setManagerState(newManager);
      setIsReady(true);
      setError(null);
      updateManagerState();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to set manager'));
      setIsReady(false);
    }
  }, [manager, updateManagerState]);

  const addEffect = useCallback((effect: EffectBase, id: string) => {
    try {
      if (!manager) {
        throw new Error('Effect manager is not initialized');
      }
      manager.addEffect(effect, id);
      setError(null);
      updateManagerState();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to add effect'));
    }
  }, [manager, updateManagerState]);

  const removeEffect = useCallback((id: string) => {
    try {
      if (!manager) {
        throw new Error('Effect manager is not initialized');
      }
      manager.removeEffect(id);
      setError(null);
      updateManagerState();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to remove effect'));
    }
  }, [manager, updateManagerState]);

  const dispose = useCallback(() => {
    try {
      if (manager) {
        manager.dispose();
        setManagerState(null);
        setIsReady(false);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to dispose manager'));
    }
  }, [manager]);

  // managerの状態が変更されたときに再レンダリングを強制
  useEffect(() => {
    if (manager) {
      setManagerState(manager);
    }
  }, [manager, updateTrigger]);

  return {
    manager,
    error,
    isReady,
    updateTrigger,
    setManager,
    addEffect,
    removeEffect,
    dispose,
  };
}; 