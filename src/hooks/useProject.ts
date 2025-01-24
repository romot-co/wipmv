/**
 * useProject
 * - プロジェクトの管理（作成/読み込み/保存/削除）
 * - エフェクトの管理（追加/更新/削除/順序変更）
 * - 自動保存機能
 */

import { useCallback, useState } from 'react';
import { ProjectService } from '../core/ProjectService';
import {
  ProjectData,
  ProjectMetadata,
  EffectConfig,
  VideoSettings,
  AppError,
  ErrorType
} from '../core/types';

interface ProjectState {
  currentProject: ProjectData | null;
  isLoading: boolean;
  error: Error | null;
}

interface UseProjectResult {
  state: ProjectState;
  createProject: (name: string, videoSettings: VideoSettings) => Promise<ProjectData>;
  loadProject: (id: string) => Promise<ProjectData>;
  saveProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  listProjects: () => Promise<ProjectMetadata[]>;
  addEffect: (effect: EffectConfig) => Promise<void>;
  updateEffect: (id: string, config: Partial<EffectConfig>) => Promise<void>;
  deleteEffect: (id: string) => Promise<void>;
  moveEffect: (fromId: string, toId: string) => Promise<void>;
  updateVideoSettings: (settings: VideoSettings) => Promise<void>;
}

export function useProject(): UseProjectResult {
  const [state, setState] = useState<ProjectState>({
    currentProject: null,
    isLoading: false,
    error: null
  });

  const service = ProjectService.getInstance();

  const createProject = useCallback(async (name: string, videoSettings: VideoSettings) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const project = await service.createProject(name, videoSettings);
      setState(prev => ({ ...prev, currentProject: project, isLoading: false }));
      return project;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(ErrorType.ProjectCreateFailed, '');
      setState(prev => ({ ...prev, error: appError, isLoading: false }));
      throw appError;
    }
  }, [service]);

  const loadProject = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const project = await service.loadProject(id);
      setState(prev => ({ ...prev, currentProject: project, isLoading: false }));
      return project;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(ErrorType.ProjectLoadFailed, '');
      setState(prev => ({ ...prev, error: appError, isLoading: false }));
      throw appError;
    }
  }, [service]);

  const saveProject = useCallback(async () => {
    if (!state.currentProject) {
      throw new AppError(ErrorType.ProjectNotFound, 'プロジェクトが選択されていません');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await service.saveProject(state.currentProject);
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(ErrorType.ProjectSaveFailed, '');
      setState(prev => ({ ...prev, error: appError, isLoading: false }));
      throw appError;
    }
  }, [service, state.currentProject]);

  const deleteProject = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await service.deleteProject(id);
      setState(prev => ({
        ...prev,
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        isLoading: false
      }));
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(ErrorType.ProjectDeleteFailed, '');
      setState(prev => ({ ...prev, error: appError, isLoading: false }));
      throw appError;
    }
  }, [service, state.currentProject]);

  const listProjects = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const projects = await service.listProjects();
      setState(prev => ({ ...prev, isLoading: false }));
      return projects;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(ErrorType.DatabaseOperationFailed, '');
      setState(prev => ({ ...prev, error: appError, isLoading: false }));
      throw appError;
    }
  }, [service]);

  const addEffect = useCallback(async (effect: EffectConfig) => {
    if (!state.currentProject) {
      throw new AppError(ErrorType.ProjectNotFound, 'プロジェクトが選択されていません');
    }

    const updatedProject = {
      ...state.currentProject,
      effects: [...state.currentProject.effects, effect]
    };

    await service.saveProject(updatedProject);
    setState(prev => ({ ...prev, currentProject: updatedProject }));
  }, [service, state.currentProject]);

  const updateEffect = useCallback(async (id: string, config: Partial<EffectConfig>) => {
    if (!state.currentProject) {
      throw new AppError(ErrorType.ProjectNotFound, 'プロジェクトが選択されていません');
    }

    const index = state.currentProject.effects.findIndex(e => e.id === id);
    if (index === -1) {
      throw new AppError(ErrorType.EffectNotFound, 'エフェクトが見つかりません');
    }

    const effects = [...state.currentProject.effects];
    const currentEffect = effects[index];

    // 型を保持したまま更新
    effects[index] = {
      ...currentEffect,
      ...config,
      type: currentEffect.type // typeは変更不可
    } as EffectConfig;

    const updatedProject = {
      ...state.currentProject,
      effects
    };

    await service.saveProject(updatedProject);
    setState(prev => ({ ...prev, currentProject: updatedProject }));
  }, [service, state.currentProject]);

  const deleteEffect = useCallback(async (id: string) => {
    if (!state.currentProject) {
      throw new AppError(ErrorType.ProjectNotFound, 'プロジェクトが選択されていません');
    }

    const index = state.currentProject.effects.findIndex(e => e.id === id);
    if (index === -1) {
      throw new AppError(ErrorType.EffectNotFound, 'エフェクトが見つかりません');
    }

    const effects = state.currentProject.effects.filter(e => e.id !== id);
    const updatedProject = {
      ...state.currentProject,
      effects
    };

    await service.saveProject(updatedProject);
    setState(prev => ({ ...prev, currentProject: updatedProject }));
  }, [service, state.currentProject]);

  const moveEffect = useCallback(async (fromId: string, toId: string) => {
    if (!state.currentProject) {
      throw new AppError(ErrorType.ProjectNotFound, 'プロジェクトが選択されていません');
    }

    const fromIndex = state.currentProject.effects.findIndex(e => e.id === fromId);
    const toIndex = state.currentProject.effects.findIndex(e => e.id === toId);

    if (fromIndex === -1 || toIndex === -1) {
      throw new AppError(ErrorType.EffectNotFound, 'エフェクトが見つかりません');
    }

    const effects = [...state.currentProject.effects];
    const [effect] = effects.splice(fromIndex, 1);
    effects.splice(toIndex, 0, effect);

    // zIndexの更新
    effects.forEach((effect, index) => {
      effect.zIndex = index;
    });

    const updatedProject = {
      ...state.currentProject,
      effects
    };

    await service.saveProject(updatedProject);
    setState(prev => ({ ...prev, currentProject: updatedProject }));
  }, [service, state.currentProject]);

  const updateVideoSettings = useCallback(async (settings: VideoSettings) => {
    if (!state.currentProject) {
      throw new AppError(ErrorType.ProjectNotFound, 'プロジェクトが選択されていません');
    }

    const updatedProject = {
      ...state.currentProject,
      videoSettings: settings
    };

    await service.saveProject(updatedProject);
    setState(prev => ({ ...prev, currentProject: updatedProject }));
  }, [service, state.currentProject]);

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
    updateVideoSettings
  };
} 