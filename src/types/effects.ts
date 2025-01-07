import { Position } from '../services/effects/nodes/ImageNode';

export interface VisualEffectConfig {
  type: string;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
  responsive?: {
    enabled: boolean;
    parameter: 'volume' | 'frequency' | 'amplitude';
    intensity: number;
  };
}

export interface WaveformEffectConfig extends VisualEffectConfig {
  type: 'waveform';
  color: string;
  lineWidth: number;
  height: number;
  verticalPosition: number;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

// 基本的な背景設定
export interface BaseBackgroundConfig extends VisualEffectConfig {
  type: 'color' | 'image';
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

// 色背景設定
export interface ColorBackgroundConfig extends BaseBackgroundConfig {
  type: 'color';
  color: string;
}

// 画像背景設定（実行時）
export interface ImageBackgroundConfig extends BaseBackgroundConfig {
  type: 'image';
  image: HTMLImageElement;
}

// 画像背景設定（保存時）
export interface StoredImageBackgroundConfig extends BaseBackgroundConfig {
  type: 'image';
  imageData: string;
}

// 統合型（実行時）
export type BackgroundEffectConfig = ColorBackgroundConfig | ImageBackgroundConfig;

// 統合型（保存時）
export type StoredBackgroundEffectConfig = ColorBackgroundConfig | StoredImageBackgroundConfig;

// 一時的な型（変換処理用）
export interface ConvertedBackgroundConfig extends StoredBackgroundEffectConfig {
  image?: HTMLImageElement;
}

export interface RippleEffectConfig extends VisualEffectConfig {
  type: 'ripple';
  color: string;
  radius: number;
  speed: number;
}

export interface FadeEffectConfig extends VisualEffectConfig {
  type: 'fade';
  direction: 'in' | 'out';
  duration: number;
}

export interface WaveformOptions {
  color: string;
  lineWidth: number;
  opacity: number;
}

export interface BarDrawerOptions {
  barColor: string;
  barWidth: number;
  barSpacing: number;
}

export interface RadialBarDrawerOptions extends BarDrawerOptions {
  centerX?: number;
  centerY?: number;
  radius?: number;
  drawDirection?: 'inner' | 'outer';
}

export interface ColorCyclerOptions {
  cycleSpeed: number;
}

export interface OpacityOptions {
  opacity: number;
}

export interface CanvasSizeOptions {
  width: number;
  height: number;
}

export interface BlendOptions {
  blendMode: GlobalCompositeOperation;
}

export interface BackgroundConfig {
  type: 'color' | 'image';
  value: string; // color: '#000000' or image: URL
}

export interface WatermarkConfig {
  image: string;
  position: {
    x: number; // 0-1の相対位置
    y: number; // 0-1の相対位置
  };
  size: {
    width: number; // 0-1の相対サイズ
    height: number; // 0-1の相対サイズ
  };
  opacity: number; // 0-1の不透明度
}

export interface TextEffectConfig extends VisualEffectConfig {
  type: 'text';
  text: string;
  font: string;
  fontSize: number;
  position: {
    x: number;
    y: number;
  };
  color: string;
  timing?: {
    start: number;
    end: number;
  };
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

export interface TextOptions {
  text: string;
  font?: string;
  fontSize?: number;
  position?: Position;
  color?: string;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
  timing?: {
    start: number;
    end: number;
  };
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

export interface TextEffectData {
  id: string;
  text: string;
  font: string;
  fontSize: number;
  position: Position;
  color: string;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  timing: {
    start: number;
    end: number;
  };
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
}

export interface WatermarkEffectConfig extends VisualEffectConfig {
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

export interface CreateWatermarkEffectOptions {
  image: HTMLImageElement;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

export const defaultBackgroundConfig: BackgroundConfig = {
  type: 'color',
  value: '#000000',
};

export const defaultWatermarkConfig: WatermarkConfig = {
  image: '',
  position: { x: 0.95, y: 0.95 },
  size: { width: 0.2, height: 0.1 },
  opacity: 0.8,
}; 