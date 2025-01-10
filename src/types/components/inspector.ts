import { VisualEffectConfig } from '../effects';

export interface InspectorProps {
  selectedEffect?: VisualEffectConfig;
  onEffectUpdate: (effect: VisualEffectConfig) => void;
}

export interface EffectInspectorProps<T extends VisualEffectConfig> {
  effect: T;
  onEffectUpdate: (effect: T) => void;
} 