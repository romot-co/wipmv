import React from 'react';
import { EffectType } from '../core/types';

interface AddEffectButtonProps {
  onAdd: (type: EffectType) => void;
}

export const AddEffectButton: React.FC<AddEffectButtonProps> = ({ onAdd }) => {
  return (
    <div className="add-effect-button">
      <button onClick={() => onAdd(EffectType.Background)}>背景を追加</button>
      <button onClick={() => onAdd(EffectType.Text)}>テキストを追加</button>
      <button onClick={() => onAdd(EffectType.Waveform)}>波形を追加</button>
      <button onClick={() => onAdd(EffectType.Watermark)}>ウォーターマークを追加</button>
    </div>
  );
}; 