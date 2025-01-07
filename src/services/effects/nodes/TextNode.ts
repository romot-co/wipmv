import { VisualEffectNode } from '../VisualEffect';
import { AudioVisualParameters } from '../../../types/audio';
import { TextOptions, TextEffectConfig } from '../../../types/effects';

export class TextNode extends VisualEffectNode {
  private context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private options: Required<TextOptions>;

  constructor(options: TextOptions) {
    super();
    this.options = {
      text: options.text,
      font: options.font ?? '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
      position: options.position ?? { x: 0.5, y: 0.5 },
      color: options.color ?? '#ffffff',
      opacity: options.opacity ?? 1,
      blendMode: options.blendMode ?? 'source-over',
      timing: options.timing ?? { start: 0, end: Infinity },
      textAlign: options.textAlign ?? 'center',
      textBaseline: options.textBaseline ?? 'middle',
      fontSize: options.fontSize ?? 24
    };
  }

  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    this.context = context;
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.context) return;

    const currentTime = parameters.currentTime * 1000; // ミリ秒に変換
    
    // タイミングチェックとフェード効果の計算
    const { start, end } = this.options.timing;
    const fadeInDuration = 500; // フェードイン時間（ミリ秒）
    const fadeOutDuration = 500; // フェードアウト時間（ミリ秒）
    
    // 表示時間外の場合はスキップ
    if (currentTime < start || currentTime > end) {
      this.passToNext(parameters, canvas);
      return;
    }

    // フェードイン/アウトの不透明度を計算
    let fadeOpacity = 1;
    if (currentTime < start + fadeInDuration) {
      fadeOpacity = (currentTime - start) / fadeInDuration;
    } else if (currentTime > end - fadeOutDuration) {
      fadeOpacity = (end - currentTime) / fadeOutDuration;
    }

    this.context.save();

    // テキストスタイルの設定
    this.context.font = `${this.options.fontSize}px ${this.options.font}`;
    this.context.fillStyle = this.options.color;
    this.context.textAlign = this.options.textAlign;
    this.context.textBaseline = this.options.textBaseline;
    this.context.globalAlpha = this.options.opacity * fadeOpacity;
    this.context.globalCompositeOperation = this.options.blendMode;

    // 位置の計算
    const x = canvas.width * this.options.position.x;
    const y = canvas.height * this.options.position.y;

    // テキストの描画
    this.context.fillText(this.options.text, x, y);

    this.context.restore();
    this.passToNext(parameters, canvas);
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): TextEffectConfig {
    return {
      type: 'text',
      text: this.options.text,
      font: this.options.font,
      fontSize: this.options.fontSize,
      position: this.options.position,
      color: this.options.color,
      opacity: this.options.opacity,
      blendMode: this.options.blendMode,
      timing: this.options.timing,
      textAlign: this.options.textAlign,
      textBaseline: this.options.textBaseline
    };
  }
} 