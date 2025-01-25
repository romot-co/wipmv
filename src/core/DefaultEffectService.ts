import { 
  EffectType, 
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig
} from './types/effect';
import { AudioSource } from './types/base';

export function createDefaultBackgroundEffect(audioSource?: AudioSource): BackgroundEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: 'background',
    backgroundType: 'solid',
    color: '#000000',
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 0,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    coordinateSystem: 'relative'
  };
}

export function createDefaultWaveformEffect(audioSource?: AudioSource): WaveformEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: 'waveform',
    waveformType: 'bar',
    displayMode: 'waveform',
    channelMode: 'mono',
    windowSeconds: 0.5,
    samplesPerSecond: 60,
    color: '#ff0000',
    barWidth: 4,
    barGap: 2,
    sensitivity: 3.0,
    smoothingFactor: 0.5,
    opacity: 1.0,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 1,
    position: { x: 0, y: 0 },
    size: { width: 1280, height: 720 },
    coordinateSystem: 'absolute',
    mirror: {
      vertical: true,
      horizontal: false
    }
  };
}

export function createDefaultTextEffect(audioSource?: AudioSource): TextEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    text: 'テキストを入力',
    font: {
      family: 'Arial',
      size: 48,
      weight: 'bold'
    },
    color: '#ffffff',
    position: { x: 400, y: 300 },
    size: { width: 200, height: 60 },
    coordinateSystem: 'relative',
    alignment: 'center',
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 0
  };
}

export function createDefaultWatermarkEffect(audioSource?: AudioSource): WatermarkEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: 'watermark',
    imageUrl: '/assets/default-watermark.svg',
    position: { x: 20, y: 20 },
    size: { width: 100, height: 100 },
    rotation: 0,
    repeat: false,
    opacity: 0.5,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 0
  };
} 