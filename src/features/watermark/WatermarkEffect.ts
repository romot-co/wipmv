import { EffectBase } from '../../core/EffectBase';
import { AudioVisualParameters } from '../../core/types';
import { WatermarkEffectConfig } from './types';

/**
 * ウォーターマークエフェクト
 * 画像をウォーターマークとして描画する
 */
export class WatermarkEffect extends EffectBase {
  private image?: HTMLImageElement;
  private imageLoaded: boolean = false;

  constructor(config: WatermarkEffectConfig) {
    super(config);
    this.loadImage();
  }

  private loadImage(): void {
    const config = this.config as WatermarkEffectConfig;
    this.image = new Image();
    this.image.onload = () => {
      this.imageLoaded = true;
    };
    this.image.src = config.imageUrl;
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.isVisible(parameters.currentTime) || !this.imageLoaded || !this.image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = this.config as WatermarkEffectConfig;
    const { style, repeat } = config;

    // 描画設定
    ctx.globalAlpha = style.opacity;
    if (style.blendMode) {
      ctx.globalCompositeOperation = style.blendMode;
    }

    if (repeat) {
      this.drawRepeatedWatermark(ctx, canvas.width, canvas.height);
    } else {
      this.drawSingleWatermark(ctx);
    }

    // 描画設定をリセット
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawSingleWatermark(ctx: OffscreenCanvasRenderingContext2D): void {
    if (!this.image) return;

    const config = this.config as WatermarkEffectConfig;
    const { position, style } = config;
    const { x, y, width, height, scale = 1, rotation = 0 } = position;

    // 変形の中心を設定
    const centerX = x + (width || this.image.width * scale) / 2;
    const centerY = y + (height || this.image.height * scale) / 2;

    ctx.save();

    // 回転と位置の適用
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);

    // 色調の適用
    if (style.tint) {
      ctx.fillStyle = style.tint;
      ctx.fillRect(x, y, width || this.image.width * scale, height || this.image.height * scale);
      ctx.globalCompositeOperation = 'destination-in';
    }

    // 画像の描画
    ctx.drawImage(
      this.image,
      x,
      y,
      width || this.image.width * scale,
      height || this.image.height * scale
    );

    ctx.restore();
  }

  private drawRepeatedWatermark(
    ctx: OffscreenCanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.image) return;

    const config = this.config as WatermarkEffectConfig;
    const { position, margin = { x: 20, y: 20 } } = config;
    const { scale = 1 } = position;

    const watermarkWidth = this.image.width * scale;
    const watermarkHeight = this.image.height * scale;

    for (let y = 0; y < canvasHeight; y += watermarkHeight + margin.y) {
      for (let x = 0; x < canvasWidth; x += watermarkWidth + margin.x) {
        ctx.drawImage(
          this.image,
          x,
          y,
          watermarkWidth,
          watermarkHeight
        );
      }
    }
  }

  dispose(): void {
    if (this.image) {
      this.image.src = '';
      this.image.onload = null;
    }
  }
} 