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
    ctx.restore();
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

    const { type } = this.config.animation;
    const easedProgress = this.ease(progress);

    switch (type) {
      case 'fade': {
        ctx.globalAlpha *= easedProgress;
        break;
      }
      case 'scale': {
        const scale = easedProgress;
        ctx.scale(scale, scale);
        break;
      }
      case 'slide': {
        const { x } = this.config.position;
        const startX = x - 100;
        const distance = x - startX;
        ctx.translate(startX + distance * easedProgress - x, 0);
        break;
      }
    }
  }

  private ease(progress: number): number {
    if (!this.config.animation?.easing) return progress;

    switch (this.config.animation.easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - Math.pow(1 - progress, 2);
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress;
    }
  }
} 