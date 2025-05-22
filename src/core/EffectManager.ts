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
import debug from 'debug';

const log = debug('app:EffectManager');

/**
 * エフェクトマネージャー
 * - エフェクトの管理（追加/削除/更新/ソート）
 * - エフェクトの状態更新
 */
export class EffectManager implements IEffectManager {
  private static readonly BASE_Z_INDEX = 1000; // 基準となるzIndex
  private static readonly Z_INDEX_STEP = 10;   // zIndex間の間隔
  private static readonly MIN_Z_INDEX = 0;     // 最小zIndex
  private static readonly MAX_Z_INDEX = 9999;  // 最大zIndex

  private effects: EffectBase<EffectConfig>[] = [];
  private needsSort: boolean = false;

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
      // 無限再帰を避けるために正規化後に直接値を返す
      this.normalizeZIndices();
      // 正規化後は BASE_Z_INDEX + 最後のエフェクトのインデックス * Z_INDEX_STEP + Z_INDEX_STEP を返す
      return EffectManager.BASE_Z_INDEX + (this.effects.length * EffectManager.Z_INDEX_STEP);
    }

    return newZIndex;
  }

  /**
   * エフェクトを追加
   */
  addEffect(effect: EffectBase<EffectConfig>, zIndex?: number): void {
    const config = effect.getConfig();
    
    try {
      // 指定されたzIndexを使用するか、新しいzIndexを計算
      config.zIndex = zIndex ?? this.calculateNewZIndex();
      
      // zIndexの範囲チェック
      if (config.zIndex < EffectManager.MIN_Z_INDEX || config.zIndex > EffectManager.MAX_Z_INDEX) {
        console.warn('Invalid zIndex value, normalizing:', config.zIndex);
        this.normalizeZIndices();
        config.zIndex = EffectManager.BASE_Z_INDEX + (this.effects.length * EffectManager.Z_INDEX_STEP);
      }
      
      // すでに同じIDのエフェクトが存在するかチェック
      const existingIndex = this.effects.findIndex(e => e.getId() === effect.getId());
      if (existingIndex >= 0) {
        console.warn('Duplicate effect ID detected, replacing existing effect:', effect.getId());
        this.effects[existingIndex] = effect;
      } else {
        // 新しいエフェクトを追加
        this.effects.push(effect);
      }
      
      this.needsSort = true;
    } catch (error) {
      console.error('Error adding effect:', error);
      // 最後の手段としてデフォルトのzIndexを設定
      config.zIndex = EffectManager.BASE_Z_INDEX;
      // それでも追加を試みる
      this.effects.push(effect);
      this.needsSort = true;
    }
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
   * 全エフェクトを取得 (ソートされていない可能性あり)
   */
  getEffects(): EffectBase<EffectConfig>[] {
    return [...this.effects];
  }

  /**
   * ソート済みの全エフェクトを取得
   */
  getSortedEffects(): EffectBase<EffectConfig>[] {
    this.sortEffectsByZIndex(); // 必要であればソートを実行
    return [...this.effects];
  }

  /**
   * エフェクトの設定を更新
   */
  updateEffectConfig(id: string, config: Partial<EffectConfig>): void {
    const effect = this.getEffect(id);
    if (!effect) {
      throw new AppError(
        ErrorType.EFFECT_NOT_FOUND,
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
   * 全エフェクトの状態を更新
   */
  updateAll(currentTime: number): void {
    // エフェクトを更新
    this.effects.forEach(effect => {
      try {
        effect.update(currentTime);
      } catch (error) {
        console.error('エフェクト更新エラー:', {
          effectId: effect.getId(),
          error
        });
      }
    });
  }

  /**
   * エフェクトを移動
   */
  moveEffect(sourceId: string, targetId: string): void {
    const sourceEffect = this.getEffect(sourceId);
    const targetEffect = this.getEffect(targetId);

    if (!sourceEffect || !targetEffect) {
      throw new AppError(
        ErrorType.EFFECT_NOT_FOUND,
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
  }

  // --- Direct Manipulation 用メソッド ---

  /**
   * 指定された座標にある最前面のエフェクトIDを取得
   * @param x 相対座標X (0.0 - 1.0)
   * @param y 相対座標Y (0.0 - 1.0)
   * @param canvasWidth キャンバスの幅
   * @param canvasHeight キャンバスの高さ
   * @returns エフェクトID、見つからない場合は null
   */
  getEffectAtPoint(x: number, y: number, canvasWidth: number, canvasHeight: number): string | null {
    // キャンバス内の絶対座標に変換
    const clickX = x * canvasWidth;
    const clickY = y * canvasHeight;
    
    // ログ出力を削減（クリックイベント時のみ）
    const isDebugEnabled = false; // デバッグログを無効化
    
    if (isDebugEnabled) {
      log('getEffectAtPoint - Click coordinates:', { clickX, clickY, canvasWidth, canvasHeight });
    }

    // zIndex の降順（描画の前面）から判定
    const sortedEffects = [...this.getSortedEffects()].reverse(); // getSortedEffects は昇順なので reverse
    
    if (isDebugEnabled) {
      log('getEffectAtPoint - Checking effects (total):', sortedEffects.length);
    }

    for (const effect of sortedEffects) {
      // 各エフェクトの情報をログ出力（デバッグモード時のみ）
      const config = effect.getConfig();
      
      if (isDebugEnabled) {
        log(`Checking effect: ${effect.getId()} (${config.type}), visible: ${config.visible}, isDraggable: ${effect.isDraggable}`);
      }
      
      // 非表示のエフェクトはスキップ
      if (!config.visible) {
        if (isDebugEnabled) {
          log(`Skipping invisible effect: ${effect.getId()}`);
        }
        continue;
      }

      try {
        const boundingBox = effect.getBoundingBox(canvasWidth, canvasHeight);
        
        if (boundingBox) {
          const { x: boxX, y: boxY, width: boxWidth, height: boxHeight } = boundingBox;
          
          // クリック判定（デバッグモード時のみ詳細ログを出力）
          const isInside = (
            clickX >= boxX &&
            clickX <= boxX + boxWidth &&
            clickY >= boxY &&
            clickY <= boxY + boxHeight
          );
          
          if (isDebugEnabled) {
            log(`BoundingBox for ${effect.getId()} (${config.type}):`, { 
              x: boxX, y: boxY, width: boxWidth, height: boxHeight,
              isInside
            });
          }
          
          // クリック座標がバウンディングボックス内にあれば、そのエフェクトIDを返す
          if (isInside) {
            log(`Effect found at point: ${effect.getId()} (${config.type})`);
            return effect.getId();
          }
        } else if (isDebugEnabled) {
          log(`No bounding box for effect: ${effect.getId()}`);
        }
      } catch (error) {
        // getBoundingBox が未実装の場合などにエラーが発生する可能性がある
        console.error('Error getting bounding box for effect:', effect.getId(), error);
        // エラーが発生しても処理を続行
      }
    }

    // どのエフェクトにもヒットしなかった場合
    if (isDebugEnabled) {
      log('No effect found at point:', { x, y, clickX, clickY });
    }
    return null;
  }
}
