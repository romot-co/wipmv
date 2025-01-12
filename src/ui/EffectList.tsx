import React from 'react';
import { EffectManager } from '../core/EffectManager';

interface EffectListProps {
  manager: EffectManager | null;
  selectedEffectId: string | undefined;
  onEffectSelect: (id: string | undefined) => void;
  onEffectRemove: (id: string) => void;
}

export const EffectList: React.FC<EffectListProps> = ({
  manager,
  selectedEffectId,
  onEffectSelect,
  onEffectRemove,
}) => {
  if (!manager) return null;

  const effects = Array.from(manager.getEffects().entries());

  return (
    <div className="effect-list">
      <h3>エフェクト一覧</h3>
      {effects.length === 0 ? (
        <p>エフェクトがありません</p>
      ) : (
        <ul>
          {effects.map(([id, effect]) => (
            <li
              key={id}
              className={selectedEffectId === id ? 'selected' : ''}
              onClick={() => onEffectSelect(id)}
            >
              <span>{effect.getConfig().type}</span>
              <div className="effect-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    manager.moveEffectUp(id);
                  }}
                  disabled={effects[0][0] === id}
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    manager.moveEffectDown(id);
                  }}
                  disabled={effects[effects.length - 1][0] === id}
                >
                  ↓
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEffectRemove(id);
                  }}
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}; 