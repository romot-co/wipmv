import { AudioVisualParameters } from '../../../types/audio';
import { NodeConfig } from './types';

/**
 * ノードの基底クラス
 * 単一の描画機能を持つ最小単位
 */
export abstract class Node {
  private next?: Node;
  protected initialized: boolean = false;

  /**
   * 次のノードを設定
   */
  setNext(node: Node): void {
    this.next = node;
  }

  /**
   * 次のノードを取得
   */
  getNext(): Node | undefined {
    return this.next;
  }

  /**
   * ノードの初期化
   */
  protected abstract onInitialize(): void;

  /**
   * ノードの処理を実行
   */
  abstract process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void;

  /**
   * 次のノードに処理を渡す
   */
  protected passToNext(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    this.next?.process(parameters, canvas);
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.next?.dispose();
  }

  /**
   * 設定を取得
   */
  abstract getConfig(): NodeConfig;
} 