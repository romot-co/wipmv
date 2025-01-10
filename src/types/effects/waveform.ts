import { BaseEffectConfig } from './base';

export type WaveformStyle = 'line' | 'bars' | 'mirror';

export interface WaveformEffectConfig extends BaseEffectConfig {
  type: 'waveform';
  style: WaveformStyle;
  color: string;
  lineWidth: number;
  height: number;
  verticalPosition: number;
  amplification: number;
  smoothing: number;
  barWidth?: number;
  barSpacing?: number;
  mirrorGap?: number;
} 