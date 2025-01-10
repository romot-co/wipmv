import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

/**
 * エフェクトノードの基底クラス
 * 単一の視覚効果の処理と描画を担当します
 */
export abstract class BaseEffectNode {
  protected nextNode: BaseEffectNode | null = null;
  protected context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  /**
   * 次のノードを設定します
   */
  setNext(node: BaseEffectNode): void {
    this.nextNode = node;
  }

  /**
   * 次のノードに処理を渡します
   */
  protected passToNext(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (this.nextNode) {
      this.nextNode.process(parameters, canvas);
    }
  }

  /**
   * ノードの初期化を行います
   */
  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    this.context = context;
    this.onInitialize(canvas, context);
  }

  /**
   * 個別の初期化処理を実装します
   */
  protected abstract onInitialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;

  /**
   * エフェクトの処理を実行します
   */
  abstract process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void;

  /**
   * リソースの解放を行います
   */
  abstract dispose(): void;

  /**
   * 設定を取得します
   */
  abstract getConfig(): BaseNodeConfig;
} 