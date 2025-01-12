import { EffectBase, BaseEffectState } from '../../core/EffectBase';
import { TextEffectConfig, AudioVisualParameters } from '../../core/types';

interface TextEffectState extends BaseEffectState {
  animationProgress: number;
  animationActive: boolean;
}

/**
 * テキストエフェクト
 * テキストの描画とアニメーションを管理する
 */
export class TextEffect extends EffectBase<TextEffectState> {
  protected override config: TextEffectConfig;
  private animationStartTime: number | null = null;

  constructor(config: TextEffectConfig) {
    const initialState: TextEffectState = {
      isReady: true,
      isLoading: false,
      error: null,
      animationProgress: 0,
      animationActive: false
    };
    super(config, initialState);
    this.config = config;
  }

  override render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;
    if (!this.state.isReady) return;

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
        this.updateState({
          animationProgress: progress,
          animationActive: progress < 1
        });
        this.applyAnimation(ctx, progress, position);
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

    // アニメーション開始時刻の初期化
    if (this.animationStartTime === null) {
      this.animationStartTime = currentTime;
      this.updateState({
        animationProgress: 0,
        animationActive: true
      });
    }

    const { duration, delay = 0, repeat = false, repeatCount = Infinity } = animation;
    const elapsedTime = currentTime - this.animationStartTime;
    
    if (elapsedTime < delay) return 0;
    
    const activeTime = elapsedTime - delay;
    if (!repeat && activeTime >= duration) return 1;

    if (repeat && repeatCount !== Infinity) {
      const totalDuration = duration * repeatCount;
      if (activeTime >= totalDuration) return 1;
    }

    const cycleProgress = (activeTime % duration) / duration;
    return cycleProgress;
  }

  private applyAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    progress: number,
    position: { x: number; y: number }
  ): void {
    if (!this.config.animation) return;

    const easeProgress = this.easeProgress(progress);

    switch (this.config.animation.type) {
      case 'fade':
        ctx.globalAlpha = easeProgress;
        break;

      case 'scale':
        ctx.translate(position.x, position.y);
        ctx.scale(easeProgress, easeProgress);
        ctx.translate(-position.x, -position.y);
        break;

      case 'slide': {
        const slideOffset = (1 - easeProgress) * 100;
        ctx.translate(slideOffset, 0);
        break;
      }
    }
  }

  private easeProgress(progress: number): number {
    const { animation } = this.config;
    if (!animation?.easing) return progress;

    switch (animation.easing) {
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

  override updateConfig(newConfig: Partial<TextEffectConfig>): void {
    super.updateConfig(newConfig);
    // アニメーション関連の設定が変更された場合はリセット
    if ('animation' in newConfig) {
      this.animationStartTime = null;
      this.updateState({
        animationProgress: 0,
        animationActive: false
      });
    }
  }

  override dispose(): void {
    this.animationStartTime = null;
    super.dispose();
  }
} 