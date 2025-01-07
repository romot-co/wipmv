import { VisualEffectNode } from '../VisualEffect';
import { AudioVisualParameters } from '../../../types/audio';
import { WaveformEffectConfig } from '../../../types/effects';

/**
 * 波形描画のオプション
 */
export interface WaveformOptions {
  color: string;
  lineWidth: number;
  height: number;
  verticalPosition: number;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * 波形描画ノード
 * オーディオデータの波形を描画します
 */
export class WaveformNode extends VisualEffectNode {
  private readonly options: Required<WaveformOptions>;
  private samplesPerFrame: number = 0;

  constructor(options: WaveformOptions) {
    super();
    this.options = {
      ...options,
      opacity: options.opacity ?? 1,
      blendMode: options.blendMode ?? 'source-over',
      verticalPosition: options.verticalPosition ?? 0.5
    };
  }

  /**
   * サンプルレートに基づいて1フレームあたりのサンプル数を計算します
   */
  private calculateSamplesPerFrame(sampleRate: number): number {
    return Math.floor(sampleRate / 30);
  }

  /**
   * 波形の描画範囲を計算します
   */
  private calculateDrawRange(currentTime: number, sampleRate: number, canvasWidth: number): {
    startSample: number;
    samplesPerPixel: number;
  } {
    const currentSample = Math.floor((currentTime * sampleRate) / 1000);
    const samplesPerPixel = this.samplesPerFrame / canvasWidth;
    
    return {
      startSample: currentSample,
      samplesPerPixel
    };
  }

  /**
   * 波形のパスを生成します
   */
  private createWaveformPath(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    timeData: Float32Array,
    startSample: number,
    samplesPerPixel: number,
    canvasWidth: number,
    centerY: number,
    amplitude: number
  ): void {
    context.beginPath();

    for (let x = 0; x < canvasWidth; x++) {
      const sampleIndex = Math.floor(startSample + (x * samplesPerPixel));
      if (sampleIndex >= timeData.length) break;

      const value = timeData[sampleIndex];
      const y = centerY + value * amplitude;

      if (x === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
  }

  /**
   * 波形を描画します
   */
  private drawWaveform(
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    canvas: OffscreenCanvas,
    timeData: Float32Array,
    currentTime: number,
    sampleRate: number
  ): void {
    const { color, lineWidth, height, opacity, blendMode, verticalPosition } = this.options;
    const centerY = canvas.height * verticalPosition;
    const amplitude = height / 2;

    const { startSample, samplesPerPixel } = this.calculateDrawRange(
      currentTime,
      sampleRate,
      canvas.width
    );

    context.save();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.globalAlpha = opacity;
    context.globalCompositeOperation = blendMode;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    this.createWaveformPath(
      context,
      timeData,
      startSample,
      samplesPerPixel,
      canvas.width,
      centerY,
      amplitude
    );

    context.stroke();
    context.restore();
  }

  initialize(_canvas: HTMLCanvasElement | OffscreenCanvas, _context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    // 初期化時の処理は現時点では不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const context = canvas.getContext('2d');
    if (!context) return;

    const timeData = parameters.timeData[0]; // 最初のチャンネルのデータを使用
    if (!this.samplesPerFrame) {
      this.samplesPerFrame = this.calculateSamplesPerFrame(parameters.audioSource.sampleRate);
    }

    this.drawWaveform(
      context,
      canvas,
      timeData,
      parameters.currentTime,
      parameters.audioSource.sampleRate
    );

    this.passToNext(parameters, canvas);
  }

  dispose(): void {
    // リソースの解放は現時点では不要
  }

  getConfig(): WaveformEffectConfig {
    return {
      type: 'waveform',
      color: this.options.color,
      lineWidth: this.options.lineWidth,
      height: this.options.height,
      verticalPosition: this.options.verticalPosition,
      opacity: this.options.opacity,
      blendMode: this.options.blendMode
    };
  }
} 