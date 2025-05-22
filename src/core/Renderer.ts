/**
 * Renderer
 * - Canvas描画の基本機能を提供 (2Dコンテキスト取得、OffscreenCanvasサポート、サイズ変更、ダブルバッファリング)
 * - プレビュー用とエクスポート用で異なる解像度を扱う
 * - 具体的な描画処理は行わず、EffectManagerなど上位ロジックから使われる
 */

import { AppError, ErrorType } from './types/error';
import debug from 'debug';

const log = debug('app:Renderer');

// プレビュー用の最大解像度を定義
const PREVIEW_MAX_WIDTH = 1280;
const PREVIEW_MAX_HEIGHT = 720;

export class Renderer {
  private canvas: HTMLCanvasElement | null;
  private offscreenCanvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private scale: number = 1;
  private isPreviewMode: boolean = false;
  private originalSize: { width: number; height: number } | null = null;

  constructor(canvas: HTMLCanvasElement, isPreview: boolean = false) {
    this.canvas = canvas;
    this.isPreviewMode = isPreview;
    
    // メインキャンバスのコンテキストを取得
    this.ctx = canvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });
    if (!this.ctx) {
      throw new AppError(
        ErrorType.RENDERER_ERROR,
        'Failed to get canvas context'
      );
    }

    // オフスクリーンキャンバスを作成
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = canvas.width;
    this.offscreenCanvas.height = canvas.height;
    
    // オフスクリーンのコンテキストを取得
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
      alpha: true,
      willReadFrequently: false
    });
    if (!this.offscreenCtx) {
      throw new AppError(
        ErrorType.RENDERER_ERROR,
        'Failed to get offscreen context'
      );
    }

    // 描画設定
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.offscreenCtx.imageSmoothingEnabled = true;
    this.offscreenCtx.imageSmoothingQuality = 'high';

    // プレビューモードの場合は解像度を調整
    if (isPreview) {
      this.adjustPreviewSize(canvas.width, canvas.height);
    }
  }

  /**
   * プレビュー用の解像度を計算して設定
   */
  private adjustPreviewSize(width: number, height: number): void {
    if (!this.isPreviewMode) return;

    this.originalSize = { width, height };
    const aspectRatio = width / height;
    let previewWidth = width;
    let previewHeight = height;

    if (previewWidth > PREVIEW_MAX_WIDTH) {
      previewWidth = PREVIEW_MAX_WIDTH;
      previewHeight = Math.round(PREVIEW_MAX_WIDTH / aspectRatio);
    }

    if (previewHeight > PREVIEW_MAX_HEIGHT) {
      previewHeight = PREVIEW_MAX_HEIGHT;
      previewWidth = Math.round(PREVIEW_MAX_HEIGHT * aspectRatio);
    }

    this.canvas!.width = previewWidth;
    this.canvas!.height = previewHeight;
    this.offscreenCanvas!.width = previewWidth;
    this.offscreenCanvas!.height = previewHeight;

    // スケールを計算
    this.scale = width / previewWidth;

    log('プレビュー解像度を設定:', {
      original: { width, height },
      preview: { width: previewWidth, height: previewHeight },
      scale: this.scale
    });
  }

  /**
   * スケールを設定
   */
  setScale(scale: number): void {
    this.scale = scale;
    
    // スケールに応じてオフスクリーンキャンバスのサイズを調整
    this.offscreenCanvas!.width = Math.round(this.canvas!.width * scale);
    this.offscreenCanvas!.height = Math.round(this.canvas!.height * scale);
    
    // 描画設定を再適用
    if (this.offscreenCtx) {
      this.offscreenCtx.imageSmoothingEnabled = true;
      this.offscreenCtx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * オフスクリーンコンテキストを取得
   */
  getOffscreenContext(): CanvasRenderingContext2D {
    if (!this.offscreenCtx) {
      throw new AppError(
        ErrorType.RENDERER_ERROR,
        'Offscreen context is not available'
      );
    }
    return this.offscreenCtx;
  }

  /**
   * オフスクリーンの内容をメインキャンバスに転送
   */
  drawToMain(): void {
    if (!this.ctx || !this.offscreenCtx) return;

    // メインキャンバスをクリア
    this.ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);

    // スケールを考慮して描画
    if (this.scale !== 1) {
      this.ctx.save();
      this.ctx.scale(1 / this.scale, 1 / this.scale);
      this.ctx.drawImage(
        this.offscreenCanvas!,
        0, 0,
        this.offscreenCanvas!.width,
        this.offscreenCanvas!.height
      );
      this.ctx.restore();
    } else {
      this.ctx.drawImage(this.offscreenCanvas!, 0, 0);
    }
  }

  /**
   * キャンバスをクリア
   */
  clear(): void {
    if (this.offscreenCtx) {
      this.offscreenCtx.clearRect(
        0,
        0,
        this.offscreenCanvas!.width,
        this.offscreenCanvas!.height
      );
    }
  }

  /**
   * 元のサイズを取得
   */
  getOriginalSize(): { width: number; height: number } {
    return this.originalSize ?? {
      width: Math.round(this.canvas!.width * this.scale),
      height: Math.round(this.canvas!.height * this.scale)
    };
  }

  /**
   * 現在のサイズを取得
   */
  getCurrentSize(): { width: number; height: number } {
    return {
      width: this.canvas!.width,
      height: this.canvas!.height
    };
  }

  /**
   * スケール値を取得
   */
  getScale(): number {
    return this.scale;
  }

  /**
   * プレビューモードかどうかを取得
   */
  isPreview(): boolean {
    return this.isPreviewMode;
  }

  /**
   * キャンバス要素を取得
  */
  getCanvas(): HTMLCanvasElement {
    if (!this.canvas) {
      throw new AppError(
        ErrorType.RENDERER_ERROR,
        'Canvas is not available'
      );
    }
    return this.canvas;
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    // キャンバスのクリア
    this.clear();
    
    // コンテキストの参照を解放
    this.ctx = null;
    this.offscreenCtx = null;
    
    // キャンバス要素の参照を解放
    this.canvas = null;
    this.offscreenCanvas = null;
  }
}
