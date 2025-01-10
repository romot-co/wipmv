import React, { useState, useCallback } from 'react';
import { TextEffectData } from '../types/effects';
import { BoundingBox } from './preview/BoundingBox';
import { Inspector } from './inspector/Inspector';
import { v4 as uuidv4 } from 'uuid';
import './TextEffectManager.css';

interface TextEffectManagerProps {
  onTextEffectsChange: (effects: TextEffectData[]) => void;
}

export const TextEffectManager: React.FC<TextEffectManagerProps> = ({
  onTextEffectsChange
}) => {
  const [textEffects, setTextEffects] = useState<TextEffectData[]>([]);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  // 新しいテキストエフェクトの追加
  const handleAddText = () => {
    const newEffect: TextEffectData = {
      id: uuidv4(),
      text: '新しいテキスト',
      font: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      position: { x: 100, y: 100 },
      opacity: 1,
      blendMode: 'normal',
      startTime: 0,
      endTime: 5000,
      animation: 'none'
    };

    const updatedEffects = [...textEffects, newEffect];
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
    setSelectedEffectId(newEffect.id);
  };

  // テキストエフェクトの削除
  const handleDeleteText = (id: string) => {
    const updatedEffects = textEffects.filter(effect => effect.id !== id);
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
    if (selectedEffectId === id) {
      setSelectedEffectId(null);
    }
  };

  // テキストエフェクトの更新
  const handleEffectUpdate = useCallback((updatedEffect: TextEffectData) => {
    const updatedEffects = textEffects.map(effect =>
      effect.id === updatedEffect.id ? updatedEffect : effect
    );
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
  }, [textEffects, onTextEffectsChange]);

  // 位置の更新
  const handlePositionChange = useCallback((id: string, position: { x: number; y: number }) => {
    const updatedEffects = textEffects.map(effect =>
      effect.id === id ? { ...effect, position } : effect
    );
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
  }, [textEffects, onTextEffectsChange]);

  // サイズの更新（フォントサイズの変更として扱う）
  const handleSizeChange = useCallback((id: string, size: { width: number; height: number }) => {
    const updatedEffects = textEffects.map(effect =>
      effect.id === id ? { ...effect, fontSize: Math.round(size.height) } : effect
    );
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
  }, [textEffects, onTextEffectsChange]);

  const selectedEffect = textEffects.find(effect => effect.id === selectedEffectId);

  return (
    <div className="text-effect-manager">
      <div className="text-effects-header">
        <h3>テキストエフェクト</h3>
        <button onClick={handleAddText}>追加</button>
      </div>

      <div className="text-effects-list">
        {textEffects.map(effect => (
          <div
            key={effect.id}
            className={`text-effect-item ${selectedEffectId === effect.id ? 'selected' : ''}`}
          >
            <div
              className="text-preview"
              onClick={() => setSelectedEffectId(effect.id)}
            >
              {effect.text}
            </div>
            <button
              className="delete-button"
              onClick={() => handleDeleteText(effect.id)}
            >
              削除
            </button>
            <BoundingBox
              initialPosition={effect.position}
              initialSize={{ width: effect.fontSize * 4, height: effect.fontSize }}
              onPositionChange={(pos) => handlePositionChange(effect.id, pos)}
              onSizeChange={(size) => handleSizeChange(effect.id, size)}
              onSelect={() => setSelectedEffectId(effect.id)}
              isSelected={selectedEffectId === effect.id}
            />
          </div>
        ))}
      </div>

      <Inspector
        selectedEffect={selectedEffect}
        onEffectUpdate={handleEffectUpdate}
      />
    </div>
  );
}; 