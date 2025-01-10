import { BaseEffectConfig, Position } from './base';

export type TextAnimation = 'none' | 'fade' | 'slide';

export interface TextEffectData extends BaseEffectConfig {
  type: 'text';
  id: string;
  text: string;
  font: string;
  fontSize: number;
  color: string;
  position: Position;
  startTime: number;
  endTime: number;
  animation: TextAnimation;
} 