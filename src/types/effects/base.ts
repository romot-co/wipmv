export interface BaseEffectConfig {
  type: string;
  opacity: number;
  blendMode: GlobalCompositeOperation;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type EffectNodeType = 
  | 'blend' 
  | 'transform' 
  | 'image' 
  | 'background' 
  | 'waveform' 
  | 'text' 
  | 'watermark'
  | 'waveform-data'
  | 'waveform-style'
  | 'text-animation';

export interface BaseNodeConfig {
  type: EffectNodeType;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

export interface BlendNodeConfig extends BaseNodeConfig {
  type: 'blend';
  mode: GlobalCompositeOperation;
  opacity: number;
}

export interface TransformNodeConfig extends BaseNodeConfig {
  type: 'transform';
  position?: Position;
  scale?: { x: number; y: number };
  rotation?: number;
  flip?: { horizontal: boolean; vertical: boolean };
  alignment?: 'left' | 'center' | 'right';
}

export interface ImageNodeConfig extends BaseNodeConfig {
  type: 'image';
  image: HTMLImageElement;
  position?: Position;
  size?: Size;
  scaleMode?: 'cover' | 'contain' | 'stretch';
}

export interface WaveformDataNodeConfig extends BaseNodeConfig {
  type: 'waveform-data';
  amplification: number;
  smoothing: number;
}

export interface WaveformStyleNodeConfig extends BaseNodeConfig {
  type: 'waveform-style';
  style: 'line' | 'bars' | 'mirror';
  color: string;
  lineWidth: number;
  height: number;
  verticalPosition: number;
  barWidth?: number;
  barSpacing?: number;
  mirrorGap?: number;
} 