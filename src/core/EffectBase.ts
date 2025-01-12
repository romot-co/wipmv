import { BaseEffectConfig, AudioVisualParameters, Disposable } from './types';

export interface BaseEffectState {
  isReady: boolean;
  isLoading: boolean;
  error: Error | null;
}

export type EffectStateListener = (state: BaseEffectState) => void;

/**
 * エフェクトの基底クラス
 * 全てのエフェクトはこのクラスを継承する
 * @template TState エフェクト固有の状態型
 */
export abstract class EffectBase<TState extends BaseEffectState = BaseEffectState> implements Disposable {
  protected config: BaseEffectConfig;
  private stateListeners: Set<EffectStateListener> = new Set();
  protected state: TState;
  private isDisposed = false;

  constructor(config: BaseEffectConfig, initialState: TState) {
    this.config = config;
    this.state = initialState;
  }

  /**
   * 設定を取得
   */
  getConfig(): BaseEffectConfig {
    return this.config;
  }

  /**
   * z-indexを取得
   */
  getZIndex(): number {
    return this.config.zIndex;
  }

  /**
   * リソースを解放する
   * - リスナーの解除
   * - 状態のリセット
   * - サブクラス固有のリソース解放
   */
  dispose(): void {
    if (this.isDisposed) return;

    // リスナーの解除
    this.stateListeners.clear();

    // 状態のリセット
    this.updateState({
      isReady: false,
      isLoading: false,
      error: null
    } as Partial<TState>);

    // サブクラス固有のリソース解放
    this.disposeResources();

    this.isDisposed = true;
  }

  /**
   * サブクラスで固有のリソース解放処理を実装
   */
  protected abstract disposeResources(): void;

  /**
   * 破棄済みかどうかをチェック
   */
  protected checkDisposed(): void {
    if (this.isDisposed) {
      throw new Error('このエフェクトは既に破棄されています');
    }
  }

  /**
   * 状態変更リスナーを登録する
   */
  addStateListener(listener: EffectStateListener): () => void {
    this.checkDisposed();
    this.stateListeners.add(listener);
    // 現在の状態を即時通知
    listener(this.state);
    
    // クリーンアップ関数を返す
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * 状態を更新する
   */
  protected updateState(newState: Partial<TState>): void {
    this.checkDisposed();
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  /**
   * 状態変更を通知する
   */
  private notifyStateChange(): void {
    this.stateListeners.forEach(listener => listener(this.state));
  }

  /**
   * エフェクトの設定を更新する
   * @param newConfig 新しい設定（部分的）
   * @param batch バッチ更新モード（複数の更新をまとめて行う場合）
   */
  updateConfig(newConfig: Partial<BaseEffectConfig>, batch = false): void {
    this.checkDisposed();

    // 変更前の値を保存
    const oldConfig = { ...this.config };

    // 設定を更新
    this.config = { ...this.config, ...newConfig };

    // 変更の影響を分析
    const changes = this.analyzeConfigChanges(oldConfig, this.config);

    // 状態の更新が必要な場合のみ更新
    if (changes.requiresStateUpdate && !batch) {
      this.handleConfigChange(changes);
    }
  }

  /**
   * 設定変更の影響を分析
   */
  protected analyzeConfigChanges(oldConfig: BaseEffectConfig, newConfig: BaseEffectConfig) {
    return {
      // 表示/非表示の変更
      visibilityChanged: oldConfig.visible !== newConfig.visible,
      
      // タイミングの変更
      timingChanged: 
        oldConfig.startTime !== newConfig.startTime ||
        oldConfig.endTime !== newConfig.endTime ||
        oldConfig.duration !== newConfig.duration,
      
      // レイヤー順の変更
      zIndexChanged: oldConfig.zIndex !== newConfig.zIndex,
      
      // 状態の更新が必要かどうか
      requiresStateUpdate:
        oldConfig.visible !== newConfig.visible ||
        oldConfig.startTime !== newConfig.startTime ||
        oldConfig.endTime !== newConfig.endTime ||
        oldConfig.duration !== newConfig.duration
    };
  }

  /**
   * 設定変更に応じた処理を実行
   */
  protected abstract handleConfigChange(
    changes: ReturnType<typeof this.analyzeConfigChanges>
  ): void;

  /**
   * 指定された時間にエフェクトが表示されるべきかを判定する
   */
  protected isVisible(currentTime: number): boolean {
    const { startTime = 0, duration } = this.config;
    if (duration === undefined) return true;
    return currentTime >= startTime && currentTime < startTime + duration;
  }

  /**
   * エフェクトを描画する
   */
  abstract render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void;

  /**
   * 状態を取得
   */
  public getState(): TState {
    return this.state;
  }
} 