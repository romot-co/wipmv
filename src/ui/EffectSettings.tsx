import React from 'react';
import { EffectManager } from '../core/EffectManager';
import { EffectConfig } from '../core/types';
import { Inspector } from './Inspector';

interface EffectSettingsProps {
  manager: EffectManager | null;
  selectedEffectId: string | undefined;
  onEffectChange: (config: Partial<EffectConfig>) => void;
}

export const EffectSettings: React.FC<EffectSettingsProps> = ({
  manager,
  selectedEffectId,
  onEffectChange,
}) => {
  if (!manager || !selectedEffectId) return null;

  const effect = manager.getEffect(selectedEffectId);
  if (!effect) return null;

  return (
    <div className="effect-settings">
      <h3>エフェクト設定</h3>
      <Inspector
        effect={effect}
        onChange={onEffectChange}
      />
    </div>
  );
}; 