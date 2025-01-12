import { BaseEffectConfig } from './base';

/**
 * 背景エフェクト設定
 */
export interface BackgroundEffectConfig extends BaseEffectConfig {
  type: 'background';
  /** 背景色 */
  color?: string;
  /** グラデーション設定 */
  gradient?: {
    /** グラデーションタイプ */
    type: 'linear' | 'radial';
    /** カラー配列 */
    colors: string[];
    /** カラーストップ位置（0-1） */
    stops?: number[];
  };
}

export interface StoredImageBackgroundConfig extends BaseEffectConfig {
  type: 'image';
  imageData: string;
}

export type StoredBackgroundEffectConfig = ColorBackgroundConfig | StoredImageBackgroundConfig; 