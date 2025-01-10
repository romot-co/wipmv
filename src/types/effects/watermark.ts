import { BaseEffectConfig, Position, Size } from './base';

export interface WatermarkConfig extends BaseEffectConfig {
  type: 'watermark';
  image: HTMLImageElement;
  position: Position;
  size: Size;
  maintainAspectRatio: boolean;
  rotation?: number;
  flip?: {
    horizontal: boolean;
    vertical: boolean;
  };
  alignment?: 'left' | 'center' | 'right';
} 