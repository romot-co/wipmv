import { AudioVisualParameters, BaseEffectConfig, ErrorType, AppError } from './types';
import { EffectBase } from './EffectBase';

/**
 * エフェクトマネージャー
 * エフェクトのライフサイクルとレンダリングを管理する
 */
export class EffectManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private effects: Map<string, EffectBase>;
  private audioBuffer: AudioBuffer | null;
  private waveformData?: Float32Array;
  private frequencyData?: Uint8Array;
  private currentTime: number;
  private duration: number;
  private isPlaying: boolean;
  private offscreen: OffscreenCanvas;
  private offscreenCtx: OffscreenCanvasRenderingContext2D;
  private animationFrameId: number | null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;
    this.effects = new Map();
    this.audioBuffer = null;
    this.currentTime = 0;
    this.duration = 0;
    this.isPlaying = false;
    this.animationFrameId = null;

    // オフスクリーンキャンバスの初期化
    this.offscreen = new OffscreenCanvas(canvas.width, canvas.height);
    const offscreenCtx = this.offscreen.getContext('2d');
    if (!offscreenCtx) {
      throw new Error('Failed to get offscreen canvas context');
    }
    this.offscreenCtx = offscreenCtx;
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
   * 指定したIDのエフェクトを取得
   */
  getEffect(id: string): EffectBase | undefined {
    return this.effects.get(id);
  }

  /**
   * エフェクトを更新
   */
  updateEffect(id: string, newConfig: Partial<BaseEffectConfig>): void {
    try {
      const effect = this.effects.get(id);
      if (!effect) {
        throw new AppError(
          ErrorType.EffectNotFound,
          `エフェクトID "${id}" が見つかりません`
        );
      }

      effect.updateConfig(newConfig);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'エフェクトの更新に失敗しました',
        error
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
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.render();
  }

  /**
   * レンダリングを停止
   */
  stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * レンダリングループ
   */
  render(): void {
    // オフスクリーンキャンバスをクリア
    this.clearCanvas();

    // エフェクトをzIndexの順にソート
    const sortedEffects = Array.from(this.effects.values()).sort(
      (a, b) => a.getConfig().zIndex - b.getConfig().zIndex
    );

    // 各エフェクトをレンダリング
    for (const effect of sortedEffects) {
      if (effect.isVisible(this.currentTime)) {
        effect.render(this.offscreenCtx, {
          currentTime: this.currentTime,
          duration: this.duration,
          waveformData: this.waveformData,
          frequencyData: this.frequencyData,
        });
      }
    }

    // オフスクリーンの内容をメインキャンバスにコピー
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.offscreen, 0, 0);

    // 次のフレームをリクエスト
    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame(() => this.render());
    }
  }

  /**
   * 音声の長さを更新
   */
  updateDuration(duration: number): void {
    this.duration = duration;
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    this.stop();
    this.effects.clear();
    this.audioBuffer = null;
    this.waveformData = undefined;
    this.frequencyData = undefined;
  }

  /**
   * エフェクトをzIndexでソート
   */
  private getSortedEffects(): EffectBase[] {
    return Array.from(this.effects.values())
      .sort((a, b) => a.getConfig().zIndex - b.getConfig().zIndex);
  }

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
   * エフェクトを上に移動
   */
  moveEffectUp(id: string): void {
    try {
      const entries = Array.from(this.effects.entries());
      const index = entries.findIndex(([key]) => key === id);
      if (index <= 0) return;

      const [prevId, prevEffect] = entries[index - 1];
      const [currentId, currentEffect] = entries[index];

      // zIndexを交換
      const prevZIndex = prevEffect.getConfig().zIndex;
      const currentZIndex = currentEffect.getConfig().zIndex;
      
      this.updateEffect(prevId, { zIndex: currentZIndex });
      this.updateEffect(currentId, { zIndex: prevZIndex });
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        error instanceof Error ? error.message : 'Failed to move effect up'
      );
    }
  }

  /**
   * エフェクトを下に移動
   */
  moveEffectDown(id: string): void {
    try {
      const entries = Array.from(this.effects.entries());
      const index = entries.findIndex(([key]) => key === id);
      if (index === -1 || index >= entries.length - 1) return;

      const [currentId, currentEffect] = entries[index];
      const [nextId, nextEffect] = entries[index + 1];

      // zIndexを交換
      const currentZIndex = currentEffect.getConfig().zIndex;
      const nextZIndex = nextEffect.getConfig().zIndex;
      
      this.updateEffect(currentId, { zIndex: nextZIndex });
      this.updateEffect(nextId, { zIndex: currentZIndex });
    } catch (error) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        error instanceof Error ? error.message : 'Failed to move effect down'
      );
    }
  }

  /**
   * 音声バッファを取得
   */
  getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  /**
   * 音声バッファを設定
   */
  setAudioBuffer(buffer: AudioBuffer): void {
    this.audioBuffer = buffer;
  }

  /**
   * キャンバスを取得
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
} 