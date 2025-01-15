/**
 * useProject
 * - プロジェクトの管理（作成/読み込み/保存/削除）
 * - エフェクトの管理（追加/更新/削除/順序変更）
 * - 自動保存機能
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ProjectService } from '../core/ProjectService';
import {
  ProjectData,
  ProjectMetadata,
  EffectConfig,
  VideoSettings
} from '../core/types';

interface ProjectState {
  currentProject: ProjectData | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseProjectResult {
  state: ProjectState;
  createProject: (name: string, videoSettings: VideoSettings) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  listProjects: () => Promise<ProjectMetadata[]>;
  addEffect: (effect: EffectConfig) => void;
  updateEffect: (index: number, config: Partial<EffectConfig>) => void;
  deleteEffect: (index: number) => void;
  moveEffect: (fromIndex: number, toIndex: number) => void;
  updateVideoSettings: (settings: VideoSettings) => void;
}

export function useProject(projectService: ProjectService): UseProjectResult {
  const [state, setState] = useState<ProjectState>({
    currentProject: null,
    isLoading: false,
    error: null,
  });

  // 自動保存用のタイマー
  const autoSaveTimerRef = useRef<number | null>(null);
  const isDirtyRef = useRef<boolean>(false);

  /**
   * プロジェクトの作成
   */
  const createProject = useCallback(async (name: string, videoSettings: VideoSettings) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const project = await projectService.createProject(name);
      project.videoSettings = videoSettings;
      await projectService.saveProject(project);
      setState(prev => ({ ...prev, currentProject: project }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('プロジェクトの作成に失敗しました');
      setState(prev => ({ ...prev, error }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [projectService]);

  /**
   * プロジェクトの読み込み
   */
  const loadProject = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const project = await projectService.loadProject(id);
      setState(prev => ({ ...prev, currentProject: project }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('プロジェクトの読み込みに失敗しました');
      setState(prev => ({ ...prev, error }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [projectService]);

  /**
   * プロジェクトの保存
   */
  const saveProject = useCallback(async () => {
    if (!state.currentProject) return;

    setState(prev => ({ ...prev, error: null }));
    try {
      await projectService.saveProject(state.currentProject);
      isDirtyRef.current = false;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('プロジェクトの保存に失敗しました');
      setState(prev => ({ ...prev, error }));
    }
  }, [projectService, state.currentProject]);

  /**
   * プロジェクトの削除
   */
  const deleteProject = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, error: null }));
    try {
      await projectService.deleteProject(id);
      if (state.currentProject?.id === id) {
        setState(prev => ({ ...prev, currentProject: null }));
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('プロジェクトの削除に失敗しました');
      setState(prev => ({ ...prev, error }));
    }
  }, [projectService, state.currentProject]);

  /**
   * プロジェクト一覧の取得
   */
  const listProjects = useCallback(async () => {
    try {
      return await projectService.listProjects();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('プロジェクト一覧の取得に失敗しました');
      setState(prev => ({ ...prev, error }));
      return [];
    }
  }, [projectService]);

  /**
   * エフェクトの追加
   */
  const addEffect = useCallback((effect: EffectConfig) => {
    if (!state.currentProject) return;

    setState(prev => {
      if (!prev.currentProject) return prev;

      const newProject = {
        ...prev.currentProject,
        effects: [...prev.currentProject.effects, effect]
      };
      isDirtyRef.current = true;
      return { ...prev, currentProject: newProject };
    });
  }, [state.currentProject]);

  /**
   * エフェクトの更新
   */
  const updateEffect = useCallback((index: number, config: Partial<EffectConfig>) => {
    if (!state.currentProject) return;

    setState(prev => {
      if (!prev.currentProject) return prev;

      const effects = [...prev.currentProject.effects];
      const currentEffect = effects[index];
      if (!currentEffect) return prev;

      // 型を保持したまま更新
      const updatedEffect = {
        ...currentEffect,
        ...config,
        type: currentEffect.type // typeは変更不可
      } as EffectConfig; // 明示的に型アサーション

      effects[index] = updatedEffect;
      const newProject = { ...prev.currentProject, effects };
      isDirtyRef.current = true;
      return { ...prev, currentProject: newProject };
    });
  }, [state.currentProject]);

  /**
   * エフェクトの削除
   */
  const deleteEffect = useCallback((index: number) => {
    if (!state.currentProject) return;

    setState(prev => {
      if (!prev.currentProject) return prev;

      const effects = prev.currentProject.effects.filter((_, i) => i !== index);
      const newProject = { ...prev.currentProject, effects };
      isDirtyRef.current = true;
      return { ...prev, currentProject: newProject };
    });
  }, [state.currentProject]);

  /**
   * エフェクトの順序変更
   */
  const moveEffect = useCallback((fromIndex: number, toIndex: number) => {
    if (!state.currentProject) return;

    setState(prev => {
      if (!prev.currentProject) return prev;

      const effects = [...prev.currentProject.effects];
      const [removed] = effects.splice(fromIndex, 1);
      effects.splice(toIndex, 0, removed);
      const newProject = { ...prev.currentProject, effects };
      isDirtyRef.current = true;
      return { ...prev, currentProject: newProject };
    });
  }, [state.currentProject]);

  /**
   * 動画設定の更新
   */
  const updateVideoSettings = useCallback((settings: VideoSettings) => {
    if (!state.currentProject) return;

    setState(prev => {
      if (!prev.currentProject) return prev;

      const newProject = {
        ...prev.currentProject,
        videoSettings: settings
      };
      isDirtyRef.current = true;
      return { ...prev, currentProject: newProject };
    });
  }, [state.currentProject]);

  /**
   * 自動保存の設定
   */
  useEffect(() => {
    // 5秒ごとに変更を確認して保存
    const autoSave = async () => {
      if (isDirtyRef.current) {
        await saveProject();
      }
    };

    autoSaveTimerRef.current = window.setInterval(autoSave, 5000);

    return () => {
      if (autoSaveTimerRef.current !== null) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveProject]);

  return {
    state,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    listProjects,
    addEffect,
    updateEffect,
    deleteEffect,
    moveEffect,
    updateVideoSettings,
  };
} 