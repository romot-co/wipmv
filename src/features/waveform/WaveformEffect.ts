import { EffectBase } from '../../core/EffectBase';
import { WaveformEffectConfig, AudioVisualParameters } from '../../core/types';

export class WaveformEffect extends EffectBase {
  private worker: Worker | null = null;
  private offlineData: {
    peaks: Float32Array;
    rms: Float32Array;
  } | null = null;
  private analysisPromise: Promise<void> | null = null;

  constructor(config: WaveformEffectConfig) {
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
            peaks: new Float32Array(e.data.peaks),
            rms: new Float32Array(e.data.rms)
          };
          if (this.analysisPromise) {
            this.analysisPromise = null;
          }
        }
      };
    }
  }

  public startOfflineAnalysis(channelData: Float32Array): Promise<void> {
    if (!this.worker) {
      return Promise.reject(new Error('Worker is not available'));
    }

    const config = this.getConfig<WaveformEffectConfig>();
    const segmentCount = config.options.segmentCount || 1024;

    this.analysisPromise = new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker is not available'));
        return;
      }

      const handler = (e: MessageEvent) => {
        if (e.data.type === 'result') {
          this.worker?.removeEventListener('message', handler);
          resolve();
        } else if (e.data.type === 'error') {
          this.worker?.removeEventListener('message', handler);
          reject(new Error(e.data.error));
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({
        type: 'analyze',
        channelData,
        segmentCount
      });
    });

    return this.analysisPromise;
  }

  public waitForAnalysisComplete(): Promise<void> {
    return this.analysisPromise || Promise.resolve();
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    const config = this.getConfig<WaveformEffectConfig>();
    const { position, colors, options } = config;

    if (!this.isVisible(params.currentTime)) return;

    if (colors.background) {
      ctx.fillStyle = colors.background;
      ctx.fillRect(position.x, position.y, position.width, position.height);
    }

    const waveformData = this.getWaveformData(params);
    if (!waveformData) return;

    const style = options.style || 'bar';
    const barWidth = options.barWidth || 2;
    const barSpacing = options.barSpacing || 1;
    const smoothing = options.smoothing || 0.5;

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
      return params.waveformData || null;
    } else {
      if (!this.offlineData?.peaks) {
        return params.waveformData || null;
      }

      const { currentTime, duration } = params;
      if (!duration) return null;

      const segmentCount = config.options.segmentCount || 1024;
      const peaksLength = this.offlineData.peaks.length;
      const samplesPerSegment = Math.floor(peaksLength / segmentCount);
      
      const startIndex = Math.floor((currentTime / duration) * (peaksLength - samplesPerSegment));
      
      const result = new Float32Array(segmentCount);
      for (let i = 0; i < segmentCount; i++) {
        const pos = startIndex + (i * samplesPerSegment / segmentCount);
        const index1 = Math.floor(pos);
        const index2 = Math.min(index1 + 1, peaksLength - 1);
        const frac = pos - index1;
        
        const value1 = this.offlineData.peaks[index1];
        const value2 = this.offlineData.peaks[index2];
        result[i] = value1 + (value2 - value1) * frac;
      }
      
      return result;
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
    this.analysisPromise = null;
  }
} 