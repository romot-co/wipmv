import { BaseEffectConfig } from './base';

export type BackgroundStyle = 'color' | 'image';

export interface ColorBackgroundConfig extends BaseEffectConfig {
  type: 'background';
  style: 'color';
  color: string;
}

export interface ImageBackgroundConfig extends BaseEffectConfig {
  type: 'background';
  style: 'image';
  image: HTMLImageElement;
}

export type BackgroundEffectConfig = ColorBackgroundConfig | ImageBackgroundConfig;

export interface StoredImageBackgroundConfig extends BaseEffectConfig {
  type: 'image';
  imageData: string;
}

export type StoredBackgroundEffectConfig = ColorBackgroundConfig | StoredImageBackgroundConfig; 