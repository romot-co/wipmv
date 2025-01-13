// EffectManager.ts

import { EffectBase } from './EffectBase';
import { AudioVisualParameters, EffectConfig, Disposable, BaseEffectState } from './types';
import { Renderer } from './Renderer';
import { AudioPlaybackService, AudioPlaybackState } from './AudioPlaybackService';

interface EffectManagerState {
  effects: Map<string, EffectBase>;
  effectStates: Map<string, BaseEffectState>;
}

/**
 * エフェクトマネージャー
 * - 複数のエフェクトを管理し、適切なタイミングで描画を行う
 * - エフェクトの状態変更を監視し、リスナーに通知する
 */
export class EffectManager {
  private state: EffectManagerState;
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
   * エフェクトを追加
   */
  public addEffect(effect: EffectBase): void {
    console.log('EffectManager.addEffect - 開始:', effect);
    const config = effect.getConfig();
    this.state.effects.set(config.id, effect);
    this.state.effectStates.set(config.id, effect.getState());
    
    this.sortEffectsByZIndex();
    this.render();
    console.log('EffectManager.addEffect - 完了。現在のエフェクト:', this.state.effects);
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
      this.render();
    }
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
   * AudioPlaybackServiceを接続
   */
  public connectAudioService(service: AudioPlaybackService): void {
    this.audioService = service;
  }

  /**
   * レンダリングループの開始
   */
  public startRenderLoop(): void {
    // 既存のループを停止
    this.stopRenderLoop();
    
    const loop = () => {
      if (this.audioService) {
        // 現在時刻を取得して更新
        const audioTime = this.audioService.getCurrentTime();
        const duration = this.audioService.getDuration();
        
        // パラメータを更新
        this.updateParams({
          currentTime: audioTime,
          duration: duration
        });

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
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * レンダリングループの停止
   */
  public stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
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
      this.render();
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

    console.log('EffectManager: Starting render with params', {
      currentTime: this.currentParams.currentTime,
      hasWaveformData: !!this.currentParams.waveformData,
      hasFrequencyData: !!this.currentParams.frequencyData,
      effectsCount: this.state.effects.size
    });

    if (this.currentParams.waveformData) {
      console.log('EffectManager: Waveform data details', {
        length: this.currentParams.waveformData.length,
        sampleValues: this.currentParams.waveformData.slice(0, 5)
      });
    }

    // エフェクトをz-indexでソート
    const sortedEffects = Array.from(this.state.effects.values())
      .sort((a, b) => a.getZIndex() - b.getZIndex());

    // 各エフェクトを描画
    for (const effect of sortedEffects) {
      const config = effect.getConfig();
      console.log('EffectManager: Rendering effect', {
        id: config.id,
        type: config.type,
        isVisible: effect.isVisible(this.currentParams.currentTime)
      });

      // 表示チェック
      if (!effect.isVisible(this.currentParams.currentTime)) {
        console.log('EffectManager: Effect is not visible at current time', this.currentParams.currentTime);
        continue;
      }

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
