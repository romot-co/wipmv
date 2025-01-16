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

  private lastPlaybackState = {
    currentTime: 0,
    isPlaying: false
  };

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
    
    // 既に同じサービスが接続されている場合は何もしない
    if (this.audioService === service) {
      console.log('AudioServiceは既に接続済みです');
      return;
    }
    
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

    // レンダリングループが停止している場合は再開
    if (this.animationFrameId === null) {
      this.startRenderLoop();
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

    // 波形データと周波数データを適切な形式に変換
    const updatedParams = {
      ...this.currentParams,
      ...params,
      waveformData: params.waveformData ?? this.currentParams.waveformData,
      frequencyData: params.frequencyData ?? this.currentParams.frequencyData
    };

    this.currentParams = updatedParams;
    this.render();
  }

  public startRenderLoop(): void {
    if (this.isDisposed || this.animationFrameId !== null) return;

    const loop = (): void => {
      if (this.isDisposed) return;

      const now = performance.now();
      const elapsed = now - this.lastRenderTime;

      if (elapsed >= this.FRAME_INTERVAL) {
        // パラメータの更新
        if (this.audioService) {
          const playbackState = this.audioService.getPlaybackState();
          const audioSource = this.audioService.getAudioSource();

          // 再生状態が変化した場合、または再生中の場合のみ更新
          const shouldUpdate = 
            playbackState.isPlaying !== this.lastPlaybackState.isPlaying ||
            playbackState.currentTime !== this.lastPlaybackState.currentTime ||
            playbackState.isPlaying;

          if (shouldUpdate && audioSource) {
            console.log('オーディオ更新チェック:', {
              currentTime: playbackState.currentTime,
              isPlaying: playbackState.isPlaying,
              hasAudioSource: !!audioSource,
              sourceInfo: {
                duration: audioSource.duration,
                sampleRate: audioSource.sampleRate,
                hasWaveformData: !!audioSource.waveformData,
                waveformChannels: audioSource.waveformData?.length,
                waveformLength: audioSource.waveformData?.[0]?.length,
                hasFrequencyData: !!audioSource.frequencyData,
                frequencyChannels: audioSource.frequencyData?.length,
                frequencyLength: audioSource.frequencyData?.[0]?.length
              }
            });

            // 波形データと周波数データの取得
            const totalFrames = Math.floor(audioSource.duration * 60); // 全フレーム数
            const currentFrameIndex = Math.floor((playbackState.currentTime / audioSource.duration) * totalFrames);
            
            // 表示用のウィンドウサイズ（フレーム数）
            const windowSizeInFrames = 12; // 0.2秒分 = 12フレーム
            
            let waveformData: Float32Array[] | null = null;
            let frequencyData: Uint8Array[] | null = null;

            if (audioSource.waveformData?.[0] && currentFrameIndex < audioSource.waveformData[0].length) {
              waveformData = audioSource.waveformData.map(channel => {
                const startIndex = Math.max(0, currentFrameIndex);
                const endIndex = Math.min(channel.length, startIndex + windowSizeInFrames);
                return channel.slice(startIndex, endIndex);
              });

              console.log('波形データ取得:', {
                currentTime: playbackState.currentTime,
                duration: audioSource.duration,
                totalFrames,
                currentFrameIndex,
                windowSizeInFrames,
                startIndex: Math.max(0, currentFrameIndex),
                endIndex: Math.min(audioSource.waveformData[0].length, currentFrameIndex + windowSizeInFrames),
                dataLength: waveformData[0].length,
                firstValue: waveformData[0][0],
                lastValue: waveformData[0][waveformData[0].length - 1],
                progress: (playbackState.currentTime / audioSource.duration) * 100
              });
            } else {
              console.warn('波形データ取得失敗:', {
                hasWaveformData: !!audioSource.waveformData,
                currentFrameIndex,
                maxLength: audioSource.waveformData?.[0]?.length,
                currentTime: playbackState.currentTime,
                duration: audioSource.duration,
                progress: (playbackState.currentTime / audioSource.duration) * 100
              });
            }

            if (audioSource.frequencyData?.[0] && currentFrameIndex < audioSource.frequencyData[0].length) {
              frequencyData = audioSource.frequencyData.map(channel => {
                const startIndex = Math.max(0, currentFrameIndex);
                const endIndex = Math.min(channel.length, startIndex + windowSizeInFrames);
                return channel.slice(startIndex, endIndex);
              });
            }

            this.currentParams = {
              currentTime: playbackState.currentTime,
              duration: playbackState.duration,
              isPlaying: playbackState.isPlaying,
              waveformData,
              frequencyData
            };

            console.log('パラメータ更新:', {
              currentTime: this.currentParams.currentTime,
              duration: audioSource.duration,
              progress: (this.currentParams.currentTime / audioSource.duration) * 100,
              isPlaying: this.currentParams.isPlaying,
              hasWaveformData: !!this.currentParams.waveformData,
              waveformLength: this.currentParams.waveformData?.[0]?.length,
              hasFrequencyData: !!this.currentParams.frequencyData,
              frequencyLength: this.currentParams.frequencyData?.[0]?.length
            });

            // 状態を保存
            this.lastPlaybackState = {
              currentTime: playbackState.currentTime,
              isPlaying: playbackState.isPlaying
            };

            // 強制的に1回描画を実行
            this.render();
          }
          
          this.lastRenderTime = now;
        }
      }

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

    // すべてのエフェクトを描画
    const effects = Array.from(this.effects.values());
    
    console.log('レンダリング:', {
      effectCount: effects.length,
      effects: effects.map(e => ({
        id: e.getConfig().id,
        type: e.getConfig().type,
        zIndex: e.getZIndex()
      })),
      currentTime: this.currentParams.currentTime,
      hasWaveformData: !!this.currentParams.waveformData,
      hasFrequencyData: !!this.currentParams.frequencyData,
      waveformDataType: this.currentParams.waveformData?.constructor.name,
      frequencyDataType: this.currentParams.frequencyData?.constructor.name,
      canvasSize: {
        width: this.canvas.width,
        height: this.canvas.height
      }
    });

    for (const effect of effects) {
      try {
        console.log('エフェクト描画開始:', {
          id: effect.getConfig().id,
          type: effect.getConfig().type,
          config: effect.getConfig()
        });
        
        effect.render(this.ctx, this.currentParams);
        
        console.log('エフェクト描画完了:', {
          id: effect.getConfig().id,
          type: effect.getConfig().type
        });
      } catch (error) {
        console.error('エフェクトの描画エラー:', {
          id: effect.getConfig().id,
          type: effect.getConfig().type,
          error
        });
      }
    }
  }

  private hasSetAudioSource(effect: unknown): effect is WithAudioSource {
    return typeof (effect as WithAudioSource).setAudioSource === 'function';
  }

  private hasImageLoadCallback(effect: unknown): effect is WithImageLoadCallback {
    return typeof (effect as WithImageLoadCallback).setOnImageLoadCallback === 'function';
  }

  /**
   * エフェクトを指定位置に移動
   */
  public moveEffect(fromIndex: number, toIndex: number): void {
    if (this.isDisposed) return;

    const effects = Array.from(this.effects.values());
    if (
      fromIndex < 0 || 
      fromIndex >= effects.length || 
      toIndex < 0 || 
      toIndex >= effects.length || 
      fromIndex === toIndex
    ) {
      return;
    }

    // 移動元と移動先のエフェクトを取得
    const effect = effects[fromIndex];
    const targetZIndex = effects[toIndex].getZIndex();

    // 移動方向に応じてz-indexを更新
    if (fromIndex < toIndex) {
      // 下に移動する場合
      for (let i = fromIndex; i < toIndex; i++) {
        const current = effects[i];
        const next = effects[i + 1];
        current.updateConfig({ zIndex: next.getZIndex() });
      }
    } else {
      // 上に移動する場合
      for (let i = fromIndex; i > toIndex; i--) {
        const current = effects[i];
        const prev = effects[i - 1];
        current.updateConfig({ zIndex: prev.getZIndex() });
      }
    }

    // 移動対象のエフェクトを目的の位置に配置
    effect.updateConfig({ zIndex: targetZIndex });

    this.sortEffectsByZIndex();
    this.render();
  }
}