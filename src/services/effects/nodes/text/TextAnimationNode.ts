import { BaseEffectNode } from '../../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { TextAnimationConfig } from '../../../../types/effects/text';

/**
 * テキストのアニメーションを適用するノード
 */
export class TextAnimationNode extends BaseEffectNode {
  private type: TextAnimationConfig['type'];
  private duration: number;
  private delay: number;
  private easing: string;

  constructor(config: TextAnimationConfig) {
    super();
    this.type = config.type;
    this.duration = config.duration;
    this.delay = config.delay ?? 0;
    this.easing = config.easing ?? 'linear';
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // アニメーションの進行度を計算
    const progress = this.calculateProgress(parameters.currentTime);
    
    // アニメーションの適用
    switch (this.type) {
      case 'fade':
        this.applyFadeAnimation(ctx, progress);
        break;
      case 'slide':
        this.applySlideAnimation(ctx, progress, canvas.width);
        break;
      case 'none':
      default:
        // アニメーションなし
        break;
    }

    this.passToNext(parameters, canvas);

    ctx.restore();
  }

  private calculateProgress(currentTime: number): number {
    const elapsedTime = currentTime - this.delay;
    if (elapsedTime < 0) return 0;
    if (elapsedTime > this.duration) return 1;

    let progress = elapsedTime / this.duration;

    // イージング関数の適用
    switch (this.easing) {
      case 'easeIn':
        progress = progress * progress;
        break;
      case 'easeOut':
        progress = 1 - (1 - progress) * (1 - progress);
        break;
      case 'easeInOut':
        progress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        break;
      case 'linear':
      default:
        // 線形の進行
        break;
    }

    return progress;
  }

  private applyFadeAnimation(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, progress: number): void {
    ctx.globalAlpha *= progress;
  }

  private applySlideAnimation(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, progress: number, width: number): void {
    const offset = width * (1 - progress);
    ctx.translate(offset, 0);
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): TextAnimationConfig {
    return {
      type: this.type,
      duration: this.duration,
      delay: this.delay,
      easing: this.easing as TextAnimationConfig['easing']
    };
  }

  updateConfig(config: Partial<TextAnimationConfig>): void {
    if (config.type !== undefined) {
      this.type = config.type;
    }
    if (config.duration !== undefined) {
      this.duration = config.duration;
    }
    if (config.delay !== undefined) {
      this.delay = config.delay;
    }
    if (config.easing !== undefined) {
      this.easing = config.easing;
    }
  }
} 