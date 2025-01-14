import { useEffect, useRef, useCallback } from 'react';
import { EffectManager } from '../core/EffectManager';
import { Renderer } from '../core/Renderer';

interface PreviewCanvasProps {
  isPlaying: boolean;
  waveformData: Float32Array;
  frequencyData: Uint8Array;
  onManagerInit: (manager: EffectManager) => void;
  videoSettings: {
    width: number;
    height: number;
    frameRate: number;
    videoBitrate: number;
    audioBitrate: number;
  };
}

/**
 * プレビューキャンバスコンポーネント
 * エフェクトのリアルタイムプレビューを表示
 */
export function PreviewCanvas({
  isPlaying,
  waveformData,
  frequencyData,
  onManagerInit,
  videoSettings,
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

    // アスペクト比を計算
    const targetAspectRatio = videoSettings.width / videoSettings.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let scaledWidth: number;
    let scaledHeight: number;

    if (containerAspectRatio > targetAspectRatio) {
      // コンテナが横長の場合、高さに合わせる
      scaledHeight = containerHeight;
      scaledWidth = containerHeight * targetAspectRatio;
    } else {
      // コンテナが縦長の場合、幅に合わせる
      scaledWidth = containerWidth;
      scaledHeight = containerWidth / targetAspectRatio;
    }

    // スケールを計算（2の倍数に丸める）
    scaledWidth = Math.floor(scaledWidth / 2) * 2;
    scaledHeight = Math.floor(scaledHeight / 2) * 2;

    canvasRef.current.style.width = `${scaledWidth}px`;
    canvasRef.current.style.height = `${scaledHeight}px`;

    // 実際のキャンバスサイズを設定
    canvasRef.current.width = videoSettings.width;
    canvasRef.current.height = videoSettings.height;

    // レンダラーのサイズも更新
    if (managerRef.current) {
      const renderer = managerRef.current.getRenderer();
      renderer.setSize(videoSettings.width, videoSettings.height);
      managerRef.current.render();
    }
  }, [videoSettings]);

  // キャンバスの初期化とエフェクトマネージャーの設定
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // キャンバスのサイズを設定
    canvas.width = videoSettings.width;
    canvas.height = videoSettings.height;

    // エフェクトマネージャーの初期化
    if (!managerRef.current) {
      const renderer = new Renderer(canvas);
      const manager = new EffectManager(renderer);
      managerRef.current = manager;
      onManagerInit(manager);
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
  }, [videoSettings, onManagerInit, handleResize]);

  // オーディオデータの更新
  useEffect(() => {
    if (!managerRef.current) return;
    
    if (waveformData && frequencyData) {
      managerRef.current.updateParams({
        waveformData,
        frequencyData
      });
      
      // 停止中は1回だけ描画
      if (!isPlaying) {
        managerRef.current.render();
      }
    }
  }, [waveformData, frequencyData, isPlaying]);

  // 再生状態の管理
  useEffect(() => {
    if (!managerRef.current) return;
    
    if (isPlaying) {
      managerRef.current.startRenderLoop();
    } else {
      managerRef.current.stopRenderLoop();
      // 停止時に1回だけ描画
      managerRef.current.render();
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
        backgroundColor: 'var(--gray-1)',
        overflow: 'hidden',
        borderRadius: 'var(--radius-3)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      />
    </div>
  );
} 