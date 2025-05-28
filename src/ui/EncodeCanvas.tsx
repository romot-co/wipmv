import { useEffect } from 'react';
import { DrawingManager } from '../core/DrawingManager';
import { VideoSettings } from '../core/types/base';
import debug from 'debug';

const log = debug('app:EncodeCanvas');

interface EncodeCanvasProps {
  drawingManager: DrawingManager;
  videoSettings: VideoSettings;
  currentTime: number;
  onFrame: (canvas: HTMLCanvasElement) => void;
}

/**
 * エンコード用キャンバス
 * - エクスポート時の1フレームをレンダリング
 * - プレビューとは別のキャンバスを使用
 */
export function EncodeCanvas({ drawingManager, videoSettings, currentTime, onFrame }: EncodeCanvasProps) {
  useEffect(() => {
    log('EncodeCanvas: フレームのレンダリング開始', { currentTime });

    // エクスポート用の一時キャンバスを作成
    const canvas = drawingManager.createExportCanvas({
      width: videoSettings.width,
      height: videoSettings.height
    });

    // フレームをレンダリング
    drawingManager.renderExportFrame(canvas, currentTime);

    // レンダリング結果を親コンポーネントに通知
    onFrame(canvas);

    log('EncodeCanvas: フレームのレンダリング完了');
  }, [drawingManager, videoSettings.width, videoSettings.height, currentTime, onFrame]);

  // 実際のDOMには表示しない（非表示のワーキングキャンバス）
  return null;
}
