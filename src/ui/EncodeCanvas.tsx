import React, { useEffect, useRef } from 'react';
import { EffectManager } from '../core/EffectManager';
import { Renderer } from '../core/Renderer';

interface EncodeCanvasProps {
  width: number;
  height: number;
  onInit?: (manager: EffectManager) => void;
}

export const EncodeCanvas: React.FC<EncodeCanvasProps> = ({
  width,
  height,
  onInit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // 高解像度用のレンダラーとマネージャーを初期化
    const renderer = new Renderer(canvasRef.current);
    const manager = new EffectManager(renderer);

    // 外部に EffectManager を渡す
    onInit?.(manager);

    return () => {
      // クリーンアップ
      manager.dispose();
    };
  }, [width, height, onInit]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ display: 'none' }} // DOMには存在するが非表示
    />
  );
}; 