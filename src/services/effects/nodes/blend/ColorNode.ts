import { VisualEffectNode } from '../VisualEffect';
import { AudioVisualParameters } from '../../../types/audio';
import { BackgroundEffectConfig } from '../../../types/effects';

/**
 * 色描画ノードのオプション
 */
export interface ColorNodeOptions {
  color: string;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * 色描画ノード
 * 単色の背景を描画します
 */
export class ColorNode extends VisualEffectNode {
  private readonly color: string;
  private readonly opacity: number;
  private readonly blendMode: GlobalCompositeOperation;

  constructor(options: ColorNodeOptions) {
    super();
    this.validateOptions(options);
    this.color = options.color;
    this.opacity = options.opacity ?? 1;
    this.blendMode = options.blendMode ?? 'source-over';
  }

  /**
   * オプションのバリデーションを行います
   */
  private validateOptions(options: ColorNodeOptions): void {
    if (!options.color) {
      throw new Error('Color must be specified');
    }
  }

  /**
   * 色を描画します
   */
  private drawColor(context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, canvas: HTMLCanvasElement | OffscreenCanvas): void {
    context.fillStyle = this.color;
    context.fillRect(0, 0, canvas.width, canvas.height);
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

    this.drawColor(context, canvas);

    context.restore();
    this.passToNext(parameters, canvas);
  }

  initialize(): void {
    // 初期化は不要
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): BackgroundEffectConfig {
    return {
      type: 'color',
      color: this.color,
      opacity: this.opacity,
      blendMode: this.blendMode
    };
  }
} 