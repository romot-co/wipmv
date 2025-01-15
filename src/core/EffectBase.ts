import { 
  EffectConfig, 
  AudioVisualParameters, 
  AppError, 
  ErrorType,
  BaseAnimation,
} from './types';

/**
 * エフェクトの基底抽象クラス
 * - 設定値の管理
 * - 表示/非表示の制御
 * - レイヤー順の管理
 * - アニメーション制御
 * を担当
 */
export abstract class EffectBase<T extends EffectConfig = EffectConfig> {
  protected config: T;
  private animationStartTime: number | null = null;

  constructor(config: T) {
    // 必須項目のバリデーション
    if (!config.type) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Effect type is required'
      );
    }

    // デフォルト値の設定
    this.config = {
      ...config,
      startTime: config.startTime ?? 0,
      endTime: config.endTime ?? Infinity,
      zIndex: config.zIndex ?? 0,
      visible: config.visible ?? true,
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    };
  }

  /**
   * 設定を取得
   */
  public getConfig(): T {
    return this.config;
  }

  /**
   * 設定を更新
   */
  public updateConfig(newConfig: Partial<T>): void {
    // 型の変更は禁止
    if (newConfig.type && newConfig.type !== this.config.type) {
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        'Cannot change effect type'
      );
    }
    
    // 設定を更新
    const oldConfig = this.config;
    this.config = {
      ...this.config,
      ...newConfig
    };

    // 派生クラスで必要な処理を実行
    this.onConfigUpdate(oldConfig, this.config);
  }

  /**
   * 設定更新時のフック
   * - 派生クラスでオーバーライドして必要な処理を実装
   */
  protected onConfigUpdate(oldConfig: T, newConfig: T): void {
    // デフォルトは何もしない
    console.log('onConfigUpdate', oldConfig, newConfig);
  }

  /**
   * 指定時刻で表示すべきかどうかを判定
   */
  public isVisible(currentTime: number): boolean {
    return (
      (this.config.visible ?? true) &&
      currentTime >= (this.config.startTime ?? 0) &&
      currentTime <= (this.config.endTime ?? Infinity)
    );
  }

  /**
   * レイヤー順を取得
   */
  public getZIndex(): number {
    return this.config.zIndex ?? 0;
  }

  /**
   * アニメーションの進行度を計算
   */
  protected getAnimationProgress(
    currentTime: number,
    animation: BaseAnimation
  ): number {
    if (this.animationStartTime === null) {
      this.animationStartTime = currentTime;
    }

    const elapsed = currentTime - this.animationStartTime;
    const delay = animation.delay ?? 0;
    
    if (elapsed < delay) return 0;
    if (elapsed >= delay + animation.duration) return 1;

    const progress = (elapsed - delay) / animation.duration;
    
    // イージング関数の適用
    switch (animation.easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - (1 - progress) * (1 - progress);
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress; // linear
    }
  }

  /**
   * エフェクトを描画
   * - 派生クラスで実装必須
   */
  public abstract render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void;

  /**
   * リソースを解放
   * - 派生クラスで必要に応じてオーバーライド
   */
  public dispose(): void {
    this.animationStartTime = null;
  }
} 