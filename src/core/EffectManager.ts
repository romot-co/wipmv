/**
 * EffectManager.ts
 *
 * - 複数のエフェクトを管理し、z-index順にソートして描画する
 * - エフェクトの追加/削除/更新/moveUp/moveDownなど既存の機能を保持
 * - 自前の requestAnimationFrame ループを持ち、AudioPlaybackServiceから
 *   再生中かどうか・currentTime等を取得し、render()を呼ぶ
 */

import { Renderer } from './Renderer';
import { EffectBase } from './EffectBase';
import { AudioPlaybackService } from './AudioPlaybackService';
import { AudioVisualParameters, AudioSource, EffectConfig, AppError, ErrorType } from './types';

// インターフェース定義
interface Disposable {
  dispose: () => void;
}

interface WithAudioSource {
  setAudioSource: (source: AudioSource) => void;
}

interface WithImageLoadCallback {
  setOnImageLoadCallback: (callback: () => void) => void;
}

/**
 * エフェクトの描画と管理を担当するクラス
 */
export class EffectManager {
  private readonly renderer: Renderer;
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private effects: Map<string, EffectBase> = new Map();
  private audioService: AudioPlaybackService | null = null;
  private isDisposed = false;
  private animationFrameId: number | null = null;
  private lastRenderTime = 0;
  private currentParams: AudioVisualParameters = {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    waveformData: null,
    frequencyData: null
  };

  private readonly FRAME_INTERVAL = 1000 / 60; // 60fps

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.canvas = renderer.getCanvas();
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to get canvas context'
      );
    }
    this.ctx = ctx;
  }

  public getRenderer(): Renderer {
    return this.renderer;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public connectAudioService(service: AudioPlaybackService): void {
    if (this.isDisposed) return;
    
    this.audioService = service;
    
    // AudioSourceを持つエフェクトに対して、音声データを設定
    const audioSource = service.getAudioSource();
    if (audioSource) {
      console.log('オーディオソースを設定:', {
        duration: audioSource.duration,
        sampleRate: audioSource.sampleRate,
        numberOfChannels: audioSource.numberOfChannels,
        hasWaveformData: !!audioSource.waveformData,
        hasFrequencyData: !!audioSource.frequencyData
      });

      for (const effect of this.effects.values()) {
        if (this.hasSetAudioSource(effect)) {
          console.log(`エフェクトにオーディオソースを設定: ${effect.getConfig().id}`);
          effect.setAudioSource(audioSource);
        }
      }
    } else {
      console.warn('オーディオソースが未設定');
    }
  }

  public addEffect(effect: EffectBase): void {
    if (this.isDisposed) return;

    const config = effect.getConfig();
    if (this.effects.has(config.id)) {
      throw new AppError(
        ErrorType.EffectAlreadyExists,
        `Effect with id ${config.id} already exists`
      );
    }

    // AudioSourceが必要なエフェクトの場合は設定
    if (this.hasSetAudioSource(effect) && this.audioService?.getAudioSource()) {
      effect.setAudioSource(this.audioService.getAudioSource()!);
    }

    // 画像ロードコールバックが必要なエフェクトの場合は設定
    if (this.hasImageLoadCallback(effect)) {
      effect.setOnImageLoadCallback(() => this.render());
    }

    this.effects.set(config.id, effect);
    this.sortEffectsByZIndex();
  }

  public removeEffect(effectOrId: EffectBase | string): void {
    if (this.isDisposed) return;

    const id = typeof effectOrId === 'string' ? effectOrId : effectOrId.getConfig().id;
    const effect = this.effects.get(id);
    
    if (effect) {
      if (this.isDisposable(effect)) {
        effect.dispose();
      }
      this.effects.delete(id);
    }
  }

  public getEffects(): EffectBase[] {
    return Array.from(this.effects.values());
  }

  private sortEffectsByZIndex(): void {
    const sorted = Array.from(this.effects.entries()).sort(
      ([, a], [, b]) => a.getZIndex() - b.getZIndex()
    );
    this.effects = new Map(sorted);
  }

  public moveEffectUp(id: string): void {
    if (this.isDisposed) return;

    const effects = Array.from(this.effects.values());
    const index = effects.findIndex(e => e.getConfig().id === id);
    if (index === -1 || index === effects.length - 1) return;

    const current = effects[index];
    const next = effects[index + 1];
    const currentZIndex = current.getZIndex();
    const nextZIndex = next.getZIndex();

    current.updateConfig({ zIndex: nextZIndex });
    next.updateConfig({ zIndex: currentZIndex });

    this.sortEffectsByZIndex();
    this.render();
  }

  public moveEffectDown(id: string): void {
    if (this.isDisposed) return;

    const effects = Array.from(this.effects.values());
    const index = effects.findIndex(e => e.getConfig().id === id);
    if (index === -1 || index === 0) return;

    const current = effects[index];
    const prev = effects[index - 1];
    const currentZIndex = current.getZIndex();
    const prevZIndex = prev.getZIndex();

    current.updateConfig({ zIndex: prevZIndex });
    prev.updateConfig({ zIndex: currentZIndex });

    this.sortEffectsByZIndex();
    this.render();
  }

  public updateEffect<T extends EffectConfig>(id: string, newConfig: Partial<T>): void {
    if (this.isDisposed) return;

    const effect = this.effects.get(id);
    if (!effect) {
      throw new AppError(
        ErrorType.EffectNotFound,
        `Effect with id ${id} not found`
      );
    }

    effect.updateConfig(newConfig);
    this.sortEffectsByZIndex();
    this.render();
  }

  public dispose(): void {
    if (this.isDisposed) return;
    
    this.stopRenderLoop();
    
    for (const effect of this.effects.values()) {
      if (this.isDisposable(effect)) {
        effect.dispose();
      }
    }
    
    this.effects.clear();
    this.audioService = null;
    this.isDisposed = true;
  }

  private isDisposable(effect: unknown): effect is Disposable {
    return typeof (effect as Disposable).dispose === 'function';
  }

  public updateParams(params: Partial<AudioVisualParameters>): void {
    if (this.isDisposed) return;

    this.currentParams = { ...this.currentParams, ...params };
    this.render();
  }

  public startRenderLoop(): void {
    if (this.isDisposed || this.animationFrameId !== null) return;

    const loop = (): void => {
      if (this.isDisposed || !this.audioService) return;

      const now = performance.now();
      const elapsed = now - this.lastRenderTime;

      // フレームレート制御
      if (elapsed >= this.FRAME_INTERVAL) {
        // オーディオパラメータの更新
        const playbackState = this.audioService.getPlaybackState();
        const audioSource = this.audioService.getAudioSource();

        this.currentParams = {
          currentTime: playbackState.currentTime,
          duration: playbackState.duration,
          isPlaying: playbackState.isPlaying,
          waveformData: audioSource?.waveformData?.[0] ?? null,
          frequencyData: audioSource?.frequencyData?.[0] ? new Uint8Array(Array.from(audioSource.frequencyData[0], v => Math.min(255, Math.floor(Number(v) * 255)))) : null,
        };

        // 描画の実行
        this.render();
        this.lastRenderTime = now;
      }

      // 次のフレームをリクエスト
      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  public stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public render(): void {
    if (this.isDisposed) return;

    // キャンバスをクリア
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 現在時刻に応じて表示すべきエフェクトのみを描画
    for (const effect of this.effects.values()) {
      if (effect.isVisible(this.currentParams.currentTime)) {
        effect.render(this.ctx, this.currentParams);
      }
    }
  }

  private hasSetAudioSource(effect: unknown): effect is WithAudioSource {
    return typeof (effect as WithAudioSource).setAudioSource === 'function';
  }

  private hasImageLoadCallback(effect: unknown): effect is WithImageLoadCallback {
    return typeof (effect as WithImageLoadCallback).setOnImageLoadCallback === 'function';
  }
}