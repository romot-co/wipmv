import { useEffect, useRef } from 'react';
import { EffectManager } from '../core/EffectManager';

interface PreviewCanvasProps {
  width: number;
  height: number;
  isPlaying: boolean;
  waveformData: Float32Array;
  frequencyData: Uint8Array;
  effectManager: EffectManager;
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
  effectManager,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // キャンバスの初期化とエフェクトマネージャーの設定
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバスのサイズを設定
    canvas.width = width;
    canvas.height = height;
    canvas.style.backgroundColor = '#000';

    // エフェクトマネージャーにキャンバスを設定
    effectManager.setCanvas(canvas);

    return () => {
      effectManager.clearCanvas();
    };
  }, [effectManager, width, height]);

  // オーディオデータの更新
  useEffect(() => {
    effectManager.updateAudioData(waveformData, frequencyData);
  }, [effectManager, waveformData, frequencyData]);

  // 再生状態の管理
  useEffect(() => {
    if (isPlaying) {
      effectManager.start();
    } else {
      effectManager.stop();
    }
  }, [effectManager, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: width,
        maxHeight: height,
      }}
    />
  );
} 