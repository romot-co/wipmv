import { EffectBase } from '../../core/EffectBase';
import { BaseEffectState, BaseEffectConfig, EffectType } from '../../core/types';
import { AudioVisualParameters } from '../../core/types';

interface WaveformEffectOptions {
  smoothing?: number;
  barWidth?: number;
  barSpacing?: number;
  style?: 'line' | 'bar' | 'mirror';
}

interface WaveformEffectConfig extends BaseEffectConfig {
  type: EffectType.Waveform;
  options?: WaveformEffectOptions;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  colors: {
    primary: string;
    secondary?: string;
    background?: string;
  };
}

interface WaveformEffectState extends BaseEffectState {
  dataProcessing: boolean;
  lastProcessedDataId: string | null;
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
  renderStyle: 'line' | 'bar' | 'mirror';
}

interface WaveformData {
  raw: Float32Array;
  smoothed: Float32Array;
  peaks: Float32Array;
  rms: number;
}

/**
 * 波形エフェクト
 * オーディオの波形をリアルタイムに分析し、様々なスタイルで描画する
 */
export class WaveformEffect extends EffectBase<WaveformEffectState> {
  private worker: Worker | null = null;
  private waveformData: WaveformData | null = null;
  protected override config: WaveformEffectConfig;

  constructor(config: WaveformEffectConfig) {
    const initialState: WaveformEffectState = {
      dataProcessing: false,
      lastProcessedDataId: null,
      isReady: false,
      isLoading: false,
      error: null,
      renderStyle: config.options?.style ?? 'bar'
    };

    super(config, initialState);
    
    // デフォルトのオプションを設定
    this.config = {
      ...config,
      options: {
        smoothing: config.options?.smoothing ?? 0.5,
        barWidth: config.options?.barWidth ?? 2,
        barSpacing: config.options?.barSpacing ?? 1,
        style: config.options?.style ?? 'bar'
      }
    };
    
    try {
      this.worker = new Worker(new URL('./waveformAnalysis.worker.ts', import.meta.url));
    } catch (error) {
      console.error('Failed to create worker:', error);
      this.state.error = error instanceof Error ? error : new Error('Failed to create worker');
    }
  }

  private processWaveformData(data: Float32Array): void {
    console.log('WaveformEffect: Starting waveform data processing');
    
    const currentDataId = this.getDataId(data);
    this.state.dataProcessing = true;
    
    if (this.worker) {
      this.worker.postMessage({
        data: Array.from(data),
        options: {
          smoothing: this.config.options?.smoothing ?? 0.5
        }
      });
      
      this.worker.onmessage = (e) => {
        console.log('WaveformEffect: Worker processing complete', e.data);
        this.waveformData = {
          raw: data,
          smoothed: new Float32Array(e.data.processedData),
          peaks: new Float32Array(e.data.peaks),
          rms: e.data.rms
        };
        this.state.lastProcessedDataId = currentDataId;
        this.state.dataProcessing = false;
        this.state.isReady = true;
      };
      
      this.worker.onerror = (error) => {
        console.error('WaveformEffect: Worker error:', error);
        this.state.dataProcessing = false;
        this.state.error = error instanceof Error ? error : new Error('Worker processing failed');
      };
    } else {
      // フォールバック処理
      console.log('WaveformEffect: Using fallback processing');
      this.waveformData = {
        raw: data,
        smoothed: data,
        peaks: this.calculatePeaks(data),
        rms: this.calculateRMS(data)
      };
      this.state.lastProcessedDataId = currentDataId;
      this.state.dataProcessing = false;
      this.state.isReady = true;
    }
  }

  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  override render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    // isVisibleチェックを一時的に無効化（常に表示）
    // if (!this.isVisible(params.currentTime)) {
    //   console.log('WaveformEffect: Effect is not visible at current time', params.currentTime);
    //   return;
    // }

    if (!params.waveformData) {
      console.log('WaveformEffect: No waveform data available');
      return;
    }

    // 波形データが変更された場合のみ分析を実行
    const currentDataId = this.getDataId(params.waveformData);
    console.log('WaveformEffect: Current state', {
      currentTime: params.currentTime,
      currentDataId,
      lastProcessedDataId: this.state.lastProcessedDataId,
      dataProcessing: this.state.dataProcessing,
      isReady: this.state.isReady,
      waveformDataLength: params.waveformData.length
    });

    if (this.shouldProcessData(params.waveformData, currentDataId)) {
      console.log('WaveformEffect: Processing new waveform data');
      this.processWaveformData(params.waveformData);
      return; // データ処理中は描画をスキップ
    }

    if (!this.state.isReady || !this.waveformData) {
      console.log('WaveformEffect: Effect is not ready');
      return;
    }

    const { position, colors } = this.config;
    const { width, height } = position;

    ctx.save();
    try {
      ctx.translate(position.x, position.y);

      if (colors.background) {
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);
      }

      // レンダリングスタイルに応じて描画メソッドを選択
      console.log('WaveformEffect: Rendering with style', this.state.renderStyle);
      switch (this.state.renderStyle) {
        case 'line':
          this.renderLineStyle(ctx, width, height);
          break;
        case 'mirror':
          this.renderMirrorStyle(ctx, width, height);
          break;
        case 'bar':
        default:
          this.renderBarStyle(ctx, width, height);
          break;
      }
    } finally {
      ctx.restore();
    }
  }

  private renderLineStyle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    if (!this.waveformData?.smoothed) return;

    const { colors } = this.config;
    const data = this.waveformData.smoothed;
    const step = Math.ceil(data.length / width);

    ctx.beginPath();
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2;

    for (let i = 0; i < width; i++) {
      const value = data[i * step] || 0;
      const x = i;
      const y = (1 - value) * height / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  private renderBarStyle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    if (!this.waveformData?.peaks) return;

    const { colors, options = {} } = this.config;
    const { barWidth = 2, barSpacing = 1 } = options;
    const data = this.waveformData.peaks;

    const totalBars = Math.floor(width / (barWidth + barSpacing));
    const step = Math.ceil(data.length / totalBars);

    ctx.fillStyle = colors.primary;
    for (let i = 0; i < totalBars; i++) {
      const value = data[i * step] || 0;
      const barHeight = value * height;
      const x = i * (barWidth + barSpacing);
      const y = height - barHeight;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }

  private renderMirrorStyle(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    if (!this.waveformData?.smoothed) return;

    const { colors, options = {} } = this.config;
    const { barWidth = 2, barSpacing = 1 } = options;
    const data = this.waveformData.smoothed;

    const totalBars = Math.floor(width / (barWidth + barSpacing));
    const step = Math.ceil(data.length / totalBars);
    const centerY = height / 2;

    ctx.fillStyle = colors.primary;
    for (let i = 0; i < totalBars; i++) {
      const value = Math.abs(data[i * step] || 0);
      const barHeight = value * height / 2;
      const x = i * (barWidth + barSpacing);

      // 上部
      ctx.fillRect(x, centerY - barHeight, barWidth, barHeight);
      // 下部
      if (colors.secondary) {
        ctx.fillStyle = colors.secondary;
        ctx.fillRect(x, centerY, barWidth, barHeight);
        ctx.fillStyle = colors.primary;
      } else {
        ctx.fillRect(x, centerY, barWidth, barHeight);
      }
    }
  }

  private calculatePeaks(data: Float32Array): Float32Array {
    const peaks = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      peaks[i] = Math.abs(data[i]);
    }
    return peaks;
  }

  private getDataId(data: Float32Array): string {
    return `${data.length}_${data[0]}_${data[data.length - 1]}_${this.calculateRMS(data)}`;
  }

  private shouldProcessData(data: Float32Array, currentDataId: string): boolean {
    // データ処理の条件を緩和
    return (
      !this.state.dataProcessing &&
      (!this.waveformData || !this.state.lastProcessedDataId || this.state.lastProcessedDataId !== currentDataId)
    );
  }

  /**
   * リソースを解放
   */
  protected override disposeResources(): void {
    // Web Workerの終了
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // 波形データの解放
    this.waveformData = null;

    // 状態のリセット
    this.updateState({
      ...this.state,
      dataProcessing: false,
      lastProcessedDataId: null,
      isReady: false
    });
  }

  override updateConfig(newConfig: Partial<WaveformEffectConfig>, batch = false): void {
    super.updateConfig(newConfig, batch);
    
    if (!batch) {
      // スタイルが変更された場合
      if ('options' in newConfig && newConfig.options?.style !== this.config.options?.style) {
        this.updateState({
          ...this.state,
          renderStyle: newConfig.options?.style || 'bar'
        });
      }

      // 波形の解析パラメータが変更された場合は再解析
      if ('options' in newConfig && 
          (newConfig.options?.smoothing !== this.config.options?.smoothing ||
           newConfig.options?.barWidth !== this.config.options?.barWidth ||
           newConfig.options?.barSpacing !== this.config.options?.barSpacing)) {
        if (this.waveformData?.raw) {
          this.processWaveformData(this.waveformData.raw);
        }
      }
    }
  }

  protected override handleConfigChange(
    changes: ReturnType<typeof this.analyzeConfigChanges>
  ): void {
    // 表示状態が変更された場合でも isReady は変更しない
    if (changes.visibilityChanged) {
      // 何もしない
    }

    // タイミングが変更された場合
    if (changes.timingChanged && this.waveformData?.raw) {
      // 波形データの再処理は不要
      // this.processWaveformData(this.waveformData.raw);
    }
  }
} 