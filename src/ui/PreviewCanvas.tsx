import React, { useEffect, useRef, memo, useMemo } from 'react';
import debug from 'debug';
import { EffectManager } from '../core/types/core';
import { AppError, ErrorType } from '../core/types/error';
import { withAppError } from '../core/types/app';
import { Renderer } from '../core/Renderer';

const log = debug('app:PreviewCanvas');

// プレビュー用の最大解像度を定義
const PREVIEW_MAX_WIDTH = 1280;
const PREVIEW_MAX_HEIGHT = 720;

/**
 * プレビューキャンバスのプロパティ
 */
interface PreviewCanvasProps {
  width: number;
  height: number;
  manager?: EffectManager;
  onError?: (error: AppError) => void;
  onRendererInit?: (renderer: Renderer) => void;
}

/**
 * プレビューキャンバス
 * - Canvasを初期化し、EffectManagerと連携
 * - リサイズ処理のみ担当
 * - プレビュー時は固定解像度（1280x720）を使用し、CSSでスケーリング
 */
export const PreviewCanvas: React.FC<PreviewCanvasProps> = memo(({
  manager,
  width,
  height,
  onError,
  onRendererInit
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

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

  // キャンバスの初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      console.log('プレビューキャンバスの初期化開始');
      
      // キャンバスサイズを設定
      canvas.width = previewWidth;
      canvas.height = previewHeight;

      // CSSでアスペクト比を維持しながら表示
      canvas.style.width = '100%';
      canvas.style.height = 'auto';
      canvas.style.imageRendering = 'pixelated';

      // レンダラーを初期化
      if (!rendererRef.current) {
        const renderer = new Renderer(canvas, true);
        rendererRef.current = renderer;
        
        // レンダラー初期化コールバックを呼び出し
        if (onRendererInit) {
          onRendererInit(renderer);
        }

        console.log('レンダラーを初期化:', {
          width: canvas.width,
          height: canvas.height,
          scale: renderer.getScale()
        });
      }

      // マネージャーにレンダラーを設定（マネージャーが変更された場合のみ）
      if (manager && (!manager.getRenderer() || manager.getRenderer() !== rendererRef.current)) {
        console.log('マネージャーにレンダラーを設定');
        manager.setRenderer(rendererRef.current);
      }

      console.log('プレビューキャンバスの初期化完了');
    } catch (error) {
      console.error('プレビューキャンバス初期化エラー:', error);
      if (error instanceof AppError) {
        onError?.(error);
      } else {
        onError?.(new AppError(
          ErrorType.RENDERER_INIT_FAILED,
          'プレビューキャンバスの初期化に失敗しました。'
        ));
      }
    }

    return () => {
      console.log('プレビューキャンバスのクリーンアップ');
      try {
        if (manager) {
          const renderer = manager.getRenderer();
          if (renderer) {
            renderer.dispose();
            manager.setRenderer(null);
          }
        }
        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current = null;
        }
      } catch (error) {
        console.error('プレビューキャンバスのクリーンアップに失敗:', error);
      }
    };
  }, [previewWidth, previewHeight, manager, onRendererInit, onError]);

  return (
    <div className="preview-canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
});

PreviewCanvas.displayName = 'PreviewCanvas';