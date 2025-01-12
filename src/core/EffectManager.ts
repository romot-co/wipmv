// EffectManager.ts

import { EffectBase } from './EffectBase';
import { AudioVisualParameters, EffectConfig, Disposable, BaseEffectState } from './types';
import { Renderer } from './Renderer';
import { AudioPlaybackService, AudioPlaybackState } from './AudioPlaybackService';

interface EffectManagerState {
  effects: Map<string, EffectBase>;
  effectStates: Map<string, BaseEffectState>;
}

interface EffectManagerListener {
  onEffectStateChange: (effectId: string, state: BaseEffectState) => void;
  onEffectsChange: (effects: Map<string, EffectBase>) => void;
}

/**
 * エフェクトマネージャー
 * - 複数のエフェクトを管理し、適切なタイミングで描画を行う
 * - エフェクトの状態変更を監視し、リスナーに通知する
 */
export class EffectManager {
  private state: EffectManagerState;
  private listeners: Set<EffectManagerListener> = new Set();
  private renderer: Renderer;
  private audioService: AudioPlaybackService | null = null;
  private animationFrameId: number | null = null;
  private currentParams: AudioVisualParameters = {
    currentTime: 0,
    duration: 0
  };
  private audioState: AudioPlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isSuspended: false
  };

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.state = {
      effects: new Map(),
      effectStates: new Map()
    };
  }

  /**
   * リスナーを追加
   */
  public addListener(listener: EffectManagerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * エフェクト状態の変更を通知
   */
  private notifyStateChange(effectId: string, state: BaseEffectState): void {
    this.state.effectStates.set(effectId, state);
    this.listeners.forEach(listener => {
      listener.onEffectStateChange(effectId, state);
    });
  }

  /**
   * エフェクトリストの変更を通知
   */
  private notifyEffectsChange(): void {
    this.listeners.forEach(listener => {
      listener.onEffectsChange(this.state.effects);
    });
  }

  /**
   * AudioPlaybackServiceを接続
   */
  public connectAudioService(service: AudioPlaybackService): () => void {
    this.audioService = service;
    
    // 状態変更を購読
    const unsubscribe = service.subscribe((state) => {
      this.audioState = state;
      this.handleAudioStateChange(state);
    });
    
    // クリーンアップ関数を返す
    return () => {
      unsubscribe();
      this.stopRenderLoop();
      this.audioService = null;
    };
  }

  /**
   * オーディオ状態変更のハンドラ
   */
  private handleAudioStateChange = (state: AudioPlaybackState): void => {
    this.updateParams({
      currentTime: state.currentTime,
      duration: state.duration
    });

    // 再生状態に応じてレンダリングループを制御
    if (state.isPlaying) {
      this.startRenderLoop();
    } else {
      this.stopRenderLoop();
    }
  };

  /**
   * レンダリングループの開始
   */
  private startRenderLoop(): void {
    // 既存のループを停止
    this.stopRenderLoop();
    
    const loop = () => {
      if (this.audioService && this.audioState.isPlaying) {
        // 波形データの取得と更新
        const analyser = this.audioService.getAnalyserNode();
        if (analyser) {
          try {
            const waveformData = new Float32Array(analyser.frequencyBinCount);
            const frequencyData = new Uint8Array(analyser.frequencyBinCount);
            
            analyser.getFloatTimeDomainData(waveformData);
            analyser.getByteFrequencyData(frequencyData);
            
            this.updateParams({
              waveformData,
              frequencyData
            });
          } catch (error) {
            console.warn('Failed to get audio data:', error);
          }
        }
        
        this.render();
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * レンダリングループの停止
   */
  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * エフェクトを追加
   */
  public addEffect(effect: EffectBase): void {
    const config = effect.getConfig();
    this.state.effects.set(config.id, effect);
    this.state.effectStates.set(config.id, effect.getState());
    
    // エフェクトの状態変更を監視
    effect.addStateListener((state) => {
      this.notifyStateChange(config.id, state);
    });
    
    this.sortEffectsByZIndex();
    this.notifyEffectsChange();
  }

  /**
   * エフェクトを削除
   */
  public removeEffect(effectOrId: EffectBase | string): void {
    const id = typeof effectOrId === 'string' ? effectOrId : effectOrId.getConfig().id;
    const effect = this.state.effects.get(id);
    
    if (effect) {
      if (this.isDisposable(effect)) {
        effect.dispose();
      }
      this.state.effects.delete(id);
      this.state.effectStates.delete(id);
      this.notifyEffectsChange();
    }
  }

  /**
   * エフェクトの設定を更新
   */
  public updateEffect(id: string, newConfig: Partial<EffectConfig>): void {
    const effect = this.state.effects.get(id);
    if (effect) {
      effect.updateConfig(newConfig);
      this.sortEffectsByZIndex();
      this.notifyEffectsChange();
    }
  }

  /**
   * AudioVisualParametersを更新
   */
  public updateParams(params: Partial<AudioVisualParameters>): void {
    this.currentParams = { ...this.currentParams, ...params };
    this.render();
  }

  /**
   * 現在のパラメータを取得
   */
  public getParams(): AudioVisualParameters {
    return this.currentParams;
  }

  /**
   * エフェクトをレンダリング
   */
  public render(): void {
    const ctx = this.renderer.getOffscreenContext();
    this.renderer.clear();

    for (const effect of this.state.effects.values()) {
      effect.render(ctx, this.currentParams);
    }

    this.renderer.drawToMain();
  }

  /**
   * エフェクトをz-indexでソート
   */
  private sortEffectsByZIndex(): void {
    const sortedEffects = new Map(
      [...this.state.effects.entries()].sort(
        (a, b) => a[1].getZIndex() - b[1].getZIndex()
      )
    );
    this.state.effects = sortedEffects;
  }

  /**
   * 全エフェクトを取得
   */
  public getEffects(): EffectBase[] {
    return Array.from(this.state.effects.values());
  }

  /**
   * エフェクトの状態を取得
   */
  public getEffectState(id: string): BaseEffectState | undefined {
    return this.state.effectStates.get(id);
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    this.stopRenderLoop();
    this.state.effects.forEach(effect => {
      if (this.isDisposable(effect)) {
        effect.dispose();
      }
    });
    this.state.effects.clear();
    this.state.effectStates.clear();
  }

  /**
   * エフェクトがDisposableインターフェースを実装しているかチェック
   */
  private isDisposable(effect: unknown): effect is Disposable {
    return (
      typeof effect === 'object' &&
      effect !== null &&
      'dispose' in effect &&
      typeof (effect as Disposable).dispose === 'function'
    );
  }

  /**
   * エフェクトを上に移動（zIndexを上げる）
   */
  public moveEffectUp(id: string): void {
    const effects = Array.from(this.state.effects.entries());
    const index = effects.findIndex(([effectId]) => effectId === id);
    if (index <= 0) return;

    const currentEffect = effects[index][1];
    const upperEffect = effects[index - 1][1];
    
    // zIndexを交換
    const tempZIndex = currentEffect.getConfig().zIndex;
    this.updateEffect(id, { zIndex: upperEffect.getConfig().zIndex });
    this.updateEffect(effects[index - 1][0], { zIndex: tempZIndex });
  }

  /**
   * エフェクトを下に移動（zIndexを下げる）
   */
  public moveEffectDown(id: string): void {
    const effects = Array.from(this.state.effects.entries());
    const index = effects.findIndex(([effectId]) => effectId === id);
    if (index === -1 || index >= effects.length - 1) return;

    const currentEffect = effects[index][1];
    const lowerEffect = effects[index + 1][1];
    
    // zIndexを交換
    const tempZIndex = currentEffect.getConfig().zIndex;
    this.updateEffect(id, { zIndex: lowerEffect.getConfig().zIndex });
    this.updateEffect(effects[index + 1][0], { zIndex: tempZIndex });
  }
}
