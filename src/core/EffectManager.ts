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
    duration: 0,
    isPlaying: false
  };
  private audioState: AudioPlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isSuspended: false
  };
  private lastRenderTime: number = 0;
  private readonly FRAME_INTERVAL: number = 1000 / 60; // 60fps

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
  public connectAudioService(service: AudioPlaybackService | null): void {
    this.audioService = service;
  }

  /**
   * AudioPlaybackServiceを切断
   */
  public disconnectAudioService(): void {
    this.audioService = null;
  }

  /**
   * レンダリングループの開始
   */
  public startRenderLoop(): void {
    if (this.animationFrameId !== null) return;
    
    const loop = (timestamp: number) => {
      if (!this.audioService) {
        this.stopRenderLoop();
        return;
      }

      // フレームレート制御
      const elapsed = timestamp - this.lastRenderTime;
      if (elapsed < this.FRAME_INTERVAL) {
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }

      try {
        // 音声の状態を取得
        const audioTime = this.audioService.getCurrentTime();
        const duration = this.audioService.getDuration();
        const analyser = this.audioService.getAnalyserNode();

        // パラメータを一括更新
        const params: Partial<AudioVisualParameters> = {
          currentTime: audioTime,
          duration: duration,
          isPlaying: true
        };

        // 波形データがある場合のみ更新
        if (analyser) {
          // メモリ再利用のためのバッファを保持
          if (!this._waveformBuffer || !this._frequencyBuffer) {
            this._waveformBuffer = new Float32Array(analyser.frequencyBinCount);
            this._frequencyBuffer = new Uint8Array(analyser.frequencyBinCount);
          }
          
          analyser.getFloatTimeDomainData(this._waveformBuffer);
          analyser.getByteFrequencyData(this._frequencyBuffer);
          params.waveformData = this._waveformBuffer;
          params.frequencyData = this._frequencyBuffer;
        }

        this.updateParams(params);
        
        // 表示されているエフェクトのみレンダリング
        if (this.hasVisibleEffects(audioTime)) {
          this.render();
        }

        this.lastRenderTime = timestamp;
      } catch (error) {
        console.error('レンダリングループでエラーが発生:', error);
        this.stopRenderLoop();
        return;
      }
      
      this.animationFrameId = requestAnimationFrame(loop);
    };
    
    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * 表示されているエフェクトがあるかチェック
   */
  private hasVisibleEffects(currentTime: number): boolean {
    return Array.from(this.state.effects.values()).some(effect => 
      effect.isVisible(currentTime)
    );
  }

  /**
   * メモリ再利用のためのバッファ
   */
  private _waveformBuffer?: Float32Array;
  private _frequencyBuffer?: Uint8Array;

  /**
   * レンダリングループの停止
   */
  public stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      
      // 停止時のパラメータ更新
      this.updateParams({
        isPlaying: false
      });
      
      // 最後の状態を描画
      this.render();
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
    
    // バッファのクリア
    this._waveformBuffer = undefined;
    this._frequencyBuffer = undefined;
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

  /**
   * 別のマネージャーの状態をコピー
   */
  public copyStateFrom(other: EffectManager): void {
    // エフェクト配列をディープコピー
    this.state.effects = new Map(other.state.effects);
    this.state.effectStates = new Map(other.state.effectStates);
  }

  /**
   * 現在のCanvasを取得
   */
  public getCanvas(): HTMLCanvasElement {
    return this.renderer.getCanvas();
  }

  public getRenderer(): Renderer {
    return this.renderer;
  }
}
