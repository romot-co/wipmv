import { VisualEffect } from './VisualEffect';
import { TextNode } from './nodes/TextNode';
import { TextEffectData } from '../../types/effects';

/**
 * テキストエフェクトを生成します
 */
export function createTextEffect(options: TextEffectData): VisualEffect {
  const node = new TextNode({
    text: options.text,
    font: options.font,
    fontSize: options.fontSize,
    position: options.position,
    color: options.color,
    opacity: options.opacity,
    blendMode: options.blendMode,
    timing: options.timing,
    textAlign: options.textAlign,
    textBaseline: options.textBaseline
  });

  return new VisualEffect(`text-${options.id}`, [node]);
}

/**
 * 複数のテキストエフェクトを生成します
 */
export function createMultipleTextEffects(textEffects: TextEffectData[]): VisualEffect[] {
  return textEffects.map(effect => createTextEffect(effect));
} 