export * from './base';
export * from './background';
export * from './waveform';
export * from './watermark';
export * from './text';

import { BackgroundEffectConfig } from './background';
import { WaveformEffectConfig } from './waveform';
import { WatermarkConfig } from './watermark';
import { TextEffectData } from './text';

export type VisualEffectConfig = 
  | BackgroundEffectConfig 
  | WaveformEffectConfig 
  | WatermarkConfig 
  | TextEffectData; 