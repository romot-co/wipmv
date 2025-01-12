import { AudioVisualParameters, BaseEffectConfig, ErrorType, AppError } from './types';
import { EffectBase } from './EffectBase';

/**
 * エフェクトマネージャー
 * エフェクトのライフサイクルとレンダリングを管理する
 */
export class EffectManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreen: OffscreenCanvas;
  private offscreenCtx: OffscreenCanvasRenderingContext2D;
  private effects: Map<string, EffectBase>;
  private currentTime: number;
  private duration: number;
  private animationFrameId: number | null;
  private waveformData: Float32Array;
  private frequencyData: Uint8Array;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to get canvas context'
      );
    }
    this.ctx = ctx;

    // オフスクリーンキャンバスの初期化
    this.offscreen = new OffscreenCanvas(canvas.width, canvas.height);
    const offscreenCtx = this.offscreen.getContext('2d');
    if (!offscreenCtx) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to get offscreen canvas context'
      );
    }
    this.offscreenCtx = offscreenCtx;

    this.effects = new Map();
    this.currentTime = 0;
    this.duration = 0;
    this.animationFrameId = null;
    this.waveformData = new Float32Array();
    this.frequencyData = new Uint8Array();
  }

  /**
   * キャンバスを設定
   */
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to get canvas context'
      );
    }
    this.ctx = ctx;

    // オフスクリーンキャンバスの再初期化
    this.offscreen = new OffscreenCanvas(canvas.width, canvas.height);
    const offscreenCtx = this.offscreen.getContext('2d');
    if (!offscreenCtx) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to get offscreen canvas context'
      );
    }
    this.offscreenCtx = offscreenCtx;
  }

  /**
   * キャンバスをクリア
   */
  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.offscreenCtx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);
  }

  /**
   * 全てのエフェクトを取得
   */
  getEffects(): Map<string, EffectBase> {
    return this.effects;
  }

  /**
   * エフェクトを追加
   */
  addEffect(effect: EffectBase, id: string): void {
    try {
      if (this.effects.has(id)) {
        throw new AppError(
          ErrorType.EffectAlreadyExists,
          `Effect with id ${id} already exists`
        );
      }
      this.effects.set(id, effect);
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        error instanceof Error ? error.message : 'Failed to add effect'
      );
    }
  }

  /**
   * エフェクトを削除
   */
  removeEffect(id: string): void {
    try {
      if (!this.effects.has(id)) {
        throw new AppError(
          ErrorType.EffectNotFound,
          `Effect with id ${id} not found`
        );
      }
      this.effects.delete(id);
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        error instanceof Error ? error.message : 'Failed to remove effect'
      );
    }
  }

  /**
   * エフェクトを取得
   */
  getEffect(id: string): EffectBase | undefined {
    try {
      const effect = this.effects.get(id);
      if (!effect) {
        throw new AppError(
          ErrorType.EffectNotFound,
          `エフェクトID "${id}" が見つかりません`
        );
      }
      return effect;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'エフェクトの取得に失敗しました',
        error
      );
    }
  }

  /**
   * エフェクトを更新
   */
  updateEffect(id: string, config: Partial<BaseEffectConfig>): void {
    try {
      const effect = this.effects.get(id);
      if (!effect) {
        throw new AppError(
          ErrorType.EffectNotFound,
          `Effect with id ${id} not found`
        );
      }
      effect.updateConfig(config);
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        error instanceof Error ? error.message : 'Failed to update effect'
      );
    }
  }

  /**
   * オーディオデータを更新
   */
  updateAudioData(waveform: Float32Array, frequency: Uint8Array): void {
    try {
      this.waveformData = waveform;
      this.frequencyData = frequency;
    } catch (error) {
      throw new AppError(
        ErrorType.AudioDecodeFailed,
        error instanceof Error ? error.message : 'Failed to update audio data'
      );
    }
  }

  /**
   * 現在の再生時間を更新
   */
  updateTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * レンダリングを開始
   */
  start(): void {
    if (this.animationFrameId !== null) return;
    this.animate();
  }

  /**
   * レンダリングを停止
   */
  stop(): void {
    if (this.animationFrameId === null) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.stop();
    for (const effect of this.effects.values()) {
      effect.dispose();
    }
    this.effects.clear();
  }

  /**
   * エフェクトをzIndexでソート
   */
  private getSortedEffects(): EffectBase[] {
    return Array.from(this.effects.values())
      .sort((a, b) => a.getConfig().zIndex - b.getConfig().zIndex);
  }

  /**
   * 動画の長さを更新
   */
  updateDuration(duration: number): void {
    this.duration = duration;
  }

  private animate = (): void => {
    const ctx = this.canvas.getContext('2d');
    
    if (!ctx || !this.offscreenCtx) return;

    // Clear both canvases
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.offscreenCtx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);

    // Render effects in order
    const parameters: AudioVisualParameters = {
      currentTime: this.currentTime,
      duration: this.duration,
      waveformData: this.waveformData,
      frequencyData: this.frequencyData,
    };

    for (const effect of this.getSortedEffects()) {
      effect.render(parameters, this.offscreen);
    }

    // Draw offscreen canvas to main canvas
    ctx.drawImage(this.offscreen, 0, 0);

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  /**
   * エフェクトのzIndexを更新
   */
  updateEffectOrder(id: string, newZIndex: number): void {
    try {
      const effect = this.effects.get(id);
      if (!effect) {
        throw new AppError(
          ErrorType.EffectNotFound,
          `エフェクトID "${id}" が見つかりません`
        );
      }

      // 現在のzIndexを取得
      const currentConfig = effect.getConfig();
      const currentZIndex = currentConfig.zIndex;

      // 他のエフェクトのzIndexを調整
      for (const [otherId, otherEffect] of this.effects.entries()) {
        if (otherId !== id) {
          const otherConfig = otherEffect.getConfig();
          if (newZIndex > currentZIndex) {
            // 上に移動する場合
            if (otherConfig.zIndex > currentZIndex && otherConfig.zIndex <= newZIndex) {
              otherEffect.updateConfig({ zIndex: otherConfig.zIndex - 1 });
            }
          } else {
            // 下に移動する場合
            if (otherConfig.zIndex >= newZIndex && otherConfig.zIndex < currentZIndex) {
              otherEffect.updateConfig({ zIndex: otherConfig.zIndex + 1 });
            }
          }
        }
      }

      // 対象のエフェクトのzIndexを更新
      effect.updateConfig({ zIndex: newZIndex });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'エフェクトの順序の更新に失敗しました',
        error
      );
    }
  }

  /**
   * エフェクトを一つ上に移動
   */
  moveEffectUp(id: string): void {
    try {
      const effect = this.effects.get(id);
      if (!effect) {
        throw new AppError(
          ErrorType.EffectNotFound,
          `エフェクトID "${id}" が見つかりません`
        );
      }

      const currentZIndex = effect.getConfig().zIndex;
      const maxZIndex = Math.max(...Array.from(this.effects.values()).map(e => e.getConfig().zIndex));
      
      if (currentZIndex < maxZIndex) {
        this.updateEffectOrder(id, currentZIndex + 1);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'エフェクトを上に移動できませんでした',
        error
      );
    }
  }

  /**
   * エフェクトを一つ下に移動
   */
  moveEffectDown(id: string): void {
    try {
      const effect = this.effects.get(id);
      if (!effect) {
        throw new AppError(
          ErrorType.EffectNotFound,
          `エフェクトID "${id}" が見つかりません`
        );
      }

      const currentZIndex = effect.getConfig().zIndex;
      const minZIndex = Math.min(...Array.from(this.effects.values()).map(e => e.getConfig().zIndex));
      
      if (currentZIndex > minZIndex) {
        this.updateEffectOrder(id, currentZIndex - 1);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'エフェクトを下に移動できませんでした',
        error
      );
    }
  }
} 