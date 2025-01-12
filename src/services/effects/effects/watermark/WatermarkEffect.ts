import { Effect } from '../../base/Effect';
import { ImageNode } from '../../nodes/image/ImageNode';
import { BlendNode } from '../../nodes/blend/BlendNode';
import { TransformNode } from '../../nodes/transform/TransformNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseEffectConfig, Position, Size } from '../../../../types/effects/base';

export interface WatermarkEffectConfig extends BaseEffectConfig {
  /** 画像データ */
  image: HTMLImageElement;
  /** サイズ（0-1） */
  size?: Size;
  /** 位置（0-1） */
  position?: Position;
  /** スケール */
  scale?: { x: number; y: number };
  /** 回転（ラジアン） */
  rotation?: number;
  /** 反転 */
  flip?: { 
    horizontal: boolean;
    vertical: boolean;
  };
}

/**
 * ウォーターマークエフェクト
 * 画像をウォーターマークとして描画します
 */
export class WatermarkEffect extends Effect {
  private readonly imageNode: ImageNode;
  private readonly blendNode: BlendNode;
  private readonly transformNode: TransformNode;

  constructor(config: WatermarkEffectConfig) {
    super(config);

    // 画像ノードの設定
    this.imageNode = new ImageNode({
      type: 'image',
      image: config.image,
      scaleMode: 'contain'
    });

    // ブレンドノードの設定
    this.blendNode = new BlendNode({
      mode: config.blendMode ?? 'source-over',
      opacity: config.opacity ?? 1.0
    });

    // 変形ノードの設定
    this.transformNode = new TransformNode({
      position: config.position ?? { x: 0.5, y: 0.5 },
      scale: config.scale ?? { x: 1, y: 1 },
      rotation: config.rotation ?? 0,
      flip: config.flip ?? { horizontal: false, vertical: false }
    });

    // ノードの接続
    this.imageNode
      .setNext(this.blendNode)
      .setNext(this.transformNode);

    this.rootNode = this.imageNode;
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.isVisible(parameters.currentTime)) {
      return;
    }
    this.rootNode?.process(parameters, canvas);
  }
}

/**
 * WatermarkEffectのファクトリー関数
 * @param config 必須プロパティ(image)と任意のプロパティを含む設定オブジェクト
 */
export const createWatermarkEffect = (config: { image: HTMLImageElement } & Partial<Omit<WatermarkEffectConfig, 'image'>>): WatermarkEffect => {
  return new WatermarkEffect({
    id: crypto.randomUUID(),
    type: 'watermark',
    ...config,
  });
}; 