import { IndexedDBManager } from './IndexedDBManager';
import { VideoSettings } from './types/base';
import { ProjectData, ProjectMetadata } from './types/state';
import { AppError, ErrorType } from './types/error';

/**
 * プロジェクトデータの永続化を担当するリポジトリのインターフェース
 */
export interface ProjectRepository {
  create(name: string, settings: VideoSettings): Promise<ProjectData>;
  load(id: string): Promise<ProjectData>;
  save(project: ProjectData): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<ProjectMetadata[]>;
}

/**
 * エラーハンドリングのためのユーティリティ関数
 */
const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorType: ErrorType,
  errorMessage: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(errorType, errorMessage);
  }
};

/**
 * IndexedDBを使用したプロジェクトリポジトリの実装
 */
export class IndexedDBProjectRepository implements ProjectRepository {
  private indexedDB: IndexedDBManager;

  constructor() {
    this.indexedDB = IndexedDBManager.getInstance();
  }

  async create(name: string, settings: VideoSettings): Promise<ProjectData> {
    const project: ProjectData = {
      id: crypto.randomUUID(),
      name,
      videoSettings: settings,
      effects: [],
      audioBuffer: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return withErrorHandling(
      () => this.indexedDB.put('projects', project).then(() => project),
      ErrorType.ProjectCreateFailed,
      'プロジェクトの作成に失敗しました'
    );
  }

  async load(id: string): Promise<ProjectData> {
    return withErrorHandling(
      async () => {
        const project = await this.indexedDB.get<ProjectData>('projects', id);
        if (!project) {
          throw new AppError(
            ErrorType.ProjectNotFound,
            'プロジェクトが見つかりません'
          );
        }
        return project;
      },
      ErrorType.ProjectLoadFailed,
      'プロジェクトの読み込みに失敗しました'
    );
  }

  async save(project: ProjectData): Promise<void> {
    project.updatedAt = Date.now();
    return withErrorHandling(
      () => this.indexedDB.put('projects', project),
      ErrorType.ProjectSaveFailed,
      'プロジェクトの保存に失敗しました'
    );
  }

  async delete(id: string): Promise<void> {
    return withErrorHandling(
      () => this.indexedDB.delete('projects', id),
      ErrorType.ProjectDeleteFailed,
      'プロジェクトの削除に失敗しました'
    );
  }

  async list(): Promise<ProjectMetadata[]> {
    return withErrorHandling(
      async () => {
        const projects = await this.indexedDB.getAll<ProjectData>('projects');
        return projects.map(({ id, name, createdAt, updatedAt }: ProjectData) => ({
          id,
          name,
          createdAt,
          updatedAt
        }));
      },
      ErrorType.GENERIC_ERROR,
      'プロジェクト一覧の取得に失敗しました'
    );
  }
}

/**
 * プロジェクトデータの永続化を担当するサービス
 */
export class ProjectService {
  private static instance: ProjectService;
  private repository: ProjectRepository;

  private constructor() {
    this.repository = new IndexedDBProjectRepository();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  async createProject(name: string, settings: VideoSettings): Promise<ProjectData> {
    return this.repository.create(name, settings);
  }

  async loadProject(id: string): Promise<ProjectData> {
    return this.repository.load(id);
  }

  async saveProject(project: ProjectData): Promise<void> {
    return this.repository.save(project);
  }

  async deleteProject(id: string): Promise<void> {
    return this.repository.delete(id);
  }

  async listProjects(): Promise<ProjectMetadata[]> {
    return this.repository.list();
  }

  /**
   * 最後に開いたプロジェクトIDを保存
   */
  async setLastOpenedProject(id: string): Promise<void> {
    return withErrorHandling(
      () => {
        const settings = { id: 'main', lastProjectId: id };
        return IndexedDBManager.getInstance().put('appSettings', settings);
      },
      ErrorType.GENERIC_ERROR,
      '最後に開いたプロジェクトの保存に失敗しました'
    );
  }

  /**
   * 最後に開いたプロジェクトIDを取得
   */
  async getLastOpenedProject(): Promise<string | null> {
    return withErrorHandling(
      async () => {
        const settings = await IndexedDBManager.getInstance().get<{ id: string; lastProjectId: string }>('appSettings', 'main');
        return settings?.lastProjectId || null;
      },
      ErrorType.GENERIC_ERROR,
      '最後に開いたプロジェクトの取得に失敗しました'
    );
  }
}
