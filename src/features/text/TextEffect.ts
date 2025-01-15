import { EffectBase } from '../../core/EffectBase';
import {
  TextEffectConfig,
  AudioVisualParameters,
  AppError,
  ErrorType,
  EffectType,
  TextAnimation,
  Position2D,
  Color
} from '../../core/types';

interface AnimationState {
  startTime: number;
  progress: number;
  currentValue: number | Position2D | Color;
}

/**
 * テキストエフェクト
 * - テキストの描画
 * - アニメーション（フェード/スケール/移動/回転/色）
 * - アラインメント制御
 */
export class TextEffect extends EffectBase<TextEffectConfig> {
  private animationState: AnimationState | null = null;

  constructor(config: TextEffectConfig) {
    if (!config.text) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Text content is required for text effect'
      );
    }

    super({
      ...config,
      type: EffectType.Text,
      text: config.text,
      fontFamily: config.fontFamily ?? 'Arial',
      fontSize: config.fontSize ?? 24,
      fontWeight: config.fontWeight ?? 'normal',
      color: config.color ?? '#ffffff',
      align: config.align ?? 'center',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over',
      position: config.position ?? { x: 0, y: 0 }
    });
  }

  protected override onConfigUpdate(oldConfig: TextEffectConfig, newConfig: TextEffectConfig): void {
    // アニメーション設定が変更された場合は状態をリセット
    if (newConfig.animation && 
        (!oldConfig.animation || 
         newConfig.animation.type !== oldConfig.animation.type ||
         newConfig.animation.duration !== oldConfig.animation.duration)) {
      this.animationState = null;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;

    const config = this.getConfig();
    if (!config.text) return; // テキストが空の場合は描画しない

    ctx.save();
    try {
      // 共通の描画設定
      ctx.globalAlpha = config.opacity ?? 1;
      ctx.globalCompositeOperation = config.blendMode ?? 'source-over';
      ctx.textAlign = config.align ?? 'center';
      ctx.textBaseline = 'middle';

      // フォント設定
      ctx.font = `${config.fontWeight} ${config.fontSize}px ${config.fontFamily}`;
      ctx.fillStyle = config.color;

      // アニメーションの適用
      this.applyAnimation(ctx, config, params.currentTime);

      // テキストの描画
      ctx.fillText(config.text, config.position.x, config.position.y);

    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'Failed to render text effect',
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
    config: TextEffectConfig,
    currentTime: number
  ): void {
    if (!config.animation) return;

    const animation = config.animation;
    const startTime = config.startTime ?? 0;
    const duration = animation.duration;
    const delay = animation.delay ?? 0;

    // アニメーションの進行度を計算
    let progress = (currentTime - startTime - delay) / duration;
    if (progress < 0 || progress > 1) return;

    // イージング関数の適用
    progress = this.applyEasing(progress, animation.easing);

    try {
      // アニメーション種別ごとの処理
      switch (animation.type) {
        case 'fade':
          this.applyFadeAnimation(ctx, animation, progress);
          break;
        case 'scale':
          this.applyScaleAnimation(ctx, animation, progress, config);
          break;
        case 'move':
          this.applyMoveAnimation(ctx, animation, progress, config);
          break;
        case 'rotate':
          this.applyRotateAnimation(ctx, animation, progress, config);
          break;
        case 'color':
          this.applyColorAnimation(ctx, animation, progress);
          break;
        default:
          throw new AppError(
            ErrorType.EffectUpdateFailed,
            `Unsupported animation type: ${(animation as TextAnimation).type}`
          );
      }
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'Failed to apply animation',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * フェードアニメーションの適用
   */
  private applyFadeAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    animation: TextAnimation,
    progress: number
  ): void {
    if (animation.type !== 'fade') return;
    const from = animation.from ?? 0;
    const to = animation.to ?? 1;
    const opacity = from + (to - from) * progress;
    ctx.globalAlpha *= opacity;
  }

  /**
   * スケールアニメーションの適用
   */
  private applyScaleAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    animation: TextAnimation,
    progress: number,
    config: TextEffectConfig
  ): void {
    if (animation.type !== 'scale') return;
    const scale = animation.from + (animation.to - animation.from) * progress;
    const { x, y } = config.position;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.translate(-x, -y);
  }

  /**
   * 移動アニメーションの適用
   */
  private applyMoveAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    animation: TextAnimation,
    progress: number,
    config: TextEffectConfig
  ): void {
    if (animation.type !== 'move') return;
    const x = animation.from.x + (animation.to.x - animation.from.x) * progress;
    const y = animation.from.y + (animation.to.y - animation.from.y) * progress;
    ctx.translate(x - config.position.x, y - config.position.y);
  }

  /**
   * 回転アニメーションの適用
   */
  private applyRotateAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    animation: TextAnimation,
    progress: number,
    config: TextEffectConfig
  ): void {
    if (animation.type !== 'rotate') return;
    const angle = (animation.from + (animation.to - animation.from) * progress) * Math.PI / 180;
    const { x, y } = config.position;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
  }

  /**
   * 色アニメーションの適用
   */
  private applyColorAnimation(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    animation: TextAnimation,
    progress: number
  ): void {
    if (animation.type !== 'color') return;
    const { from, to } = animation;
    const r = Math.round(from.r + (to.r - from.r) * progress);
    const g = Math.round(from.g + (to.g - from.g) * progress);
    const b = Math.round(from.b + (to.b - from.b) * progress);
    const a = from.a + (to.a - from.a) * progress;
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
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

  public override dispose(): void {
    this.animationState = null;
    super.dispose();
  }
} 