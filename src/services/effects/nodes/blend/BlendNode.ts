import { BaseEffectNode } from './BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BlendNodeConfig } from '../../../../types/effects/base';

export interface BlendNodeOptions {
  mode: GlobalCompositeOperation;
  opacity?: number;
}

/**
 * ブレンドモードを適用するノード
 */
export class BlendNode extends BaseEffectNode {
  private readonly mode: GlobalCompositeOperation;
  private readonly opacity: number;

  constructor(options: BlendNodeOptions) {
    super();
    this.mode = options.mode;
    this.opacity = options.opacity ?? 1.0;
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = this.mode;
    ctx.globalAlpha = this.opacity;

    this.passToNext(parameters, canvas);

    ctx.restore();
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): BlendNodeConfig {
    return {
      type: 'blend',
      mode: this.mode,
      opacity: this.opacity
    };
  }
} 