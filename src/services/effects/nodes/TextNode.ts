import { VisualEffectNode } from '../VisualEffect';
import { AudioVisualParameters } from '../../../types/audio';
import { TextOptions, TextEffectConfig } from '../../../types/effects';

export class TextNode extends VisualEffectNode {
  private context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private options: Required<TextOptions>;

  constructor(options: TextOptions) {
    super();
    console.log('TextNode: Initializing with options', {
      text: options.text,
      font: options.font,
      fontSize: options.fontSize,
      position: options.position,
      color: options.color,
      opacity: options.opacity,
      blendMode: options.blendMode,
      timing: options.timing,
      textAlign: options.textAlign,
      textBaseline: options.textBaseline
    });
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
    console.log('TextNode: Initializing context', {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      contextType: context.constructor.name
    });
    this.context = context;
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.context) {
      console.warn('TextNode: Context is not initialized');
      return;
    }

    const currentTime = parameters.currentTime;
    
    // タイミングチェックとフェード効果の計算
    const { start, end } = this.options.timing;
    const fadeInDuration = 500;
    const fadeOutDuration = 500;
    
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
    fadeOpacity = Math.max(0, Math.min(1, fadeOpacity));

    // 現在のキンテキストの状態を保存
    const currentState = {
      globalAlpha: this.context.globalAlpha,
      globalCompositeOperation: this.context.globalCompositeOperation,
      fillStyle: this.context.fillStyle,
      strokeStyle: this.context.strokeStyle,
      font: this.context.font,
      textAlign: this.context.textAlign,
      textBaseline: this.context.textBaseline,
      lineWidth: this.context.lineWidth
    };

    try {
      // テキストスタイルの設定
      const fontString = `${this.options.fontSize}px ${this.options.font}`;
      this.context.font = fontString;
      this.context.textAlign = this.options.textAlign;
      this.context.textBaseline = this.options.textBaseline;
      this.context.globalAlpha = this.options.opacity * fadeOpacity;
      this.context.globalCompositeOperation = this.options.blendMode;
      this.context.fillStyle = this.options.color;
      this.context.strokeStyle = 'black';
      this.context.lineWidth = 2;

      // 位置の計算
      const x = canvas.width * this.options.position.x;
      const y = canvas.height * this.options.position.y;

      // テキストの描画
      this.context.strokeText(this.options.text, x, y);
      this.context.fillText(this.options.text, x, y);

      // 描画後の状態を確認
      const imageData = this.context.getImageData(x - 50, y - 50, 100, 100);
      const hasContent = imageData.data.some(value => value !== 0);
      console.log('TextNode: Drawing result', {
        text: this.options.text,
        position: { x, y },
        color: this.options.color,
        opacity: this.context.globalAlpha,
        hasContent,
        currentState: {
          fillStyle: this.context.fillStyle,
          strokeStyle: this.context.strokeStyle,
          globalAlpha: this.context.globalAlpha,
          globalCompositeOperation: this.context.globalCompositeOperation
        }
      });
    } finally {
      // コンテキストの状態を元に戻す
      Object.assign(this.context, currentState);
    }

    // 次のノードに処理を渡す
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
      timing: this.options.timing,
      textAlign: this.options.textAlign,
      textBaseline: this.options.textBaseline
    };
  }
} 