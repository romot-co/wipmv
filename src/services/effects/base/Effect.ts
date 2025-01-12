import { BaseEffectConfig, EffectType } from '../../../types/effects/base';
import { Node } from './Node';
import { AudioVisualParameters } from '../../../types/audio';

/**
 * エフェクトの基底クラス
 * 複数のノードを組み合わせて高レベルの機能を提供する
 */
export abstract class Effect {
  protected config: BaseEffectConfig;
  protected rootNode?: Node;

  constructor(config: BaseEffectConfig) {
    this.config = config;
  }

  /**
   * エフェクトの種類を取得
   */
  getType(): EffectType {
    return this.config.type;
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): BaseEffectConfig {
    return this.config;
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<BaseEffectConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
    };
  }

  /**
   * エフェクトを描画
   */
  abstract render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void;

  /**
   * リソースを解放
   */
  dispose(): void {
    this.rootNode?.dispose();
  }

  /**
   * エフェクトが表示可能かどうかを判定
   */
  protected isVisible(currentTime: number): boolean {
    if (!this.config.visible) {
      return false;
    }

    const { startTime, endTime } = this.config;
    if (startTime === undefined || endTime === undefined) {
      return true;
    }
    return currentTime >= startTime && currentTime <= endTime;
  }
} 