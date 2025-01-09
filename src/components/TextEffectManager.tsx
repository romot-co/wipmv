import React, { useState } from 'react';
import { TextEffectData } from '../types/effects';
import './TextEffectManager.css';

interface TextEffectManagerProps {
  onTextEffectsChange: (effects: TextEffectData[]) => void;
  initialEffects?: TextEffectData[];
}

export const TextEffectManager: React.FC<TextEffectManagerProps> = ({ 
  onTextEffectsChange,
  initialEffects = []
}) => {
  const [textEffects, setTextEffects] = useState<TextEffectData[]>(initialEffects);

  const addTextEffect = () => {
    const newEffect: TextEffectData = {
      id: crypto.randomUUID(),
      text: '',
      font: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif',
      fontSize: 24,
      position: { x: 0.5, y: 0.5 },
      color: '#ffffff',
      opacity: 1,
      blendMode: 'source-over',
      timing: { start: 0, end: 5000 },
      textAlign: 'center',
      textBaseline: 'middle'
    };

    const updatedEffects = [...textEffects, newEffect];
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
  };

  const updateTextEffect = (id: string, updates: Partial<TextEffectData>) => {
    const updatedEffects = textEffects.map(effect => 
      effect.id === id ? { ...effect, ...updates } : effect
    );
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
  };

  const removeTextEffect = (id: string) => {
    const updatedEffects = textEffects.filter(effect => effect.id !== id);
    setTextEffects(updatedEffects);
    onTextEffectsChange(updatedEffects);
  };

  return (
    <div className="text-effect-manager">
      <div className="text-effect-header">
        <h3>テキストエフェクト</h3>
        <button onClick={addTextEffect}>追加</button>
      </div>
      
      <div className="text-effect-list">
        {textEffects.map(effect => (
          <div key={effect.id} className="text-effect-item">
            <div className="text-effect-row">
              <input
                type="text"
                value={effect.text}
                onChange={e => updateTextEffect(effect.id, { text: e.target.value })}
                placeholder="テキストを入力"
              />
              <button onClick={() => removeTextEffect(effect.id)}>削除</button>
            </div>
            
            <div className="text-effect-controls">
              <div className="control-group">
                <label>フォント</label>
                <input
                  type="text"
                  value={effect.font}
                  onChange={e => updateTextEffect(effect.id, { font: e.target.value })}
                />
              </div>

              <div className="control-group">
                <label>フォントサイズ</label>
                <input
                  type="number"
                  min="8"
                  max="200"
                  value={effect.fontSize}
                  onChange={e => updateTextEffect(effect.id, { fontSize: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="control-group">
                <label>色</label>
                <input
                  type="color"
                  value={effect.color}
                  onChange={e => updateTextEffect(effect.id, { color: e.target.value })}
                />
              </div>
              
              <div className="control-group">
                <label>不透明度</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effect.opacity}
                  onChange={e => updateTextEffect(effect.id, { opacity: parseFloat(e.target.value) })}
                />
              </div>
              
              <div className="control-group">
                <label>開始時間 (ms)</label>
                <input
                  type="number"
                  value={effect.timing.start}
                  onChange={e => updateTextEffect(effect.id, { 
                    timing: { ...effect.timing, start: parseInt(e.target.value) }
                  })}
                />
              </div>
              
              <div className="control-group">
                <label>終了時間 (ms)</label>
                <input
                  type="number"
                  value={effect.timing.end}
                  onChange={e => updateTextEffect(effect.id, {
                    timing: { ...effect.timing, end: parseInt(e.target.value) }
                  })}
                />
              </div>
              
              <div className="control-group">
                <label>位置 X</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effect.position.x}
                  onChange={e => updateTextEffect(effect.id, {
                    position: { ...effect.position, x: parseFloat(e.target.value) }
                  })}
                />
              </div>
              
              <div className="control-group">
                <label>位置 Y</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={effect.position.y}
                  onChange={e => updateTextEffect(effect.id, {
                    position: { ...effect.position, y: parseFloat(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 