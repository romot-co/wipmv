import React, { useEffect, useRef, memo } from 'react';
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

  // 初期化処理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    console.log('PreviewCanvas: EffectManager初期化開始');
    const renderer = new Renderer(canvas);
    const manager = new EffectManager(renderer);
    managerRef.current = manager;
    isInitializedRef.current = true;
    onManagerInit(manager);
    console.log('PreviewCanvas: EffectManager初期化完了');

    // コンポーネントのアンマウント時のみクリーンアップを実行
    return () => {
      if (managerRef.current) {
        console.log('PreviewCanvas: EffectManager破棄');
        managerRef.current.stopRenderLoop();
        managerRef.current.dispose();
        managerRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, []); // 依存配列を空にして初期化は1回だけ実行

  // サイズ更新処理
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !managerRef.current) return;

    // キャンバスサイズの設定
    canvas.width = videoSettings.width;
    canvas.height = videoSettings.height;

    // レンダラーのサイズ更新
    const renderer = managerRef.current.getRenderer();
    renderer.setSize(videoSettings.width, videoSettings.height);
    managerRef.current.render();
  }, [videoSettings.width, videoSettings.height]);

  return <canvas ref={canvasRef} />;
});