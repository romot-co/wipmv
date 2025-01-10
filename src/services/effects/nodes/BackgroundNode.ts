import { VisualNode } from './VisualNode';
import { BackgroundEffectConfig, ColorBackgroundConfig, ImageBackgroundConfig } from '../../../types/effects';
import { AudioVisualParameters } from '../../../types/audio';

export class BackgroundNode implements VisualNode {
  private config: Omit<BackgroundEffectConfig, 'type'>;
  private context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  constructor(config: Omit<BackgroundEffectConfig, 'type'>) {
    this.config = config;
  }

  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    this.context = context;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }

  process(params: AudioVisualParameters, canvas: HTMLCanvasElement | OffscreenCanvas): void {
    if (!this.context) return;

    const ctx = this.context;
    const { width, height } = canvas;
    const { opacity, blendMode } = this.config;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode;

    if (this.isColorConfig(this.config)) {
      // カラー背景の描画
      ctx.fillStyle = this.config.color;
      ctx.fillRect(0, 0, width, height);
    } else if (this.isImageConfig(this.config) && this.config.image) {
      // 画像背景の描画
      const img = this.config.image;
      const scale = Math.max(width / img.width, height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
    }

    ctx.restore();
  }

  private isColorConfig(config: Omit<BackgroundEffectConfig, 'type'>): config is Omit<ColorBackgroundConfig, 'type'> {
    return 'color' in config;
  }

  private isImageConfig(config: Omit<BackgroundEffectConfig, 'type'>): config is Omit<ImageBackgroundConfig, 'type'> {
    return 'image' in config;
  }

  getConfig(): Omit<BackgroundEffectConfig, 'type'> {
    return this.config;
  }

  setConfig(config: Partial<Omit<BackgroundEffectConfig, 'type'>>): void {
    this.config = { ...this.config, ...config };
  }
} 