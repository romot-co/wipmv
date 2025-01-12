import { useCallback, useRef, useState, useEffect } from 'react';
import { EncoderOptions } from '../core/types';
import { EncoderService } from '../core/EncoderService';

interface VideoEncoderState {
  isEncoding: boolean;
  progress: number;
  error: Error | null;
  startEncoding: (canvas: HTMLCanvasElement, duration: number) => Promise<void>;
  stopEncoding: () => void;
}

/**
 * ビデオエンコーディングを管理するフック
 * エンコーダーの初期化、フレームのエンコード、データの管理を行う
 */
export const useVideoEncoder = (): VideoEncoderState => {
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const encoderRef = useRef<EncoderService | null>(null);

  // エンコーダーのクリーンアップ
  useEffect(() => {
    return () => {
      if (encoderRef.current) {
        encoderRef.current.dispose();
      }
    };
  }, []);

  const startEncoding = useCallback(async (canvas: HTMLCanvasElement, duration: number) => {
    try {
      setIsEncoding(true);
      setProgress(0);
      setError(null);

      // エンコーダーの初期化
      const options: EncoderOptions = {
        width: canvas.width,
        height: canvas.height,
        frameRate: 30,
        videoBitrate: 5000000,
        audioBitrate: 128000,
      };

      const encoder = new EncoderService(
        options.width,
        options.height,
        options.frameRate,
        options.videoBitrate,
        options.audioBitrate
      );
      await encoder.initialize();
      await encoder.start();
      encoderRef.current = encoder;

      // フレームのエンコード
      const frameCount = duration * options.frameRate;
      for (let i = 0; i < frameCount; i++) {
        if (!isEncoding) break;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const bitmap = await createImageBitmap(canvas);
          const videoFrame = new VideoFrame(bitmap, { timestamp: i * (1000 / options.frameRate) });
          await encoder.encodeVideoFrame(videoFrame, i * (1000 / options.frameRate));
          bitmap.close();
          setProgress((i + 1) / frameCount);
        }

        // フレーム間の待機
        await new Promise(resolve => setTimeout(resolve, 1000 / options.frameRate));
      }

      await encoder.stop();
      setIsEncoding(false);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Encoding failed'));
      setIsEncoding(false);
    }
  }, [isEncoding]);

  const stopEncoding = useCallback(() => {
    try {
      setIsEncoding(false);
      if (encoderRef.current) {
        encoderRef.current.dispose();
        encoderRef.current = null;
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to stop encoding'));
    }
  }, []);

  return {
    isEncoding,
    progress,
    error,
    startEncoding,
    stopEncoding,
  };
}; 