import { AppError, ErrorType } from './types';

interface ImageLoadResult {
  image: HTMLImageElement;
  width: number;
  height: number;
}

interface ImageLoaderOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * 画像ロード管理クラス
 * - プリロード機能
 * - キャッシュ管理
 * - エラーリトライ
 * - タイムアウト処理
 */
export class ImageLoader {
  private static instance: ImageLoader;
  private cache: Map<string, Promise<ImageLoadResult>> = new Map();
  private options: Required<ImageLoaderOptions>;

  private constructor(options: ImageLoaderOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      timeout: options.timeout ?? 10000
    };
  }

  public static getInstance(options?: ImageLoaderOptions): ImageLoader {
    if (!ImageLoader.instance) {
      ImageLoader.instance = new ImageLoader(options);
    }
    return ImageLoader.instance;
  }

  /**
   * 画像をロード
   */
  public async loadImage(url: string): Promise<ImageLoadResult> {
    if (!url) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        '画像URLが指定されていません'
      );
    }

    // キャッシュチェック
    const cached = this.cache.get(url);
    if (cached) return cached;

    // 新規ロード
    const loadPromise = this.loadWithRetry(url);
    this.cache.set(url, loadPromise);
    
    return loadPromise;
  }

  /**
   * 複数の画像を並列ロード
   */
  public async preloadImages(urls: string[]): Promise<Map<string, ImageLoadResult>> {
    const results = new Map<string, ImageLoadResult>();
    
    await Promise.all(
      urls.map(async url => {
        try {
          const result = await this.loadImage(url);
          results.set(url, result);
        } catch (error) {
          console.warn(`Failed to preload image: ${url}`, error);
        }
      })
    );

    return results;
  }

  /**
   * キャッシュをクリア
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * 特定のURLのキャッシュを削除
   */
  public removeFromCache(url: string): void {
    this.cache.delete(url);
  }

  /**
   * リトライ機能付きの画像ロード
   */
  private async loadWithRetry(url: string, retryCount = 0): Promise<ImageLoadResult> {
    try {
      return await this.loadWithTimeout(url);
    } catch (error) {
      if (retryCount < this.options.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        return this.loadWithRetry(url, retryCount + 1);
      }
      throw new AppError(
        ErrorType.EffectInitFailed,
        `画像のロードに失敗しました: ${url}`,
        error
      );
    }
  }

  /**
   * タイムアウト付きの画像ロード
   */
  private loadWithTimeout(url: string): Promise<ImageLoadResult> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      let timeoutId: number;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        image.onload = null;
        image.onerror = null;
      };

      image.onload = () => {
        cleanup();
        resolve({
          image,
          width: image.width,
          height: image.height
        });
      };

      image.onerror = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${url}`));
      };

      timeoutId = window.setTimeout(() => {
        cleanup();
        reject(new Error(`Image load timeout: ${url}`));
      }, this.options.timeout);

      image.src = url;
    });
  }
} 