import { ProjectData } from './types/state';
import { ProjectService } from './ProjectService';

/**
 * プロジェクトの自動保存を担当するサービス
 */
export class AutoSaveService {
  private static instance: AutoSaveService;
  private projectService: ProjectService;
  private autoSaveInterval: number | null = null;
  private currentProject: ProjectData | null = null;

  private constructor() {
    this.projectService = ProjectService.getInstance();
  }

  public static getInstance(): AutoSaveService {
    if (!AutoSaveService.instance) {
      AutoSaveService.instance = new AutoSaveService();
    }
    return AutoSaveService.instance;
  }

  /**
   * 自動保存の開始
   */
  startAutoSave(project: ProjectData): void {
    this.currentProject = project;
    if (this.autoSaveInterval) return;

    this.autoSaveInterval = window.setInterval(async () => {
      if (this.currentProject) {
        try {
          await this.projectService.saveProject(this.currentProject);
        } catch (error) {
          console.error('Auto save failed:', error);
        }
      }
    }, 30000); // 30秒ごとに保存
  }

  /**
   * 自動保存の停止
   */
  stopAutoSave(): void {
    this.currentProject = null;
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * 現在のプロジェクトの更新
   */
  updateCurrentProject(project: ProjectData | null): void {
    this.currentProject = project;
  }

  /**
   * 現在のプロジェクトの取得
   */
  getCurrentProject(): ProjectData | null {
    return this.currentProject;
  }
}
