import { EffectBase } from '../../core/types/core';
import { BackgroundEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';
import { Color } from '../../core/types/base';

/**
 * 背景エフェクト
 * - 単色背景
 * - 画像背景（フィットモード対応）
 * - グラデーション背景
 * - アニメーション対応
 */
export class BackgroundEffect extends EffectBase<BackgroundEffectConfig> {
  private image: HTMLImageElement | null = null;
  private animationController: AnimationController | null = null;

  constructor(config: BackgroundEffectConfig) {
    super({
      ...config,
      backgroundType: config.backgroundType ?? 'solid',
      color: config.color ?? '#000000',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });

    // アニメーションコントローラーの初期化
    if (config.animation) {
      this.animationController = new AnimationController(config.animation);
    }
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    if (this.config.animation && this.animationController) {
      const { startTime = 0, endTime = Infinity } = this.config;
      const duration = endTime - startTime;
      this.animationController.update(currentTime, startTime, duration);
    }
  }

  /**
   * 背景を描画
   */
  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const {
      backgroundType = 'solid',
      color = '#000000',
      gradientColors,
      gradientDirection = 'horizontal',
      opacity = 1,
      blendMode = 'source-over'
    } = this.config;

    // アニメーション値の適用
    const effectiveOpacity = this.animationController?.getValue<number>('opacity') ?? opacity;
    const effectiveColor = this.animationController?.getValue<Color>('color') ?? color;
    const scale = this.animationController?.getValue<number>('scale') ?? 1;

    ctx.save();
    ctx.globalAlpha = effectiveOpacity;
    ctx.globalCompositeOperation = blendMode;

    // スケール変換の適用
    if (scale !== 1) {
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
    }

    switch (backgroundType) {
      case 'solid':
        ctx.fillStyle = this.colorToString(effectiveColor);
        ctx.fillRect(0, 0, width, height);
        break;

      case 'gradient':
        if (gradientColors && gradientColors.length >= 2) {
          let gradient: CanvasGradient;
          if (gradientDirection === 'horizontal') {
            gradient = ctx.createLinearGradient(0, 0, width, 0);
          } else if (gradientDirection === 'vertical') {
            gradient = ctx.createLinearGradient(0, 0, 0, height);
          } else {
            gradient = ctx.createRadialGradient(
              width / 2, height / 2, 0,
              width / 2, height / 2, Math.max(width, height) / 2
            );
          }
          gradient.addColorStop(0, gradientColors[0]);
          gradient.addColorStop(1, gradientColors[1]);
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        break;

      case 'image':
        if (this.image) {
          const { imageSize = 'cover', imagePosition = { x: 0, y: 0 } } = this.config;
          if (imageSize === 'cover') {
            const scale = Math.max(width / this.image.width, height / this.image.height);
            const scaledWidth = this.image.width * scale;
            const scaledHeight = this.image.height * scale;
            const x = (width - scaledWidth) / 2 + (imagePosition.x * width);
            const y = (height - scaledHeight) / 2 + (imagePosition.y * height);
            ctx.drawImage(this.image, x, y, scaledWidth, scaledHeight);
          } else if (imageSize === 'contain') {
            const scale = Math.min(width / this.image.width, height / this.image.height);
            const scaledWidth = this.image.width * scale;
            const scaledHeight = this.image.height * scale;
            const x = (width - scaledWidth) / 2 + (imagePosition.x * width);
            const y = (height - scaledHeight) / 2 + (imagePosition.y * height);
            ctx.drawImage(this.image, x, y, scaledWidth, scaledHeight);
          } else {
            ctx.drawImage(this.image, 0, 0, width, height);
          }
        }
        break;
    }

    ctx.restore();
  }

  /**
   * 画像を設定
   */
  async setImage(url: string): Promise<void> {
    if (!url) {
      this.image = null;
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        resolve();
      };
      img.onerror = (error) => {
        reject(new Error('Failed to load image: ' + error));
      };
      img.src = url;
    });
  }

  /**
   * 色情報を文字列に変換
   */
  private colorToString(color: Color | string): string {
    if (typeof color === 'string') {
      return color;
    }
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    this.image = null;
    this.animationController = null;
  }
} 