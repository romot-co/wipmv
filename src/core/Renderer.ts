/**
 * レンダラー
 * Canvas描画の基本機能を提供する
 */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D | null;
  private offscreen: OffscreenCanvas | HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  private isOffscreenSupported: boolean;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }

    // OffscreenCanvasのサポートチェック
    this.isOffscreenSupported = typeof OffscreenCanvas !== 'undefined';
    if (this.isOffscreenSupported) {
      this.offscreen = new OffscreenCanvas(canvas.width, canvas.height);
      this.offscreenCtx = this.offscreen.getContext('2d');
      if (!this.offscreenCtx) {
        this.isOffscreenSupported = false;
        console.warn('Failed to get offscreen context, falling back to main canvas');
        this.offscreen = canvas;
        this.offscreenCtx = this.ctx;
      }
    } else {
      console.warn('OffscreenCanvas is not supported, falling back to main canvas');
      this.offscreen = canvas;
      this.offscreenCtx = this.ctx;
    }
  }

  /**
   * キャンバスをクリア
   */
  clear(): void {
    if (!this.ctx || !this.offscreenCtx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.offscreenCtx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);
  }

  /**
   * オフスクリーンコンテキストを取得
   */
  getOffscreenContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
    return this.offscreenCtx || this.ctx!;
  }

  /**
   * オフスクリーンの内容をメインキャンバスに描画
   */
  drawToMain(): void {
    if (!this.ctx || !this.offscreenCtx) return;
    if (this.isOffscreenSupported && this.offscreen instanceof OffscreenCanvas) {
      this.ctx.drawImage(this.offscreen, 0, 0);
    }
  }

  /**
   * キャンバスのサイズを設定
   */
  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;

    if (this.isOffscreenSupported) {
      const newOffscreen = new OffscreenCanvas(width, height);
      const newCtx = newOffscreen.getContext('2d');
      if (newCtx) {
        this.offscreen = newOffscreen;
        this.offscreenCtx = newCtx;
      } else {
        this.isOffscreenSupported = false;
        console.warn('Failed to get offscreen context after resize, falling back to main canvas');
        this.offscreen = this.canvas;
        this.offscreenCtx = this.ctx;
      }
    }
  }

  /**
   * キャンバスのサイズを取得
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * メインコンテキストを取得
   */
  getMainContext(): CanvasRenderingContext2D {
    return this.ctx!;
  }

  /**
   * OffscreenCanvasのサポート状態を取得
   */
  isOffscreenCanvasSupported(): boolean {
    return this.isOffscreenSupported;
  }
} 