import { Effect } from '../../base/Effect';
import { ColorNode } from '../../nodes/color/ColorNode';
import { ImageNode } from '../../nodes/image/ImageNode';
import { BlendNode } from '../../nodes/blend/BlendNode';
import { TransformNode } from '../../nodes/transform/TransformNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseEffectConfig } from '../../../../types/effects/base';

export interface BackgroundEffectConfig extends BaseEffectConfig {
  /** 背景色 */
  color?: string;
  /** グラデーション設定 */
  gradient?: {
    /** グラデーションタイプ */
    type: 'linear' | 'radial';
    /** カラーストップの色 */
    colors: string[];
    /** カラーストップの位置（0-1） */
    stops?: number[];
  };
  /** 背景画像 */
  image?: {
    /** 画像データ */
    data: HTMLImageElement;
    /** 画像のスケールモード */
    scaleMode?: 'cover' | 'contain' | 'stretch';
  };
}

/**
 * 背景エフェクト
 * 単色、グラデーション、または画像による背景を描画します
 */
export class BackgroundEffect extends Effect {
  private readonly colorNode: ColorNode;
  private readonly imageNode?: ImageNode;
  private readonly blendNode: BlendNode;
  private readonly transformNode: TransformNode;

  constructor(config: BackgroundEffectConfig) {
    super(config);

    // カラーノードの設定
    this.colorNode = new ColorNode({
      type: 'color',
      color: config.color ?? '#555555',
      gradient: config.gradient
    });

    // 画像ノードの設定（画像が指定されている場合のみ）
    if (config.image?.data) {
      this.imageNode = new ImageNode({
        type: 'image',
        image: config.image.data,
        scaleMode: config.image.scaleMode
      });
    }

    // ブレンドノードの設定
    this.blendNode = new BlendNode({
      mode: config.blendMode ?? 'source-over',
      opacity: config.opacity ?? 1.0
    });

    // 変形ノードの設定（背景は常にキャンバス全体をカバー）
    this.transformNode = new TransformNode({
      position: { x: 0.5, y: 0.5 },
      scale: { x: 1, y: 1 }
    });

    // ノードの接続
    if (this.imageNode) {
      // 画像がある場合は、色の上に画像を重ねる
      this.colorNode
        .setNext(this.imageNode)
        .setNext(this.blendNode)
        .setNext(this.transformNode);
    } else {
      // 画像がない場合は、色のみ
      this.colorNode
        .setNext(this.blendNode)
        .setNext(this.transformNode);
    }

    this.rootNode = this.colorNode;
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.isVisible(parameters.currentTime)) {
      return;
    }
    this.rootNode?.process(parameters, canvas);
  }
}

/**
 * BackgroundEffectのファクトリー関数
 */
export const createBackgroundEffect = (config: Partial<BackgroundEffectConfig> = {}): BackgroundEffect => {
  return new BackgroundEffect({
    id: crypto.randomUUID(),
    type: 'background',
    ...config,
  });
}; 