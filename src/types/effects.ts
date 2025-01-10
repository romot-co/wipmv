export interface BaseEffectConfig {
  opacity: number;
  blendMode: GlobalCompositeOperation;
  startTime?: number;
  endTime?: number;
  zIndex?: number;
}

export interface BackgroundEffectConfig extends BaseEffectConfig {
  type: 'background';
  style: 'color' | 'image';
  color?: string;
  image?: HTMLImageElement;
}

export interface WaveformEffectConfig extends BaseEffectConfig {
  type: 'waveform';
  style: 'line' | 'bar' | 'circle';
  color: string;
  lineWidth: number;
  height: number;
  verticalPosition: number;
}

export interface TextEffectConfig extends BaseEffectConfig {
  type: 'text';
  id: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  position: { x: number; y: number };
  animation?: 'none' | 'fade' | 'slide';
}

export interface WatermarkConfig extends BaseEffectConfig {
  type: 'watermark';
  image: HTMLImageElement;
  position: { x: number; y: number };
  size: { width: number; height: number };
  maintainAspectRatio: boolean;
}

export type VisualEffectConfig =
  | BackgroundEffectConfig
  | WaveformEffectConfig
  | TextEffectConfig
  | WatermarkConfig; 