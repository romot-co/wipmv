import { EffectManager } from './EffectManager';
import { Renderer } from './Renderer';
import { EffectBase, EffectConfig } from './types';
import { AppError, ErrorType } from './types/error';

/**
 * 描画処理を統括するクラス
 * - EffectManager からエフェクトリストを取得
 * - Renderer を使用してキャンバスに描画
 */
export class DrawingManager {
  private effectManager: EffectManager;
  private renderer: Renderer | null = null;

  constructor(effectManager: EffectManager) {
    this.effectManager = effectManager;
  }

  /**
   * レンダラーを設定
   */
  setRenderer(renderer: Renderer | null): void {
    this.renderer = renderer;
  }

  /**
   * レンダラーを取得
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }

  /**
   * 全エフェクトを描画 (EffectManager から移動)
   */
  renderAll(
    currentTime: number, 
    ctx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    selectedEffectId?: string | null
  ): void {
    if (!this.renderer && !ctx) {
      console.warn('DrawingManager: Renderer not set.');
      return;
    }

    try {
      // EffectManager からソート済みのエフェクトリストを取得
      const effects = this.effectManager.getSortedEffects();
      
      // 重複を排除するためにエフェクトIDをセットで管理
      const processedEffectIds = new Set<string>();
      const uniqueEffects = effects.filter(effect => {
        const id = effect.getId();
        if (processedEffectIds.has(id)) {
          return false;
        }
        processedEffectIds.add(id);
        return true;
      });
      
      // console.log('DrawingManager.renderAll: Drawing', uniqueEffects.length, 'unique effects at time', currentTime);
      
      const context = ctx ?? this.renderer!.getOffscreenContext();
      if (!ctx && this.renderer) {
        this.renderer.clear(); // オフスクリーン描画の場合はクリア
      }

      // 表示状態のエフェクトのみ描画
      for (const effect of uniqueEffects) {
        if (effect.isVisible()) { 
          // console.log(`Drawing effect: ${effect.getId()}, type: ${effect.getConfig().type}`);
          try {
            effect.render(context);
          } catch (error) {
            console.error('Effect render error:', { effectId: effect.getId(), error });
            // TODO: エラーハンドリングを改善
          }
        } else {
          console.log(`Skipping invisible effect: ${effect.getId()}, type: ${effect.getConfig().type}`);
        }
      }

      // --- 選択中エフェクトのハイライト描画 (EffectManager から移動) ---
      if (selectedEffectId) {
        const selectedEffect = this.effectManager.getEffect(selectedEffectId);
        if (selectedEffect && selectedEffect.isVisible()) {
          try {
            const rendererSize = this.renderer?.getCurrentSize() ?? { width: 0, height: 0 };
            const bbox = selectedEffect.getBoundingBox(rendererSize.width, rendererSize.height);
            if (bbox) {
              context.save();
              context.strokeStyle = 'rgba(255, 0, 0, 0.7)'; // Example highlight style
              context.lineWidth = 2;
              context.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
              context.restore();
            }
          } catch (e) {
            // console.warn('Failed to get bounding box for selected effect highlight', e);
          }
        }
      }
      
      // オフスクリーンからメインキャンバスへ転送 (renderAll に ctx が指定されなかった場合)
      if (!ctx && this.renderer) {
        this.renderer.drawToMain();
      }

    } catch (error) {
      console.error('DrawingManager renderAll error:', error);
      // TODO: エラーハンドリング
    }
  }

  /**
   * エクスポート用のキャンバスを作成 (EffectManager から移動)
   */
  createExportCanvas(options: { width: number; height: number }): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    return canvas;
  }

  /**
   * エクスポートフレームを描画 (EffectManager から移動)
   */
  renderExportFrame(canvas: HTMLCanvasElement, currentTime: number): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new AppError(
        ErrorType.RENDERER_ERROR,
        'Failed to get canvas context for export'
      );
    }
    // エクスポート時は選択ハイライトなしで renderAll を呼ぶ
    this.renderAll(currentTime, ctx, null);
  }

  dispose(): void {
    this.renderer = null;
    // EffectManager の参照は解除するが、EffectManager 自体の dispose はここでは行わない
    // this.effectManager = null;
  }
} 