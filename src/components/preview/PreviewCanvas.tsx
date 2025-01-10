import React, { useRef, useEffect, memo } from 'react';
import { VisualEffect } from '../../services/effects/core/VisualEffect';

interface PreviewCanvasProps {
  width: number;
  height: number;
  currentTime: number;
  audioData?: Float32Array;
  effects: VisualEffect[];
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = memo(({
  width,
  height,
  currentTime,
  audioData,
  effects
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement>();

  // オフスクリーンキャンバスの初期化
  useEffect(() => {
    offscreenCanvasRef.current = document.createElement('canvas');
    offscreenCanvasRef.current.width = width;
    offscreenCanvasRef.current.height = height;
  }, [width, height]);

  // レンダリング
  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!canvas || !offscreenCanvas || !audioData) return;

    const ctx = canvas.getContext('2d');
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!ctx || !offscreenCtx) return;

    // オフスクリーンキャンバスをクリア
    offscreenCtx.clearRect(0, 0, width, height);

    // エフェクトをオフスクリーンキャンバスに描画
    effects.forEach(effect => {
      effect.render(offscreenCtx, {
        width,
        height,
        currentTime,
        audioData
      });
    });

    // メインキャンバスに一度に描画
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(offscreenCanvas, 0, 0);
  }, [width, height, currentTime, audioData, effects]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="preview-canvas"
    />
  );
}, (prevProps, nextProps) => {
  // プロパティの比較関数
  return (
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.currentTime === nextProps.currentTime &&
    prevProps.audioData === nextProps.audioData &&
    prevProps.effects === nextProps.effects
  );
}); 