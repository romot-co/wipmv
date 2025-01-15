import { EffectBase } from '../../core/EffectBase';
import {
  BackgroundEffectConfig,
  AudioVisualParameters,
  AppError,
  ErrorType,
  EffectType,
  Size2D,
  BackgroundAnimation
} from '../../core/types';

interface DrawImageOptions {
  image: HTMLImageElement;
  fitMode: 'cover' | 'contain' | 'fill' | 'center';
  canvasSize: Size2D;
  opacity: number;
}

interface DrawGradientOptions {
  colors: string[];
  direction: 'horizontal' | 'vertical' | 'radial';
  canvasSize: Size2D;
  opacity: number;
}

/**
 * 背景エフェクト
 * - 単色背景
 * - 画像背景（フィットモード対応）
 * - グラデーション背景
 * - アニメーション対応
 */
export class BackgroundEffect extends EffectBase<BackgroundEffectConfig> {
  private image: HTMLImageElement | null = null;
  private imageLoader: Promise<void> | null = null;
  private onImageLoadCallback: (() => void) | null = null;

  constructor(config: BackgroundEffectConfig) {
    super({
      ...config,
      type: EffectType.Background,
      backgroundType: config.backgroundType ?? 'color',
      color: config.color ?? '#000000',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over',
      fitMode: config.fitMode ?? 'cover'
    });

    // 画像の場合は読み込みを開始
    if (config.backgroundType === 'image' && config.imageUrl) {
      this.loadImage(config.imageUrl);
    }
  }

  protected override onConfigUpdate(oldConfig: BackgroundEffectConfig, newConfig: BackgroundEffectConfig): void {
    // 画像URLが変更された場合は再読み込み
    if (
      newConfig.backgroundType === 'image' &&
      newConfig.imageUrl &&
      newConfig.imageUrl !== oldConfig.imageUrl
    ) {
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
          `Failed to load image: ${url}`
        ));
      };
      this.image.src = url;
    });
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;

    const config = this.getConfig();
    const { width, height } = ctx.canvas;
    const canvasSize: Size2D = { width, height };

    ctx.save();
    try {
      // 共通の描画設定
      ctx.globalAlpha = config.opacity ?? 1;
      ctx.globalCompositeOperation = config.blendMode ?? 'source-over';

      // アニメーションの適用
      if (config.animation) {
        this.applyAnimation(ctx, config.animation, params.currentTime, canvasSize);
      }

      // 背景タイプに応じた描画
      switch (config.backgroundType) {
        case 'image':
          if (this.image && config.imageUrl) {
            this.drawImage(ctx, {
              image: this.image,
              fitMode: config.fitMode ?? 'cover',
              canvasSize,
              opacity: config.opacity ?? 1
            });
          }
          break;

        case 'gradient':
          if (config.gradientColors && config.gradientColors.length >= 2) {
            this.drawGradient(ctx, {
              colors: config.gradientColors,
              direction: config.gradientDirection ?? 'horizontal',
              canvasSize,
              opacity: config.opacity ?? 1
            });
          }
          break;

        case 'color':
        default:
          if (config.color) {
            ctx.fillStyle = config.color;
            ctx.fillRect(0, 0, width, height);
          }
          break;
      }
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'Failed to render background effect',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      ctx.restore();
    }
  }

  /**
   * アニメーションの適用
   */
  private applyAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    animation: BackgroundAnimation,
    currentTime: number,
    canvasSize: Size2D
  ): void {
    const startTime = this.getConfig().startTime || 0;
    const duration = animation.duration;
    const delay = animation.delay || 0;

    // アニメーションの進行度を計算
    let progress = (currentTime - startTime - delay) / duration;
    if (progress < 0 || progress > 1) return;

    // イージング関数の適用
    progress = this.applyEasing(progress, animation.easing);

    // アニメーション種別ごとの処理
    let from: number;
    let to: number;
    let scale: number;
    let angle: number;

    switch (animation.type) {
      case 'fade':
        from = animation.from ?? 0;
        to = animation.to ?? 1;
        ctx.globalAlpha *= from + (to - from) * progress;
        break;

      case 'scale':
        scale = animation.from + (animation.to - animation.from) * progress;
        ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-canvasSize.width / 2, -canvasSize.height / 2);
        break;

      case 'rotate':
        angle = (animation.from + (animation.to - animation.from) * progress) * Math.PI / 180;
        ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
        ctx.rotate(angle);
        ctx.translate(-canvasSize.width / 2, -canvasSize.height / 2);
        break;
    }
  }

  /**
   * 画像の描画
   */
  private drawImage(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawImageOptions
  ): void {
    const { image, fitMode, canvasSize } = options;
    const { width: canvasWidth, height: canvasHeight } = canvasSize;
    const imageAspect = image.width / image.height;
    const canvasAspect = canvasWidth / canvasHeight;

    let sx = 0;
    let sy = 0;
    let sWidth = image.width;
    let sHeight = image.height;
    let dx = 0;
    let dy = 0;
    let dWidth = canvasWidth;
    let dHeight = canvasHeight;

    switch (fitMode) {
      case 'cover':
        if (canvasAspect > imageAspect) {
          sHeight = (image.width / canvasAspect);
          sy = (image.height - sHeight) / 2;
        } else {
          sWidth = (image.height * canvasAspect);
          sx = (image.width - sWidth) / 2;
        }
        break;

      case 'contain':
        if (canvasAspect > imageAspect) {
          dWidth = canvasHeight * imageAspect;
          dx = (canvasWidth - dWidth) / 2;
        } else {
          dHeight = canvasWidth / imageAspect;
          dy = (canvasHeight - dHeight) / 2;
        }
        break;

      case 'center':
        dWidth = image.width;
        dHeight = image.height;
        dx = (canvasWidth - dWidth) / 2;
        dy = (canvasHeight - dHeight) / 2;
        break;

      case 'fill':
      default:
        // デフォルトはfill（引き伸ばし）
        break;
    }

    ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
  }

  /**
   * グラデーションの描画
   */
  private drawGradient(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    options: DrawGradientOptions
  ): void {
    const { colors, direction, canvasSize } = options;
    const { width, height } = canvasSize;
    let gradient: CanvasGradient;

    switch (direction) {
      case 'vertical':
        gradient = ctx.createLinearGradient(0, 0, 0, height);
        break;

      case 'radial':
        gradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, Math.max(width, height) / 2
        );
        break;

      case 'horizontal':
      default:
        gradient = ctx.createLinearGradient(0, 0, width, 0);
        break;
    }

    // カラーストップの設定
    const step = 1 / (colors.length - 1);
    colors.forEach((color, index) => {
      gradient.addColorStop(index * step, color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * イージング関数の適用
   */
  private applyEasing(progress: number, easing?: string): number {
    switch (easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - (1 - progress) * (1 - progress);
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress; // linear
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

  public dispose(): void {
    if (this.image) {
      this.image.onload = null;
      this.image.onerror = null;
      this.image = null;
    }
    this.imageLoader = null;
    this.onImageLoadCallback = null;
  }
} 