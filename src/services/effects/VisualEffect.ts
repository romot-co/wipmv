import { AudioVisualParameters } from '../../types/audio';
import { VisualEffectConfig } from '../../types/effects';

/**
 * ビジュアルエフェクトノードの基底クラス
 * 単一の視覚効果の処理と描画を担当します
 */
export abstract class VisualEffectNode {
  private nextNode: VisualEffectNode | null = null;

  /**
   * ノードの初期化を行います
   * @param canvas - 描画対象のキャンバス
   * @param context - 描画コンテキスト
   */
  abstract initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void;

  /**
   * エフェクトの処理を実行します
   * @param parameters - オーディオビジュアルパラメータ
   * @param canvas - 描画対象のキャンバス
   */
  abstract process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void;

  /**
   * リソースの解放を行います
   */
  abstract dispose(): void;

  /**
   * 次のノードを設定します
   * @param node - 次のノード
   */
  setNext(node: VisualEffectNode): void {
    this.nextNode = node;
  }

  /**
   * 次のノードに処理を渡します
   * @param parameters - オーディオビジュアルパラメータ
   * @param canvas - 描画対象のキャンバス
   */
  protected passToNext(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (this.nextNode) {
      this.nextNode.process(parameters, canvas);
    }
  }

  /**
   * 設定を取得します
   */
  abstract getConfig(): VisualEffectConfig;
}

/**
 * ビジュアルエフェクトクラス
 * 複数のノードをチェーンとして管理します
 */
export class VisualEffect {
  private name: string;
  private nodes: VisualEffectNode[] = [];

  constructor(name: string, nodes: VisualEffectNode[]) {
    this.name = name;
    this.nodes = nodes;
    this.connectNodes();
  }

  /**
   * ノードをチェーンとして接続します
   */
  private connectNodes(): void {
    for (let i = 0; i < this.nodes.length - 1; i++) {
      this.nodes[i].setNext(this.nodes[i + 1]);
    }
  }

  /**
   * エフェクトの名前を取得します
   */
  getName(): string {
    return this.name;
  }

  /**
   * エフェクトの初期化を行います
   */
  initialize(canvas: HTMLCanvasElement | OffscreenCanvas, context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    this.nodes.forEach(node => node.initialize(canvas, context));
  }

  /**
   * エフェクトの処理を実行します
   */
  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (this.nodes.length > 0) {
      this.nodes[0].process(parameters, canvas);
    }
  }

  /**
   * 次のエフェクトを設定します
   */
  setNext(nextEffect: VisualEffect): void {
    if (this.nodes.length > 0 && nextEffect.nodes.length > 0) {
      this.nodes[this.nodes.length - 1].setNext(nextEffect.nodes[0]);
    }
  }

  /**
   * リソースの解放を行います
   */
  dispose(): void {
    this.nodes.forEach(node => node.dispose());
  }

  /**
   * エフェクトのノードを取得します
   */
  getNodes(): VisualEffectNode[] {
    return this.nodes;
  }
} 