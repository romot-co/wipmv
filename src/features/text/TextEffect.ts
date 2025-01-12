import { EffectBase } from '../../core/EffectBase';
import { AudioVisualParameters } from '../../core/types';
import { TextEffectConfig, TextAnimation } from './types';

/**
 * テキストエフェクト
 * テキストの描画とアニメーションを管理する
 */
export class TextEffect extends EffectBase {
  constructor(config: TextEffectConfig) {
    super(config);
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.isVisible(parameters.currentTime)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = this.config as TextEffectConfig;
    const { text, style, position } = config;

    // スタイルの設定
    ctx.font = `${style.fontWeight || 'normal'} ${style.fontSize}px ${style.fontFamily}`;
    ctx.textAlign = style.align || 'left';
    ctx.textBaseline = style.baseline || 'top';

    // アニメーション適用
    const animationProgress = this.calculateAnimationProgress(parameters.currentTime);
    this.applyAnimation(ctx, animationProgress, config.animation);

    // テキストの描画
    if (style.strokeColor && style.strokeWidth) {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = style.strokeWidth;
      ctx.strokeText(text, position.x, position.y);
    }

    ctx.fillStyle = style.color;
    ctx.fillText(text, position.x, position.y);
  }

  private calculateAnimationProgress(currentTime: number): number {
    const config = this.config as TextEffectConfig;
    const animation = config.animation;
    if (!animation) return 1;

    const startTime = config.startTime || 0;
    const elapsedTime = currentTime - startTime - (animation.delay || 0);
    
    if (elapsedTime < 0) return 0;
    if (elapsedTime > animation.duration) return 1;

    return elapsedTime / animation.duration;
  }

  private applyAnimation(
    ctx: OffscreenCanvasRenderingContext2D,
    progress: number,
    animation?: TextAnimation
  ): void {
    if (!animation) return;

    const easeProgress = this.ease(progress, animation.easing);
    let scale: number;
    let slideDistance: number;
    let slideOffset: number;

    switch (animation.type) {
      case 'fade':
        ctx.globalAlpha = easeProgress;
        break;

      case 'scale':
        scale = easeProgress;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        break;

      case 'slide':
        slideDistance = 100; // ピクセル単位のスライド距離
        slideOffset = slideDistance * (1 - easeProgress);
        ctx.setTransform(1, 0, 0, 1, slideOffset, 0);
        break;
    }
  }

  private ease(progress: number, type?: string): number {
    switch (type) {
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