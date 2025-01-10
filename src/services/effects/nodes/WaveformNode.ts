import { VisualNode } from './VisualNode';
import { WaveformEffectConfig } from '../../../types/effects';
import { AudioVisualParameters } from '../../../types/audio';

export class WaveformNode implements VisualNode {
  private config: Omit<WaveformEffectConfig, 'type'>;
  private context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  private lastRenderTime: number = 0;

  constructor(config: Omit<WaveformEffectConfig, 'type'>) {
    this.config = config;
  }

  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    this.context = context;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }

  process(params: AudioVisualParameters, canvas: HTMLCanvasElement | OffscreenCanvas): void {
    if (!this.context) return;

    const ctx = this.context;
    const { width, height } = canvas;
    const {
      color,
      lineWidth,
      verticalPosition,
      opacity,
      blendMode
    } = this.config;

    // 波形の高さを設定
    const waveHeight = (this.config.height / 100) * height;
    const centerY = (verticalPosition / 100) * height;

    // 描画設定
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.globalCompositeOperation = blendMode;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    if (!params.audioSource?.timeData?.length || !params.audioSource.timeData[0]?.length) {
      // データがない場合は中央線のみ描画
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const data = params.audioSource.timeData[0];
    const volume = params.audioSource.volumeData[0][0] || 1.0;
    
    // 表示する波形のサンプル数を計算
    const samplesPerPixel = Math.max(1, Math.floor(data.length / width));
    const visibleSamples = width * samplesPerPixel;
    
    // 現在の時間に基づいてオフセットを計算
    const currentTime = params.currentTime || 0;
    const sampleRate = params.audioSource.sampleRate;
    const timeOffset = Math.floor((currentTime * sampleRate) % data.length);

    // 波形の描画
    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < width; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerPixel; j++) {
        const sampleIndex = (timeOffset + i * samplesPerPixel + j) % data.length;
        sum += data[sampleIndex] * volume;
      }
      const average = sum / samplesPerPixel;
      const y = centerY + (average * waveHeight);
      ctx.lineTo(i, y);
    }

    ctx.stroke();
    this.lastRenderTime = currentTime;
    ctx.restore();
  }

  getConfig(): Omit<WaveformEffectConfig, 'type'> {
    return this.config;
  }

  setConfig(config: Partial<Omit<WaveformEffectConfig, 'type'>>): void {
    this.config = { ...this.config, ...config };
  }
} 