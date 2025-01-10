import { Effect, EffectConfig } from '../../base';
import { ImageNode, ImageNodeOptions, BlendNode, BlendNodeOptions, TransformNode, TransformNodeOptions } from '../../nodes';
import { AudioVisualParameters } from '../../../../types/audio';
import { Size } from '../../base';

export interface WatermarkEffectConfig extends EffectConfig {
  type: 'watermark';
  image: HTMLImageElement;
  size?: Size;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
  scale?: { x: number; y: number };
  rotation?: number;
  flip?: { horizontal: boolean; vertical: boolean };
}

/**
 * ウォーターマークを描画するエフェクト
 */
export class WatermarkEffect extends Effect {
  private readonly imageNode: ImageNode;
  private readonly blendNode: BlendNode;
  private readonly transformNode: TransformNode;

  constructor(config: WatermarkEffectConfig) {
    super('watermark', config);

    // ブレンドノードの設定
    const blendOptions: BlendNodeOptions = {
      mode: config.blendMode ?? 'source-over',
      opacity: config.opacity ?? 1
    };
    this.blendNode = new BlendNode(blendOptions);

    // 変換ノードの設定
    const transformOptions: TransformNodeOptions = {
      position: config.position,
      scale: config.scale,
      rotation: config.rotation,
      flip: config.flip
    };
    this.transformNode = new TransformNode(transformOptions);

    // 画像ノードの設定
    const imageOptions: ImageNodeOptions = {
      image: config.image,
      size: config.size,
      scaleMode: 'contain'
    };
    this.imageNode = new ImageNode(imageOptions);

    // ノードの接続
    this.blendNode.setNext(this.transformNode);
    this.transformNode.setNext(this.imageNode);
    this.rootNode = this.blendNode;
  }

  render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    width: number,
    height: number,
    currentTime: number,
    audioData?: Float32Array
  ): void {
    if (!this.isVisible(currentTime)) return;

    const canvas = new OffscreenCanvas(width, height);
    const parameters: AudioVisualParameters = {
      currentTime,
      duration: 0,
      timeData: audioData ? [audioData] : [new Float32Array()],
      frequencyData: [new Float32Array()],
      sampleRate: 44100,
      numberOfChannels: 2,
      fftSize: 2048,
      canvas: {
        width,
        height,
        context: canvas.getContext('2d')!
      }
    };

    if (this.rootNode) {
      this.rootNode.process(parameters, canvas);
    }
  }

  dispose(): void {
    this.imageNode.dispose();
    this.blendNode.dispose();
    this.transformNode.dispose();
  }
}

/**
 * WatermarkEffectのファクトリー関数
 */
export const createWatermarkEffect = (config: WatermarkEffectConfig): WatermarkEffect => {
  return new WatermarkEffect(config);
}; 