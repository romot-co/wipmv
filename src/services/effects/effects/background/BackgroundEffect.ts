import { Effect } from '../../base/Effect';
import { BackgroundNode } from '../../nodes/background/BackgroundNode';
import { BlendNode } from '../../nodes/blend/BlendNode';
import { TransformNode } from '../../nodes/transform/TransformNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { EffectConfig } from '../../../../types/effects/base';

export interface BackgroundEffectOptions {
  color?: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    stops?: number[];
  };
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * 背景エフェクト
 * 単色または gradient による背景を描画します
 */
export class BackgroundEffect extends Effect {
  private readonly backgroundNode: BackgroundNode;
  private readonly blendNode: BlendNode;
  private readonly transformNode: TransformNode;

  constructor(options: BackgroundEffectOptions) {
    super();

    // 背景ノードの設定
    this.backgroundNode = new BackgroundNode({
      color: options.color ?? '#000000',
      gradient: options.gradient
    });

    // ブレンドノードの設定
    this.blendNode = new BlendNode({
      mode: options.blendMode ?? 'source-over',
      opacity: options.opacity ?? 1.0
    });

    // 変形ノードの設定（背景は常にキャンバス全体をカバー）
    this.transformNode = new TransformNode({
      position: { x: 0.5, y: 0.5 },
      scale: { x: 1, y: 1 }
    });

    // ノードの接続
    this.backgroundNode
      .setNext(this.blendNode)
      .setNext(this.transformNode);
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    this.backgroundNode.process(parameters, canvas);
  }

  dispose(): void {
    this.backgroundNode.dispose();
    this.blendNode.dispose();
    this.transformNode.dispose();
  }

  getConfig(): EffectConfig {
    return {
      type: 'background',
      ...this.backgroundNode.getConfig(),
      ...this.blendNode.getConfig(),
      ...this.transformNode.getConfig()
    };
  }
} 