import { EffectBase } from '../../core/EffectBase';
import { TextEffectConfig, AudioVisualParameters } from '../../core/types';

export class TextEffect extends EffectBase {
  constructor(config: TextEffectConfig) {
    // デフォルトスタイルを設定
    const defaultConfig: TextEffectConfig = {
      ...config,
      style: {
        fontFamily: config.style.fontFamily || 'Arial',
        fontSize: config.style.fontSize || 24,
        fontWeight: config.style.fontWeight || 'normal',
        color: config.style.color || '#000000',
        strokeColor: config.style.strokeColor,
        strokeWidth: config.style.strokeWidth || 0,
        align: config.style.align || 'left',
        baseline: config.style.baseline || 'top'
      }
    };
    super(defaultConfig);
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    const config = this.getConfig<TextEffectConfig>();
    const { text, style, position } = config;

    // 表示チェック
    if (!this.isVisible(params.currentTime)) return;

    ctx.save();
    try {
      // フォントスタイルの設定
      ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
      ctx.textAlign = (style.align || 'left') as CanvasTextAlign;
      ctx.textBaseline = (style.baseline || 'top') as CanvasTextBaseline;

      // ストロークの描画
      if (style.strokeColor && style.strokeWidth && style.strokeWidth > 0) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.strokeText(text, position.x, position.y);
      }

      // テキストの描画
      ctx.fillStyle = style.color;
      ctx.fillText(text, position.x, position.y);

    } finally {
      ctx.restore();
    }
  }
} 