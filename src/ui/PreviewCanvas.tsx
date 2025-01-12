import { useEffect, useRef, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  // キャンバスのリサイズ処理
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // アスペクト比を維持しながらリサイズ
    const scale = Math.min(
      containerWidth / width,
      containerHeight / height
    );

    const scaledWidth = Math.floor(width * scale);
    const scaledHeight = Math.floor(height * scale);

    canvasRef.current.style.width = `${scaledWidth}px`;
    canvasRef.current.style.height = `${scaledHeight}px`;

    // 実際のキャンバスサイズは元のサイズを維持
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // エフェクトマネージャーに通知
    if (managerRef.current) {
      managerRef.current.setCanvas(canvasRef.current);
    }
  }, [width, height]);

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

    // リサイズイベントの設定
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, [width, height, onManagerInit, handleResize]);

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
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
} 