/**
 * レンダラー
 * Canvas描画の基本機能を提供する
 */
export class Renderer {
  private readonly ctx: CanvasRenderingContext2D | null;
  private offscreen: OffscreenCanvas;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    this.offscreen = new OffscreenCanvas(canvas.width, canvas.height);

    if (!this.ctx) {
      throw new Error('Failed to get 2D context');
    }
  }

  /**
   * キャンバスをクリア
   */
  clear(): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * オフスクリーンキャンバスを取得
   */
  getOffscreenCanvas(): OffscreenCanvas {
    return this.offscreen;
  }

  /**
   * オフスクリーンの内容をメインキャンバスに描画
   */
  drawToMain(): void {
    if (!this.ctx) return;
    this.ctx.drawImage(this.offscreen, 0, 0);
  }

  /**
   * キャンバスのサイズを設定
   */
  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreen = new OffscreenCanvas(width, height);
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
} 