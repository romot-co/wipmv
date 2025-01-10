import { BaseEffectNode } from '../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

export interface TextNodeOptions {
  text: string;
  font: string;
  fontSize: number;
  color: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

export interface TextNodeConfig extends BaseNodeConfig {
  type: 'text';
  text: string;
  font: string;
  fontSize: number;
  color: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
}

/**
 * テキストを描画するノード
 */
export class TextNode extends BaseEffectNode {
  private readonly text: string;
  private readonly font: string;
  private readonly fontSize: number;
  private readonly color: string;
  private readonly textAlign: CanvasTextAlign;
  private readonly textBaseline: CanvasTextBaseline;

  constructor(options: TextNodeOptions) {
    super();
    this.text = options.text;
    this.font = options.font;
    this.fontSize = options.fontSize;
    this.color = options.color;
    this.textAlign = options.textAlign ?? 'center';
    this.textBaseline = options.textBaseline ?? 'middle';
    this.validateOptions(options);
  }

  private validateOptions(options: TextNodeOptions): void {
    if (!options.text) {
      throw new Error('Text must be specified');
    }
    if (!options.font) {
      throw new Error('Font must be specified');
    }
    if (!options.fontSize || options.fontSize <= 0) {
      throw new Error('Font size must be a positive number');
    }
    if (!options.color) {
      throw new Error('Color must be specified');
    }
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // テキストのスタイルを設定
    ctx.font = `${this.fontSize}px ${this.font}`;
    ctx.fillStyle = this.color;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;

    // テキストを描画
    ctx.fillText(this.text, canvas.width / 2, canvas.height / 2);

    ctx.restore();
    this.passToNext(parameters, canvas);
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): TextNodeConfig {
    return {
      type: 'text',
      text: this.text,
      font: this.font,
      fontSize: this.fontSize,
      color: this.color,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline
    };
  }
} 