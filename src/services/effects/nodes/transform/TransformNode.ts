import { BaseEffectNode } from '../../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { TransformNodeOptions, Position, Scale } from '../../../../types/effects/base';

/**
 * 変形を適用するノード
 */
export class TransformNode extends BaseEffectNode {
  private position: Position;
  private scale: Scale;
  private rotation: number;

  constructor(options: TransformNodeOptions) {
    super();
    this.position = options.position ?? { x: 0.5, y: 0.5 };
    this.scale = options.scale ?? { x: 1, y: 1 };
    this.rotation = options.rotation ?? 0;
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // 中心を基準に変形を適用
    const centerX = canvas.width * this.position.x;
    const centerY = canvas.height * this.position.y;

    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.scale(this.scale.x, this.scale.y);
    ctx.translate(-centerX, -centerY);

    this.passToNext(parameters, canvas);

    ctx.restore();
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): TransformNodeOptions {
    return {
      position: this.position,
      scale: this.scale,
      rotation: this.rotation
    };
  }

  updateConfig(config: Partial<TransformNodeOptions>): void {
    if (config.position !== undefined) {
      this.position = config.position;
    }
    if (config.scale !== undefined) {
      this.scale = config.scale;
    }
    if (config.rotation !== undefined) {
      this.rotation = config.rotation;
    }
  }
} 