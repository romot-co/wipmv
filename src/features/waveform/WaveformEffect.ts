import { EffectBase } from '../../core/EffectBase';
import { WaveformEffectConfig, AudioVisualParameters } from '../../core/types';

export class WaveformEffect extends EffectBase {
  private worker: Worker | null = null;
  private offlineData: {
    peaks: Float32Array;
    rms: Float32Array;
  } | null = null;

  constructor(config: WaveformEffectConfig) {
    // デフォルトオプションを設定
    const defaultConfig: WaveformEffectConfig = {
      ...config,
      options: {
        smoothing: 0.5,
        barWidth: 2,
        barSpacing: 1,
        style: 'bar',
        analysisMode: 'realtime',
        segmentCount: 1024,
        ...config.options
      }
    };
    super(defaultConfig);
    this.initWorker();
  }

  private initWorker() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./waveformAnalysis.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (e) => {
        if (e.data.type === 'result') {
          this.offlineData = {
            peaks: e.data.peaks,
            rms: e.data.rms
          };
        }
      };
    }
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    const config = this.getConfig<WaveformEffectConfig>();
    const { position, colors, options } = config;

    // 表示チェック
    if (!this.isVisible(params.currentTime)) return;

    // 背景描画
    if (colors.background) {
      ctx.fillStyle = colors.background;
      ctx.fillRect(position.x, position.y, position.width, position.height);
    }

    // 波形データの取得（リアルタイム/オフライン）
    const waveformData = this.getWaveformData(params);
    if (!waveformData) return;

    // 描画スタイルの設定
    const style = options.style || 'bar';
    const barWidth = options.barWidth || 2;
    const barSpacing = options.barSpacing || 1;
    const smoothing = options.smoothing || 0.5;

    // 波形の描画
    this.drawWaveform(ctx, waveformData, {
      style,
      barWidth,
      barSpacing,
      smoothing,
      position,
      colors
    });
  }

  private getWaveformData(params: AudioVisualParameters): Float32Array | null {
    const config = this.getConfig<WaveformEffectConfig>();
    const analysisMode = config.options.analysisMode || 'realtime';

    if (analysisMode === 'realtime') {
      // リアルタイムモード: AnalyserNodeからの生データを使用
      return params.waveformData || null;
    } else {
      // オフラインモード: 事前計算したデータを使用
      if (!this.offlineData) {
        // まだ解析が完了していない場合は解析を開始
        if (params.waveformData && this.worker) {
          const segmentCount = config.options.segmentCount || 1024;
          this.worker.postMessage({
            type: 'analyze',
            channelData: params.waveformData,
            sampleRate: 44100, // TODO: 実際のサンプルレートを使用
            segmentCount
          });
        }
        // 解析完了までリアルタイムデータを使用
        return params.waveformData || null;
      }
      return this.offlineData.peaks;
    }
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
    const centerY = position.y + position.height / 2;

    ctx.fillStyle = colors.primary;
    if (colors.secondary) {
      ctx.strokeStyle = colors.secondary;
    }

    const totalBars = Math.floor(position.width / (barWidth + barSpacing));
    const step = Math.floor(data.length / totalBars);

    for (let i = 0; i < totalBars; i++) {
      const x = position.x + i * (barWidth + barSpacing);
      let amplitude = 0;

      // データポイントの平均を計算
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx < data.length) {
          amplitude += Math.abs(data[idx]);
        }
      }
      amplitude /= step;

      const height = amplitude * position.height;

      if (style === 'bar') {
        ctx.fillRect(x, centerY - height / 2, barWidth, height);
      } else if (style === 'line') {
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, centerY - height / 2);
        } else {
          ctx.lineTo(x, centerY - height / 2);
        }
      } else if (style === 'mirror') {
        const mirrorHeight = height / 2;
        ctx.fillRect(x, centerY - mirrorHeight, barWidth, mirrorHeight);
        ctx.fillRect(x, centerY, barWidth, mirrorHeight);
      }
    }

    if (style === 'line') {
      ctx.stroke();
    }
  }

  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.offlineData = null;
  }
} 