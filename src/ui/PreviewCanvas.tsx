import React, { useEffect, useRef, memo, useMemo } from 'react';
import { EffectManager } from '../core/EffectManager';

// プレビュー用の最大解像度を定義
const PREVIEW_MAX_WIDTH = 1280;
const PREVIEW_MAX_HEIGHT = 720;

// PreviewCanvas が受け取るpropsをシンプルにする
interface PreviewCanvasProps {
  manager: EffectManager;
  width: number;
  height: number;
}

/**
 * プレビューキャンバス
 * - Canvasを初期化し、EffectManagerと連携
 * - リサイズ処理のみ担当
 * - プレビュー時は固定解像度（1280x720）を使用し、CSSでスケーリング
 */
export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  manager,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // プレビュー用の解像度を計算
  const { previewWidth, previewHeight } = useMemo(() => {
    const aspectRatio = width / height;
    let previewWidth = width;
    let previewHeight = height;

    if (previewWidth > PREVIEW_MAX_WIDTH) {
      previewWidth = PREVIEW_MAX_WIDTH;
      previewHeight = Math.round(PREVIEW_MAX_WIDTH / aspectRatio);
    }

    if (previewHeight > PREVIEW_MAX_HEIGHT) {
      previewHeight = PREVIEW_MAX_HEIGHT;
      previewWidth = Math.round(PREVIEW_MAX_HEIGHT * aspectRatio);
    }

    console.log('プレビュー解像度を計算:', {
      originalWidth: width,
      originalHeight: height,
      previewWidth,
      previewHeight
    });

    return { previewWidth, previewHeight };
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    console.log('プレビューキャンバスの初期化開始');
    
    // キャンバスサイズを設定
    canvas.width = previewWidth;
    canvas.height = previewHeight;

    // CSSでアスペクト比を維持しながら表示
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.imageRendering = 'pixelated';

    // マネージャーにキャンバスを設定
    manager.setPreviewCanvas(canvas);

    console.log('プレビューキャンバスの初期化完了:', {
      width: canvas.width,
      height: canvas.height
    });

    return () => {
      console.log('プレビューキャンバスのクリーンアップ');
      manager.clearPreviewCanvas();
    };
  }, [manager, previewWidth, previewHeight]);

  return (
    <div className="preview-canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
};

PreviewCanvas.displayName = 'PreviewCanvas';