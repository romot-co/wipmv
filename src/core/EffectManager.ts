/**
 * EffectManager.ts
 *
 * - 複数のエフェクトを管理し、z-index順にソートして描画する
 * - エフェクトの追加/削除/更新/moveUp/moveDownなど既存の機能を保持
 * - 自前の requestAnimationFrame ループを持ち、AudioPlaybackServiceから
 *   再生中かどうか・currentTime・waveformData等を取得し、render()を呼ぶ
 *
 * なお: "Renderer.ts" などに描画用ロジックを分ける場合もありますが、
 * ここでは 1つのCanvasに対して contextを取得する簡易例で示しています。
 */

import { EffectBase } from './EffectBase';
import { Renderer } from './Renderer';
import { AudioVisualParameters, EffectConfig, Disposable, BaseEffectState } from './types';
import { AudioPlaybackService } from './AudioPlaybackService';

interface EffectManagerState {
  effects: Map<string, EffectBase>;
  effectStates: Map<string, BaseEffectState>;
}

export class EffectManager {
  private state: EffectManagerState;
  private audioService: AudioPlaybackService | null = null;

  // requestAnimationFrame制御用ID
  private animationFrameId: number | null = null;

  // Canvas / Context
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private ctx: CanvasRenderingContext2D;

  private currentParams: AudioVisualParameters = {
    currentTime: 0,
    duration: 0,
    isPlaying: false
  };
  // 波形や周波数データは params.waveformData / frequencyData に入れてもOK
  
  // FPS制御やログ用
  private lastRenderTime = 0;
  private readonly FRAME_INTERVAL = 1000 / 60; // 60fps

  constructor(renderer: Renderer) {
    this.renderer = renderer;
    this.canvas = renderer.getCanvas();
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error("Failed to get 2D rendering context for EffectManager");
    }
    this.ctx = ctx;

    this.state = {
      effects: new Map(),
      effectStates: new Map()
    };
  }

  public getRenderer(): Renderer {
    return this.renderer;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * AudioServiceを接続
   */
  public connectAudioService(service: AudioPlaybackService): void {
    this.audioService = service;
  }

  /**
   * エフェクトを追加
   */
  public addEffect(effect: EffectBase): void {
    const config = effect.getConfig();
    this.state.effects.set(config.id, effect);
    this.state.effectStates.set(config.id, effect.getState());
    this.sortEffectsByZIndex();
    this.render(); // 追加直後に一度描画
  }

  /**
   * エフェクトを削除
   */
  public removeEffect(effectOrId: EffectBase | string): void {
    const id = typeof effectOrId === 'string' ? effectOrId : effectOrId.getConfig().id;
    const effect = this.state.effects.get(id);
    if (effect) {
      // Disposableならdispose呼ぶ
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
   * zIndex順でソート
   */
  private sortEffectsByZIndex(): void {
    const sorted = [...this.state.effects.entries()].sort(
      (a, b) => a[1].getZIndex() - b[1].getZIndex()
    );
    this.state.effects = new Map(sorted);
  }

  /**
   * エフェクトを上に移動(zIndexを上げる)
   */
  public moveEffectUp(id: string): void {
    const effectsArray = Array.from(this.state.effects.values());
    const index = effectsArray.findIndex(e => e.getConfig().id === id);
    if (index <= 0) return;

    const current = effectsArray[index];
    const upper = effectsArray[index - 1];

    const tempZ = current.getConfig().zIndex;
    current.updateConfig({ zIndex: upper.getConfig().zIndex });
    upper.updateConfig({ zIndex: tempZ });

    this.sortEffectsByZIndex();
    this.render();
  }

  /**
   * エフェクトを下に移動(zIndexを下げる)
   */
  public moveEffectDown(id: string): void {
    const effectsArray = Array.from(this.state.effects.values());
    const index = effectsArray.findIndex(e => e.getConfig().id === id);
    if (index === -1 || index >= effectsArray.length - 1) return;

    const current = effectsArray[index];
    const lower = effectsArray[index + 1];

    const tempZ = current.getConfig().zIndex;
    current.updateConfig({ zIndex: lower.getConfig().zIndex });
    lower.updateConfig({ zIndex: tempZ });

    this.sortEffectsByZIndex();
    this.render();
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

  public dispose(): void {
    this.stopRenderLoop();
    this.state.effects.clear();
    this.state.effectStates.clear();
  }

  /**
   * エフェクトがDisposableか判定
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
   * managerの内部パラメータをupdate
   */
  public updateParams(params: Partial<AudioVisualParameters>): void {
    this.currentParams = { ...this.currentParams, ...params };
  }

  /**
   * レンダリングループ開始
   * - requestAnimationFrameを使って描画し続ける
   */
  public startRenderLoop(): void {
    if (this.animationFrameId != null) return; // 重複開始防止

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
      this.lastRenderTime = timestamp;

      // 音声が再生中のみリアルタイム更新
      if (this.audioService.isPlaying()) {
        const t = this.audioService.getCurrentTime();
        const dur = this.audioService.getDuration();

        // 必要に応じて wave/freqデータを取得
        const waveform = this.audioService.getWaveformData();
        // const freq = this.audioService.getFrequencyData(); // 使いたければ

        // manager内部パラメータを更新
        this.updateParams({
          currentTime: t,
          duration: dur,
          isPlaying: true,
          waveformData: waveform
        });

        // render
        this.render();
      } else {
        // 再生中でないなら "isPlaying: false" をセット、必要なら1回だけ描画して止めてもOK
        this.updateParams({
          isPlaying: false
        });
        // 要件に応じて、停止中も描画したい場合は this.render() を呼んでも可
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * レンダリングループ停止
   */
  public stopRenderLoop(): void {
    if (this.animationFrameId != null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  /**
   * メインのrender処理
   */
  public render(): void {
    const ctx = this.ctx;
    const { currentTime, duration, isPlaying, waveformData } = this.currentParams;

    // キャンバスクリア
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // zIndex順にエフェクト描画
    const effectList = [...this.state.effects.values()];
    for (const effect of effectList) {
      // 表示中かどうか / 時間内かどうか など effect内で判断
      effect.render(ctx, {
        currentTime,
        duration,
        isPlaying,
        waveformData
      });
    }
  }
}