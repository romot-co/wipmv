import { VisualEffect } from './VisualEffect';
import { BackgroundEffectConfig, WaveformEffectConfig } from '../../types/effects';

export function extractBackgroundConfig(effect: VisualEffect): BackgroundEffectConfig {
  const node = effect.getNodes()[0];
  const config = node.getConfig();
  return {
    type: config.type,
    color: config.type === 'color' ? config.color : undefined,
    image: config.type === 'image' ? config.image : undefined,
    opacity: config.opacity,
    blendMode: config.blendMode
  } as BackgroundEffectConfig;
}

export function extractWaveformConfig(effect: VisualEffect): WaveformEffectConfig {
  const node = effect.getNodes()[0];
  const config = node.getConfig();
  return {
    type: 'waveform',
    color: config.color,
    lineWidth: config.lineWidth,
    height: config.height,
    verticalPosition: config.verticalPosition,
    opacity: config.opacity,
    blendMode: config.blendMode
  } as WaveformEffectConfig;
} 