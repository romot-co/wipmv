import { Node } from './Node';
import { AudioVisualParameters } from '../../../types/audio';
import { NodeConfig } from './types';

/**
 * エフェクトノードの基底クラス
 * 単一の視覚効果の処理と描画を担当します
 */
export abstract class BaseEffectNode extends Node {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onInitialize(_canvas: HTMLCanvasElement | OffscreenCanvas, _context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    // 基本的な初期化処理は不要
  }

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
  abstract getConfig(): NodeConfig;
} 