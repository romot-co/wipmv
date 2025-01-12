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
    if (!this.isVisible(params.currentTime)) return;
    if (!params.waveformData) return;

    const { position, style, colors, options = {} } = this.config;
    const { width, height } = position;
    const {
      barWidth = 2,
      barSpacing = 1,
      smoothing = 0.5,
      mirror = false
    } = options;

    ctx.save();
    try {
      // 描画領域の設定
      ctx.translate(position.x, position.y);

      // データの準備
      const dataLength = params.waveformData.length;
      const totalBars = Math.floor(width / (barWidth + barSpacing));
      const step = Math.ceil(dataLength / totalBars);
      const smoothedData = this.smoothData(params.waveformData, smoothing);

      // スタイルの設定
      ctx.fillStyle = colors.primary;
      if (colors.background) {
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = colors.primary;
      }

      // 波形の描画
      let y: number;
      for (let i = 0; i < totalBars; i++) {
        const dataIndex = i * step;
        const value = smoothedData[dataIndex] || 0;
        const barHeight = Math.abs(value) * height;
        const x = i * (barWidth + barSpacing);

        if (mirror) {
          // ミラーモード
          y = (height - barHeight) / 2;
          ctx.fillRect(x, y, barWidth, barHeight);
          if (colors.secondary) {
            ctx.fillStyle = colors.secondary;
            ctx.fillRect(x, height / 2, barWidth, barHeight / 2);
            ctx.fillStyle = colors.primary;
          }
        } else {
          // 通常モード
          switch (style) {
            case 'line':
              if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(x, height - barHeight);
              } else {
                ctx.lineTo(x, height - barHeight);
              }
              if (i === totalBars - 1) {
                ctx.stroke();
              }
              break;

            case 'bar':
              ctx.fillRect(x, height - barHeight, barWidth, barHeight);
              break;

            case 'mirror':
              y = (height - barHeight) / 2;
              ctx.fillRect(x, y, barWidth, barHeight);
              break;
          }
        }
      }
    } finally {
      ctx.restore();
    }
  }

  private smoothData(data: Float32Array, factor: number): Float32Array {
    if (factor <= 0) return data;
    if (factor >= 1) factor = 0.9999;

    const smoothed = new Float32Array(data.length);
    let lastValue = data[0];

    for (let i = 0; i < data.length; i++) {
      const currentValue = data[i];
      smoothed[i] = lastValue + factor * (currentValue - lastValue);
      lastValue = smoothed[i];
    }

    return smoothed;
  }
} 