import { BaseEffectNode } from '../../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BlendNodeOptions } from '../../../../types/effects/base';

/**
 * ブレンドモードを適用するノード
 */
export class BlendNode extends BaseEffectNode {
  private mode: GlobalCompositeOperation;
  private opacity: number;

  constructor(options: BlendNodeOptions) {
    super();
    this.mode = options.mode;
    this.opacity = options.opacity;
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

  getConfig(): BlendNodeOptions {
    return {
      mode: this.mode,
      opacity: this.opacity
    };
  }

  updateConfig(config: Partial<BlendNodeOptions>): void {
    if (config.mode !== undefined) {
      this.mode = config.mode;
    }
    if (config.opacity !== undefined) {
      this.opacity = config.opacity;
    }
  }
} 