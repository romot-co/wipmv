import { Effect } from '../base';

/**
 * キャンバスレンダラー
 * エフェクトの描画を管理する
 */
export class CanvasRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly effects: Effect[] = [];
  private audioData?: Float32Array;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;
  }

  /**
   * エフェクトを追加
   */
  addEffect(effect: Effect): void {
    this.effects.push(effect);
  }

  /**
   * エフェクトを削除
   */
  removeEffect(effect: Effect): void {
    const index = this.effects.indexOf(effect);
    if (index !== -1) {
      this.effects.splice(index, 1);
    }
  }

  /**
   * 全てのエフェクトを削除
   */
  clearEffects(): void {
    this.effects.forEach(effect => effect.dispose());
    this.effects.length = 0;
  }

  /**
   * オーディオデータを更新
   */
  updateAudioData(data: Float32Array): void {
    this.audioData = data;
  }

  /**
   * エフェクトを描画
   */
  render(currentTime: number): void {
    // キャンバスをクリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 各エフェクトを描画
    this.effects.forEach(effect => {
      effect.render(
        this.ctx,
        this.canvas.width,
        this.canvas.height,
        currentTime,
        this.audioData
      );
    });
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.clearEffects();
  }
} 