import { useEffect, useRef, useCallback } from 'react';
import { EffectManager } from '../core/EffectManager';
import { Renderer } from '../core/Renderer';

// PreviewCanvas が受け取るpropsをシンプルにする
interface PreviewCanvasProps {
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
 * プレビューキャンバス
 * - Canvasを初期化し、EffectManagerをインスタンス化
 * - リサイズ処理のみ担当
 */
export function PreviewCanvas({
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
      // コンテナが横長 => 高さに合わせる
      scaledHeight = containerHeight;
      scaledWidth = containerHeight * targetAspectRatio;
    } else {
      // コンテナが縦長 => 幅に合わせる
      scaledWidth = containerWidth;
      scaledHeight = containerWidth / targetAspectRatio;
    }

    // スケールを2の倍数に丸める(任意)
    scaledWidth = Math.floor(scaledWidth / 2) * 2;
    scaledHeight = Math.floor(scaledHeight / 2) * 2;

    // DOM上のサイズだけ変更
    const canvas = canvasRef.current;
    canvas.style.width = `${scaledWidth}px`;
    canvas.style.height = `${scaledHeight}px`;

    // 実際の内部解像度
    canvas.width = videoSettings.width;
    canvas.height = videoSettings.height;

    // EffectManagerにサイズを合わせる
    if (managerRef.current) {
      const renderer = managerRef.current.getRenderer();
      renderer.setSize(videoSettings.width, videoSettings.height);
      managerRef.current.render(); // リサイズ後に1回描画
    }
  }, [videoSettings]);

  // マウント時とvideoSettings変更時に実行
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 初期サイズ
    canvas.width = videoSettings.width;
    canvas.height = videoSettings.height;

    // EffectManager 初期化
    if (!managerRef.current) {
      // Rendererは例示用, 実際にはcanvasに直接ctxを取る形でもOK
      const renderer = new Renderer(canvas);
      const manager = new EffectManager(renderer);
      managerRef.current = manager;

      // 親へ通知
      onManagerInit(manager);
    }

    // リサイズイベントを設定
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (managerRef.current) {
        // dispose
        managerRef.current.stopRenderLoop();
        managerRef.current = null;
      }
    };
  }, [videoSettings, onManagerInit, handleResize]);

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