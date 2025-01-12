import { Node } from '../../base/Node';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

/**
 * 波形スタイルノードの設定
 */
export interface WaveformStyleConfig extends BaseNodeConfig {
  /** 描画スタイル */
  type: 'waveform-line' | 'waveform-bar' | 'waveform-area';
  /** 線の色 */
  color: string;
  /** 線の太さ */
  lineWidth?: number;
  /** 塗りつぶし色（areaタイプのみ） */
  fillColor?: string;
  /** バーの間隔（barタイプのみ） */
  barSpacing?: number;
  /** 波形の高さ（%） */
  height?: number;
  /** 垂直位置（%） */
  verticalPosition?: number;
}

/**
 * 波形の描画スタイルを処理するノード
 */
export class WaveformStyleNode extends Node {
  private readonly style: 'line' | 'bar' | 'area';
  private readonly color: string;
  private readonly lineWidth: number;
  private readonly fillColor?: string;
  private readonly barSpacing: number;
  private readonly height: number;
  private readonly verticalPosition: number;

  constructor(config: WaveformStyleConfig) {
    super(config.type);
    this.style = config.type.replace('waveform-', '') as 'line' | 'bar' | 'area';
    this.color = config.color;
    this.lineWidth = config.lineWidth ?? 2;
    this.fillColor = config.fillColor;
    this.barSpacing = config.barSpacing ?? 2;
    this.height = config.height ?? 100;
    this.verticalPosition = config.verticalPosition ?? 50;
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx || !parameters.timeData[0]) return;

    const audioData = parameters.timeData[0];
    const waveformHeight = (this.height / 100) * canvas.height;
    const yPosition = (this.verticalPosition / 100) * canvas.height;

    ctx.save();
    ctx.strokeStyle = this.color;
    ctx.fillStyle = this.fillColor ?? this.color;
    ctx.lineWidth = this.lineWidth;

    switch (this.style) {
      case 'line':
        this.renderLine(ctx, canvas.width, waveformHeight, yPosition, audioData);
        break;
      case 'bar':
        this.renderBars(ctx, canvas.width, waveformHeight, yPosition, audioData);
        break;
      case 'area':
        this.renderArea(ctx, canvas.width, waveformHeight, yPosition, audioData);
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
    const step = width / audioData.length;

    ctx.beginPath();
    ctx.moveTo(0, yPosition);

    for (let i = 0; i < audioData.length; i++) {
      const x = i * step;
      const y = yPosition + (audioData[i] * waveformHeight);
      ctx.lineTo(x, y);
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
    const barWidth = width / audioData.length - this.barSpacing;

    for (let i = 0; i < audioData.length; i++) {
      const x = i * (barWidth + this.barSpacing);
      const height = Math.abs(audioData[i] * waveformHeight);
      const y = yPosition - height / 2;

      ctx.fillRect(x, y, barWidth, height);
    }
  }

  private renderArea(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    waveformHeight: number,
    yPosition: number,
    audioData: Float32Array
  ): void {
    const step = width / audioData.length;

    ctx.beginPath();
    ctx.moveTo(0, yPosition);

    // 上部の波形を描画
    for (let i = 0; i < audioData.length; i++) {
      const x = i * step;
      const y = yPosition + (audioData[i] * waveformHeight);
      ctx.lineTo(x, y);
    }

    // 下部の波形を描画（逆順）
    for (let i = audioData.length - 1; i >= 0; i--) {
      const x = i * step;
      const y = yPosition - (audioData[i] * waveformHeight);
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
  }
} 