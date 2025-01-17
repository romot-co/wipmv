import { EffectBase } from '../../core/EffectBase';
import { BackgroundEffectConfig } from '../../core/types';

/**
 * 背景エフェクト
 * - 単色背景
 * - 画像背景（フィットモード対応）
 * - グラデーション背景
 * - アニメーション対応
 */
export class BackgroundEffect extends EffectBase<BackgroundEffectConfig> {
  private image: HTMLImageElement | null = null;
  private animationState: {
    progress: number;
    opacity: number;
    scale: number;
    color: string;
  } | null = null;

  constructor(config: BackgroundEffectConfig) {
    super({
      ...config,
      backgroundType: config.backgroundType ?? 'solid',
      color: config.color ?? '#000000',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });

    // アニメーション状態の初期化
    if (config.animation) {
      this.animationState = {
        progress: 0,
        opacity: config.opacity ?? 1,
        scale: 1,
        color: config.color ?? '#000000'
      };
    }
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    if (this.config.animation && this.animationState) {
      const { animation } = this.config;
      const { startTime = 0, endTime = 0 } = this.config;
      const duration = endTime - startTime;
      
      // 進行度を計算（0-1）
      const progress = Math.max(0, Math.min((currentTime - startTime) / duration, 1));
      this.animationState.progress = progress;

      // アニメーションタイプに応じて値を更新
      switch (animation.type) {
        case 'fade':
          this.animationState.opacity = this.lerp(
            animation.from ?? 0,
            animation.to ?? 1,
            progress
          );
          break;
        case 'scale':
          this.animationState.scale = this.lerp(
            animation.from ?? 0.5,
            animation.to ?? 1.5,
            progress
          );
          break;
        case 'color':
          if (animation.from && animation.to) {
            const r = this.lerp(animation.from.r, animation.to.r, progress);
            const g = this.lerp(animation.from.g, animation.to.g, progress);
            const b = this.lerp(animation.from.b, animation.to.b, progress);
            const a = this.lerp(animation.from.a, animation.to.a, progress);
            this.animationState.color = `rgba(${r},${g},${b},${a})`;
          }
          break;
      }
    }
  }

  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * 背景を描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const {
      backgroundType = 'solid',
      color = '#000000',
      gradientColors,
      gradientDirection = 'horizontal',
      opacity = 1,
      blendMode = 'source-over'
    } = this.config;

    // アニメーション状態の適用
    const effectiveOpacity = this.animationState?.opacity ?? opacity;
    const effectiveColor = this.animationState?.color ?? color;
    const scale = this.animationState?.scale ?? 1;

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
        ctx.fillStyle = effectiveColor;
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
  setImage(url: string): void {
    if (!url) {
      this.image = null;
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.image = img;
    };
    img.src = url;
  }

  /**
   * リソースの解放
   */
  override dispose(): void {
    this.image = null;
    this.animationState = null;
    super.dispose();
  }
} 