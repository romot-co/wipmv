import { BaseEffectNode } from '../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

export type BackgroundType = 'color' | 'image';

export interface BackgroundNodeOptions {
  type: BackgroundType;
  color?: string;
  image?: HTMLImageElement;
  scaleMode?: 'cover' | 'contain' | 'stretch';
}

export interface BackgroundNodeConfig extends BaseNodeConfig {
  type: 'background';
  backgroundType: BackgroundType;
  color?: string;
  image?: HTMLImageElement;
  scaleMode?: 'cover' | 'contain' | 'stretch';
}

/**
 * 背景を描画するノード
 */
export class BackgroundNode extends BaseEffectNode {
  private readonly backgroundType: BackgroundType;
  private readonly color: string;
  private readonly image: HTMLImageElement | null;
  private readonly scaleMode: 'cover' | 'contain' | 'stretch';

  constructor(options: BackgroundNodeOptions) {
    super();
    this.backgroundType = options.type;
    this.color = options.color ?? '#000000';
    this.image = options.image ?? null;
    this.scaleMode = options.scaleMode ?? 'cover';
    this.validateOptions(options);
  }

  private validateOptions(options: BackgroundNodeOptions): void {
    if (options.type === 'color' && !options.color) {
      throw new Error('Color must be specified for color background');
    }
    if (options.type === 'image' && !options.image) {
      throw new Error('Image must be specified for image background');
    }
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    if (this.backgroundType === 'color') {
      this.drawColor(ctx, canvas.width, canvas.height);
    } else if (this.backgroundType === 'image' && this.image) {
      this.drawImage(ctx, canvas.width, canvas.height);
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

  private drawImage(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    if (!this.image) return;

    const { width: imgWidth, height: imgHeight } = this.image;
    let scale: number;
    let drawWidth: number;
    let drawHeight: number;
    let x: number;
    let y: number;

    switch (this.scaleMode) {
      case 'cover':
        scale = Math.max(width / imgWidth, height / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        x = (width - drawWidth) / 2;
        y = (height - drawHeight) / 2;
        break;

      case 'contain':
        scale = Math.min(width / imgWidth, height / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        x = (width - drawWidth) / 2;
        y = (height - drawHeight) / 2;
        break;

      case 'stretch':
      default:
        drawWidth = width;
        drawHeight = height;
        x = 0;
        y = 0;
        break;
    }

    ctx.drawImage(this.image, x, y, drawWidth, drawHeight);
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): BackgroundNodeConfig {
    return {
      type: 'background',
      backgroundType: this.backgroundType,
      color: this.color,
      image: this.image ?? undefined,
      scaleMode: this.scaleMode
    };
  }
} 