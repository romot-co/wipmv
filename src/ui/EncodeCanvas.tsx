import { useEffect } from 'react';
import { EffectManager } from '../core/EffectManager';
import { VideoSettings } from '../core/types';

interface EncodeCanvasProps {
  manager: EffectManager;
  videoSettings: VideoSettings;
  currentTime: number;
  onFrame: (canvas: HTMLCanvasElement) => void;
}

/**
 * エンコード用キャンバス
 * - エクスポート時の1フレームをレンダリング
 * - プレビューとは別のキャンバスを使用
 */
export function EncodeCanvas({ manager, videoSettings, currentTime, onFrame }: EncodeCanvasProps) {
  useEffect(() => {
    console.log('EncodeCanvas: フレームのレンダリング開始', { currentTime });

    // エクスポート用の一時キャンバスを作成
    const canvas = manager.createExportCanvas({
      width: videoSettings.width,
      height: videoSettings.height
    });

    // フレームをレンダリング
    manager.renderExportFrame(canvas, currentTime);

    // レンダリング結果を親コンポーネントに通知
    onFrame(canvas);

    console.log('EncodeCanvas: フレームのレンダリング完了');
  }, [manager, videoSettings.width, videoSettings.height, currentTime, onFrame]);

  // 実際のDOMには表示しない（非表示のワーキングキャンバス）
  return null;
} 