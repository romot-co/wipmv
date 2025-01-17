import { 
  EffectType, 
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig,
  AudioSource
} from './types';

export function createDefaultBackgroundEffect(audioSource?: AudioSource): BackgroundEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: EffectType.Background,
    backgroundType: 'solid',
    color: '#000000',
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 0
  };
}

export function createDefaultWaveformEffect(audioSource?: AudioSource): WaveformEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: EffectType.Waveform,
    waveformType: 'bar',
    color: '#ffffff',
    barWidth: 3,
    barGap: 1,
    sensitivity: 2.0,
    smoothingFactor: 0.5,
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 0,
    mirror: true
  };
}

export function createDefaultTextEffect(audioSource?: AudioSource): TextEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: EffectType.Text,
    text: 'テキストを入力',
    fontFamily: 'Arial',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    position: { x: 400, y: 300 },
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
    type: EffectType.Watermark,
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