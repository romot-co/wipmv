import { EffectBase, BaseEffectState } from '../../core/EffectBase';
import { WaveformEffectConfig, AudioVisualParameters } from '../../core/types';

interface WaveformEffectState extends BaseEffectState {
  dataProcessing: boolean;
  lastProcessedDataId: string | null;
  renderStyle: 'line' | 'bar' | 'mirror';
  analysisComplete: boolean;
}

type WaveformData = {
  raw: Float32Array;
  smoothed: Float32Array;
  peaks: Float32Array;
  rms: number;
};

/**
 * 波形エフェクト
 * オーディオの波形をリアルタイムに分析し、様々なスタイルで描画する
 */
export class WaveformEffect extends EffectBase<WaveformEffectState> {
  protected override config: WaveformEffectConfig;
  private waveformData: WaveformData | null = null;
  private analysisWorker: Worker | null = null;

  constructor(config: WaveformEffectConfig) {
    const initialState: WaveformEffectState = {
      isReady: true,
      isLoading: false,
      error: null,
      dataProcessing: false,
      lastProcessedDataId: null,
      renderStyle: config.options?.style || 'bar',
      analysisComplete: false
    };
    super(config, initialState);
    this.config = config;
    this.initializeAnalysisWorker();
  }

  private initializeAnalysisWorker(): void {
    // Web Workerの初期化（実際のWorkerコードは別ファイルで実装）
    try {
      this.analysisWorker = new Worker(new URL('./waveformAnalysis.worker.ts', import.meta.url));
      this.analysisWorker.onmessage = this.handleWorkerMessage.bind(this);
    } catch (error) {
      console.warn('Worker initialization failed, falling back to main thread processing');
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { smoothed, peaks, rms } = event.data;
    if (this.waveformData && this.waveformData.raw) {
      this.waveformData = {
        raw: this.waveformData.raw,
        smoothed: new Float32Array(smoothed),
        peaks: new Float32Array(peaks),
        rms
      };
      this.updateState({
        ...this.state,
        dataProcessing: false,
        analysisComplete: true
      });
    }
  }

  override render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;
    if (!params.waveformData) return;
    if (!this.state.isReady) return;

    const { position, colors } = this.config;
    const { width, height } = position;

    // 波形データが変更された場合のみ分析を実行
    const currentDataId = this.getDataId(params.waveformData);
    if (this.shouldProcessData(params.waveformData, currentDataId)) {
      this.processWaveformData(params.waveformData);
    }

    if (!this.waveformData) return;

    ctx.save();
    try {
      ctx.translate(position.x, position.y);

      if (colors.background) {
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);
      }

      // レンダリングスタイルに応じて描画メソッドを選択
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

  private processWaveformData(data: Float32Array): void {
    this.updateState({ ...this.state, dataProcessing: true });
    
    if (this.analysisWorker) {
      // Web Workerで非同期処理
      this.analysisWorker.postMessage({
        data: data,
        options: this.config.options
      });
    } else {
      // フォールバック: メインスレッドで処理
      this.processDataInMainThread(data);
    }
  }

  private processDataInMainThread(data: Float32Array): void {
    try {
      const smoothed = this.smoothData(data, this.config.options?.smoothing ?? 0.5);
      const peaks = this.calculatePeaks(data);
      const rms = this.calculateRMS(data);

      this.waveformData = { raw: data, smoothed, peaks, rms };
      this.updateState({
        ...this.state,
        dataProcessing: false,
        analysisComplete: true,
        error: null
      });
    } catch (error) {
      this.updateState({
        ...this.state,
        dataProcessing: false,
        error: error instanceof Error ? error : new Error('Failed to process waveform data')
      });
    }
  }

  /**
   * 波形データをスムージング
   */
  private smoothData(data: Float32Array, factor: number): Float32Array {
    const smoothed = new Float32Array(data.length);
    const alpha = Math.max(0, Math.min(1, factor));
    
    smoothed[0] = data[0];
    for (let i = 1; i < data.length; i++) {
      smoothed[i] = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
    }
    
    return smoothed;
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

  private calculateRMS(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
  }

  private getDataId(data: Float32Array): string {
    return `${data.length}_${data[0]}_${data[data.length - 1]}_${this.calculateRMS(data)}`;
  }

  private shouldProcessData(newData: Float32Array, currentDataId: string): boolean {
    if (this.state.dataProcessing) return false;
    if (!this.waveformData?.raw) return true;
    return currentDataId !== this.state.lastProcessedDataId;
  }

  /**
   * リソースを解放
   */
  protected override disposeResources(): void {
    // Web Workerの終了
    if (this.analysisWorker) {
      this.analysisWorker.terminate();
      this.analysisWorker = null;
    }

    // 波形データの解放
    this.waveformData = null;

    // 状態のリセット
    this.updateState({
      ...this.state,
      dataProcessing: false,
      lastProcessedDataId: null,
      analysisComplete: false
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
    // 表示状態が変更された場合
    if (changes.visibilityChanged) {
      this.updateState({
        ...this.state,
        isReady: this.config.visible
      });
    }

    // タイミングが変更された場合
    if (changes.timingChanged && this.waveformData?.raw) {
      // 必要に応じて波形データを再処理
      this.processWaveformData(this.waveformData.raw);
    }
  }
} 