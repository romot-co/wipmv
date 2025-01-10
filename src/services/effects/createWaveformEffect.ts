import { VisualEffect } from './VisualEffect';
import { WaveformNode } from './nodes/WaveformNode';
import { WaveformEffectConfig } from '../../types/effects';

export function createWaveformEffect(options: Omit<WaveformEffectConfig, 'type'>): VisualEffect {
  const node = new WaveformNode(options);
  return new VisualEffect('waveform', [node]);
} 