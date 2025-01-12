import { useState, useCallback } from 'react';
import { ErrorType, AppError } from '../core/types';
import { EffectManager } from '../core/EffectManager';
import { EncoderService } from '../core/EncoderService';

export const useVideoEncoder = () => {
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const startEncoding = useCallback(async (manager: EffectManager, audioFile: File) => {
    if (isEncoding) return;

    try {
      setIsEncoding(true);
      setProgress(0);
      setError(null);

      // エンコーデーの初期化
      const canvas = manager.getCanvas();
      const encoder = new EncoderService(
        canvas.width,
        canvas.height,
        30, // フレームレート
        5_000_000, // ビデオビットレート (5Mbps)
        128_000 // オーディオビットレート (128kbps)
      );

      await encoder.initialize();

      // オーディオデータの処理
      const audioContext = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // エンコード開始
      encoder.start();

      // フレーム処理
      const duration = audioBuffer.duration;
      const frameInterval = 1000 / 30; // 30fps
      const totalFrames = Math.ceil(duration * 30);
      
      for (let frame = 0; frame < totalFrames; frame++) {
        if (!isEncoding) break; // エンコード中断チェック
        
        const currentTime = frame / 30;
        manager.updateTime(currentTime);
        manager.render();
        
        const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData) {
          // ImageDataをImageBitmapに変換
          const imageBitmap = await createImageBitmap(imageData);
          const videoFrame = new VideoFrame(imageBitmap, {
            timestamp: frame * frameInterval * 1000, // マイクロ秒単位
          });
          await encoder.encodeVideoFrame(videoFrame, currentTime);
          imageBitmap.close();
        }

        // 進捗更新
        setProgress((frame / totalFrames) * 100);
        
        // 次のフレームまで待機
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // エンコード完了
      await encoder.stop();
      setProgress(100);
    } catch (err) {
      if (err instanceof AppError) {
        setError(err);
      } else if (err instanceof Error) {
        setError(new AppError(ErrorType.ExportEncodeFailed, err.message));
      } else {
        setError(new AppError(ErrorType.ExportEncodeFailed, 'Unknown error'));
      }
    } finally {
      setIsEncoding(false);
    }
  }, [isEncoding]);

  const stopEncoding = useCallback(() => {
    if (!isEncoding) return;
    setIsEncoding(false);
    setProgress(0);
  }, [isEncoding]);

  return {
    isEncoding,
    progress,
    error,
    startEncoding,
    stopEncoding,
  };
}; 