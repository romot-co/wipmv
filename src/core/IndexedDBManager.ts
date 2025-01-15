import { ProjectData, ProjectMetadata, AppError, ErrorType } from './types';

/**
 * IndexedDBを管理するシングルトンクラス
 */
export class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'wipmv-db';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'projects';

  private constructor() {}

  public static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new AppError(
          ErrorType.ProjectServiceError,
          'Failed to open database'
        ));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('by-updated', 'updatedAt');
        }
      };
    });
  }

  public async saveProject(project: ProjectData): Promise<void> {
    if (!this.db) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Database not initialized'
      );
    }

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(project);

      request.onerror = () => {
        reject(new AppError(
          ErrorType.ProjectServiceError,
          'Failed to save project'
        ));
      };

      request.onsuccess = () => resolve();
    });
  }

  public async loadProject(id: string): Promise<ProjectData | null> {
    if (!this.db) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Database not initialized'
      );
    }

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onerror = () => {
        reject(new AppError(
          ErrorType.ProjectServiceError,
          'Failed to load project'
        ));
      };

      request.onsuccess = () => resolve(request.result || null);
    });
  }

  public async listProjects(): Promise<ProjectMetadata[]> {
    if (!this.db) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Database not initialized'
      );
    }

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('by-updated');
      const request = index.getAll();

      request.onerror = () => {
        reject(new AppError(
          ErrorType.ProjectServiceError,
          'Failed to list projects'
        ));
      };

      request.onsuccess = () => {
        const projects = request.result.map((project: ProjectData) => ({
          id: project.id,
          name: project.name,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }));
        resolve(projects);
      };
    });
  }

  public async deleteProject(id: string): Promise<void> {
    if (!this.db) {
      throw new AppError(
        ErrorType.ProjectServiceError,
        'Database not initialized'
      );
    }

    const db = this.db;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => {
        reject(new AppError(
          ErrorType.ProjectServiceError,
          'Failed to delete project'
        ));
      };

      request.onsuccess = () => resolve();
    });
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
} 