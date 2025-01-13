import React, { useRef, useState } from 'react';
import { EffectManager } from '../core/EffectManager';
import { VideoEncoderService } from '../core/VideoEncoderService';
import './ExportButton.css';

interface ExportButtonProps {
  audioBuffer: AudioBuffer;
  manager: EffectManager | null;
  onError: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

/**
 * 動画エクスポートボタンコンポーネント
 * - エンコード処理の開始
 * - 進捗表示
 * - エラーハンドリング
 */
export const ExportButton: React.FC<ExportButtonProps> = ({
  audioBuffer,
  manager,
  onError,
  onProgress
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = async () => {
    if (!canvasRef.current || isExporting || !manager) return;

    try {
      setIsExporting(true);
      const encoder = new VideoEncoderService({
        width: 1920,
        height: 1080,
        frameRate: 30,
        videoBitrate: 5000000,
        audioBitrate: 128000,
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels
      });

      await encoder.initialize();

      // 進捗計算用の変数
      const totalFrames = Math.ceil(audioBuffer.duration * 30); // 30fps
      let processedFrames = 0;

      // フレームごとの処理
      for (let time = 0; time < audioBuffer.duration; time += 1/30) {
        // パラメータを更新
        manager.updateParams({
          currentTime: time,
          duration: audioBuffer.duration,
          isPlaying: true
        });

        // フレームをレンダリング
        manager.render();

        // フレームをエンコード
        if (canvasRef.current) {
          await encoder.encodeVideoFrame(canvasRef.current, time * 1000000);
        }

        // 音声データをエンコード
        const samplesPerFrame = Math.floor(audioBuffer.sampleRate / 30);
        const startSample = Math.floor(time * audioBuffer.sampleRate);
        await encoder.encodeAudioBuffer(
          audioBuffer,
          startSample,
          samplesPerFrame,
          time * 1000000
        );

        // 進捗を更新
        processedFrames++;
        onProgress?.(processedFrames / totalFrames);
      }

      // エンコード完了
      const data = await encoder.finalize();
      
      // ダウンロード
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('エクスポート中にエラーが発生しました:', error);
      onError(error instanceof Error ? error : new Error('エクスポートに失敗しました'));
    } finally {
      setIsExporting(false);
      onProgress?.(0);
    }
  };

  return (
    <div className="export-button-container">
      <button
        className={`export-button ${isExporting ? 'exporting' : ''}`}
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? 'エクスポート中...' : 'エクスポート'}
      </button>
      <canvas ref={canvasRef} style={{ display: 'none' }} width={1920} height={1080} />
    </div>
  );
}; 