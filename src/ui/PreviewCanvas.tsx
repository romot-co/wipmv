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
 * エフェクトのリアルタイムプレビューを提供する
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

  // Rendererの初期化
  useEffect(() => {
    if (!canvasRef.current) return;

    // キャンバスのサイズを設定
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    return () => {
      // クリーンアップ
      effectManager.dispose();
    };
  }, [width, height, effectManager]);

  // オーディオデータの更新
  useEffect(() => {
    if (waveformData && frequencyData) {
      effectManager.updateAudioData(waveformData, frequencyData);
    }
  }, [waveformData, frequencyData, effectManager]);

  // 再生状態の管理
  useEffect(() => {
    if (isPlaying) {
      effectManager.start();
    } else {
      effectManager.stop();
    }

    return () => {
      effectManager.stop();
    };
  }, [isPlaying, effectManager]);

  return (
    <canvas
      id="preview-canvas"
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height: 'auto', backgroundColor: '#000000' }}
    />
  );
} 