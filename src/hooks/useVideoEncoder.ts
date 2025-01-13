// src/hooks/useVideoEncoder.ts

import { useCallback, useRef, useState } from 'react';
import { VideoEncoderService, EncoderConfig } from '../core/VideoEncoderService';
import { AudioSource } from '../core/types';
import { EffectManager } from '../core/EffectManager';

interface UseVideoEncoderReturn {
  isEncoding: boolean;
  progress: number;
  error: string | null;
  startEncoding: (
    canvas: HTMLCanvasElement,
    audioSource: AudioSource,
    effectManager: EffectManager,
    config: EncoderConfig
  ) => Promise<Blob | null>;
}

/**
 * オフラインエンコードの例: 
 * - canvas & AudioBuffer からフレームを生成してエンコード
 */
export function useVideoEncoder(): UseVideoEncoderReturn {
  const [isEncoding, setIsEncoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const encoderRef = useRef<VideoEncoderService | null>(null);

  const startEncoding = useCallback(
    async (
      canvas: HTMLCanvasElement,
      audioSource: AudioSource,
      effectManager: EffectManager,
      config: EncoderConfig
    ): Promise<Blob | null> => {
      if (isEncoding) return null;
      setIsEncoding(true);
      setProgress(0);
      setError(null);

      try {
        // EncoderService 初期化
        const service = new VideoEncoderService(config);
        encoderRef.current = service;
        await service.initialize();

        const frameRate = config.frameRate;
        const audioBuffer = audioSource.buffer;
        const totalDuration = audioBuffer.duration;
        const frameCount = Math.floor(totalDuration * frameRate);
        const samplesPerFrame = Math.floor(audioBuffer.sampleRate / frameRate);

        // 波形データを事前に計算
        const waveformData = new Uint8Array(1024);
        const channelData = audioBuffer.getChannelData(0);
        const samplesPerWaveform = Math.floor(audioBuffer.length / 1024);

        // 波形データを計算
        for (let i = 0; i < 1024; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerWaveform; j++) {
            const idx = i * samplesPerWaveform + j;
            if (idx < channelData.length) {
              sum += Math.abs(channelData[idx]);
            }
          }
          waveformData[i] = Math.min(255, Math.floor(sum / samplesPerWaveform * 255));
        }

        // 各フレームをエンコード
        for (let i = 0; i < frameCount; i++) {
          const currentSec = i / frameRate;
          const timestampUsec = Math.floor(currentSec * 1_000_000);

          // 1) Canvas描画
          effectManager.updateParams({
            currentTime: currentSec,
            duration: totalDuration,
            waveformData,
            frequencyData: new Uint8Array(1024), // ダミーデータ
            isPlaying: true
          });
          effectManager.render();

          // 2) VideoFrame エンコード
          await service.encodeVideoFrame(canvas, timestampUsec);

          // 3) AudioData エンコード
          const startSample = i * samplesPerFrame;
          await service.encodeAudioBuffer(
            audioBuffer,
            startSample,
            samplesPerFrame,
            timestampUsec
          );

          setProgress(Math.floor(((i + 1) / frameCount) * 100));
        }

        // flush & finalize
        const mp4Data = await service.finalize();
        // Blob化
        const blob = new Blob([mp4Data], { type: 'video/mp4' });
        return blob;
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : 'Unknown Error');
        return null;
      } finally {
        setIsEncoding(false);
        setProgress(0);
        encoderRef.current?.dispose();
        encoderRef.current = null;
      }
    },
    [isEncoding]
  );

  return {
    isEncoding,
    progress,
    error,
    startEncoding
  };
}