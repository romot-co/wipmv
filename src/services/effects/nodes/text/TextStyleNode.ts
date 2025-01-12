import { BaseEffectNode } from '../../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { TextStyleConfig } from '../../../../types/effects/text';

/**
 * テキストのスタイルを適用するノード
 */
export class TextStyleNode extends BaseEffectNode {
  private font: string;
  private fontSize: number;
  private color: string;
  private textAlign: CanvasTextAlign;
  private textBaseline: CanvasTextBaseline;

  constructor(config: TextStyleConfig) {
    super();
    this.font = config.font;
    this.fontSize = config.fontSize;
    this.color = config.color;
    this.textAlign = config.textAlign ?? 'center';
    this.textBaseline = config.textBaseline ?? 'middle';
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    
    // フォント設定
    ctx.font = `${this.fontSize}px ${this.font}`;
    ctx.fillStyle = this.color;
    ctx.textAlign = this.textAlign;
    ctx.textBaseline = this.textBaseline;

    this.passToNext(parameters, canvas);

    ctx.restore();
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): TextStyleConfig {
    return {
      font: this.font,
      fontSize: this.fontSize,
      color: this.color,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline
    };
  }

  updateConfig(config: Partial<TextStyleConfig>): void {
    if (config.font !== undefined) {
      this.font = config.font;
    }
    if (config.fontSize !== undefined) {
      this.fontSize = config.fontSize;
    }
    if (config.color !== undefined) {
      this.color = config.color;
    }
    if (config.textAlign !== undefined) {
      this.textAlign = config.textAlign;
    }
    if (config.textBaseline !== undefined) {
      this.textBaseline = config.textBaseline;
    }
  }
} 