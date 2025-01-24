/**
 * IndexedDBマネージャー
 * - データベースの初期化と管理
 * - CRUD操作の提供
 * - エラーハンドリング
 */
export class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;
  private readonly dbName = 'wipmv';
  private readonly version = 1;
  private readonly storeName = 'projects';
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  /**
   * データベースの初期化
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('updatedAt', 'updatedAt');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * データの保存
   */
  async put<T extends { id: string }>(storeName: string, data: T): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => {
        reject(new Error('Failed to save data'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * データの取得
   */
  async get<T>(storeName: string, id: string): Promise<T | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onerror = () => {
        reject(new Error('Failed to get data'));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  /**
   * 全データの取得
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => {
        reject(new Error('Failed to get all data'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  /**
   * データの削除
   */
  async delete(storeName: string, id: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onerror = () => {
        reject(new Error('Failed to delete data'));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * データベースの接続を閉じる
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
} 