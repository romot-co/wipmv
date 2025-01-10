import { BaseEffectNode } from './BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { TransformNodeConfig } from '../../../../types/effects/base';

export interface TransformNodeOptions {
  position?: { x: number; y: number };
  scale?: { x: number; y: number };
  rotation?: number;
  flip?: { horizontal: boolean; vertical: boolean };
  alignment?: 'left' | 'center' | 'right';
}

/**
 * 位置、回転、反転などの変換を適用するノード
 */
export class TransformNode extends BaseEffectNode {
  private readonly position: { x: number; y: number };
  private readonly scale: { x: number; y: number };
  private readonly rotation: number;
  private readonly flip: { horizontal: boolean; vertical: boolean };
  private readonly alignment: 'left' | 'center' | 'right';

  constructor(options: TransformNodeOptions) {
    super();
    this.position = options.position ?? { x: 0.5, y: 0.5 };
    this.scale = options.scale ?? { x: 1, y: 1 };
    this.rotation = options.rotation ?? 0;
    this.flip = options.flip ?? { horizontal: false, vertical: false };
    this.alignment = options.alignment ?? 'center';
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    // 位置の計算
    let x = this.position.x * canvas.width;
    const y = this.position.y * canvas.height;

    // アライメントの適用
    switch (this.alignment) {
      case 'left':
        x = 0;
        break;
      case 'right':
        x = canvas.width;
        break;
      // centerはデフォルト
    }

    // 変換の適用
    ctx.translate(x, y);

    if (this.rotation) {
      ctx.rotate((this.rotation * Math.PI) / 180);
    }

    if (this.flip.horizontal || this.flip.vertical) {
      ctx.scale(
        this.flip.horizontal ? -1 : 1,
        this.flip.vertical ? -1 : 1
      );
    }

    ctx.scale(this.scale.x, this.scale.y);

    this.passToNext(parameters, canvas);

    ctx.restore();
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): TransformNodeConfig {
    return {
      type: 'transform',
      position: this.position,
      scale: this.scale,
      rotation: this.rotation,
      flip: this.flip,
      alignment: this.alignment
    };
  }
} 