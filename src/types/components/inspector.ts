import { EffectType } from '../effects/base';
import { VisualEffectConfig } from '../effects';

/**
 * インスペクタのプロパティ
 */
export interface InspectorProps {
  /** 選択中のエフェクト */
  selectedEffect: VisualEffectConfig | null;
  /** 選択中のエフェクトタイプ */
  effectType: EffectType | null;
  /** エフェクトの更新 */
  onEffectUpdate: (type: EffectType, config: Partial<VisualEffectConfig>) => void;
  /** エフェクトの削除 */
  onEffectRemove: (type: EffectType) => void;
  /** エフェクトの作成 */
  onEffectCreate: (type: EffectType, config: VisualEffectConfig) => void;
}

export interface EffectInspectorProps<T extends VisualEffectConfig> {
  effect: T;
  onEffectUpdate: (effect: T) => void;
} 