import { Disposable, AudioSource } from './base';
import { EffectConfig } from './effect';
import { HasAudioSource } from './state';

export type { EffectConfig };

/**
 * コアクラスとインターフェースの定義
 */

/**
 * エフェクトの基本クラス
 */
export abstract class EffectBase<T extends EffectConfig> implements HasAudioSource, Disposable {
  protected config: T;
  protected audioSource: AudioSource | null = null;

  constructor(config: T) {
    this.config = config;
  }

  getId(): string {
    return this.config.id;
  }

  getConfig(): T {
    return this.config;
  }

  updateConfig(newConfig: Partial<T>): void {
    this.config = { ...this.config, ...newConfig };
  }

  isActive(currentTime: number): boolean {
    const { startTime = 0, endTime = Infinity } = this.config;
    return currentTime >= startTime && currentTime <= endTime;
  }

  abstract update(currentTime: number): void;
  abstract render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;

  dispose(): void {
    // 継承先で必要に応じてオーバーライド
  }

  getAudioSource(): AudioSource {
    if (!this.audioSource) {
      throw new Error('AudioSource is not set');
    }
    return this.audioSource;
  }

  setAudioSource(source: AudioSource): void {
    this.audioSource = source;
  }
}

/**
 * エフェクトマネージャーのインターフェース
 */
export interface EffectManager extends Disposable {
  setRenderer(renderer: Renderer | null): void;
  getRenderer(): Renderer | null;
  addEffect(effect: EffectBase<EffectConfig>, zIndex?: number): void;
  removeEffect(id: string): void;
  getEffect(id: string): EffectBase<EffectConfig> | undefined;
  getEffects(): EffectBase<EffectConfig>[];
  updateEffectConfig(id: string, config: Partial<EffectConfig>): void;
  updateAll(currentTime: number): void;
  renderAll(currentTime: number, ctx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;
  moveEffect(sourceId: string, targetId: string): void;
  dispose(): void;
  createExportCanvas(options: { width: number; height: number }): HTMLCanvasElement;
  renderExportFrame(canvas: HTMLCanvasElement, currentTime: number): void;
}

/**
 * レンダラーのインターフェース
 */
export interface Renderer extends Disposable {
  getOffscreenContext(): CanvasRenderingContext2D;
  drawToMain(): void;
  clear(): void;
  getOriginalSize(): { width: number; height: number };
  getCurrentSize(): { width: number; height: number };
  getScale(): number;
  isPreview(): boolean;
  getCanvas(): HTMLCanvasElement;
} 