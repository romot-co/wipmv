import { Position, Size, CoordinateSystem, BlendMode, VideoSettings } from './base';
import { Animation, BackgroundAnimation, WaveformAnimation, WatermarkAnimation } from './animation';

/**
 * エフェクト関連の型定義
 */

/**
 * エフェクトの種類
 */
export type EffectType = 'background' | 'text' | 'waveform' | 'watermark';

/**
 * エフェクトの基本設定
 */
export interface BaseEffectConfig {
  id: string;
  type: EffectType;
  visible?: boolean;
  zIndex?: number;
  position: Position;
  size: Size;
  coordinateSystem?: CoordinateSystem;
  opacity?: number;
  blendMode?: BlendMode;
  startTime?: number;
  endTime?: number;
  animation?: Animation;
}

/**
 * フォント設定
 */
export interface FontConfig {
  family: string;
  size: number;
  weight?: number | string;
}

/**
 * テキストエフェクト設定
 */
export interface TextEffectConfig extends BaseEffectConfig {
  type: 'text';
  text: string;
  font: FontConfig;
  color: string;
  alignment?: 'left' | 'center' | 'right';
}

/**
 * 背景エフェクト設定
 */
export interface BackgroundEffectConfig extends BaseEffectConfig {
  type: 'background';
  backgroundType: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientColors?: [string, string];
  gradientDirection?: 'horizontal' | 'vertical' | 'radial';
  imageUrl?: string;
  imageSize?: 'cover' | 'contain' | 'stretch';
  imagePosition?: Position;
  animation?: BackgroundAnimation;
}

/**
 * 波形エフェクト設定
 */
export interface WaveformEffectConfig extends BaseEffectConfig {
  type: 'waveform';
  displayMode: 'waveform' | 'frequency';
  waveformType: 'bar' | 'line' | 'circle';
  barWidth: number;
  barGap: number;
  sensitivity: number;
  color: string;
  smoothingFactor: number;
  mirror: { vertical: boolean; horizontal: boolean };
  channelMode: 'mono' | 'stereo' | 'leftOnly' | 'rightOnly';
  windowSeconds: number;
  samplesPerSecond: number;
  useColorBands?: boolean;
  colorBands?: {
    ranges: Array<{
      min: number;
      max: number;
      color: string;
    }>;
  };
  animation?: WaveformAnimation;
}

/**
 * ウォーターマークエフェクト設定
 */
export interface WatermarkEffectConfig extends BaseEffectConfig {
  type: 'watermark';
  imageUrl?: string;
  rotation?: number;
  repeat?: boolean;
  animation?: WatermarkAnimation;
}

/**
 * 全エフェクトの設定の共通型
 */
export type EffectConfig = 
  | BackgroundEffectConfig 
  | TextEffectConfig 
  | WaveformEffectConfig 
  | WatermarkEffectConfig; 