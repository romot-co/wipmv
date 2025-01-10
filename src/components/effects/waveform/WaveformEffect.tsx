import React, { useEffect, useRef } from 'react';
import { WaveformEffectConfig } from '../../types/effects';
import { BoundingBox } from '../preview/BoundingBox';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 波形描画ロジック
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 波形の描画設定
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = effect.lineWidth;
    ctx.globalAlpha = effect.opacity;
    ctx.globalCompositeOperation = effect.blendMode as GlobalCompositeOperation;

    // 波形の描画
    const sliceWidth = canvasWidth / audioData.length;
    const waveformHeight = effect.height || 100;
    const verticalPosition = typeof effect.verticalPosition === 'number' ? effect.verticalPosition : 50;
    const centerY = Math.max(0, Math.min(canvasHeight, (verticalPosition / 100) * canvasHeight));

    ctx.beginPath();
    ctx.moveTo(0, centerY);

    for (let i = 0; i < audioData.length; i++) {
      const x = i * sliceWidth;
      const y = centerY + (audioData[i] * waveformHeight);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [effect, audioData, canvasWidth, canvasHeight]);

  // BoundingBox関連のハンドラー
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
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
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