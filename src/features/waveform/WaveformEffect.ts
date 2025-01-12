import { EffectBase } from '../../core/EffectBase';
import { AudioVisualParameters } from '../../core/types';
import { WaveformEffectConfig } from './types';

/**
 * 波形エフェクト
 * オーディオの波形を様々なスタイルで描画する
 */
export class WaveformEffect extends EffectBase {
  constructor(config: WaveformEffectConfig) {
    super(config);
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.isVisible(parameters.currentTime)) return;
    if (!parameters.waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = this.config as WaveformEffectConfig;
    const { position, colors, style, options = {} } = config;

    // 背景の描画
    if (colors.background) {
      ctx.fillStyle = colors.background;
      ctx.fillRect(position.x, position.y, position.width, position.height);
    }

    // 波形データの準備
    const data = this.processWaveformData(parameters.waveformData, options.smoothing);

    switch (style) {
      case 'line':
        this.drawLineWaveform(ctx, data, config);
        break;
      case 'bar':
        this.drawBarWaveform(ctx, data, config);
        break;
      case 'mirror':
        this.drawMirrorWaveform(ctx, data, config);
        break;
    }
  }

  private processWaveformData(data: Float32Array, smoothing = 0): Float32Array {
    if (smoothing <= 0) return data;

    const result = new Float32Array(data.length);
    const windowSize = Math.floor(smoothing * 10);

    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - windowSize); j < Math.min(data.length, i + windowSize + 1); j++) {
        sum += data[j];
        count++;
      }

      result[i] = sum / count;
    }

    return result;
  }

  private drawLineWaveform(
    ctx: OffscreenCanvasRenderingContext2D,
    data: Float32Array,
    config: WaveformEffectConfig
  ): void {
    const { position, colors } = config;
    const { x, y, width, height } = position;
    const step = width / data.length;

    ctx.beginPath();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;

    for (let i = 0; i < data.length; i++) {
      const amplitude = data[i] * height / 2;
      const px = x + i * step;
      const py = y + height / 2 + amplitude;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.stroke();
  }

  private drawBarWaveform(
    ctx: OffscreenCanvasRenderingContext2D,
    data: Float32Array,
    config: WaveformEffectConfig
  ): void {
    const { position, colors, options = {} } = config;
    const { x, y, width, height } = position;
    const barWidth = options.barWidth || 4;
    const barSpacing = options.barSpacing || 2;
    const totalBarWidth = barWidth + barSpacing;
    const numBars = Math.floor(width / totalBarWidth);
    const step = Math.floor(data.length / numBars);

    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        const index = i * step + j;
        if (index < data.length) {
          sum += Math.abs(data[index]);
        }
      }
      const amplitude = (sum / step) * height;
      const px = x + i * totalBarWidth;
      const py = y + height - amplitude;

      ctx.fillStyle = colors.primary;
      ctx.fillRect(px, py, barWidth, amplitude);
    }
  }

  private drawMirrorWaveform(
    ctx: OffscreenCanvasRenderingContext2D,
    data: Float32Array,
    config: WaveformEffectConfig
  ): void {
    const { position, colors } = config;
    const { x, y, width, height } = position;
    const halfHeight = height / 2;
    const step = width / data.length;

    ctx.beginPath();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;

    // 上部の波形
    for (let i = 0; i < data.length; i++) {
      const amplitude = data[i] * halfHeight;
      const px = x + i * step;
      const py = y + halfHeight - amplitude;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    // 下部の波形（反転）
    for (let i = data.length - 1; i >= 0; i--) {
      const amplitude = data[i] * halfHeight;
      const px = x + i * step;
      const py = y + halfHeight + amplitude;
      ctx.lineTo(px, py);
    }

    ctx.closePath();

    if (colors.secondary) {
      ctx.fillStyle = colors.secondary;
      ctx.fill();
    }
    ctx.stroke();
  }
} 