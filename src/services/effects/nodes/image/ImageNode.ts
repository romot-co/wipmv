import { BaseEffectNode } from '../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { ImageNodeConfig } from '../../../../types/effects/base';

/**
 * 画像のスケールモード
 */
export type ScaleMode = 'cover' | 'contain' | 'stretch';

/**
 * 画像の位置情報
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * 画像のサイズ情報
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 画像描画の寸法情報
 */
interface DrawDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * 画像ノードのオプション
 */
export interface ImageNodeOptions {
  image: HTMLImageElement;
  position?: Position;
  size?: Size;
  opacity?: number;
  scaleMode?: ScaleMode;
  blendMode?: GlobalCompositeOperation;
}

/**
 * 画像描画ノード
 * 画像の描画を担当します
 */
export class ImageNode extends BaseEffectNode {
  private readonly image: HTMLImageElement;
  private readonly position: Position;
  private readonly size: Size;
  private readonly opacity: number;
  private readonly scaleMode: ScaleMode;
  private readonly blendMode: GlobalCompositeOperation;

  constructor(options: ImageNodeOptions) {
    super();
    this.validateOptions(options);
    this.image = options.image;
    this.position = options.position ?? { x: 0.5, y: 0.5 };
    this.size = options.size ?? { width: 1, height: 1 };
    this.opacity = options.opacity ?? 1;
    this.scaleMode = options.scaleMode ?? 'contain';
    this.blendMode = options.blendMode ?? 'source-over';
  }

  /**
   * オプションのバリデーションを行います
   */
  private validateOptions(options: ImageNodeOptions): void {
    if (!options.image) {
      throw new Error('Image must be specified');
    }
  }

  /**
   * 画像の描画寸法を計算します
   */
  private calculateImageDimensions(canvas: HTMLCanvasElement | OffscreenCanvas): DrawDimensions {
    const { width: canvasWidth, height: canvasHeight } = canvas;
    const { width: imgWidth, height: imgHeight } = this.image;
    const { width: targetWidth, height: targetHeight } = this.size;

    let scale: number;
    switch (this.scaleMode) {
      case 'cover': {
        scale = Math.max(
          (canvasWidth * targetWidth) / imgWidth,
          (canvasHeight * targetHeight) / imgHeight
        );
        break;
      }
      case 'contain': {
        scale = Math.min(
          (canvasWidth * targetWidth) / imgWidth,
          (canvasHeight * targetHeight) / imgHeight
        );
        break;
      }
      case 'stretch':
      default: {
        return {
          width: canvasWidth * targetWidth,
          height: canvasHeight * targetHeight,
          x: canvasWidth * this.position.x - (canvasWidth * targetWidth) / 2,
          y: canvasHeight * this.position.y - (canvasHeight * targetHeight) / 2
        };
      }
    }

    const width = imgWidth * scale;
    const height = imgHeight * scale;
    return {
      width,
      height,
      x: canvasWidth * this.position.x - width / 2,
      y: canvasHeight * this.position.y - height / 2
    };
  }

  /**
   * 画像を描画します
   */
  private drawImage(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: HTMLCanvasElement | OffscreenCanvas): void {
    const dimensions = this.calculateImageDimensions(canvas);
    context.drawImage(
      this.image,
      dimensions.x,
      dimensions.y,
      dimensions.width,
      dimensions.height
    );
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  /**
   * エフェクトの処理を実行します
   */
  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const context = canvas.getContext('2d');
    if (!context) return;

    context.save();
    context.globalAlpha = this.opacity;
    context.globalCompositeOperation = this.blendMode;

    this.drawImage(context, canvas);

    context.restore();
    this.passToNext(parameters, canvas);
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): ImageNodeConfig {
    return {
      type: 'image',
      image: this.image,
      position: this.position,
      size: this.size,
      opacity: this.opacity,
      blendMode: this.blendMode,
      scaleMode: this.scaleMode
    };
  }
} 