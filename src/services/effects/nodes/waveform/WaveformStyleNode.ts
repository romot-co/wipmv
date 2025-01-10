import { BaseEffectNode } from '../../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

export type WaveformStyle = 'line' | 'bars' | 'mirror';

export interface WaveformStyleOptions {
  style: WaveformStyle;
  color: string;
  lineWidth?: number;
  height?: number;
  verticalPosition?: number;
  barWidth?: number;
  barSpacing?: number;
  mirrorGap?: number;
}

interface WaveformStyleNodeConfig extends BaseNodeConfig {
  type: 'waveform-style';
  style: WaveformStyle;
  color: string;
  lineWidth: number;
  height: number;
  verticalPosition: number;
  barWidth?: number;
  barSpacing?: number;
  mirrorGap?: number;
}

/**
 * 波形の描画スタイルを処理するノード
 */
export class WaveformStyleNode extends BaseEffectNode {
  private readonly style: WaveformStyle;
  private readonly color: string;
  private readonly lineWidth: number;
  private readonly height: number;
  private readonly verticalPosition: number;
  private readonly barWidth: number;
  private readonly barSpacing: number;
  private readonly mirrorGap: number;

  constructor(options: WaveformStyleOptions) {
    super();
    this.style = options.style;
    this.color = options.color;
    this.lineWidth = options.lineWidth ?? 2;
    this.height = options.height ?? 100;
    this.verticalPosition = options.verticalPosition ?? 50;
    this.barWidth = options.barWidth ?? 4;
    this.barSpacing = options.barSpacing ?? 2;
    this.mirrorGap = options.mirrorGap ?? 10;
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !parameters.timeData[0]) return;

    const audioData = parameters.timeData[0];
    const waveformHeight = (this.height / 100) * canvas.height;
    const yPosition = (this.verticalPosition / 100) * canvas.height;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.color;
    ctx.lineWidth = this.lineWidth;

    switch (this.style) {
      case 'line':
        this.renderLine(ctx, canvas.width, waveformHeight, yPosition, audioData);
        break;
      case 'bars':
        this.renderBars(ctx, canvas.width, waveformHeight, yPosition, audioData);
        break;
      case 'mirror':
        this.renderMirror(ctx, canvas.width, waveformHeight, yPosition, audioData);
        break;
    }

    ctx.restore();
    this.passToNext(parameters, canvas);
  }

  private renderLine(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    waveformHeight: number,
    yPosition: number,
    audioData: Float32Array
  ): void {
    ctx.beginPath();
    const step = Math.ceil(audioData.length / width);

    for (let i = 0; i < width; i++) {
      const audioIndex = i * step;
      const value = audioData[audioIndex];
      const y = yPosition + (value * waveformHeight) / 2;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();
  }

  private renderBars(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    waveformHeight: number,
    yPosition: number,
    audioData: Float32Array
  ): void {
    const totalBarWidth = this.barWidth + this.barSpacing;
    const numBars = Math.floor(width / totalBarWidth);
    const step = Math.ceil(audioData.length / numBars);

    for (let i = 0; i < numBars; i++) {
      const audioIndex = i * step;
      const value = audioData[audioIndex];
      const barHeight = (value * waveformHeight) / 2;
      const x = i * totalBarWidth;

      ctx.fillRect(
        x,
        yPosition - barHeight / 2,
        this.barWidth,
        barHeight
      );
    }
  }

  private renderMirror(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    waveformHeight: number,
    yPosition: number,
    audioData: Float32Array
  ): void {
    const gap = this.mirrorGap / 2;
    const step = Math.ceil(audioData.length / width);

    // 上部の波形
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const audioIndex = i * step;
      const value = audioData[audioIndex];
      const y = yPosition - gap - (value * waveformHeight) / 2;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();

    // 下部の波形（反転）
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      const audioIndex = i * step;
      const value = audioData[audioIndex];
      const y = yPosition + gap + (value * waveformHeight) / 2;

      if (i === 0) {
        ctx.moveTo(i, y);
      } else {
        ctx.lineTo(i, y);
      }
    }
    ctx.stroke();
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): WaveformStyleNodeConfig {
    return {
      type: 'waveform-style',
      style: this.style,
      color: this.color,
      lineWidth: this.lineWidth,
      height: this.height,
      verticalPosition: this.verticalPosition,
      barWidth: this.barWidth,
      barSpacing: this.barSpacing,
      mirrorGap: this.mirrorGap
    };
  }
} 