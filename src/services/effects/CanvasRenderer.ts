import { AudioSource } from '../../types/audio';
import { VisualEffectManager } from './VisualEffectManager';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas;
  private offscreenContext: OffscreenCanvasRenderingContext2D;
  private frameRate: number;
  private lastEffectCount: number = 0;

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
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }
    this.context = context;
    console.log('CanvasRenderer: Canvas element set successfully', {
      width: this.canvas.width,
      height: this.canvas.height,
      contextType: this.context.constructor.name
    });
  }

  render(audioSource: AudioSource, time: number, effectManager: VisualEffectManager): void {
    console.log('CanvasRenderer: Starting render', {
      time,
      canvasSize: {
        width: this.canvas.width,
        height: this.canvas.height
      },
      offscreenSize: {
        width: this.offscreenCanvas.width,
        height: this.offscreenCanvas.height
      }
    });
    
    // エフェクトの数が変更された場合、または初回の場合は再初期化
    const currentEffectCount = effectManager.getEffectCount();
    if (currentEffectCount !== this.lastEffectCount) {
      console.log('CanvasRenderer: Effect count changed', {
        current: currentEffectCount,
        last: this.lastEffectCount,
        canvasSize: {
          width: this.offscreenCanvas.width,
          height: this.offscreenCanvas.height
        }
      });
      effectManager.reset(); // 初期化状態を強制的にリセット
      effectManager.initialize(this.offscreenCanvas, this.offscreenContext);
      this.lastEffectCount = currentEffectCount;
    }

    // オフスクリーンキャンバスをクリア
    this.offscreenContext.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);

    // エフェクトの処理
    effectManager.process(audioSource, time, this.offscreenCanvas);

    // オフスクリーンキャンバスの状態を確認
    const imageData = this.offscreenContext.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    const hasContent = imageData.data.some(value => value !== 0);
    console.log('CanvasRenderer: Offscreen canvas state after effects', {
      hasContent,
      globalAlpha: this.offscreenContext.globalAlpha,
      globalCompositeOperation: this.offscreenContext.globalCompositeOperation
    });

    // メインキャンバスをクリア
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // オフスクリーンキャンバスの内容をメインキャンバスに転送
    this.context.save();
    this.context.globalAlpha = 1;
    this.context.globalCompositeOperation = 'source-over';
    this.context.drawImage(this.offscreenCanvas, 0, 0);

    // メインキャンバスの状態を確認
    const mainImageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const mainHasContent = mainImageData.data.some(value => value !== 0);
    console.log('CanvasRenderer: Main canvas state after transfer', {
      hasContent: mainHasContent,
      globalAlpha: this.context.globalAlpha,
      globalCompositeOperation: this.context.globalCompositeOperation
    });
    this.context.restore();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
} 