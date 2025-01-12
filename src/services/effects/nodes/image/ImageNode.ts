import { Node } from '../../base/Node';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

/**
 * 画像のスケールモード
 */
export type ScaleMode = 'cover' | 'contain' | 'stretch';

/**
 * 画像ノードの設定
 */
export interface ImageNodeConfig extends BaseNodeConfig {
  /** 画像データ */
  image: HTMLImageElement;
  /** スケールモード */
  scaleMode?: ScaleMode;
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
 * 画像描画ノード
 * 画像の描画を担当します
 */
export class ImageNode extends Node {
  private readonly image: HTMLImageElement;
  private readonly scaleMode: ScaleMode;

  constructor(config: ImageNodeConfig) {
    super('image');
    this.validateConfig(config);
    this.image = config.image;
    this.scaleMode = config.scaleMode ?? 'cover';
  }

  /**
   * 設定のバリデーションを行います
   */
  private validateConfig(config: ImageNodeConfig): void {
    if (!config.image) {
      throw new Error('Image must be specified');
    }
  }

  /**
   * 画像の描画寸法を計算します
   */
  private calculateImageDimensions(canvas: OffscreenCanvas): DrawDimensions {
    const { width: canvasWidth, height: canvasHeight } = canvas;
    const { width: imgWidth, height: imgHeight } = this.image;

    let scale: number;
    let drawWidth: number;
    let drawHeight: number;
    let x: number;
    let y: number;

    switch (this.scaleMode) {
      case 'cover': {
        scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        x = (canvasWidth - drawWidth) / 2;
        y = (canvasHeight - drawHeight) / 2;
        break;
      }
      case 'contain': {
        scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
        drawWidth = imgWidth * scale;
        drawHeight = imgHeight * scale;
        x = (canvasWidth - drawWidth) / 2;
        y = (canvasHeight - drawHeight) / 2;
        break;
      }
      case 'stretch':
      default: {
        drawWidth = canvasWidth;
        drawHeight = canvasHeight;
        x = 0;
        y = 0;
        break;
      }
    }

    return { width: drawWidth, height: drawHeight, x, y };
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    const dimensions = this.calculateImageDimensions(canvas);
    ctx.drawImage(
      this.image,
      dimensions.x,
      dimensions.y,
      dimensions.width,
      dimensions.height
    );

    ctx.restore();
    this.passToNext(parameters, canvas);
  }
} 