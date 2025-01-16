import { v4 as uuidv4 } from 'uuid';
import { IndexedDBManager } from './IndexedDBManager';
import { ProjectData, ProjectMetadata, ErrorType, AppError } from './types';

/**
 * プロジェクトデータの永続化を管理するサービス
 * - 自動保存
 * - 自動復帰
 * - プロジェクト履歴
 */
export class ProjectService {
  private static instance: ProjectService;
  private dbManager: IndexedDBManager;
  private currentProject: ProjectData | null = null;
  private autoSaveTimer: number | null = null;
  private readonly AUTO_SAVE_INTERVAL = 5000; // 5秒ごとに自動保存

  private constructor() {
    this.dbManager = IndexedDBManager.getInstance();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.dbManager.initialize();
      await this.autoRestore();
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Failed to initialize ProjectService',
        error
      );
    }
  }

  /**
   * 最後に編集していたプロジェクトを自動復帰
   */
  private async autoRestore(): Promise<void> {
    try {
      const projects = await this.dbManager.listProjects();
      if (projects.length > 0) {
        // 最後に更新されたプロジェクトを取得
        const latestProject = projects.sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        )[0];
        this.currentProject = await this.loadProject(latestProject.id);
      }
    } catch (error) {
      console.warn('Failed to auto-restore project:', error);
    }
  }

  /**
   * 自動保存を開始
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer !== null) return;

    this.autoSaveTimer = window.setInterval(() => {
      if (this.currentProject) {
        this.saveProject(this.currentProject).catch(console.error);
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  /**
   * 自動保存を停止
   */
  private stopAutoSave(): void {
    if (this.autoSaveTimer !== null) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  public async createProject(name: string): Promise<ProjectData> {
    const now = new Date();
    const project: ProjectData = {
      id: uuidv4(),
      name,
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      videoSettings: {
        width: 960,
        height: 540,
        fps: 30,
        bitrate: 5000000
      },
      effects: []
    };

    try {
      await this.dbManager.saveProject(project);
      this.currentProject = project;
      this.startAutoSave();
      return project;
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Failed to create project',
        error
      );
    }
  }

  public async saveProject(project: ProjectData): Promise<void> {
    try {
      const updatedProject = {
        ...project,
        updatedAt: new Date()
      };
      await this.dbManager.saveProject(updatedProject);
      this.currentProject = updatedProject;
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Failed to save project',
        error
      );
    }
  }

  public async loadProject(id: string): Promise<ProjectData> {
    try {
      const project = await this.dbManager.loadProject(id);
      if (!project) {
        throw new AppError(
          ErrorType.ProjectNotFound,
          `Project with id ${id} not found`
        );
      }
      this.currentProject = project;
      this.startAutoSave();
      return project;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Failed to load project',
        error
      );
    }
  }

  public getCurrentProject(): ProjectData | null {
    return this.currentProject;
  }

  public async listProjects(): Promise<ProjectMetadata[]> {
    try {
      return await this.dbManager.listProjects();
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Failed to list projects',
        error
      );
    }
  }

  public async deleteProject(id: string): Promise<void> {
    try {
      await this.dbManager.deleteProject(id);
      if (this.currentProject?.id === id) {
        this.currentProject = null;
        this.stopAutoSave();
      }
    } catch (error) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Failed to delete project',
        error
      );
    }
  }

  public dispose(): void {
    this.stopAutoSave();
    if (this.currentProject) {
      this.saveProject(this.currentProject).catch(console.error);
    }
    this.dbManager.close();
  }
} 