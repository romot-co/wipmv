import { useState, useCallback } from 'react';
import { VideoEncoderService } from '../services/video/VideoEncoderService';
import { AudioEncoderService } from '../services/audio/AudioEncoderService';
import { MP4Multiplexer } from '../services/video/MP4Multiplexer';
import { VideoConfig, AudioConfig, AudioSource } from '../types';
import { DEFAULT_VIDEO_CONFIG, DEFAULT_AUDIO_CONFIG } from '../constants';

export const useVideoEncoding = () => {
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const encode = useCallback(async (
    canvas: OffscreenCanvas,
    audioSource: AudioSource,
    duration: number,
    videoConfig: VideoConfig = DEFAULT_VIDEO_CONFIG,
    audioConfig: AudioConfig = DEFAULT_AUDIO_CONFIG,
  ) => {
    setIsEncoding(true);
    setProgress(0);
    setError(null);

    try {
      const videoEncoder = new VideoEncoderService(videoConfig);
      const audioEncoder = new AudioEncoderService(audioConfig);
      const multiplexer = new MP4Multiplexer(videoConfig, audioConfig);

      await videoEncoder.initialize();
      await audioEncoder.initialize();

      videoEncoder.setOnEncodedChunk((chunk, meta) => {
        multiplexer.addVideoChunk(chunk, meta);
      });

      audioEncoder.setOnEncodedChunk((chunk, meta) => {
        multiplexer.addAudioChunk(chunk, meta);
      });

      // エンコード処理
      await audioEncoder.encodeAudio(audioSource);
      await audioEncoder.flush();

      const frameCount = Math.ceil(duration * videoConfig.framerate / 1000);
      for (let i = 0; i < frameCount; i++) {
        const frame = new VideoFrame(canvas, {
          timestamp: (i * 1000000) / videoConfig.framerate,
        });
        await videoEncoder.encodeFrame(frame, { keyFrame: i === 0 });
        setProgress(i / frameCount);
      }

      await videoEncoder.flush();

      const result = multiplexer.finalize();
      return new Blob([result], { type: 'video/mp4' });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('エンコード中にエラーが発生しました'));
      throw err;
    } finally {
      setIsEncoding(false);
      setProgress(1);
    }
  }, []);

  return {
    isEncoding,
    progress,
    error,
    encode,
  };
}; 