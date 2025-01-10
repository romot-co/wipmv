import { AudioVisualParameters } from '../../types/audio';
import { VisualEffectConfig } from '../../types/effects';
import { VisualNode } from './nodes/VisualNode';

/**
 * ビジュアルエフェクトクラス
 * 複数のノードをチェーンとして管理します
 */
export class VisualEffect {
  private name: string;
  private nodes: VisualNode[] = [];
  private context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  constructor(name: string, nodes: VisualNode[]) {
    this.name = name;
    this.nodes = nodes;
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
    this.context = context;
    this.nodes.forEach(node => node.initialize(canvas, context));
  }

  /**
   * エフェクトの処理を実行します
   */
  process(parameters: AudioVisualParameters, targetCanvas: HTMLCanvasElement | OffscreenCanvas): void {
    if (!this.context) return;

    // 各ノードの処理を実行
    this.nodes.forEach(node => {
      node.process(parameters, targetCanvas);
    });
  }

  /**
   * エフェクトの設定を取得します
   */
  getConfig(): VisualEffectConfig {
    if (this.nodes.length === 0) {
      throw new Error('No nodes available');
    }
    const nodeConfig = this.nodes[0].getConfig() as Record<string, unknown>;
    return {
      type: this.name,
      ...nodeConfig
    } as VisualEffectConfig;
  }

  /**
   * エフェクトのノードを取得します
   */
  getNodes(): VisualNode[] {
    return this.nodes;
  }
} 