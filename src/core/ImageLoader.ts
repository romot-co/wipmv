/**
 * 画像読み込みの結果型
 */
interface ImageLoadResult {
  success: boolean;
  image?: HTMLImageElement;
  error?: Error;
}

/**
 * 画像読み込みのオプション
 */
interface ImageLoadOptions {
  /** リトライ回数 (デフォルト: 3) */
  maxRetries?: number;
  /** リトライ間隔(ms) (デフォルト: 1000) */
  retryDelay?: number;
  /** タイムアウト時間(ms) (デフォルト: 10000) */
  timeout?: number;
}

/**
 * 画像読み込みを管理するシングルトンクラス
 * - 画像のキャッシュ
 * - 読み込みのリトライ
 * - タイムアウト処理
 * を提供します
 */
export class ImageLoader {
  private static instance: ImageLoader;
  private imageCache: Map<string, HTMLImageElement>;
  private loadingPromises: Map<string, Promise<ImageLoadResult>>;

  private constructor() {
    this.imageCache = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): ImageLoader {
    if (!ImageLoader.instance) {
      ImageLoader.instance = new ImageLoader();
    }
    return ImageLoader.instance;
  }

  /**
   * 画像を読み込む
   * @param url 画像URL
   * @param options 読み込みオプション
   */
  public async loadImage(
    url: string,
    options: ImageLoadOptions = {}
  ): Promise<ImageLoadResult> {
    // キャッシュチェック
    const cachedImage = this.imageCache.get(url);
    if (cachedImage) {
      return { success: true, image: cachedImage };
    }

    // 既に読み込み中の場合は既存のPromiseを返す
    const existingPromise = this.loadingPromises.get(url);
    if (existingPromise) {
      return existingPromise;
    }

    // デフォルトオプション
    const {
      maxRetries = 3,
      retryDelay = 1000,
      timeout = 10000
    } = options;

    // 新しい読み込みを開始
    const loadPromise = this.loadImageWithRetry(url, maxRetries, retryDelay, timeout);
    this.loadingPromises.set(url, loadPromise);

    try {
      const result = await loadPromise;
      if (result.success && result.image) {
        this.imageCache.set(url, result.image);
      }
      return result;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * キャッシュから画像を削除
   */
  public removeFromCache(url: string): void {
    this.imageCache.delete(url);
  }

  /**
   * キャッシュをクリア
   */
  public clearCache(): void {
    this.imageCache.clear();
  }

  /**
   * リトライ機能付きの画像読み込み
   */
  private async loadImageWithRetry(
    url: string,
    maxRetries: number,
    retryDelay: number,
    timeout: number
  ): Promise<ImageLoadResult> {
    let retries = 0;

    while (retries <= maxRetries) {
      try {
        const result = await this.loadImageWithTimeout(url, timeout);
        return result;
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error : new Error('Failed to load image')
          };
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return {
      success: false,
      error: new Error('Max retries exceeded')
    };
  }

  /**
   * タイムアウト付きの画像読み込み
   */
  private loadImageWithTimeout(
    url: string,
    timeout: number
  ): Promise<ImageLoadResult> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timeoutId: number = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Image load timeout: ${url}`));
      }, timeout);

      const cleanup = () => {
        image.onload = null;
        image.onerror = null;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      image.onload = () => {
        cleanup();
        resolve({ success: true, image });
      };

      image.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}`));
      };

      image.src = url;
    });
  }
}
