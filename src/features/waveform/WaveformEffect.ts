import { EffectBase } from '../../core/EffectBase';
import { WaveformEffectConfig, AudioSource, AudioVisualParameters, BaseEffectConfig } from '../../core/types';

export class WaveformEffect extends EffectBase {
  private audioSource: AudioSource | null = null;
  private config: WaveformEffectConfig;
  private lastRenderTime: number = 0;
  private segmentDuration: number = 0;

  constructor(config: WaveformEffectConfig) {
    super(config);
    this.config = {
      ...config,
      options: {
        smoothing: 0.5,
        barWidth: 2,
        barSpacing: 1,
        style: 'bar',
        analysisMode: 'offline',
        segmentCount: 128,
        ...config.options
      }
    };
  }

  public setAudioSource(source: AudioSource): void {
    this.audioSource = source;
    if (source.buffer) {
      this.segmentDuration = source.buffer.duration / (this.config.options.segmentCount || 128);
    }
  }

  public render(ctx: CanvasRenderingContext2D, params: AudioVisualParameters): void {
    if (!this.isVisible(params.currentTime) || !this.audioSource) return;
    this.draw(ctx, params.currentTime);
  }

  private draw(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (!this.audioSource || !this.config.options) return;

    const { position, colors, options } = this.config;
    const { height } = position;
    const { style, barWidth = 2, barSpacing = 1, segmentCount = 128 } = options;

    // 現在の再生位置に基づいてセグメントのインデックスを計算
    const currentSegment = Math.floor(currentTime / this.segmentDuration);
    
    // 波形データの取得
    const waveformData = this.getWaveformDataForSegment(currentSegment, segmentCount);
    if (!waveformData) return;

    // 描画スタイルの設定
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.fillStyle = colors.primary;

    // バーの幅と間隔の計算
    const totalBarWidth = barWidth + barSpacing;
    const scale = height / 2;

    // 波形の描画
    waveformData.forEach((amplitude, i) => {
      const x = i * totalBarWidth;
      const barHeight = Math.abs(amplitude) * scale;

      if (style === 'bar') {
        // バースタイルの描画
        ctx.fillRect(x, height / 2 - barHeight / 2, barWidth, barHeight);
      } else {
        // ラインスタイルの描画
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, height / 2 + amplitude * scale);
        } else {
          ctx.lineTo(x, height / 2 + amplitude * scale);
        }
      }
    });

    if (style !== 'bar') {
      ctx.stroke();
    }

    ctx.restore();
    this.lastRenderTime = currentTime;
  }

  private getWaveformDataForSegment(currentSegment: number, segmentCount: number): number[] | null {
    if (!this.audioSource?.waveformData?.[0]) return null;

    const waveformData = this.audioSource.waveformData[0];
    const samplesPerSegment = Math.floor(waveformData.length / segmentCount);
    const startIndex = currentSegment * samplesPerSegment;
    const endIndex = Math.min(startIndex + samplesPerSegment, waveformData.length);

    // Float32Arrayをnumber[]に変換して返す
    return Array.from(waveformData.slice(startIndex, endIndex));
  }

  public getConfig<T extends BaseEffectConfig = WaveformEffectConfig>(): T {
    return this.config as T;
  }

  public updateConfig(newConfig: Partial<WaveformEffectConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      options: {
        ...this.config.options,
        ...newConfig.options
      }
    };
  }
} 