import { Position, Size } from '../common';
import { AudioSource } from '../core';
import { VisualEffectConfig } from '../effects';

export interface PreviewPlayerProps {
  audioSource: AudioSource;
  effects: VisualEffectConfig[];
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onEffectSelect: (effect: VisualEffectConfig) => void;
  selectedEffect?: VisualEffectConfig;
}

export interface BoundingBoxProps {
  initialPosition: Position;
  initialSize: Size;
  onPositionChange: (position: Position) => void;
  onSizeChange: (size: Size) => void;
  onSelect: () => void;
  isSelected: boolean;
  lockHorizontal?: boolean;
  lockVertical?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
} 