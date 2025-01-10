import { VisualEffect } from './VisualEffect';
import { BackgroundNode } from './nodes/BackgroundNode';
import { BackgroundEffectConfig } from '../../types/effects';

export function createBackgroundEffect(options: Omit<BackgroundEffectConfig, 'type'>): VisualEffect {
  const node = new BackgroundNode(options);
  return new VisualEffect('background', [node]);
} 