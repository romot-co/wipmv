import { useEffect, useRef } from 'react';
import { EffectManager } from '../core/EffectManager';

interface PreviewCanvasProps {
  width: number;
  height: number;
  isPlaying: boolean;
  waveformData: Float32Array;
  frequencyData: Uint8Array;
  onManagerInit: (manager: EffectManager) => void;
}

/**
 * プレビューキャンバスコンポーネント
 * エフェクトのリアルタイムプレビューを表示
 */
export function PreviewCanvas({
  width,
  height,
  isPlaying,
  waveformData,
  frequencyData,
  onManagerInit,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<EffectManager | null>(null);

  // キャンバスの初期化とエフェクトマネージャーの設定
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバスのサイズを設定
    canvas.width = width;
    canvas.height = height;

    // エフェクトマネージャーの初期化
    if (!managerRef.current) {
      const manager = new EffectManager(canvas);
      managerRef.current = manager;
      onManagerInit(manager);
    } else {
      managerRef.current.setCanvas(canvas);
    }

    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [width, height, onManagerInit]);

  // オーディオデータの更新
  useEffect(() => {
    if (!managerRef.current) return;
    if (waveformData && frequencyData) {
      managerRef.current.updateAudioData(waveformData, frequencyData);
      if (!isPlaying) {
        managerRef.current.render(); // 停止中でも表示を更新
      }
    }
  }, [waveformData, frequencyData, isPlaying]);

  // 再生状態の管理
  useEffect(() => {
    if (!managerRef.current) return;
    
    if (isPlaying) {
      managerRef.current.start();
    } else {
      managerRef.current.stop();
    }
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: width,
        maxHeight: height,
        backgroundColor: '#000',
      }}
    />
  );
} 