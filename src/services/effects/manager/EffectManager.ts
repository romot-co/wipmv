import { Effect, EffectConfig } from '../base';
import { createTextEffect, createWatermarkEffect, TextEffectConfig, WatermarkEffectConfig } from '../effects';
import { CanvasRenderer } from '../renderer/CanvasRenderer';

/**
 * エフェクトマネージャー
 * エフェクトのライフサイクルとレンダリングを管理する
 */
export class EffectManager {
  private readonly renderer: CanvasRenderer;
  private readonly effects: Map<string, Effect> = new Map();
  private animationFrameId?: number;
  private startTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new CanvasRenderer(canvas);
  }

  /**
   * エフェクトを作成
   */
  createEffect(config: EffectConfig): Effect {
    if (this.isTextConfig(config)) {
      return createTextEffect(config);
    }
    if (this.isWatermarkConfig(config)) {
      return createWatermarkEffect(config);
    }
    throw new Error(`Unknown effect type: ${config.type}`);
  }

  private isTextConfig(config: EffectConfig): config is TextEffectConfig {
    return config.type === 'text';
  }

  private isWatermarkConfig(config: EffectConfig): config is WatermarkEffectConfig {
    return config.type === 'watermark';
  }

  /**
   * エフェクトを追加
   */
  addEffect(effect: Effect): void {
    const config = effect.getConfig();
    this.effects.set(config.id, effect);
    this.renderer.addEffect(effect);
  }

  /**
   * エフェクトを削除
   */
  removeEffect(id: string): void {
    const effect = this.effects.get(id);
    if (effect) {
      this.renderer.removeEffect(effect);
      this.effects.delete(id);
      effect.dispose();
    }
  }

  /**
   * エフェクトを更新
   */
  updateEffect(id: string, config: Partial<EffectConfig>): void {
    const effect = this.effects.get(id);
    if (effect) {
      effect.updateConfig(config);
    }
  }

  /**
   * オーディオデータを更新
   */
  updateAudioData(data: Float32Array): void {
    this.renderer.updateAudioData(data);
  }

  /**
   * レンダリングを開始
   */
  start(): void {
    this.startTime = performance.now();
    this.animate();
  }

  /**
   * レンダリングを停止
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.effects.clear();
  }

  private animate = (): void => {
    const currentTime = (performance.now() - this.startTime) / 1000;
    this.renderer.render(currentTime);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };
} 