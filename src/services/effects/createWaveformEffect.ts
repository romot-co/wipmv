import { VisualEffect } from './VisualEffect';
import { WaveformNode, WaveformOptions } from './nodes/WaveformNode';

export function createWaveformEffect(options: Omit<WaveformOptions, 'type'>): VisualEffect {
  const node = new WaveformNode({
    type: 'waveform',
    ...options
  });
  return new VisualEffect('waveform', [node]);
} 