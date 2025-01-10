import React, { useState, useCallback } from 'react';
import { TextEffectData } from '../../../types/effects';
import { TextPreview } from './TextPreview';
import { Inspector } from '../../inspector/Inspector';
import { v4 as uuidv4 } from 'uuid';
import './TextSettings.css';

interface TextSettingsProps {
  onTextEffectsChange: (effects: TextEffectData[]) => void;
}

export const TextSettings: React.FC<TextSettingsProps> = ({
  onTextEffectsChange
}) => {
  const [textEffects, setTextEffects] = useState<TextEffectData[]>([]);
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  // 新しいテキストエフェクトの追加
  const handleAddText = () => {
    const newEffect: TextEffectData = {
      id: uuidv4(),
      type: 'text',
      text: '新しいテキスト',
      font: 'Arial',
      fontSize: 24,
      color: '#ffffff',
      position: { x: 100, y: 100 },
      opacity: 1,
      blendMode: 'source-over' as GlobalCompositeOperation,
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
  const handleUpdateText = useCallback((id: string, updates: Partial<TextEffectData>) => {
    setTextEffects(prevEffects => {
      const updatedEffects = prevEffects.map(effect =>
        effect.id === id ? { ...effect, ...updates } : effect
      );
      onTextEffectsChange(updatedEffects);
      return updatedEffects;
    });
  }, [onTextEffectsChange]);

  const selectedEffect = textEffects.find(e => e.id === selectedEffectId);

  return (
    <div className="text-settings">
      <div className="text-settings-toolbar">
        <button onClick={handleAddText}>テキストを追加</button>
        {selectedEffectId && (
          <button onClick={() => handleDeleteText(selectedEffectId)}>
            選択中のテキストを削除
          </button>
        )}
      </div>
      <div className="text-settings-list">
        {textEffects.map(effect => (
          <TextPreview
            key={effect.id}
            effect={effect}
            isSelected={selectedEffectId === effect.id}
            onClick={() => setSelectedEffectId(effect.id)}
            onPositionChange={(newPos) => handleUpdateText(effect.id, { position: newPos })}
          />
        ))}
      </div>
      {selectedEffect && (
        <Inspector
          selectedEffect={selectedEffect}
          effectType="text"
          onEffectUpdate={(_, updates) => handleUpdateText(selectedEffect.id, updates as Partial<TextEffectData>)}
        />
      )}
    </div>
  );
}; 