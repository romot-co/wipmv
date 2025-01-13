/**
 * Renderer
 * - Canvas描画の基本機能を提供 (2Dコンテキスト取得、OffscreenCanvasサポート、サイズ変更、ダブルバッファリング)
 * - 具体的な描画処理は行わず、EffectManagerなど上位ロジックから使われる
 */

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D | null;
  private offscreen: OffscreenCanvas | HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  private isOffscreenSupported: boolean;

  constructor(private readonly canvas: HTMLCanvasElement) {
    // メインCanvasの2Dコンテキストを取得
    this.ctx = canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D context for main canvas');
    }

    // OffscreenCanvasサポートチェック
    this.isOffscreenSupported = typeof OffscreenCanvas !== 'undefined';

    if (this.isOffscreenSupported) {
      // オフスクリーンキャンバス生成
      this.offscreen = new OffscreenCanvas(canvas.width, canvas.height);
      this.offscreenCtx = this.offscreen.getContext('2d');

      if (!this.offscreenCtx) {
        // 取得失敗した場合は fallback
        this.isOffscreenSupported = false;
        console.warn('Failed to get offscreen context, falling back to main canvas.');
        this.offscreen = canvas;
        this.offscreenCtx = this.ctx;
      }
    } else {
      // OffscreenCanvas非対応ブラウザならメインキャンバスを使う
      console.warn('OffscreenCanvas not supported, using main canvas directly.');
      this.offscreen = canvas;
      this.offscreenCtx = this.ctx;
    }
  }

  /**
   * キャンバスをクリア
   * - オフスクリーン＆メインキャンバスの両方をクリア
   */
  clear(): void {
    if (!this.ctx || !this.offscreenCtx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.offscreenCtx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);
  }

  /**
   * オフスクリーンコンテキストを取得
   * - ここに描画すれば、drawToMain() でメインキャンバスに反映可能
   */
  getOffscreenContext(): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
    return this.offscreenCtx || this.ctx!;
  }

  /**
   * メインキャンバスの2Dコンテキストを取得
   * - 必要に応じて直接描画したい場合など
   */
  getMainContext(): CanvasRenderingContext2D {
    return this.ctx!;
  }

  /**
   * オフスクリーンの内容をメインキャンバスへ drawImage
   * - ダブルバッファリングでちらつきを抑える
   */
  drawToMain(): void {
    if (!this.ctx || !this.offscreenCtx) return;

    // OffscreenCanvasの内容をメインCanvasに転写
    if (this.isOffscreenSupported && this.offscreen instanceof OffscreenCanvas) {
      this.ctx.drawImage(this.offscreen, 0, 0);
    } else {
      // サポート外ならそもそもオフスクリーン＝メインキャンバスなので何もしない
    }
  }

  /**
   * キャンバスのサイズを変更
   * - メインキャンバスとオフスクリーンの両方を合わせる
   */
  setSize(width: number, height: number): void {
    // メインCanvasのリサイズ
    this.canvas.width = width;
    this.canvas.height = height;

    // オフスクリーンCanvasもリサイズ
    if (this.isOffscreenSupported) {
      const newOffscreen = new OffscreenCanvas(width, height);
      const newCtx = newOffscreen.getContext('2d');
      if (newCtx) {
        this.offscreen = newOffscreen;
        this.offscreenCtx = newCtx;
      } else {
        // fallback
        this.isOffscreenSupported = false;
        console.warn('Failed to get offscreen context after resize, falling back to main canvas.');
        this.offscreen = this.canvas;
        this.offscreenCtx = this.ctx;
      }
    }
  }

  /**
   * 現在のキャンバスサイズを取得
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * OffscreenCanvasが利用できるか
   */
  isOffscreenCanvasSupported(): boolean {
    return this.isOffscreenSupported;
  }

  /**
   * 現在のキャンバスを取得
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
