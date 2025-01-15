import { WatermarkEffectConfig, AppError, ErrorType, AudioVisualParameters } from '../../core/types';
import { EffectBase } from '../../core/EffectBase';

export class WatermarkEffect extends EffectBase<WatermarkEffectConfig> {
  private image: HTMLImageElement | null = null;
  private isLoading: boolean = false;

  constructor(config: WatermarkEffectConfig) {
    const defaultConfig: WatermarkEffectConfig = {
      ...config,
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over',
      position: config.position ?? { x: 0, y: 0 },
      size: config.size ?? { width: 100, height: 100 },
      rotation: config.rotation ?? 0,
      tiled: config.tiled ?? false,
      type: config.type,
      id: config.id,
      startTime: config.startTime ?? 0,
      endTime: config.endTime ?? 0,
      zIndex: config.zIndex ?? 0,
      visible: config.visible ?? true
    };
    super(defaultConfig);
    this.loadImage(config.imageUrl);
  }

  private async loadImage(url: string): Promise<void> {
    if (!url) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Image URL is required for watermark effect'
      );
    }

    if (this.isLoading) return;
    this.isLoading = true;

    try {
      const image = new Image();
      image.crossOrigin = 'anonymous';  // CORS対応

      await new Promise<void>((resolve, reject) => {
        image.onload = () => {
          this.image = image;
          this.isLoading = false;
          resolve();
        };
        image.onerror = () => {
          this.isLoading = false;
          reject(new AppError(
            ErrorType.EffectInitFailed,
            `Failed to load image: ${url}`
          ));
        };
        image.src = url;
      });
    } catch (error) {
      this.isLoading = false;
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to load watermark image',
        error
      );
    }
  }

  protected override onConfigUpdate(oldConfig: WatermarkEffectConfig, newConfig: WatermarkEffectConfig): void {
    if (newConfig.imageUrl && newConfig.imageUrl !== oldConfig.imageUrl) {
      this.loadImage(newConfig.imageUrl).catch(error => {
        console.error('Failed to load new watermark image:', error);
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, params: AudioVisualParameters): void {
    if (!this.image || !this.isVisible(params.currentTime)) return;

    const config = this.getConfig();
    const { position, size, rotation, opacity, blendMode, tiled } = config;

    // すべてのプロパティが存在することを確認
    if (!position || !size || rotation === undefined || opacity === undefined || !blendMode) {
      console.warn('Missing required properties for watermark effect');
      return;
    }

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode;

    if (tiled) {
      // タイル表示の場合
      const pattern = ctx.createPattern(this.image, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
    } else {
      // 単一表示の場合
      ctx.translate(position.x + size.width / 2, position.y + size.height / 2);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.drawImage(
        this.image,
        -size.width / 2,
        -size.height / 2,
        size.width,
        size.height
      );
    }

    ctx.restore();
  }

  public dispose(): void {
    this.image = null;
    super.dispose();
  }
} 