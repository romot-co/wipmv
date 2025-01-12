import { EffectBase } from '../../core/EffectBase';
import { WaveformEffectConfig, AudioVisualParameters } from '../../core/types';

/**
 * 波形エフェクト
 * オーディオの波形を様々なスタイルで描画する
 */
export class WaveformEffect extends EffectBase {
  protected override config: WaveformEffectConfig;

  constructor(config: WaveformEffectConfig) {
    super(config);
    this.config = config;
  }

  render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    const { position, colors, style, options = {} } = this.config;
    const { waveformData } = params;
    if (!waveformData) return;

    // オプションの設定
    const barWidth = options.barWidth || 2;
    const barSpacing = options.barSpacing || 1;
    const smoothing = options.smoothing || 0.5;
    const mirror = options.mirror || false;

    // 描画領域の設定
    const { x, y, width, height } = position;
    const centerY = y + height / 2;

    // 波形データの準備
    const dataLength = waveformData.length;
    const step = Math.ceil(dataLength / (width / (barWidth + barSpacing)));
    const amplitudeScale = height / 2;

    ctx.save();

    // 背景の描画
    if (colors.background) {
      ctx.fillStyle = colors.background;
      ctx.fillRect(x, y, width, height);
    }

    // 波形の描画
    let currentX = x;
    for (let i = 0; i < width; i += barWidth + barSpacing) {
      const dataIndex = Math.floor(i / width * dataLength);
      let amplitude = 0;

      // データポイントの平均を計算
      for (let j = 0; j < step && dataIndex + j < dataLength; j++) {
        amplitude += Math.abs(waveformData[dataIndex + j]);
      }
      amplitude = (amplitude / step) * smoothing;

      const barHeight = amplitude * amplitudeScale;

      // プライマリカラーで波形を描画
      ctx.fillStyle = colors.primary;
      if (mirror) {
        ctx.fillRect(
          currentX,
          centerY - barHeight / 2,
          barWidth,
          barHeight
        );
      } else {
        ctx.fillRect(
          currentX,
          centerY,
          barWidth,
          -barHeight
        );

        // セカンダリカラーがある場合は下部も描画
        if (colors.secondary) {
          ctx.fillStyle = colors.secondary;
          ctx.fillRect(
            currentX,
            centerY,
            barWidth,
            barHeight
          );
        }
      }

      currentX += barWidth + barSpacing;
    }

    ctx.restore();
  }
} 