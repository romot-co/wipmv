import React, { useEffect, useRef, memo, useCallback } from 'react';
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
export const PreviewCanvas = memo(({
  onManagerInit,
  videoSettings,
}: PreviewCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const managerRef = useRef<EffectManager | null>(null);
  const isInitializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // レンダラーの更新処理
  const updateRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    const manager = managerRef.current;
    if (!canvas || !manager) return;

    console.log('PreviewCanvas: レンダラー更新', {
      width: videoSettings.width,
      height: videoSettings.height
    });

    // キャンバスサイズの設定
    canvas.width = videoSettings.width;
    canvas.height = videoSettings.height;

    // レンダラーのサイズ更新
    const renderer = manager.getRenderer();
    renderer.setSize(videoSettings.width, videoSettings.height);
    
    // 強制的に再レンダリング
    requestAnimationFrame(() => {
      if (managerRef.current) {
        managerRef.current.render();
      }
    });
  }, [videoSettings.width, videoSettings.height]);

  // 初期化処理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    console.log('PreviewCanvas: EffectManager初期化開始');
    const renderer = new Renderer(canvas);
    const manager = new EffectManager(renderer);
    managerRef.current = manager;
    isInitializedRef.current = true;

    // 初期サイズを設定
    updateRenderer();
    
    // マネージャーを親コンポーネントに通知
    onManagerInit(manager);
    console.log('PreviewCanvas: EffectManager初期化完了');

    // クリーンアップ
    return () => {
      console.log('PreviewCanvas: クリーンアップ開始');
      if (managerRef.current) {
        managerRef.current.stopRenderLoop();
        managerRef.current.dispose();
        managerRef.current = null;
        isInitializedRef.current = false;
      }
      console.log('PreviewCanvas: クリーンアップ完了');
    };
  }, []); // 依存配列を空にして、初期化を1回だけ行う

  // サイズ更新処理
  useEffect(() => {
    if (!isInitializedRef.current) return;
    updateRenderer();
  }, [updateRenderer]);

  // アスペクト比を計算
  const aspectRatio = videoSettings.width / videoSettings.height;

  return (
    <div 
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          paddingBottom: `${(1 / aspectRatio) * 100}%`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <canvas 
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  );
});

PreviewCanvas.displayName = 'PreviewCanvas';