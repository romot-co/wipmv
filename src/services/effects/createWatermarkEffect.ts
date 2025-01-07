import { VisualEffect } from './VisualEffect';
import { ImageNode } from './nodes/ImageNode';

/**
 * ウォーターマークエフェクト生成のオプション
 */
export interface CreateWatermarkEffectOptions {
  image: HTMLImageElement;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * ウォーターマークエフェクトを生成します
 */
export function createWatermarkEffect(options: CreateWatermarkEffectOptions): VisualEffect {
  const node = new ImageNode({
    image: options.image,
    position: options.position ?? { x: 0.5, y: 0.5 },
    size: options.size ?? { width: 0.3, height: 0.3 },
    opacity: options.opacity ?? 0.8,
    scaleMode: 'contain',
    blendMode: options.blendMode ?? 'source-over'
  });

  return new VisualEffect('watermark', [node]);
} 