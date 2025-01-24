import React, { useEffect, useRef, memo, useMemo } from 'react';
import { EffectManager } from '../core/types/core';
import { AppError, ErrorType } from '../core/types/error';
import { withAppError } from '../core/types/app';

// プレビュー用の最大解像度を定義
const PREVIEW_MAX_WIDTH = 1280;
const PREVIEW_MAX_HEIGHT = 720;

/**
 * プレビューキャンバスのプロパティ
 */
interface PreviewCanvasProps {
  manager: EffectManager;
  width: number;
  height: number;
  onError?: (error: AppError) => void;
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
  onError
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

      // マネージャーにキャンバスを設定
      manager.setRenderer({
        getOffscreenContext: () => {
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new AppError(
              ErrorType.RENDERER_INIT_FAILED,
              'プレビューキャンバスの2Dコンテキストを取得できません。'
            );
          }
          return ctx;
        },
        drawToMain: () => {
          // プレビューキャンバスは直接描画するため不要
        },
        clear: () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        },
        getOriginalSize: () => ({
          width,
          height
        }),
        getCurrentSize: () => ({
          width: previewWidth,
          height: previewHeight
        }),
        getScale: () => previewWidth / width,
        isPreview: () => true,
        getCanvas: () => canvas,
        dispose: () => {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      });

      console.log('プレビューキャンバスの初期化完了:', {
        width: canvas.width,
        height: canvas.height
      });
    } catch (error) {
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
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        manager.setRenderer({
          getOffscreenContext: () => {
            throw new Error('Disposed');
          },
          drawToMain: () => {},
          clear: () => {},
          getOriginalSize: () => ({ width: 0, height: 0 }),
          getCurrentSize: () => ({ width: 0, height: 0 }),
          getScale: () => 1,
          isPreview: () => false,
          getCanvas: () => canvas,
          dispose: () => {}
        });
      } catch (error) {
        console.error('プレビューキャンバスのクリーンアップに失敗:', error);
      }
    };
  }, [manager, width, height, previewWidth, previewHeight, onError]);

  return (
    <div className="preview-canvas-container">
      <canvas ref={canvasRef} />
    </div>
  );
});

PreviewCanvas.displayName = 'PreviewCanvas';