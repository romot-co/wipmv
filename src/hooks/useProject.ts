/**
 * useProject
 * - プロジェクトの管理（作成/読み込み/保存/削除）
 * - エフェクトの管理（追加/更新/削除/順序変更）
 * - 自動保存機能
 */

import { useCallback } from 'react';
import { ProjectService } from '../core/ProjectService';
import { 
  ProjectData, 
  VideoSettings, 
  AppError,
  ErrorType,
  ProjectMetadata
} from '../core/types';
import { useApp } from '../contexts/AppContext';

export interface UseProjectResult {
  state: {
    currentProject: ProjectData | null;
    lastSaved: number | null;
    isLoading: boolean;
  };
  createProject: (name: string, videoSettings: VideoSettings) => Promise<ProjectData>;
  loadProject: (id: string) => Promise<ProjectData>;
  saveProject: () => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  listProjects: () => Promise<ProjectMetadata[]>;
  updateVideoSettings: (settings: VideoSettings) => Promise<void>;
}

export function useProject(): UseProjectResult {
  const { 
    projectState,
    setProjectState,
    setProgressState,
    handleError
  } = useApp();

  const service = ProjectService.getInstance();

  const createProject = useCallback(async (name: string, videoSettings: VideoSettings) => {
    setProgressState({ isLoading: true, message: 'プロジェクトを作成中...' });
    try {
      const project = await service.createProject(name, videoSettings);
      setProjectState({ 
        currentProject: project,
        lastSaved: Date.now()
      });
      return project;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        ErrorType.ProjectCreateFailed,
        'プロジェクトの作成に失敗しました',
        error
      );
      handleError('project', appError);
      throw appError;
    } finally {
      setProgressState({ isLoading: false, message: null });
    }
  }, [service, setProjectState, setProgressState, handleError]);

  const loadProject = useCallback(async (id: string) => {
    setProgressState({ isLoading: true, message: 'プロジェクトを読み込み中...' });
    try {
      const project = await service.loadProject(id);
      setProjectState({ 
        currentProject: project,
        lastSaved: Date.now()
      });
      return project;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        ErrorType.ProjectLoadFailed,
        'プロジェクトの読み込みに失敗しました',
        error
      );
      handleError('project', appError);
      throw appError;
    } finally {
      setProgressState({ isLoading: false, message: null });
    }
  }, [service, setProjectState, setProgressState, handleError]);

  const saveProject = useCallback(async () => {
    if (!projectState.currentProject) {
      throw new AppError(
        ErrorType.ProjectNotFound,
        'プロジェクトが選択されていません'
      );
    }

    setProgressState({ isSaving: true, message: 'プロジェクトを保存中...' });
    try {
      await service.saveProject(projectState.currentProject);
      setProjectState({ lastSaved: Date.now() });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        ErrorType.ProjectSaveFailed,
        'プロジェクトの保存に失敗しました',
        error
      );
      handleError('project', appError);
      throw appError;
    } finally {
      setProgressState({ isSaving: false, message: null });
    }
  }, [service, projectState.currentProject, setProjectState, setProgressState, handleError]);

  const deleteProject = useCallback(async (id: string) => {
    setProgressState({ isLoading: true, message: 'プロジェクトを削除中...' });
    try {
      await service.deleteProject(id);
      if (projectState.currentProject?.id === id) {
        setProjectState({ 
          currentProject: null,
          lastSaved: null
        });
      }
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        ErrorType.ProjectDeleteFailed,
        'プロジェクトの削除に失敗しました',
        error
      );
      handleError('project', appError);
      throw appError;
    } finally {
      setProgressState({ isLoading: false, message: null });
    }
  }, [service, projectState.currentProject, setProjectState, setProgressState, handleError]);

  const listProjects = useCallback(async () => {
    setProgressState({ isLoading: true, message: 'プロジェクト一覧を取得中...' });
    try {
      const projects = await service.listProjects();
      setProjectState({ projectList: projects });
      return projects;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        ErrorType.DatabaseOperationFailed,
        'プロジェクト一覧の取得に失敗しました',
        error
      );
      handleError('project', appError);
      throw appError;
    } finally {
      setProgressState({ isLoading: false, message: null });
    }
  }, [service, setProjectState, setProgressState, handleError]);

  const updateVideoSettings = useCallback(async (settings: VideoSettings) => {
    if (!projectState.currentProject) {
      throw new AppError(
        ErrorType.ProjectNotFound,
        'プロジェクトが選択されていません'
      );
    }

    try {
      const updatedProject = {
        ...projectState.currentProject,
        videoSettings: settings,
        updatedAt: Date.now()
      };
      await service.saveProject(updatedProject);
      setProjectState({ 
        currentProject: updatedProject,
        lastSaved: Date.now()
      });
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        ErrorType.ProjectSaveFailed,
        '動画設定の更新に失敗しました',
        error
      );
      handleError('project', appError);
      throw appError;
    }
  }, [service, projectState.currentProject, setProjectState, handleError]);

  return {
    state: projectState,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    listProjects,
    updateVideoSettings
  };
} 