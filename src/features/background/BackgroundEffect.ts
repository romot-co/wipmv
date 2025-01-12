import { EffectBase, BaseEffectState } from '../../core/EffectBase';
import { BackgroundEffectConfig, AudioVisualParameters } from '../../core/types';
import { ImageLoader } from '../../core/ImageLoader';

interface BackgroundEffectState extends BaseEffectState {
  imageLoaded: boolean;
  imageSize: {
    width: number;
    height: number;
  } | null;
}

/**
 * 背景エフェクト
 * 単色、画像、グラデーションの背景を描画する
 */
export class BackgroundEffect extends EffectBase<BackgroundEffectState> {
  protected override config: BackgroundEffectConfig;
  private image: HTMLImageElement | null = null;
  private imageLoader: ImageLoader;

  constructor(config: BackgroundEffectConfig) {
    const initialState: BackgroundEffectState = {
      isReady: config.backgroundType !== 'image',
      isLoading: config.backgroundType === 'image' && !!config.imageUrl,
      error: null,
      imageLoaded: false,
      imageSize: null
    };
    super(config, initialState);
    this.config = config;
    this.imageLoader = ImageLoader.getInstance();
    
    if (config.backgroundType === 'image' && config.imageUrl) {
      this.loadImage(config.imageUrl);
    }
  }

  override updateConfig(newConfig: Partial<BackgroundEffectConfig>, batch = false): void {
    super.updateConfig(newConfig, batch);
    
    // 画像URLが変更された場合は再ロード
    if (!batch && 'imageUrl' in newConfig && this.config.backgroundType === 'image') {
      this.updateState({
        isLoading: true,
        isReady: false,
        imageLoaded: false,
        imageSize: null
      });
      this.loadImage(this.config.imageUrl || '');
    }
  }

  private async loadImage(url: string): Promise<void> {
    if (!url) {
      this.image = null;
      this.updateState({
        isReady: true,
        isLoading: false,
        imageLoaded: false,
        imageSize: null,
        error: null
      });
      return;
    }

    try {
      const result = await this.imageLoader.loadImage(url);
      this.image = result.image;
      this.updateState({
        isReady: true,
        isLoading: false,
        error: null,
        imageLoaded: true,
        imageSize: {
          width: result.width,
          height: result.height
        }
      });
    } catch (error) {
      this.image = null;
      this.updateState({
        isReady: false,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to load image'),
        imageLoaded: false,
        imageSize: null
      });
    }
  }

  override render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;
    if (this.config.backgroundType === 'image' && !this.state.isReady) return;

    const { width, height } = ctx.canvas;

    switch (this.config.backgroundType) {
      case 'color':
        if (this.config.color) {
          ctx.fillStyle = this.config.color;
          ctx.fillRect(0, 0, width, height);
        }
        break;

      case 'image':
        if (this.image && this.state.imageLoaded) {
          // 画像を中央に配置してアスペクト比を維持
          const scale = Math.max(
            width / this.image.width,
            height / this.image.height
          );
          const scaledWidth = this.image.width * scale;
          const scaledHeight = this.image.height * scale;
          const x = (width - scaledWidth) / 2;
          const y = (height - scaledHeight) / 2;

          ctx.drawImage(this.image, x, y, scaledWidth, scaledHeight);
        }
        break;

      case 'gradient':
        if (this.config.gradient && this.config.gradient.colors.length >= 2) {
          const { colors, angle } = this.config.gradient;
          
          // 角度に基づいて開始点と終了点を計算
          const angleRad = (angle * Math.PI) / 180;
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          const x1 = width / 2 - cos * width / 2;
          const y1 = height / 2 - sin * height / 2;
          const x2 = width / 2 + cos * width / 2;
          const y2 = height / 2 + sin * height / 2;

          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
          });

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        break;
    }
  }

  /**
   * リソースを解放
   */
  protected override disposeResources(): void {
    // 画像リソースの解放
    if (this.image) {
      this.image.src = '';
      this.image = null;
    }

    // ImageLoaderのキャッシュから削除
    if (this.config.backgroundType === 'image' && this.config.imageUrl) {
      this.imageLoader.removeFromCache(this.config.imageUrl);
    }
  }

  protected override handleConfigChange(
    changes: ReturnType<typeof this.analyzeConfigChanges>
  ): void {
    // 表示状態が変更された場合
    if (changes.visibilityChanged) {
      this.updateState({
        ...this.state,
        isReady: this.config.visible ? 
          (this.config.backgroundType !== 'image' || this.state.imageLoaded) : 
          false
      });
    }

    // タイミングが変更された場合
    if (changes.timingChanged) {
      // 必要に応じて追加の処理
    }
  }
} 