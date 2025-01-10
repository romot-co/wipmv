import React from 'react';
import { WaveformEffectConfig } from '../../types/effects';
import { BoundingBox } from '../preview/BoundingBox';
import { WaveformRenderer } from './WaveformRenderer';

interface WaveformEffectProps {
  effect: WaveformEffectConfig;
  onEffectUpdate: (updatedEffect: WaveformEffectConfig) => void;
  isSelected: boolean;
  onSelect: () => void;
  canvasWidth: number;
  canvasHeight: number;
  audioData: Float32Array;
}

export const WaveformEffect: React.FC<WaveformEffectProps> = ({
  effect,
  onEffectUpdate,
  isSelected,
  onSelect,
  canvasWidth,
  canvasHeight,
  audioData
}) => {
  const handlePositionChange = (position: { x: number; y: number }) => {
    const normalizedY = (position.y / canvasHeight) * 100;
    onEffectUpdate({
      ...effect,
      verticalPosition: Math.max(0, Math.min(100, normalizedY))
    });
  };

  const handleSizeChange = (size: { width: number; height: number }) => {
    onEffectUpdate({
      ...effect,
      height: Math.max(10, Math.min(300, size.height))
    });
  };

  const verticalPosition = typeof effect.verticalPosition === 'number' ? effect.verticalPosition : 50;
  const position = {
    x: 0,
    y: Math.max(0, Math.min(canvasHeight, (verticalPosition / 100) * canvasHeight))
  };

  const size = {
    width: canvasWidth,
    height: Math.max(10, Math.min(300, effect.height || 100))
  };

  return (
    <div style={{ position: 'relative', width: canvasWidth, height: canvasHeight }}>
      <WaveformRenderer
        effect={effect}
        audioData={audioData}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
      />
      <BoundingBox
        initialPosition={position}
        initialSize={size}
        onPositionChange={handlePositionChange}
        onSizeChange={handleSizeChange}
        onSelect={onSelect}
        isSelected={isSelected}
        lockHorizontal={true}
      />
    </div>
  );
}; 