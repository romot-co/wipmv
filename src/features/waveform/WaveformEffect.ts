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
    if (!this.isVisible(params.currentTime)) {
      console.debug('WaveformEffect: Not visible at current time', params.currentTime);
      return;
    }
    
    if (!params.waveformData) {
      console.debug('WaveformEffect: No waveform data available');
      return;
    }

    const { position, style, colors, options = {} } = this.config;
    const { width, height } = position;
    
    console.debug('WaveformEffect: Rendering with config', {
      position,
      style,
      colors,
      options,
      dataLength: params.waveformData.length,
      maxValue: Math.max(...params.waveformData),
    });

    ctx.save();
    try {
      // 描画領域の設定
      ctx.translate(position.x, position.y);

      // データの準備
      const dataLength = params.waveformData.length;
      const barWidth = options.barWidth ?? 2;
      const barSpacing = options.barSpacing ?? 1;
      const totalBars = Math.floor(width / (barWidth + barSpacing));
      const step = Math.ceil(dataLength / totalBars);
      const smoothedData = this.smoothData(params.waveformData, options.smoothing ?? 0.5);

      console.debug('WaveformEffect: Calculated rendering parameters', {
        totalBars,
        step,
        dataLength,
        smoothedDataLength: smoothedData.length
      });

      // スタイルの設定
      ctx.fillStyle = colors.primary;
      if (colors.background) {
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = colors.primary;
      }

      // 波形の描画
      const { mirror = false } = options;
      for (let i = 0; i < totalBars; i++) {
        const dataIndex = i * step;
        const value = smoothedData[dataIndex] || 0;
        const barHeight = Math.abs(value) * height;
        const x = i * (barWidth + barSpacing);

        if (mirror) {
          const y = (height - barHeight) / 2;
          console.debug('WaveformEffect: Drawing mirror bar', {
            x, y, barWidth, barHeight, value
          });
          ctx.fillRect(x, y, barWidth, barHeight);
        } else {
          console.debug('WaveformEffect: Drawing normal bar', {
            x, y: height - barHeight, barWidth, barHeight, value
          });
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        }
      }
    } catch (error) {
      console.error('WaveformEffect: Error during rendering', error);
    } finally {
      ctx.restore();
    }
  }

  private smoothData(data: Float32Array, factor: number): Float32Array {
    console.debug('WaveformEffect: Smoothing data', {
      dataLength: data.length,
      factor,
      firstValue: data[0],
      lastValue: data[data.length - 1]
    });

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