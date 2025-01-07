import { VisualEffect } from './VisualEffect';
import { ImageNode } from './nodes/ImageNode';
import { ColorNode } from './nodes/ColorNode';

/**
 * 背景エフェクトの種類
 */
export type BackgroundType = 'color' | 'image';

/**
 * 背景エフェクト生成のオプション
 */
export interface CreateBackgroundEffectOptions {
  type: BackgroundType;
  color?: string;
  image?: HTMLImageElement;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * 背景エフェクトを生成します
 */
export function createBackgroundEffect(options: CreateBackgroundEffectOptions): VisualEffect {
  validateOptions(options);

  const node = options.type === 'color'
    ? new ColorNode({
        color: options.color!,
        opacity: options.opacity,
        blendMode: options.blendMode
      })
    : new ImageNode({
        image: options.image!,
        opacity: options.opacity,
        blendMode: options.blendMode,
        scaleMode: 'cover',
        position: { x: 0.5, y: 0.5 },
        size: { width: 1, height: 1 }
      });

  return new VisualEffect('background', [node]);
}

/**
 * オプションのバリデーションを行います
 */
function validateOptions(options: CreateBackgroundEffectOptions): void {
  if (options.type === 'color' && !options.color) {
    throw new Error('Color must be specified when type is "color"');
  }
  if (options.type === 'image' && !options.image) {
    throw new Error('Image must be specified when type is "image"');
  }
} 