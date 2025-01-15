import { EffectBase } from '../../core/EffectBase';
import {
  WatermarkEffectConfig,
  AudioVisualParameters,
  AppError,
  ErrorType,
  EffectType,
  Size2D
} from '../../core/types';

/**
 * ウォーターマークエフェクト
 * - 画像の読み込みと描画
 * - 位置、サイズ、回転の制御
 * - タイル表示オプション
 */
export class WatermarkEffect extends EffectBase<WatermarkEffectConfig> {
  private image: HTMLImageElement | null = null;
  private imageLoader: Promise<void> | null = null;
  private onImageLoadCallback: (() => void) | null = null;

  constructor(config: WatermarkEffectConfig) {
    if (!config.imageUrl) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Image URL is required for watermark effect'
      );
    }

    super({
      ...config,
      type: EffectType.Watermark,
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over',
      position: config.position ?? { x: 0, y: 0 },
      size: config.size,
      rotation: config.rotation ?? 0,
      tiled: config.tiled ?? false,
      tileSpacing: config.tileSpacing ?? 0
    });

    this.loadImage(config.imageUrl);
  }

  protected override onConfigUpdate(oldConfig: WatermarkEffectConfig, newConfig: WatermarkEffectConfig): void {
    if (newConfig.imageUrl && newConfig.imageUrl !== oldConfig.imageUrl) {
      this.loadImage(newConfig.imageUrl);
    }
  }

  /**
   * 画像の読み込み
   */
  private loadImage(url: string): void {
    // 既存の読み込みをキャンセル
    if (this.onImageLoadCallback) {
      this.onImageLoadCallback = null;
    }

    this.image = new Image();
    this.imageLoader = new Promise((resolve, reject) => {
      if (!this.image) return reject(new Error('Image is null'));

      this.onImageLoadCallback = () => resolve();
      this.image.onload = this.onImageLoadCallback;
      this.image.onerror = () => {
        reject(new AppError(
          ErrorType.EffectInitFailed,
          `Failed to load watermark image: ${url}`
        ));
      };
      this.image.src = url;
    });
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime) || !this.image) return;

    const config = this.getConfig();
    const { width: canvasWidth, height: canvasHeight } = ctx.canvas;

    ctx.save();
    try {
      // 共通の描画設定
      ctx.globalAlpha = config.opacity ?? 1;
      ctx.globalCompositeOperation = config.blendMode ?? 'source-over';

      if (config.tiled) {
        // タイル表示
        this.renderTiled(ctx, config, canvasWidth, canvasHeight);
      } else {
        // 単一表示
        this.renderSingle(ctx, config, canvasWidth, canvasHeight);
      }
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'Failed to render watermark effect',
        error
      );
    } finally {
      ctx.restore();
    }
  }

  /**
   * 単一のウォーターマークを描画
   */
  private renderSingle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    config: WatermarkEffectConfig,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.image) return;

    // サイズの計算
    const size = this.calculateSize(config.size, this.image, canvasWidth, canvasHeight);

    // 回転の適用
    if (config.rotation) {
      ctx.translate(config.position.x + size.width / 2, config.position.y + size.height / 2);
      ctx.rotate(config.rotation * Math.PI / 180);
      ctx.translate(-(config.position.x + size.width / 2), -(config.position.y + size.height / 2));
    }

    // 描画
    ctx.drawImage(
      this.image,
      config.position.x,
      config.position.y,
      size.width,
      size.height
    );
  }

  /**
   * タイル状にウォーターマークを描画
   */
  private renderTiled(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    config: WatermarkEffectConfig,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.image) return;

    // サイズの計算
    const size = this.calculateSize(config.size, this.image, canvasWidth, canvasHeight);
    const spacing = config.tileSpacing ?? 0;
    const totalWidth = size.width + spacing;
    const totalHeight = size.height + spacing;

    // タイルの範囲を計算
    const startX = config.position.x;
    const startY = config.position.y;
    const cols = Math.ceil(canvasWidth / totalWidth) + 1;
    const rows = Math.ceil(canvasHeight / totalHeight) + 1;

    // タイル状に描画
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * totalWidth;
        const y = startY + row * totalHeight;

        // 回転の適用
        if (config.rotation) {
          ctx.save();
          ctx.translate(x + size.width / 2, y + size.height / 2);
          ctx.rotate(config.rotation * Math.PI / 180);
          ctx.translate(-(x + size.width / 2), -(y + size.height / 2));
        }

        // 描画
        ctx.drawImage(this.image, x, y, size.width, size.height);

        if (config.rotation) {
          ctx.restore();
        }
      }
    }
  }

  /**
   * 描画サイズを計算
   */
  private calculateSize(
    configSize: Size2D | undefined,
    image: HTMLImageElement,
    canvasWidth: number,
    canvasHeight: number
  ): Size2D {
    if (configSize) {
      return configSize;
    }

    // デフォルトサイズ：キャンバスの1/4
    const maxWidth = canvasWidth / 4;
    const maxHeight = canvasHeight / 4;
    const imageAspect = image.width / image.height;

    if (maxWidth / maxHeight > imageAspect) {
      return {
        width: maxHeight * imageAspect,
        height: maxHeight
      };
    } else {
      return {
        width: maxWidth,
        height: maxWidth / imageAspect
      };
    }
  }

  /**
   * 画像の読み込み完了を待機
   */
  public async waitForLoad(): Promise<void> {
    if (this.imageLoader) {
      await this.imageLoader;
    }
  }

  public override dispose(): void {
    if (this.image) {
      this.image.onload = null;
      this.image.onerror = null;
      this.image = null;
    }
    this.imageLoader = null;
    this.onImageLoadCallback = null;
    super.dispose();
  }
} 