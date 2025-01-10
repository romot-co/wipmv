import React, { useEffect, useRef } from 'react';
import { WaveformEffectConfig } from '../../types/effects';

interface WaveformRendererProps {
  effect: WaveformEffectConfig;
  audioData: Float32Array;
  canvasWidth: number;
  canvasHeight: number;
}

export const WaveformRenderer: React.FC<WaveformRendererProps> = ({
  effect,
  audioData,
  canvasWidth,
  canvasHeight
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
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
  );
}; 