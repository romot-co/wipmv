import { BaseEffectConfig } from './types';

/**
 * エフェクトの基底クラス
 * - 全エフェクトの共通インターフェースを定義
 * - 更新と描画のライフサイクルを規定
 */
export abstract class EffectBase<T extends BaseEffectConfig = BaseEffectConfig> {
  protected config: T;

  constructor(config: T) {
    this.config = config;
  }

  /**
   * エフェクトのIDを取得
   */
  getId(): string {
    return this.config.id;
  }

  /**
   * エフェクトの設定を取得
   */
  getConfig(): T {
    return this.config;
  }

  /**
   * エフェクトの設定を更新
   */
  updateConfig(newConfig: Partial<T>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * エフェクトが指定時刻でアクティブかどうか
   */
  isActive(currentTime: number): boolean {
    const { startTime = 0, endTime = Infinity } = this.config;
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  abstract update(currentTime: number): void;

  /**
   * キャンバスに描画
   */
  abstract render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;

  /**
   * リソースの解放
   */
  dispose(): void {
    // 継承先で必要に応じてオーバーライド
  }
} 