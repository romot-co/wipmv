import React, { useEffect, useRef } from 'react';
import { EffectManager } from '../core/EffectManager';

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

    // エフェクトマネージャーを初期化
    const manager = new EffectManager();
    manager.setPreviewCanvas(canvasRef.current);

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