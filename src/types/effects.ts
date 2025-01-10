export interface BaseEffectConfig {
  type: string;
  opacity: number;
  blendMode: GlobalCompositeOperation;
}

export interface ColorBackgroundConfig extends BaseEffectConfig {
  type: 'color';
  color: string;
}

export interface ImageBackgroundConfig extends BaseEffectConfig {
  type: 'image';
  image: HTMLImageElement;
}

export type BackgroundEffectConfig = ColorBackgroundConfig | ImageBackgroundConfig;

export interface StoredImageBackgroundConfig extends BaseEffectConfig {
  type: 'image';
  imageData: string;
}

export type StoredBackgroundEffectConfig = ColorBackgroundConfig | StoredImageBackgroundConfig;

export interface WaveformEffectConfig extends BaseEffectConfig {
  type: 'waveform';
  color: string;
  lineWidth: number;
  height: number;
  verticalPosition: number;
}

export interface WatermarkConfig extends BaseEffectConfig {
  type: 'watermark';
  image: HTMLImageElement;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
}

export interface TextEffectData extends BaseEffectConfig {
  type: 'text';
  id: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  position: {
    x: number;
    y: number;
  };
  startTime: number;
  endTime: number;
  animation: 'none' | 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut';
}

export type VisualEffectConfig = BackgroundEffectConfig | WaveformEffectConfig | WatermarkConfig | TextEffectData; 