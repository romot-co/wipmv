import { Node } from '../../base/Node';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

/**
 * カラーノードの設定
 */
export interface ColorNodeConfig extends BaseNodeConfig {
  /** 塗りつぶし色 */
  color?: string;
  /** グラデーション設定 */
  gradient?: {
    /** グラデーションタイプ */
    type: 'linear' | 'radial';
    /** カラーストップの色 */
    colors: string[];
    /** カラーストップの位置（0-1） */
    stops?: number[];
  };
}

/**
 * 単色またはグラデーションで塗りつぶすノード
 */
export class ColorNode extends Node {
  private readonly color: string;
  private readonly gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    stops?: number[];
  };

  constructor(config: ColorNodeConfig) {
    super('color');
    this.color = config.color ?? '#555555';
    this.gradient = config.gradient;
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    if (this.gradient?.colors.length) {
      this.drawGradient(ctx, canvas.width, canvas.height);
    } else {
      this.drawColor(ctx, canvas.width, canvas.height);
    }

    ctx.restore();
    this.passToNext(parameters, canvas);
  }

  private drawColor(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, width, height);
  }

  private drawGradient(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    if (!this.gradient?.colors.length) return;

    let gradient: CanvasGradient;
    if (this.gradient.type === 'linear') {
      gradient = ctx.createLinearGradient(0, 0, width, height);
    } else {
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    }

    const stops = this.gradient.stops ?? this.gradient.colors.map((_, i) => i / (this.gradient.colors.length - 1));
    this.gradient.colors.forEach((color, i) => {
      gradient.addColorStop(stops[i], color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
} 