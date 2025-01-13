import React from 'react';
import { EffectBase } from '../core/EffectBase';
import { EffectType } from '../core/types';
import './EffectList.css';

interface Props {
  effects: EffectBase[];
  selectedEffectId?: string;
  onEffectSelect: (id: string) => void;
  onEffectRemove: (id: string) => void;
  onEffectMove: (id: string, direction: 'up' | 'down') => void;
}

// エフェクトタイプごとのアイコンとラベル
const effectTypeInfo = {
  [EffectType.Background]: { icon: '🎨', label: '背景' },
  [EffectType.Text]: { icon: '📝', label: 'テキスト' },
  [EffectType.Waveform]: { icon: '📊', label: '波形' },
  [EffectType.Watermark]: { icon: '🖼', label: '透かし' },
};

export const EffectList: React.FC<Props> = ({
  effects,
  selectedEffectId,
  onEffectSelect,
  onEffectRemove,
  onEffectMove
}) => {
  // エフェクトを逆順に表示（zIndexが大きい順）
  const sortedEffects = [...effects].reverse();

  return (
    <div className="effect-list">
      {sortedEffects.map((effect, index) => {
        const config = effect.getConfig();
        const typeInfo = effectTypeInfo[config.type];
        const isSelected = config.id === selectedEffectId;

        return (
          <div
            key={config.id}
            className={`effect-item ${isSelected ? 'selected' : ''}`}
            onClick={() => onEffectSelect(config.id)}
          >
            <div className="effect-item-content">
              <div className="effect-item-icon">
                {typeInfo.icon}
              </div>
              <div className="effect-item-type">
                {typeInfo.label}
              </div>
              <div className="effect-item-index">
                (z-index: {config.zIndex})
              </div>
            </div>
            <div className="effect-item-controls">
              <button
                className="effect-item-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEffectMove(config.id, 'up');
                }}
                disabled={index === 0}
                title="上へ移動"
              >
                ↑
              </button>
              <button
                className="effect-item-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEffectMove(config.id, 'down');
                }}
                disabled={index === sortedEffects.length - 1}
                title="下へ移動"
              >
                ↓
              </button>
              <button
                className="effect-item-button delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onEffectRemove(config.id);
                }}
                title="削除"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 