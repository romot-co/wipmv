import { AudioSource } from '../../types/audio';
import { VisualEffectManager } from './VisualEffectManager';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas;
  private offscreenContext: OffscreenCanvasRenderingContext2D;
  private frameRate: number;
  private lastEffectCount: number = 0;
  private animationFrameId: number | null = null;
  private isPlaying: boolean = false;
  private audioSource: AudioSource | null = null;
  private effectManager: VisualEffectManager | null = null;
  private audioTime: number = 0;

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
    const offscreenContext = this.offscreenCanvas.getContext('2d', { alpha: true });
    if (!offscreenContext) {
      throw new Error('Failed to get offscreen canvas context');
    }
    this.offscreenContext = offscreenContext;
    this.frameRate = frameRate;

    // 初期設定
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = 'high';
    this.offscreenContext.imageSmoothingEnabled = true;
    this.offscreenContext.imageSmoothingQuality = 'high';

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

  /**
   * 既存のキャンバス要素を設定します
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    console.log('CanvasRenderer: Setting canvas element', {
      originalSize: {
        width: canvas.width,
        height: canvas.height
      },
      newSize: {
        width: this.offscreenCanvas.width,
        height: this.offscreenCanvas.height
      }
    });
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

  startPlayback(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.scheduleNextFrame();
    
    console.log('CanvasRenderer: Started playback', {
      audioTime: this.audioTime,
      hasAudioSource: !!this.audioSource,
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

  private renderFrame(): void {
    // 必要なリソースがない場合は描画をスキップ
    if (!this.audioSource || !this.effectManager) {
      console.warn('CanvasRenderer: Missing resources', {
        hasAudioSource: !!this.audioSource,
        hasEffectManager: !!this.effectManager
      });
      return;
    }

    // エフェクトの数が変更された場合、または初回の場合は再初期化
    const currentEffectCount = this.effectManager.getEffectCount();
    if (currentEffectCount !== this.lastEffectCount) {
      console.log('CanvasRenderer: Effect count changed', {
        current: currentEffectCount,
        last: this.lastEffectCount
      });
      this.effectManager.reset();
      this.effectManager.initialize(this.offscreenCanvas, this.offscreenContext);
      this.lastEffectCount = currentEffectCount;
    }

    // コンテキストの状態を保存
    this.context.save();
    this.offscreenContext.save();

    // オフスクリーンキャンバスをクリア
    this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // エフェクトの処理
    try {
      this.effectManager.process(this.audioSource, this.audioTime, this.offscreenCanvas);
    } catch (error) {
      console.error('Error processing effects:', error);
    }

    // メインキャンバスをクリア
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // オフスクリーンキャンバスの内容をメインキャンバスに転送
    this.context.globalAlpha = 1;
    this.context.globalCompositeOperation = 'source-over';
    const bitmap = this.offscreenCanvas.transferToImageBitmap();
    this.context.drawImage(bitmap, 0, 0);
    bitmap.close();

    // コンテキストの状態を復元
    this.context.restore();
    this.offscreenContext.restore();

    console.log('CanvasRenderer: Frame rendered', {
      time: this.audioTime,
      isPlaying: this.isPlaying,
      effectCount: currentEffectCount,
      canvasSize: {
        width: this.canvas.width,
        height: this.canvas.height
      }
    });
  }

  render(audioSource: AudioSource, time: number, effectManager: VisualEffectManager): void {
    this.audioSource = audioSource;
    this.effectManager = effectManager;
    this.audioTime = time;
    this.renderFrame();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
} 