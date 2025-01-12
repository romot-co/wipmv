import { EffectBase } from '../../core/EffectBase';
import { TextEffectConfig, AudioVisualParameters } from '../../core/types';

/**
 * テキストエフェクト
 * テキストの描画とアニメーションを管理する
 */
export class TextEffect extends EffectBase {
  protected override config: TextEffectConfig;

  constructor(config: TextEffectConfig) {
    super(config);
    this.config = config;
  }

  render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;

    const { text, style, position } = this.config;

    // スタイルの適用
    ctx.save();

    try {
      ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily}`;
      ctx.fillStyle = style.color;
      ctx.textAlign = style.align || 'center';
      ctx.textBaseline = style.baseline || 'middle';

      // アニメーションの適用
      if (this.config.animation) {
        const progress = this.calculateAnimationProgress(params.currentTime);
        this.applyAnimation(ctx, progress);
      }

      // テキストの描画
      if (style.strokeWidth && style.strokeWidth > 0 && style.strokeColor) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeText(text, position.x, position.y);
      }
      ctx.fillText(text, position.x, position.y);
    } finally {
      ctx.restore();
    }
  }

  private calculateAnimationProgress(currentTime: number): number {
    const { animation } = this.config;
    if (!animation) return 1;

    const { duration, delay = 0 } = animation;
    const startTime = delay;
    const endTime = startTime + duration;

    if (currentTime < startTime) return 0;
    if (currentTime > endTime) return 1;

    return (currentTime - startTime) / duration;
  }

  private applyAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    progress: number
  ): void {
    if (!this.config.animation) return;

    const { position } = this.config;
    const easeProgress = this.easeInOutCubic(progress);
    let scale: number;
    let slideOffset: number;

    switch (this.config.animation.type) {
      case 'fade':
        ctx.globalAlpha = easeProgress;
        break;

      case 'scale':
        scale = easeProgress;
        ctx.setTransform(
          scale, 0,
          0, scale,
          position.x * (1 - scale),
          position.y * (1 - scale)
        );
        break;

      case 'slide':
        slideOffset = (1 - easeProgress) * 100;
        ctx.setTransform(
          1, 0,
          0, 1,
          slideOffset,
          0
        );
        break;
    }
  }

  private easeInOutCubic(progress: number): number {
    if (!this.config.animation?.easing) return progress;

    switch (this.config.animation.easing) {
      case 'easeIn':
        return progress * progress * progress;
      case 'easeOut':
        return 1 - Math.pow(1 - progress, 3);
      case 'easeInOut':
        return progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      default:
        return progress;
    }
  }
} 