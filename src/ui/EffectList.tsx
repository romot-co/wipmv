import React, { useState } from 'react';
import { EffectManager } from '../core/EffectManager';

interface EffectListProps {
  manager: EffectManager | null;
  selectedEffectId: string | undefined;
  onEffectSelect: (id: string | undefined) => void;
  onEffectRemove: (id: string) => void;
}

type MovementState = {
  id: string;
  direction: 'up' | 'down';
} | null;

export const EffectList: React.FC<EffectListProps> = ({
  manager,
  selectedEffectId,
  onEffectSelect,
  onEffectRemove,
}) => {
  const [movementState, setMovementState] = useState<MovementState>(null);

  if (!manager) return null;

  const effects = manager.getEffects();

  const handleMoveUp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMovementState({ id, direction: 'up' });
    manager.moveEffectUp(id);
    setTimeout(() => setMovementState(null), 300);
  };

  const handleMoveDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMovementState({ id, direction: 'down' });
    manager.moveEffectDown(id);
    setTimeout(() => setMovementState(null), 300);
  };

  return (
    <div className="effect-list">
      <h3>エフェクト一覧</h3>
      {effects.length === 0 ? (
        <p>エフェクトがありません</p>
      ) : (
        <ul>
          {effects.map((effect, index) => {
            const id = effect.getConfig().id;
            const isMoving = movementState?.id === id;
            const movingClass = isMoving
              ? movementState.direction === 'up'
                ? 'moving-up'
                : 'moving-down'
              : '';

            return (
              <li
                key={id}
                className={`
                  ${selectedEffectId === id ? 'selected' : ''}
                  ${movingClass}
                `}
                onClick={() => onEffectSelect(id)}
              >
                <span>{effect.getConfig().type}</span>
                <div className="effect-actions">
                  <button
                    onClick={(e) => handleMoveUp(id, e)}
                    disabled={index === 0}
                    title="上に移動"
                  >
                    ↑
                  </button>
                  <button
                    onClick={(e) => handleMoveDown(id, e)}
                    disabled={index === effects.length - 1}
                    title="下に移動"
                  >
                    ↓
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEffectRemove(id);
                    }}
                    title="削除"
                  >
                    削除
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}; 