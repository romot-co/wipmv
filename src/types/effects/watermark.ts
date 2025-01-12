import { BaseEffectConfig, Position, Size } from './base';

/**
 * ウォーターマークエフェクト設定
 */
export interface WatermarkEffectConfig extends BaseEffectConfig {
  type: 'watermark';
  /** 画像 */
  image: HTMLImageElement;
  /** 位置 */
  position: Position;
  /** サイズ */
  size: Size;
  /** アスペクト比を維持するか */
  maintainAspectRatio: boolean;
  /** 回転角度（度） */
  rotation?: number;
  /** 反転設定 */
  flip?: {
    /** 水平反転 */
    horizontal: boolean;
    /** 垂直反転 */
    vertical: boolean;
  };
  /** 配置 */
  alignment?: 'left' | 'center' | 'right';
} 