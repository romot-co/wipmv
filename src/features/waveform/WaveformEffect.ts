import { EffectBase } from '../../core/EffectBase';
import { WaveformEffectConfig, AudioVisualParameters, AudioSource } from '../../core/types';

export class WaveformEffect extends EffectBase {
  private audioSource: AudioSource | null = null;

  constructor(config: WaveformEffectConfig) {
    const defaultConfig: WaveformEffectConfig = {
      ...config,
      options: {
        smoothing: 0.5,
        barWidth: 2,
        barSpacing: 1,
        style: 'bar',
        analysisMode: 'offline',
        segmentCount: 1024,
        ...config.options
      }
    };
    super(defaultConfig);
  }

  public setAudioSource(source: AudioSource): void {
    this.audioSource = source;
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime) || !this.audioSource) return;

    const config = this.getConfig<WaveformEffectConfig>();
    const { options, position, colors } = config;

    // 波形データを取得
    const waveformData = this.getWaveformData();
    if (!waveformData) return;

    // 波形を描画
    this.drawWaveform(ctx, waveformData, {
      style: options.style || 'bar',
      barWidth: options.barWidth || 2,
      barSpacing: options.barSpacing || 1,
      smoothing: options.smoothing || 0.5,
      position,
      colors
    });
  }

  private getWaveformData(): Float32Array | null {
    if (!this.audioSource) return null;

    const config = this.getConfig<WaveformEffectConfig>();
    const { options } = config;
    const segmentCount = options.segmentCount || 1024;

    // オフライン解析データから波形データを取得
    const waveformData = this.audioSource.waveformData[0]; // 左チャンネルを使用
    if (!waveformData) return null;

    // 指定されたセグメント数に合わせてデータを補間
    const samplesPerSegment = Math.floor(waveformData.length / segmentCount);
    const result = new Float32Array(segmentCount);

    for (let i = 0; i < segmentCount; i++) {
      const startIndex = i * samplesPerSegment;
      const endIndex = Math.min(startIndex + samplesPerSegment, waveformData.length);
      let sum = 0;
      for (let j = startIndex; j < endIndex; j++) {
        sum += Math.abs(waveformData[j]);
      }
      result[i] = sum / (endIndex - startIndex);
    }

    return result;
  }

  private drawWaveform(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    data: Float32Array,
    options: {
      style: string;
      barWidth: number;
      barSpacing: number;
      smoothing: number;
      position: { x: number; y: number; width: number; height: number };
      colors: { primary: string; secondary?: string };
    }
  ): void {
    const { style, barWidth, barSpacing, position, colors } = options;
    const { x, y, width, height } = position;

    ctx.save();
    try {
      // クリッピング領域を設定
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();

      // スタイルに応じて描画
      switch (style) {
        case 'line':
          this.drawLineStyle(ctx, data, position, colors);
          break;
        case 'mirror':
          this.drawMirrorStyle(ctx, data, position, colors, barWidth, barSpacing);
          break;
        case 'bar':
        default:
          this.drawBarStyle(ctx, data, position, colors, barWidth, barSpacing);
          break;
      }
    } finally {
      ctx.restore();
    }
  }

  private drawLineStyle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    data: Float32Array,
    position: { x: number; y: number; width: number; height: number },
    colors: { primary: string; secondary?: string }
  ): void {
    const { x, y, width, height } = position;
    const centerY = y + height / 2;

    ctx.beginPath();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;

    const step = width / (data.length - 1);
    data.forEach((value, i) => {
      const pointX = x + i * step;
      const pointY = centerY + (value * height) / 2;
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        ctx.lineTo(pointX, pointY);
      }
    });

    ctx.stroke();
  }

  private drawBarStyle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    data: Float32Array,
    position: { x: number; y: number; width: number; height: number },
    colors: { primary: string; secondary?: string },
    barWidth: number,
    barSpacing: number
  ): void {
    const { x, y, width, height } = position;
    const totalBarWidth = barWidth + barSpacing;
    const numBars = Math.floor(width / totalBarWidth);
    const step = data.length / numBars;

    ctx.fillStyle = colors.primary;

    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor(i * step);
      const value = data[dataIndex];
      const barHeight = value * height;
      const barX = x + i * totalBarWidth;
      const barY = y + (height - barHeight) / 2;
      ctx.fillRect(barX, barY, barWidth, barHeight);
    }
  }

  private drawMirrorStyle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    data: Float32Array,
    position: { x: number; y: number; width: number; height: number },
    colors: { primary: string; secondary?: string },
    barWidth: number,
    barSpacing: number
  ): void {
    const { x, y, width, height } = position;
    const totalBarWidth = barWidth + barSpacing;
    const numBars = Math.floor(width / totalBarWidth);
    const step = data.length / numBars;
    const halfHeight = height / 2;
    const centerY = y + halfHeight;

    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor(i * step);
      const value = data[dataIndex];
      const barHeight = value * halfHeight;
      const barX = x + i * totalBarWidth;
      
      // 上部
      ctx.fillStyle = colors.primary;
      ctx.fillRect(barX, centerY - barHeight, barWidth, barHeight);
      
      // 下部
      ctx.fillStyle = colors.secondary || colors.primary;
      ctx.fillRect(barX, centerY, barWidth, barHeight);
    }
  }
} 