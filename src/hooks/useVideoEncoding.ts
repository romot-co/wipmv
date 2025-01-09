import { useState, useCallback } from 'react';
import { VideoEncoderService } from '../services/encoder/VideoEncoderService';
import { AudioEncoderService } from '../services/encoder/AudioEncoderService';
import { MP4Multiplexer } from '../services/video/MP4Multiplexer';
import { VideoConfig, AudioConfig, AudioSource } from '../types';
import { DEFAULT_VIDEO_CONFIG, DEFAULT_AUDIO_CONFIG } from '../constants';

const createAudioData = (source: AudioSource): AudioData => {
  // AudioDataを作成
  return new AudioData({
    format: source.numberOfChannels === 1 ? 'f32-planar' : 'f32',
    sampleRate: source.sampleRate,
    numberOfFrames: source.timeData[0].length,
    numberOfChannels: source.numberOfChannels,
    timestamp: 0,
    data: new Float32Array(source.rawData),
  });
};

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
      const multiplexer = new MP4Multiplexer(videoConfig, audioConfig);

      const videoEncoder = new VideoEncoderService({
        ...videoConfig,
        onEncodedChunk: (chunk, meta) => {
          multiplexer.addVideoChunk(chunk, meta);
        }
      });

      const audioEncoder = new AudioEncoderService({
        ...audioConfig,
        onEncodedChunk: (chunk, meta) => {
          multiplexer.addAudioChunk(chunk, meta);
        }
      });

      await videoEncoder.initialize();
      await audioEncoder.initialize();

      // エンコード処理
      const audioData = createAudioData(audioSource);
      await audioEncoder.encodeAudio(audioData);
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