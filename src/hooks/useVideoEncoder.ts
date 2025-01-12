import { useCallback, useRef, useState } from 'react';
import { EffectManager } from '../core/EffectManager';

interface EncoderConfig {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  mimeType: string;
}

export function useVideoEncoder() {
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const encoderRef = useRef<VideoEncoder | null>(null);
  const chunksRef = useRef<Uint8Array[]>([]);

  const startEncoding = useCallback(async (
    manager: EffectManager,
    config: EncoderConfig,
    onComplete: (blob: Blob) => void
  ) => {
    if (isEncoding) return;
    setIsEncoding(true);
    setProgress(0);
    setError(null);
    chunksRef.current = [];

    try {
      // エンコーダーの初期化
      const encoder = new VideoEncoder({
        output: (chunk) => {
          const data = new Uint8Array(chunk.byteLength);
          chunk.copyTo(data);
          chunksRef.current.push(data);
        },
        error: (e) => {
          setError(`Encoding error: ${e.message}`);
          setIsEncoding(false);
        }
      });

      await encoder.configure({
        codec: 'vp8',
        width: config.width,
        height: config.height,
        bitrate: config.videoBitrate,
        framerate: config.frameRate,
      });

      encoderRef.current = encoder;

      // オーディオデータの準備
      const audioBuffer = manager.getAudioBuffer();
      if (!audioBuffer) {
        throw new Error('No audio buffer available');
      }

      const duration = audioBuffer.duration;
      const frameCount = Math.ceil(duration * config.frameRate);
      const frameInterval = 1 / config.frameRate;

      // フレームのエンコード
      for (let i = 0; i < frameCount; i++) {
        const currentTime = i * frameInterval;
        manager.setCurrentTime(currentTime);
        manager.render();

        const ctx = manager.getContext();
        const imageData = ctx.getImageData(0, 0, config.width, config.height);
        const imageBitmap = await createImageBitmap(imageData);

        const frame = new VideoFrame(imageBitmap, {
          timestamp: Math.round(currentTime * 1000000), // マイクロ秒単位
          duration: Math.round(frameInterval * 1000000),
        });

        await encoder.encode(frame);
        frame.close();
        imageBitmap.close();

        setProgress(Math.floor((i + 1) / frameCount * 100));
      }

      await encoder.flush();
      encoder.close();

      // エンコードされたデータをBlobに変換
      const blob = new Blob(chunksRef.current, { type: config.mimeType });
      onComplete(blob);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown encoding error');
    } finally {
      setIsEncoding(false);
      setProgress(0);
      chunksRef.current = [];
    }
  }, [isEncoding]);

  const stopEncoding = useCallback(() => {
    if (!isEncoding || !encoderRef.current) return;

    try {
      encoderRef.current.close();
      encoderRef.current = null;
      chunksRef.current = [];
      setIsEncoding(false);
      setProgress(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to stop encoding');
    }
  }, [isEncoding]);

  return {
    isEncoding,
    progress,
    error,
    startEncoding,
    stopEncoding,
  };
} 