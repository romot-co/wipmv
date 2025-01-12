import { BaseEffectConfig } from './base';

/** 波形スタイル */
export type WaveformStyle = 'line' | 'bars' | 'mirror';

/** 波形データ設定 */
export interface WaveformDataConfig {
  /** 波形の増幅率 */
  amplification: number;
  /** スムージング値 (0-1) */
  smoothing: number;
}

/** 波形スタイル設定 */
export interface WaveformStyleConfig {
  /** 波形の表示スタイル */
  type: WaveformStyle;
  /** 波形の色 */
  color: string;
  /** 線の太さ */
  lineWidth: number;
  /** 波形の高さ */
  height: number;
  /** 垂直位置 (0-100%) */
  verticalPosition: number;
  /** バーの幅 (bars/mirror用) */
  barWidth?: number;
  /** バーの間隔 (bars/mirror用) */
  barSpacing?: number;
  /** ミラー表示時の中央の隙間 */
  mirrorGap?: number;
}

/** 波形エフェクト設定 */
export interface WaveformEffectConfig extends BaseEffectConfig {
  type: 'waveform';
  /** データ処理設定 */
  data: WaveformDataConfig;
  /** スタイル設定 */
  style: WaveformStyleConfig;
} 