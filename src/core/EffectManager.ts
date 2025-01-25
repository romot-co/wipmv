/**
 * エフェクトマネージャー
 * 
 * - 複数のエフェクトを管理し、z-index順にソートして描画
 * - エフェクトの追加/削除/更新を一元管理
 * - プレビュー時はrequestAnimationFrameでレンダリングループを実行
 * - エンコード時は単一フレーム単位で描画を実行
 * - AudioPlaybackServiceと連携して再生時間に応じた描画を実現
 * - キャンバスサイズ変更時に全エフェクトの座標とサイズを更新
 * - プレビュー時は低解像度、エクスポート時は元の解像度で描画
 */

import { EffectConfig } from './types/effect';
import { AppError, ErrorType, ErrorMessages } from './types/error';
import { Disposable, AudioSource } from './types/base';
import { EffectBase, EffectManager as IEffectManager } from './types/core';
import { AudioPlaybackService } from './AudioPlaybackService';
import { Renderer } from './Renderer';
import { updateRectForResize } from '../utils/coordinates';
import { VideoEncoderService } from './VideoEncoderService';

/**
 * エフェクトマネージャー
 * - エフェクトの管理（追加/削除/更新/ソート）
 * - エフェクトの描画
 */
export class EffectManager implements IEffectManager {
  private static readonly BASE_Z_INDEX = 1000; // 基準となるzIndex
  private static readonly Z_INDEX_STEP = 10;   // zIndex間の間隔
  private static readonly MIN_Z_INDEX = 0;     // 最小zIndex
  private static readonly MAX_Z_INDEX = 9999;  // 最大zIndex

  private effects: EffectBase<EffectConfig>[] = [];
  private needsSort: boolean = false;
  private renderer: Renderer | null = null;

  /**
   * レンダラーを設定
   */
  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
  }

  /**
   * レンダラーを取得
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }

  /**
   * 新しいzIndexを計算
   */
  private calculateNewZIndex(): number {
    if (this.effects.length === 0) {
      return EffectManager.BASE_Z_INDEX;
    }

    const maxZIndex = Math.max(
      ...this.effects.map(effect => effect.getConfig().zIndex ?? 0)
    );

    const newZIndex = maxZIndex + EffectManager.Z_INDEX_STEP;
    if (newZIndex > EffectManager.MAX_Z_INDEX) {
      this.normalizeZIndices();
      return this.calculateNewZIndex();
    }

    return newZIndex;
  }

  /**
   * エフェクトを追加
   */
  addEffect(effect: EffectBase<EffectConfig>, zIndex?: number): void {
    const config = effect.getConfig();
    config.zIndex = zIndex ?? this.calculateNewZIndex();
    
    if (config.zIndex < EffectManager.MIN_Z_INDEX || config.zIndex > EffectManager.MAX_Z_INDEX) {
      throw new AppError(
        ErrorType.EffectInitFailed,
        'Invalid zIndex value'
      );
    }

    this.effects.push(effect);
    this.needsSort = true;
  }

  /**
   * エフェクトを削除
   */
  removeEffect(id: string): void {
    this.effects = this.effects.filter(effect => effect.getId() !== id);
  }

  /**
   * エフェクトを取得
   */
  getEffect(id: string): EffectBase<EffectConfig> | undefined {
    return this.effects.find(effect => effect.getId() === id);
  }

  /**
   * 全エフェクトを取得
   */
  getEffects(): EffectBase<EffectConfig>[] {
    return [...this.effects];
  }

  /**
   * エフェクトの設定を更新
   */
  updateEffectConfig(id: string, config: Partial<EffectConfig>): void {
    const effect = this.getEffect(id);
    if (!effect) {
      throw new AppError(
        ErrorType.EffectNotFound,
        'Effect not found'
      );
    }

    effect.updateConfig(config);
    if ('zIndex' in config) {
      this.needsSort = true;
    }
  }

  /**
   * エフェクトをzIndexでソート
   */
  private sortEffectsByZIndex(): void {
    if (!this.needsSort) return;

    this.effects.sort((a, b) => {
      const aIndex = a.getConfig().zIndex ?? 0;
      const bIndex = b.getConfig().zIndex ?? 0;
      return aIndex - bIndex;
    });

    this.needsSort = false;
  }

  /**
   * エフェクトの表示状態を更新
   */
  private updateEffectVisibility(currentTime: number): void {
    for (const effect of this.effects) {
      const config = effect.getConfig();
      
      // 開始時間と終了時間のチェック
      const startTime = config.startTime ?? 0;
      const endTime = (config.endTime === 0 || config.endTime === undefined) ? Infinity : config.endTime;
      
      // 表示状態を更新
      const isVisible = currentTime >= startTime && currentTime <= endTime;
      
      // 表示状態が変化した時のみログを出力
      if (config.visible !== isVisible) {
        console.log('エフェクト表示状態更新:', {
          effectId: effect.getId(),
          currentTime,
          startTime,
          endTime,
          visible: isVisible,
          previousVisible: config.visible
        });
      }
      
      // 設定を更新
      effect.updateConfig({
        ...config,
        visible: isVisible
      });
    }
  }

  /**
   * 全エフェクトの状態を更新
   */
  updateAll(currentTime: number): void {
    if (!this.renderer) {
      console.warn('レンダラーが設定されていません');
      return;
    }

    // エフェクトの表示状態を更新
    this.updateEffectVisibility(currentTime);

    // エフェクトを更新
    this.effects.forEach(effect => {
      const config = effect.getConfig();
      if (config.visible) {
        try {
          effect.update(currentTime);
        } catch (error) {
          console.error('エフェクト更新エラー:', {
            effectId: effect.getId(),
            error
          });
        }
      }
    });
  }

  /**
   * 全エフェクトを描画
   */
  renderAll(currentTime: number, ctx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    if (!this.renderer && !ctx) {
      console.warn('レンダラーが設定されていません');
      return;
    }

    try {
      // エフェクトをソート
      this.sortEffectsByZIndex();

      // オフスクリーンに描画
      const context = ctx ?? this.renderer!.getOffscreenContext();
      if (!ctx && this.renderer) {
        this.renderer.clear();
      }

      // 表示状態のエフェクトのみ描画
      let hasVisibleEffects = false;
      for (const effect of this.effects) {
        const config = effect.getConfig();
        if (config.visible) {
          hasVisibleEffects = true;
          try {
            effect.render(context);
          } catch (error) {
            console.error('エフェクト描画エラー:', {
              effectId: effect.getId(),
              error
            });
          }
        }
      }

      // メインキャンバスに転送
      if (!ctx && this.renderer) {
        this.renderer.drawToMain();
      }
    } catch (error) {
      console.error('renderAllエラー:', error);
    }
  }

  /**
   * エフェクトを移動
   */
  moveEffect(sourceId: string, targetId: string): void {
    const sourceEffect = this.getEffect(sourceId);
    const targetEffect = this.getEffect(targetId);

    if (!sourceEffect || !targetEffect) {
      throw new AppError(
        ErrorType.EffectNotFound,
        'Effect not found'
      );
    }

    const sourceZIndex = sourceEffect.getConfig().zIndex ?? 0;
    const targetZIndex = targetEffect.getConfig().zIndex ?? 0;

    // 移動先のzIndexを計算
    let newZIndex: number;
    if (sourceZIndex < targetZIndex) {
      // 上に移動
      const nextEffect = this.effects.find(e => 
        (e.getConfig().zIndex ?? 0) > targetZIndex
      );
      newZIndex = nextEffect
        ? (targetZIndex + (nextEffect.getConfig().zIndex ?? 0)) / 2
        : targetZIndex + EffectManager.Z_INDEX_STEP;
    } else {
      // 下に移動
      const prevEffect = this.effects.find(e =>
        (e.getConfig().zIndex ?? 0) < targetZIndex
      );
      newZIndex = prevEffect
        ? (targetZIndex + (prevEffect.getConfig().zIndex ?? 0)) / 2
        : targetZIndex - EffectManager.Z_INDEX_STEP;
    }

    // zIndexの範囲チェック
    if (newZIndex < EffectManager.MIN_Z_INDEX || newZIndex > EffectManager.MAX_Z_INDEX) {
      this.normalizeZIndices();
      this.moveEffect(sourceId, targetId);
      return;
    }

    // zIndexを更新
    sourceEffect.updateConfig({ zIndex: newZIndex });
    this.needsSort = true;
  }

  /**
   * zIndexを正規化
   */
  private normalizeZIndices(): void {
    this.sortEffectsByZIndex();
    this.effects.forEach((effect, index) => {
      effect.updateConfig({
        zIndex: EffectManager.BASE_Z_INDEX + index * EffectManager.Z_INDEX_STEP
      });
    });
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    this.effects.forEach(effect => effect.dispose());
    this.effects = [];
    this.renderer = null;
  }

  /**
   * エクスポート用のキャンバスを作成
   */
  createExportCanvas(options: { width: number; height: number }): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    return canvas;
  }

  /**
   * エクスポートフレームを描画
   */
  renderExportFrame(canvas: HTMLCanvasElement, currentTime: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new AppError(
        ErrorType.RENDERER_ERROR,
        'Failed to get canvas context'
      );
    }
    this.renderAll(currentTime, ctx);
  }
}