import { ProjectData, ProjectMetadata } from './types';

/**
 * IndexedDBを管理するクラス
 */
export class IndexedDBManager {
  private static instance: IndexedDBManager | null = null;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'wipmv-db';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'projects';
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // シングルトンのためprivate
  }

  public static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  /**
   * データベースの初期化
   */
  public async initialize(): Promise<void> {
    await this.init();
  }

  /**
   * データベースの初期化（内部実装）
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('データベースの初期化に失敗:', request.error);
        reject(new Error('Failed to initialize database'));
      };

      request.onsuccess = () => {
        console.log('データベースの初期化成功');
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('データベースのアップグレード');
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * プロジェクトの保存
   */
  public async saveProject(project: ProjectData): Promise<void> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.put(project);

      request.onsuccess = () => {
        console.log('プロジェクトを保存しました:', project.id);
        resolve();
      };

      request.onerror = () => {
        console.error('プロジェクトの保存に失敗:', request.error);
        reject(new Error('Failed to save project'));
      };
    });
  }

  /**
   * プロジェクトの読み込み
   */
  public async loadProject(id: string): Promise<ProjectData | null> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('プロジェクトの読み込みに失敗:', request.error);
        reject(new Error('Failed to load project'));
      };
    });
  }

  /**
   * プロジェクト一覧の取得
   */
  public async listProjects(): Promise<ProjectMetadata[]> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const projects = request.result || [];
        const metadata: ProjectMetadata[] = projects.map(project => ({
          id: project.id,
          name: project.name,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }));
        resolve(metadata);
      };

      request.onerror = () => {
        console.error('プロジェクト一覧の取得に失敗:', request.error);
        reject(new Error('Failed to list projects'));
      };
    });
  }

  /**
   * プロジェクトの削除
   */
  public async deleteProject(id: string): Promise<void> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('プロジェクトを削除しました:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('プロジェクトの削除に失敗:', request.error);
        reject(new Error('Failed to delete project'));
      };
    });
  }

  /**
   * データベースの接続を閉じる
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
} 