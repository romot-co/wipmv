import { AudioVisualParameters } from '../../../types/audio';
import { BaseNodeConfig, NodeType } from '../../../types/effects/base';

/**
 * ノードの基底クラス
 * 単一の描画責務を持つ最小単位
 */
export abstract class Node {
  protected config: BaseNodeConfig;
  protected nextNode?: Node;

  constructor(type: NodeType) {
    this.config = { type };
  }

  /**
   * 次のノードを設定
   */
  setNext(node: Node): Node {
    this.nextNode = node;
    return node;
  }

  /**
   * 次のノードに処理を渡す
   */
  protected passToNext(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    this.nextNode?.process(parameters, canvas);
  }

  /**
   * ノードの処理を実行
   */
  abstract process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void;

  /**
   * 設定を取得
   */
  getConfig(): BaseNodeConfig {
    return this.config;
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<BaseNodeConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.nextNode?.dispose();
  }
} 