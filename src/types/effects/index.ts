import { BaseEffectConfig, EffectType } from './base';
import { BackgroundEffectConfig } from './background';
import { WaveformEffectConfig } from './waveform';
import { TextEffectConfig } from './text';
import { WatermarkConfig } from './watermark';

/**
 * 視覚エフェクト設定
 */
export type VisualEffectConfig =
  | BackgroundEffectConfig
  | WaveformEffectConfig
  | TextEffectConfig
  | WatermarkConfig;

// 型のエクスポート
export type {
  BaseEffectConfig,
  BackgroundEffectConfig,
  WaveformEffectConfig,
  TextEffectConfig,
  WatermarkConfig as WatermarkEffectConfig
}; 