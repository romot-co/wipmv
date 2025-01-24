import { IndexedDBManager } from './IndexedDBManager';
import {
  VideoSettings,
  ProjectData,
  AppError,
  ErrorType,
  ProjectMetadata
} from './types';

/**
 * プロジェクト管理サービス
 * - プロジェクトデータの永続化
 * - 自動保存
 * - 自動復旧
 * - プロジェクト履歴
 */
export class ProjectService {
  private static instance: ProjectService;
  private indexedDB: IndexedDBManager;
  private autoSaveInterval: number | null = null;
  private currentProject: ProjectData | null = null;

  private constructor() {
    this.indexedDB = IndexedDBManager.getInstance();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  /**
   * プロジェクトの作成
   */
  async createProject(name: string, videoSettings: VideoSettings): Promise<ProjectData> {
    const project: ProjectData = {
      id: crypto.randomUUID(),
      name,
      videoSettings,
      effects: [],
      audioBuffer: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await this.indexedDB.put('projects', project);
      this.currentProject = project;
      this.startAutoSave();
      return project;
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectCreateFailed,
        'プロジェクトの作成に失敗しました'
      );
    }
  }

  /**
   * プロジェクトの読み込み
   */
  async loadProject(id: string): Promise<ProjectData> {
    try {
      const project = await this.indexedDB.get<ProjectData>('projects', id);
      if (!project) {
        throw new AppError(
          ErrorType.ProjectNotFound,
          'プロジェクトが見つかりません'
        );
      }

      this.currentProject = project;
      this.startAutoSave();
      return project;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.ProjectLoadFailed,
        'プロジェクトの読み込みに失敗しました'
      );
    }
  }

  /**
   * プロジェクトの保存
   */
  async saveProject(project: ProjectData): Promise<void> {
    try {
      project.updatedAt = Date.now();
      await this.indexedDB.put('projects', project);
      this.currentProject = project;
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectSaveFailed,
        'プロジェクトの保存に失敗しました'
      );
    }
  }

  /**
   * プロジェクトの削除
   */
  async deleteProject(id: string): Promise<void> {
    try {
      await this.indexedDB.delete('projects', id);
      if (this.currentProject?.id === id) {
        this.stopAutoSave();
        this.currentProject = null;
      }
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectDeleteFailed,
        'プロジェクトの削除に失敗しました'
      );
    }
  }

  /**
   * プロジェクト一覧の取得
   */
  async listProjects(): Promise<ProjectMetadata[]> {
    try {
      const projects = await this.indexedDB.getAll<ProjectData>('projects');
      return projects.map(({ id, name, createdAt, updatedAt }: ProjectData) => ({
        id,
        name,
        createdAt,
        updatedAt
      }));
    } catch (error) {
      throw new AppError(
        ErrorType.DatabaseOperationFailed,
        'プロジェクト一覧の取得に失敗しました'
      );
    }
  }

  /**
   * 現在のプロジェクトの取得
   */
  getCurrentProject(): ProjectData | null {
    return this.currentProject;
  }

  /**
   * 自動保存の開始
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) return;

    this.autoSaveInterval = window.setInterval(async () => {
      if (this.currentProject) {
        try {
          await this.saveProject(this.currentProject);
        } catch (error) {
          console.error('Auto save failed:', error);
        }
      }
    }, 30000); // 30秒ごとに保存
  }

  /**
   * 自動保存の停止
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}
