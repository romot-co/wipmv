import { EffectBase } from '../../core/EffectBase';
import { TextEffectConfig, TextAnimation, Position2D } from '../../core/types';

/**
 * テキストエフェクト
 * - テキストの描画
 * - アニメーション（フェード/スケール/移動/回転/色）
 * - アラインメント制御
 */
export class TextEffect extends EffectBase<TextEffectConfig> {
  private animationState: {
    progress: number;
    opacity: number;
    scale: number;
    position: Position2D;
    rotation: number;
    color: string;
  } | null = null;

  constructor(config: TextEffectConfig) {
    super({
      ...config,
      text: config.text ?? '',
      fontFamily: config.fontFamily ?? 'Arial',
      fontSize: config.fontSize ?? 48,
      fontWeight: config.fontWeight ?? 'normal',
      color: config.color ?? '#ffffff',
      position: config.position ?? { x: 0, y: 0 },
      alignment: config.alignment ?? 'center',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });

    // アニメーション状態の初期化
    if (config.animations && config.animations.length > 0) {
      this.animationState = {
        progress: 0,
        opacity: config.opacity ?? 1,
        scale: 1,
        position: { ...config.position },
        rotation: 0,
        color: config.color ?? '#ffffff'
      };
    }
  }

  update(currentTime: number): void {
    if (!this.config.animations || !this.animationState) return;

    const { startTime = 0, endTime = 0 } = this.config;
    const duration = endTime - startTime;

    // 進行度を計算（0-1）
    const progress = Math.max(0, Math.min((currentTime - startTime) / duration, 1));
    this.animationState.progress = progress;

    // 各アニメーションを適用
    for (const animation of this.config.animations) {
      const animationProgress = this.getAnimationProgress(progress, animation);
      if (animationProgress === null) continue;

      let r: number, g: number, b: number, a: number;

      switch (animation.type) {
        case 'fade':
          this.animationState.opacity = this.lerp(
            animation.from ?? 0,
            animation.to ?? 1,
            animationProgress
          );
          break;

        case 'scale':
          this.animationState.scale = this.lerp(
            animation.from,
            animation.to,
            animationProgress
          );
          break;

        case 'move':
          this.animationState.position = {
            x: this.lerp(animation.from.x, animation.to.x, animationProgress),
            y: this.lerp(animation.from.y, animation.to.y, animationProgress)
          };
          break;

        case 'rotate':
          this.animationState.rotation = this.lerp(
            animation.from,
            animation.to,
            animationProgress
          );
          break;

        case 'color':
          r = this.lerp(animation.from.r, animation.to.r, animationProgress);
          g = this.lerp(animation.from.g, animation.to.g, animationProgress);
          b = this.lerp(animation.from.b, animation.to.b, animationProgress);
          a = this.lerp(animation.from.a, animation.to.a, animationProgress);
          this.animationState.color = `rgba(${r},${g},${b},${a})`;
          break;
      }
    }
  }

  private getAnimationProgress(globalProgress: number, animation: TextAnimation): number | null {
    const { duration, delay = 0 } = animation;
    const startProgress = delay;
    const endProgress = startProgress + duration;

    if (globalProgress < startProgress || globalProgress > endProgress) {
      return null;
    }

    const progress = (globalProgress - startProgress) / duration;
    return this.applyEasing(progress, animation.easing);
  }

  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

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

  render(ctx: CanvasRenderingContext2D): void {
    const {
      text,
      fontFamily,
      fontSize,
      fontWeight,
      color = '#ffffff',
      position,
      alignment = 'center',
      opacity = 1,
      blendMode = 'source-over'
    } = this.config;

    // アニメーション状態の適用
    const effectiveOpacity = this.animationState?.opacity ?? opacity;
    const effectiveColor = this.animationState?.color ?? color;
    const effectivePosition = this.animationState?.position ?? position;
    const scale = this.animationState?.scale ?? 1;
    const rotation = this.animationState?.rotation ?? 0;

    ctx.save();
    ctx.globalAlpha = effectiveOpacity;
    ctx.globalCompositeOperation = blendMode;
    ctx.fillStyle = effectiveColor;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = alignment;
    ctx.textBaseline = 'middle';

    // 変換の適用
    ctx.translate(effectivePosition.x, effectivePosition.y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    // テキストの描画
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
} 