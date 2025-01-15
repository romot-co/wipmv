import { EffectBase } from '../../core/EffectBase';
import { BackgroundEffectConfig, AudioVisualParameters } from '../../core/types';
import { ImageLoader } from '../../core/ImageLoader';

export class BackgroundEffect extends EffectBase {
  private image: HTMLImageElement | null = null;
  private imageLoader: ImageLoader;
  private onImageLoadCallback: (() => void) | null = null;

  constructor(config: BackgroundEffectConfig) {
    // デフォルト設定
    const defaultConfig: BackgroundEffectConfig = {
      ...config,
      backgroundType: config.backgroundType || 'color',
      color: config.color || '#ffffff',
      imageUrl: config.imageUrl,
      gradient: config.gradient || {
        colors: ['#ffffff', '#000000'],
        angle: 0
      }
    };
    super(defaultConfig);
    this.imageLoader = ImageLoader.getInstance();
    this.loadImage();
  }

  public setOnImageLoadCallback(callback: () => void): void {
    this.onImageLoadCallback = callback;
  }

  private async loadImage(): Promise<void> {
    const config = this.getConfig<BackgroundEffectConfig>();
    if (config.backgroundType !== 'image' || !config.imageUrl) {
      this.image = null;
      // 画像なしの場合もコールバックを呼び出し（表示更新のため）
      if (this.onImageLoadCallback) {
        this.onImageLoadCallback();
      }
      return;
    }

    try {
      const result = await this.imageLoader.loadImage(config.imageUrl);
      this.image = result?.image || null;
      // 画像ロード完了時にコールバックを呼び出し
      if (this.onImageLoadCallback) {
        this.onImageLoadCallback();
      }
    } catch (error) {
      console.error('Failed to load background image:', error);
      this.image = null;
      // エラー時にもコールバックを呼び出し（エラー状態を反映するため）
      if (this.onImageLoadCallback) {
        this.onImageLoadCallback();
      }
    }
  }

  public updateConfig(newConfig: Partial<BackgroundEffectConfig>): void {
    super.updateConfig(newConfig);
    if ('backgroundType' in newConfig || 'imageUrl' in newConfig) {
      this.loadImage();
    }
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    const config = this.getConfig<BackgroundEffectConfig>();

    // 表示チェック
    if (!this.isVisible(params.currentTime)) return;

    const { width, height } = ctx.canvas;

    ctx.save();
    try {
      switch (config.backgroundType) {
        case 'image':
          if (this.image) {
            // 画像背景
            const imageAspect = this.image.width / this.image.height;
            const canvasAspect = width / height;
            let drawWidth = width;
            let drawHeight = height;
            let offsetX = 0;
            let offsetY = 0;

            // アスペクト比を保持しながら、キャンバス全体をカバー
            if (imageAspect > canvasAspect) {
              // 画像の方が横長の場合、高さに合わせる
              drawWidth = height * imageAspect;
              offsetX = (width - drawWidth) / 2;
            } else {
              // 画像の方が縦長の場合、幅に合わせる
              drawHeight = width / imageAspect;
              offsetY = (height - drawHeight) / 2;
            }

            ctx.drawImage(this.image, offsetX, offsetY, drawWidth, drawHeight);
          }
          break;

        case 'gradient':
          if (config.gradient && config.gradient.colors.length >= 2) {
            // グラデーション背景
            const { colors, angle } = config.gradient;
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

        case 'color':
        default:
          // 単色背景
          ctx.fillStyle = config.color || '#ffffff';
          ctx.fillRect(0, 0, width, height);
          break;
      }
    } finally {
      ctx.restore();
    }
  }

  public dispose(): void {
    if (this.image) {
      this.image = null;
    }
    if (this.imageLoader) {
      const config = this.getConfig<BackgroundEffectConfig>();
      if (config.imageUrl) {
        this.imageLoader.removeFromCache(config.imageUrl);
      }
    }
  }
} 