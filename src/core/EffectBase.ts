import { AudioVisualParameters, EffectConfig } from './types';

/**
 * エフェクトの基底クラス
 */
export abstract class EffectBase {
  protected config: EffectConfig;

  constructor(config: EffectConfig) {
    this.config = config;
  }

  /**
   * 設定を取得
   */
  getConfig(): EffectConfig {
    return this.config;
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<EffectConfig>): void {
    this.config = { ...this.config, ...newConfig } as EffectConfig;
  }

  /**
   * 表示状態をチェック
   */
  isVisible(currentTime: number): boolean {
    if (!this.config.visible) return false;
    
    // 開始時間と終了時間が設定されていない場合は常に表示
    if (this.config.startTime === undefined && this.config.endTime === undefined) {
      return true;
    }

    // 開始時間のチェック
    if (this.config.startTime !== undefined && currentTime < this.config.startTime) {
      return false;
    }

    // 終了時間のチェック
    if (this.config.endTime !== undefined && currentTime > this.config.endTime) {
      return false;
    }

    return true;
  }

  /**
   * エフェクトをレンダリング
   */
  abstract render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, params: AudioVisualParameters): void;

  /**
   * エフェクトのz-indexを取得
   */
  getZIndex(): number {
    return this.config.zIndex;
  }
} 