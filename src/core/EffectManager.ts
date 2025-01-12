// EffectManager.ts

import { EffectBase } from './EffectBase';
import { AudioVisualParameters } from './types';
import { Renderer } from './Renderer'; // Offscreen+メインCanvas管理を行うクラス(任意)

/**
 * エフェクトマネージャ
 * - 複数のEffectBaseを管理し、zIndex順に描画
 * - Renderer(任意) と連携して、OffscreenCanvas → メインCanvasへ描画転送
 */
export class EffectManager {
  private effects: EffectBase[] = [];
  private renderer?: Renderer; // Rendererがある場合

  constructor(renderer?: Renderer) {
    this.renderer = renderer;
  }

  /**
   * エフェクトを追加
   * - zIndexの昇順でソートして管理
   */
  public addEffect(effect: EffectBase): void {
    this.effects.push(effect);
    this.sortEffectsByZIndex();
  }

  /**
   * エフェクトを削除
   * @param effectOrId 削除対象
   */
  public removeEffect(effectOrId: EffectBase | string): void {
    const id =
      typeof effectOrId === 'string'
        ? effectOrId
        : this.effects.indexOf(effectOrId) >= 0
        ? this.effects.indexOf(effectOrId)
        : -1;

    if (typeof effectOrId === 'string') {
      // IDによる削除の場合、IDが無いと判断が難しい
      // → もしEffectBaseにも一意のidプロパティがあるならそれで判定してもOK
      // ここでは単純にzIndex順で配列管理しているため、イメージ的には indexOf などで検索
      // あるいはエフェクト自身が config.id を持っているならfilter
      // (実装例)
      this.effects = this.effects.filter(
        (effect) => (effect.getConfig() as any).id !== effectOrId
      );
    } else {
      // EffectBaseインスタンスそのものを渡された場合
      const idx = this.effects.indexOf(effectOrId);
      if (idx !== -1) {
        this.effects.splice(idx, 1);
      }
    }
  }

  /**
   * すべてのエフェクトをクリア
   */
  public clearEffects(): void {
    this.effects = [];
  }

  /**
   * 描画処理
   * @param params AudioVisualParameters (currentTimeなどが入る)
   * @param manualCtx 外部が直接Canvasを扱いたい場合、ctxを渡すことも可能
   */
  public render(
    params: AudioVisualParameters,
    manualCtx?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  ): void {
    // Rendererが存在する場合
    if (this.renderer && !manualCtx) {
      // 1) Canvasをクリア (オフスクリーン＆メイン)
      this.renderer.clear();

      // 2) オフスクリーンCtx取得
      const ctx = this.renderer.getOffscreenContext();
      // 3) zIndex順にエフェクト描画
      for (const effect of this.effects) {
        // isVisible判定は EffectBase 内部でおこなう
        effect.render(ctx, params);
      }
      // 4) Offscreen → メインCanvas転写
      this.renderer.drawToMain();
    }
    // Rendererを使わず、直接ctxが与えられている場合
    else if (manualCtx) {
      // 直接ctxをクリア
      manualCtx.clearRect(0, 0, manualCtx.canvas.width, manualCtx.canvas.height);

      for (const effect of this.effects) {
        effect.render(manualCtx, params);
      }
    }
    // どちらも無い (エラー、あるいは描画不要)
    else {
      // do nothing
    }
  }

  /**
   * エフェクトをzIndexの昇順で並べ直す
   */
  private sortEffectsByZIndex(): void {
    this.effects.sort((a, b) => a.getZIndex() - b.getZIndex());
  }

  /**
   * エフェクトの参照を取得
   */
  public getEffects(): EffectBase[] {
    return this.effects;
  }

  /**
   * Rendererの取得
   */
  public getRenderer(): Renderer | undefined {
    return this.renderer;
  }

  /**
   * Rendererの差し替え（後からセットできるように）
   */
  public setRenderer(renderer: Renderer) {
    this.renderer = renderer;
  }

  /**
   * リソース解放（必要なら）
   */
  public dispose(): void {
    // ここでエフェクトに dispose() を呼ぶとか
    this.effects = [];
    this.renderer = undefined;
  }
}
