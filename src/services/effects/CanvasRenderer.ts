import { AudioSource } from '../../types/audio';
import { VisualEffectManager } from './VisualEffectManager';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas;
  private offscreenContext: OffscreenCanvasRenderingContext2D;
  private frameRate: number;
  private initialized: boolean = false;

  constructor(width: number, height: number, frameRate: number) {
    console.log('CanvasRenderer: Initializing with dimensions', width, height);
    
    // メインキャンバスの設定
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.context = context;

    // オフスクリーンキャンバスの設定
    this.offscreenCanvas = new OffscreenCanvas(width, height);
    const offscreenContext = this.offscreenCanvas.getContext('2d');
    if (!offscreenContext) {
      throw new Error('Failed to get offscreen canvas context');
    }
    this.offscreenContext = offscreenContext;
    this.frameRate = frameRate;

    console.log('CanvasRenderer: Initialization complete');
  }

  /**
   * 既存のキャンバス要素を設定します
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    console.log('CanvasRenderer: Setting canvas element');
    this.canvas = canvas;
    this.canvas.width = this.offscreenCanvas.width;
    this.canvas.height = this.offscreenCanvas.height;
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.context = context;
    console.log('CanvasRenderer: Canvas element set successfully');
  }

  render(audioSource: AudioSource, time: number, effectManager: VisualEffectManager): void {
    console.log('CanvasRenderer: Starting render at time', time);
    
    // オフェクトマネージャーの初期化（最初の1回のみ）
    if (!this.initialized) {
      effectManager.initialize(this.offscreenCanvas, this.offscreenContext);
      this.initialized = true;
      console.log('CanvasRenderer: Initialized effect manager');
    }

    // オフスクリーンキャンバスをクリア
    this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    console.log('CanvasRenderer: Cleared offscreen canvas');

    // エフェクトの処理
    effectManager.process(audioSource, time, this.offscreenCanvas);
    console.log('CanvasRenderer: Processed effects');

    // メインキャンバスに描画
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage(this.offscreenCanvas, 0, 0);
    console.log('CanvasRenderer: Rendered to main canvas');
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
} 