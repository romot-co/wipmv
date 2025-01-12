import React, { useState } from 'react';
import { EffectManager } from '../core/EffectManager';
import { BackgroundEffect } from '../features/background/BackgroundEffect';
import { TextEffect } from '../features/text/TextEffect';
import { WatermarkEffect } from '../features/watermark/WatermarkEffect';
import { WaveformEffect } from '../features/waveform/WaveformEffect';
import { EffectType } from '../core/types';
import './AddEffectButton.css';

interface AddEffectButtonProps {
  manager: EffectManager | null;
}

const effectTypes: { type: EffectType; label: string }[] = [
  { type: EffectType.Background, label: '背景' },
  { type: EffectType.Text, label: 'テキスト' },
  { type: EffectType.Waveform, label: '波形' },
  { type: EffectType.Watermark, label: 'ウォーターマーク' }
];

export const AddEffectButton: React.FC<AddEffectButtonProps> = ({ manager }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  if (!manager) return null;

  const handleAddEffect = async (type: EffectType) => {
    setIsAdding(true);
    let effect;
    const zIndex = manager.getEffects().length;

    try {
      switch (type) {
        case EffectType.Background:
          effect = new BackgroundEffect({
            id: `background-${Date.now()}`,
            type: EffectType.Background,
            backgroundType: 'color',
            color: '#000000',
            zIndex,
            visible: true
          });
          break;
        case EffectType.Text:
          effect = new TextEffect({
            id: `text-${Date.now()}`,
            type: EffectType.Text,
            text: 'テキスト',
            style: {
              fontSize: 24,
              fontFamily: 'sans-serif',
              color: '#ffffff'
            },
            position: { x: 100, y: 100 },
            zIndex,
            visible: true
          });
          break;
        case EffectType.Waveform:
          effect = new WaveformEffect({
            id: `waveform-${Date.now()}`,
            type: EffectType.Waveform,
            position: { x: 0, y: 0, width: 800, height: 200 },
            colors: {
              primary: '#ffffff'
            },
            zIndex,
            visible: true
          });
          break;
        case EffectType.Watermark:
          effect = new WatermarkEffect({
            id: `watermark-${Date.now()}`,
            type: EffectType.Watermark,
            imageUrl: '',
            position: { x: 50, y: 50, width: 100, height: 100 },
            style: {
              opacity: 0.5,
              blendMode: 'source-over'
            },
            zIndex,
            visible: true
          });
          break;
      }

      if (effect) {
        await manager.addEffect(effect);
      }
    } catch (error) {
      console.error('エフェクトの追加に失敗しました:', error);
    } finally {
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="add-effect">
      <button
        className={`add-effect-button ${isAdding ? 'adding' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="エフェクトを追加"
        disabled={isAdding}
      >
        {isAdding ? '追加中...' : '＋ エフェクトを追加'}
      </button>
      {isOpen && (
        <div className="effect-type-menu">
          {effectTypes.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleAddEffect(type)}
              className="effect-type-item"
              disabled={isAdding}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 