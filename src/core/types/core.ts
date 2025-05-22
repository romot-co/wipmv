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
  protected visible: boolean;
  protected audioSource: AudioSource | null = null;
  public readonly isDraggable: boolean;

  constructor(config: T, isDraggable: boolean = false) {
    this.config = config;
    this.isDraggable = isDraggable;
    this.visible = config.visible !== undefined ? config.visible : true;
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
    const effectiveEndTime = (endTime === undefined || endTime === 0) ? Infinity : endTime;
    return currentTime >= startTime && currentTime <= effectiveEndTime;
  }

  isVisible(): boolean {
    return this.visible;
  }

  abstract update(currentTime: number): void;
  abstract render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;

  /**
   * エフェクトの描画領域（バウンディングボックス）をキャンバス座標で取得します。
   * クリック判定などに使用します。
   * @param canvasWidth 現在のキャンバス幅 (ピクセル)
   * @param canvasHeight 現在のキャンバス高さ (ピクセル)
   * @returns バウンディングボックス { x, y, width, height } または null (クリック不可の場合)
   */
  abstract getBoundingBox(canvasWidth: number, canvasHeight: number): { x: number, y: number, width: number, height: number } | null;

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
  addEffect(effect: EffectBase<EffectConfig>, zIndex?: number): void;
  removeEffect(id: string): void;
  getEffect(id: string): EffectBase<EffectConfig> | undefined;
  getEffects(): EffectBase<EffectConfig>[];
  getSortedEffects(): EffectBase<EffectConfig>[];
  updateEffectConfig(id: string, config: Partial<EffectConfig>): void;
  updateAll(currentTime: number): void;
  moveEffect(sourceId: string, targetId: string): void;
  dispose(): void;
  getEffectAtPoint(x: number, y: number, canvasWidth: number, canvasHeight: number): string | null;
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

/**
 * エクスポートボタンのプロパティ
 */
export interface ExportButtonProps {
  onError: (error: Error) => void;
  onProgress?: (progress: number) => void;
  videoSettings: {
    width: number;
    height: number;
    frameRate: number;
    videoBitrate: number;
    audioBitrate: number;
  };
  onSettingsChange: (settings: {
    width: number;
    height: number;
    frameRate: number;
    videoBitrate: number;
    audioBitrate: number;
  }) => void;
  audioSource: AudioSource | null;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
  disabled?: boolean;
}
