/**
 * エフェクトマネージャー
 * 
 * - 複数のエフェクトを管理し、z-index順にソートして描画
 * - エフェクトの追加/削除/更新を一元管理
 * - プレビュー時はrequestAnimationFrameでレンダリングループを実行
 * - エンコード時は単一フレーム単位で描画を実行
 * - AudioPlaybackServiceと連携して再生時間に応じた描画を実現
 * - キャンバスサイズ変更時に全エフェクトの座標とサイズを更新
 */

import { EffectBase } from './EffectBase';
import { EffectConfig } from './types';
import { AppError, ErrorType } from './types';
import { AudioPlaybackService } from './AudioPlaybackService';
import { Renderer } from './Renderer';
import { updateRectForResize } from '../utils/coordinates';

/**
 * エフェクトマネージャー
 * - エフェクトの追加・削除・更新・描画を一元管理
 * - zIndexによる描画順序の制御
 * - プレビューとエンコードで共通のロジックを提供
 */
export class EffectManager {
  private effects: EffectBase<EffectConfig>[] = [];
  private needsSort: boolean = false;
  private isRendering: boolean = false;
  private rafId: number | null = null;
  private audioService: AudioPlaybackService | null = null;
  private renderer: Renderer | null = null;
  private lastCanvasSize: { width: number; height: number } | null = null;

  /**
   * プレビュー用キャンバスを設定
   */
  setPreviewCanvas(canvas: HTMLCanvasElement): void {
    try {
      this.renderer = new Renderer(canvas);
      this.lastCanvasSize = this.renderer.getSize();
    } catch (error) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Failed to initialize renderer',
        error
      );
    }
  }

  /**
   * AudioPlaybackServiceを設定
   */
  setAudioService(service: AudioPlaybackService): void {
    this.audioService = service;
  }

  /**
   * プレビューのレンダリングループを開始
   */
  startPreviewLoop(): void {
    if (this.isRendering || !this.renderer) return;
    this.isRendering = true;

    const renderFrame = () => {
      if (!this.isRendering || !this.renderer) {
        this.stopPreviewLoop();
        return;
      }

      // キャンバスサイズの変更を検知
      const currentSize = this.renderer.getSize();
      if (this.lastCanvasSize && (
        currentSize.width !== this.lastCanvasSize.width ||
        currentSize.height !== this.lastCanvasSize.height
      )) {
        this.handleCanvasResize(this.lastCanvasSize, currentSize);
        this.lastCanvasSize = currentSize;
      }

      // 現在時刻を取得
      const currentTime = this.audioService?.getCurrentTime() ?? 0;

      // オフスクリーンコンテキストを取得
      const ctx = this.renderer.getOffscreenContext();

      // キャンバスをクリア
      this.renderer.clear();

      // エフェクトの更新と描画
      this.updateAll(currentTime);
      this.renderAll(ctx);

      // オフスクリーンの内容をメインキャンバスに転送
      this.renderer.drawToMain();

      // 次のフレームをリクエスト
      this.rafId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
  }

  /**
   * プレビューのレンダリングループを停止
   */
  stopPreviewLoop(): void {
    this.isRendering = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 1フレームだけ描画（エンコード時などに使用）
   */
  renderFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, currentTime: number): void {
    this.updateAll(currentTime);
    this.renderAll(ctx);
  }

  /**
   * エフェクトの追加
   */
  addEffect(effect: EffectBase<EffectConfig>): void {
    if (this.effects.some(e => e.getId() === effect.getId())) {
      throw new AppError(
        ErrorType.EffectAlreadyExists,
        `Effect with id ${effect.getId()} already exists`
      );
    }
    this.effects.push(effect);
    this.needsSort = true;
  }

  /**
   * エフェクトの削除
   */
  removeEffect(id: string): void {
    const index = this.effects.findIndex(e => e.getId() === id);
    if (index === -1) {
      throw new AppError(
        ErrorType.EffectNotFound,
        `Effect with id ${id} not found`
      );
    }
    this.effects.splice(index, 1);
  }

  /**
   * エフェクトの取得
   */
  getEffect(id: string): EffectBase<EffectConfig> | undefined {
    return this.effects.find(e => e.getId() === id);
  }

  /**
   * 全エフェクトの取得
   */
  getEffects(): EffectBase<EffectConfig>[] {
    return [...this.effects];
  }

  /**
   * エフェクトの設定更新
   */
  updateEffectConfig(id: string, config: Partial<EffectConfig>): void {
    const effect = this.getEffect(id);
    if (!effect) {
      throw new AppError(
        ErrorType.EffectNotFound,
        `Effect with id ${id} not found`
      );
    }
    effect.updateConfig(config);
    this.needsSort = true;
  }

  /**
   * キャンバスサイズ変更時の処理
   * - 全エフェクトの座標とサイズを更新
   */
  private handleCanvasResize(
    oldSize: { width: number; height: number },
    newSize: { width: number; height: number }
  ): void {
    try {
      for (const effect of this.effects) {
        const config = effect.getConfig();
        const { position, size } = updateRectForResize(
          config.position,
          config.size,
          config.coordinateSystem ?? 'absolute',
          oldSize,
          newSize
        );
        effect.updateConfig({ position, size });
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        `Failed to update effects on resize: ${details}`,
        error
      );
    }
  }

  /**
   * zIndexでエフェクトをソート
   */
  private sortEffectsByZIndex(): void {
    if (!this.needsSort) return;

    this.effects.sort((a, b) => {
      const aZIndex = a.getConfig().zIndex ?? 0;
      const bZIndex = b.getConfig().zIndex ?? 0;
      return aZIndex - bZIndex;
    });
    this.needsSort = false;
  }

  /**
   * 全エフェクトの更新
   */
  updateAll(currentTime: number): void {
    try {
      // アクティブなエフェクトのみをフィルタリング
      const activeEffects = this.effects.filter(effect => effect.isActive(currentTime));
      
      // アクティブなエフェクトのみ更新
      for (const effect of activeEffects) {
        effect.update(currentTime);
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        `Failed to update effects: ${details}`,
        error
      );
    }
  }

  /**
   * 全エフェクトの描画
   */
  renderAll(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    try {
      // zIndexでソート
      this.sortEffectsByZIndex();

      // アクティブで可視のエフェクトのみをフィルタリング
      const visibleEffects = this.effects.filter(effect => 
        effect.isActive(this.audioService?.getCurrentTime() ?? 0) && 
        effect.getConfig().visible !== false
      );

      // 描画が必要なエフェクトのみ描画
      for (const effect of visibleEffects) {
        ctx.save();
        effect.render(ctx);
        ctx.restore();
      }
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error);
      throw new AppError(
        ErrorType.EffectUpdateFailed,
        `Failed to render effects: ${details}`,
        error
      );
    }
  }

  /**
   * 全エフェクトの破棄
   */
  dispose(): void {
    this.stopPreviewLoop();
    for (const effect of this.effects) {
      effect.dispose();
    }
    this.effects = [];
    this.audioService = null;
    this.renderer = null;
    this.lastCanvasSize = null;
  }
}