import React, { useState, useCallback } from 'react';
import { BackgroundEffectConfig, WaveformEffectConfig, BaseEffectConfig } from '../../types/effects';
import { WaveformEffect } from './WaveformEffect';
import { Inspector, EffectType } from '../inspector/Inspector';
import './EffectManager.css';

interface EffectManagerProps {
  onEffectsChange: (effects: BaseEffectConfig[]) => void;
  initialEffects: {
    background: BackgroundEffectConfig;
    waveform: WaveformEffectConfig;
  };
  canvasWidth: number;
  canvasHeight: number;
  audioData: Float32Array;
}

export const EffectManager: React.FC<EffectManagerProps> = ({
  onEffectsChange,
  initialEffects,
  canvasWidth,
  canvasHeight,
  audioData
}) => {
  const [backgroundEffect, setBackgroundEffect] = useState<BackgroundEffectConfig>(initialEffects.background);
  const [waveformEffect, setWaveformEffect] = useState<WaveformEffectConfig>(initialEffects.waveform);
  const [selectedEffectType, setSelectedEffectType] = useState<EffectType | null>(null);

  const handleBackgroundChange = useCallback((newConfig: BackgroundEffectConfig) => {
    setBackgroundEffect(newConfig);
    onEffectsChange([newConfig, waveformEffect]);
  }, [waveformEffect, onEffectsChange]);

  const handleWaveformChange = useCallback((newConfig: WaveformEffectConfig) => {
    setWaveformEffect(newConfig);
    onEffectsChange([backgroundEffect, newConfig]);
  }, [backgroundEffect, onEffectsChange]);

  const getSelectedEffect = () => {
    switch (selectedEffectType) {
      case 'background':
        return backgroundEffect;
      case 'waveform':
        return waveformEffect;
      default:
        return null;
    }
  };

  const handleEffectUpdate = (updatedEffect: BaseEffectConfig) => {
    switch (selectedEffectType) {
      case 'background':
        handleBackgroundChange(updatedEffect as BackgroundEffectConfig);
        break;
      case 'waveform':
        handleWaveformChange(updatedEffect as WaveformEffectConfig);
        break;
    }
  };

  return (
    <div className="effect-manager">
      <h3>エフェクト設定</h3>

      <div className="effect-sections">
        <div className="effect-section">
          <h4>背景</h4>
          <div
            className={`effect-preview ${selectedEffectType === 'background' ? 'selected' : ''}`}
            onClick={() => setSelectedEffectType('background')}
          >
            {backgroundEffect.type === 'color' ? (
              <div
                className="color-preview"
                style={{ backgroundColor: backgroundEffect.color }}
              />
            ) : (
              backgroundEffect.image && (
                <img
                  src={backgroundEffect.image.src}
                  alt="背景プレビュー"
                  className="image-preview"
                />
              )
            )}
          </div>
        </div>

        <div className="effect-section">
          <h4>波形</h4>
          <div
            className={`effect-preview ${selectedEffectType === 'waveform' ? 'selected' : ''}`}
            onClick={() => setSelectedEffectType('waveform')}
          >
            <WaveformEffect
              effect={waveformEffect}
              onEffectUpdate={handleWaveformChange}
              isSelected={selectedEffectType === 'waveform'}
              onSelect={() => setSelectedEffectType('waveform')}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              audioData={audioData}
            />
          </div>
        </div>
      </div>

      <Inspector
        selectedEffect={getSelectedEffect()}
        effectType={selectedEffectType}
        onEffectUpdate={handleEffectUpdate}
      />
    </div>
  );
}; 