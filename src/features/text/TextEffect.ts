import { EffectBase } from '../../core/types/core';
import { TextEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';
import { Color } from '../../core/types/base';

/**
 * テキストエフェクト
 * - テキストの描画
 * - アニメーション（フェード/スケール/移動/回転/色）
 * - アラインメント制御
 */
export class TextEffect extends EffectBase<TextEffectConfig> {
  private animationController: AnimationController | null = null;

  constructor(config: TextEffectConfig) {
    super({
      ...config,
      text: config.text ?? '',
      font: {
        family: config.font?.family ?? 'Arial',
        size: config.font?.size ?? 48,
        weight: config.font?.weight ?? 'normal'
      },
      color: config.color ?? '#ffffff',
      position: config.position ?? { x: 0, y: 0 },
      alignment: config.alignment ?? 'center',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });

    // アニメーションコントローラーの初期化
    if (config.animation) {
      this.animationController = new AnimationController(config.animation);
    }
  }

  update(currentTime: number): void {
    if (this.config.animation && this.animationController) {
      const { startTime = 0, endTime = Infinity } = this.config;
      const duration = endTime - startTime;
      this.animationController.update(currentTime, startTime, duration);
    }
  }

  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const {
      text,
      font,
      color = '#ffffff',
      position,
      alignment = 'center',
      opacity = 1,
      blendMode = 'source-over'
    } = this.config;

    // アニメーション値の適用
    const effectiveOpacity = this.animationController?.getValue<number>('opacity') ?? opacity;
    const effectiveColor = this.animationController?.getValue<Color>('color') ?? color;
    const effectivePosition = {
      x: this.animationController?.getValue<number>('x') ?? position.x,
      y: this.animationController?.getValue<number>('y') ?? position.y
    };
    const scale = this.animationController?.getValue<number>('scale') ?? 1;
    const rotation = this.animationController?.getValue<number>('rotate') ?? 0;

    ctx.save();
    ctx.globalAlpha = effectiveOpacity;
    ctx.globalCompositeOperation = blendMode;
    ctx.fillStyle = this.colorToString(effectiveColor);
    ctx.font = `${font.weight} ${font.size}px ${font.family}`;
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

  /**
   * 色情報を文字列に変換
   */
  private colorToString(color: Color | string): string {
    if (typeof color === 'string') {
      return color;
    }
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
  }

  dispose(): void {
    this.animationController = null;
  }
} 