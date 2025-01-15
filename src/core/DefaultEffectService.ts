import { 
  EffectType, 
  BackgroundEffectConfig,
  TextEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig
} from './types';

export function createDefaultBackgroundEffect(): BackgroundEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: EffectType.Background,
    backgroundType: 'color',
    color: '#000000',
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: 0,
    zIndex: 0
  };
}

export function createDefaultWaveformEffect(): WaveformEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: EffectType.Waveform,
    waveformType: 'bar',
    color: '#ffffff',
    position: { x: 0, y: 0 },
    size: { width: 800, height: 200 },
    barWidth: 4,
    barSpacing: 2,
    sensitivity: 1.0,
    smoothingFactor: 0.5,
    opacity: 1,
    blendMode: 'source-over',
    zIndex: 0
  };
}

export function createDefaultTextEffect(): TextEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: EffectType.Text,
    text: 'テキストを入力',
    fontFamily: 'Arial',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    align: 'center',
    position: { x: 400, y: 300 },
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: 0,
    zIndex: 0
  };
}

export function createDefaultWatermarkEffect(): WatermarkEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: EffectType.Watermark,
    imageUrl: '',
    position: { x: 20, y: 20 },
    size: { width: 100, height: 100 },
    rotation: 0,
    tiled: false,
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: 0,
    zIndex: 0
  };
} 