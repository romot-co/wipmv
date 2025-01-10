import { VisualEffectManager } from './VisualEffectManager';
import { AudioAnalyzer } from '../audio/AudioAnalyzer';
import { AudioVisualParameters, AudioSource } from '../../types/audio';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private backgroundCanvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D;
  private backgroundContext: CanvasRenderingContext2D | null = null;
  private offscreenCanvas: OffscreenCanvas;
  private backgroundOffscreenCanvas: OffscreenCanvas;
  private offscreenContext: OffscreenCanvasRenderingContext2D;
  private backgroundOffscreenContext: OffscreenCanvasRenderingContext2D;
  private frameRate: number;
  private lastEffectCount: number = 0;
  private animationFrameId: number | null = null;
  private isPlaying: boolean = false;
  private audioBuffer: AudioBuffer | null = null;
  private effectManager: VisualEffectManager | null = null;
  private audioTime: number = 0;
  private audioAnalyzer: AudioAnalyzer | null = null;

  constructor(width: number, height: number, frameRate: number) {
    console.log('CanvasRenderer: Initializing with dimensions', {
      width,
      height,
      frameRate
    });
    
    // メインキャンバスの設定
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.context = context;

    // オフスクリーンキャンバスの設定
    this.offscreenCanvas = new OffscreenCanvas(width, height);
    this.backgroundOffscreenCanvas = new OffscreenCanvas(width, height);
    const offscreenContext = this.offscreenCanvas.getContext('2d', { alpha: true });
    const backgroundOffscreenContext = this.backgroundOffscreenCanvas.getContext('2d', { alpha: true });
    if (!offscreenContext || !backgroundOffscreenContext) {
      throw new Error('Failed to get offscreen canvas context');
    }
    this.offscreenContext = offscreenContext;
    this.backgroundOffscreenContext = backgroundOffscreenContext;
    this.frameRate = frameRate;

    // 初期設定
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.offscreenContext.imageSmoothingEnabled = true;
    this.offscreenContext.imageSmoothingQuality = 'high';

    // AudioAnalyzerの初期化（遅延初期化）
    this.audioAnalyzer = null;

    console.log('CanvasRenderer: Initialization complete', {
      mainCanvas: {
        width: this.canvas.width,
        height: this.canvas.height,
        contextType: this.context.constructor.name
      },
      offscreenCanvas: {
        width: this.offscreenCanvas.width,
        height: this.offscreenCanvas.height,
        contextType: this.offscreenContext.constructor.name
      }
    });
  }

  private getAudioAnalyzer(): AudioAnalyzer {
    if (!this.audioAnalyzer) {
      this.audioAnalyzer = new AudioAnalyzer();
    }
    return this.audioAnalyzer;
  }

  /**
   * 既存のキャンバス要素を設定します
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    console.log('CanvasRenderer: Setting main canvas element');
    this.canvas = canvas;
    this.canvas.width = this.offscreenCanvas.width;
    this.canvas.height = this.offscreenCanvas.height;
    const context = this.canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.context = context;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
  }

  /**
   * 背景キャンバス要素を設定します
   */
  setBackgroundCanvas(canvas: HTMLCanvasElement): void {
    console.log('CanvasRenderer: Setting background canvas element');
    this.backgroundCanvas = canvas;
    this.backgroundCanvas.width = this.offscreenCanvas.width;
    this.backgroundCanvas.height = this.offscreenCanvas.height;
    const context = this.backgroundCanvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('Failed to get background canvas context');
    }
    this.backgroundContext = context;
    this.backgroundContext.imageSmoothingEnabled = true;
    this.backgroundContext.imageSmoothingQuality = 'high';
  }

  startPlayback(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.scheduleNextFrame();
    
    console.log('CanvasRenderer: Started playback', {
      audioTime: this.audioTime,
      hasAudioBuffer: !!this.audioBuffer,
      hasEffectManager: !!this.effectManager
    });
  }

  stopPlayback(): void {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('CanvasRenderer: Stopped playback');
  }

  private scheduleNextFrame(): void {
    if (!this.isPlaying) return;

    this.animationFrameId = requestAnimationFrame(() => {
      this.renderFrame();
      this.scheduleNextFrame();
    });
  }

  /**
   * ダミーのAudioSourceを作成します
   */
  private createDummyAudioSource(): AudioSource {
    return {
      timeData: [new Float32Array(1024)],
      volumeData: [new Float32Array([0])],
      amplitudeData: new Float32Array(1024),
      frequencyData: [new Float32Array(1024)],
      phaseData: new Float32Array(1024),
      stereoData: [new Float32Array([0])],
      dynamicRangeData: [new Float32Array([1])],
      sampleRate: 44100,
      numberOfChannels: 2,
      rawData: new ArrayBuffer(0),
      duration: 0
    };
  }

  private renderFrame(): void {
    // エフェクトマネージャーがない場合は描画をスキップ
    if (!this.effectManager) {
      console.warn('CanvasRenderer: Missing effect manager');
      return;
    }

    // エフェクトの数が変更された場合、または初回の場合は再初期化
    const currentEffectCount = this.effectManager.getEffectCount();
    if (currentEffectCount !== this.lastEffectCount) {
      console.log('CanvasRenderer: Effect count changed', {
        current: currentEffectCount,
        last: this.lastEffectCount
      });
      try {
        this.effectManager.reset();
        if (this.backgroundContext) {
          this.effectManager.initialize(this.backgroundCanvas!, this.backgroundContext);
        }
        this.effectManager.initialize(this.canvas, this.context);
        this.lastEffectCount = currentEffectCount;
      } catch (error) {
        console.error('Failed to initialize effects:', error);
        return;
      }
    }

    try {
      // AudioSourceの準備（オーディオバッファがない場合はダミーデータを使用）
      const audioSource = this.audioBuffer
        ? this.getAudioAnalyzer().analyze(this.audioBuffer) ?? this.createDummyAudioSource()
        : this.createDummyAudioSource();

      // パラメータを準備
      const parameters: AudioVisualParameters = {
        timeData: audioSource.timeData,
        volume: audioSource.volumeData[0],
        amplitude: audioSource.amplitudeData,
        frequency: audioSource.frequencyData[0],
        phase: audioSource.phaseData,
        stereo: audioSource.stereoData[0],
        dynamicRange: audioSource.dynamicRangeData[0],
        currentTime: this.audioTime,
        audioSource
      };

      // プレビュー用の描画
      this.renderPreview(parameters);

      // オーディオ時間を更新
      if (this.audioBuffer) {
        this.audioTime = (this.audioTime + (1 / this.frameRate)) % this.audioBuffer.duration;
      }
    } catch (error) {
      console.error('Error rendering frame:', error);
    }
  }

  /**
   * プレビュー用の描画を行います
   */
  private renderPreview(parameters: AudioVisualParameters): void {
    // メインキャンバスをクリア
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 背景エフェクトを描画
    const backgroundEffect = this.effectManager!.getBackgroundEffect();
    if (backgroundEffect && this.backgroundContext && this.backgroundCanvas) {
      try {
        // 背景キャンバスをクリア
        this.backgroundContext.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        
        // デフォルトの背景色を設定
        this.backgroundContext.fillStyle = '#000000';
        this.backgroundContext.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        
        // 背景エフェクトを描画
        this.backgroundContext.save();
        backgroundEffect.process(parameters, this.backgroundCanvas);
        this.backgroundContext.restore();
      } catch (error) {
        console.error('Error processing background effect:', error);
        // エラー時のデフォルト背景（グレー）
        this.backgroundContext.fillStyle = '#666666';
        this.backgroundContext.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
      }

      // 背景をメインキャンバスに描画
      this.context.save();
      this.context.globalCompositeOperation = 'source-over';
      this.context.drawImage(this.backgroundCanvas, 0, 0);
      this.context.restore();
    } else {
      // 背景エフェクトがない場合はデフォルトの背景色を設定
      this.context.fillStyle = '#000000';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // その他のエフェクトを描画
    try {
      this.context.save();
      this.effectManager!.processNonBackgroundEffects(parameters, this.canvas);
      this.context.restore();
    } catch (error) {
      console.error('Error processing non-background effects:', error);
    }
  }

  /**
   * ビデオ出力用の描画を行います
   */
  private renderVideoFrame(parameters: AudioVisualParameters): ImageBitmap {
    // オフスクリーンキャンバスをクリア
    this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    this.backgroundOffscreenContext.clearRect(0, 0, this.backgroundOffscreenCanvas.width, this.backgroundOffscreenCanvas.height);

    // 背景エフェクトを描画
    const backgroundEffect = this.effectManager!.getBackgroundEffect();
    if (backgroundEffect) {
      this.backgroundOffscreenContext.save();
      backgroundEffect.process(parameters, this.backgroundOffscreenCanvas);
      this.backgroundOffscreenContext.restore();
    }

    // 背景をメインキャンバスに描画
    this.offscreenContext.save();
    this.offscreenContext.globalCompositeOperation = 'source-over';
    this.offscreenContext.drawImage(this.backgroundOffscreenCanvas, 0, 0);
    this.offscreenContext.restore();

    // その他のエフェクトを描画
    this.offscreenContext.save();
    this.effectManager!.processNonBackgroundEffects(parameters, this.offscreenCanvas);
    this.offscreenContext.restore();

    // 結果をImageBitmapとして返す
    return this.offscreenCanvas.transferToImageBitmap();
  }

  render(audioBuffer: AudioBuffer, time: number, effectManager: VisualEffectManager): void {
    // 状態を更新
    this.audioBuffer = audioBuffer;
    this.effectManager = effectManager;
    this.audioTime = time;

    // レンダリングを実行（同期的に）
    this.renderFrame();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    // 再生を停止
    this.stopPlayback();

    // アニメーションフレームをキャンセル
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // AudioAnalyzerのクリーンアップ
    if (this.audioAnalyzer) {
      this.audioAnalyzer = null;
    }

    // キャンバスのクリーンアップ
    if (this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    if (this.offscreenContext) {
      this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }

    // 参照のクリア
    this.audioBuffer = null;
    this.effectManager = null;
    this.isPlaying = false;
    this.lastEffectCount = 0;
  }
} 