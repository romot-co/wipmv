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
    color: '#3b82f6', // 一時的に青色に変更してテスト
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 10,
    position: { x: 0, y: 0 },
    size: { width: 1280, height: 720 },
    coordinateSystem: 'absolute'
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
    zIndex: 30,
    position: { x: 0, y: 100 },
    size: { width: 1280, height: 520 },
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
    position: { x: 640, y: 360 },
    size: { width: 300, height: 60 },
    coordinateSystem: 'absolute',
    alignment: 'center',
    opacity: 1,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 100
  };
}

export function createDefaultWatermarkEffect(audioSource?: AudioSource): WatermarkEffectConfig {
  return {
    id: crypto.randomUUID(),
    type: 'watermark',
    imageUrl: '/assets/default-watermark.svg',
    position: { x: 640, y: 360 },
    size: { width: 200, height: 140 },
    rotation: 0,
    repeat: false,
    opacity: 0.8,
    blendMode: 'source-over',
    visible: true,
    startTime: 0,
    endTime: audioSource?.duration ?? 0,
    zIndex: 40,
    coordinateSystem: 'absolute'
  };
} 