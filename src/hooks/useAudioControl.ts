import { useEffect, useState, useCallback } from 'react';
import { EffectManager } from '../core/EffectManager';
import { AudioPlaybackService, AudioPlaybackState } from '../core/AudioPlaybackService';

interface UseAudioControlProps {
  manager: EffectManager | null;
  audioService: AudioPlaybackService;
}

interface UseAudioControlReturn {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  error: Error | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (time: number) => Promise<void>;
  getAnalyser: () => AnalyserNode | null;
  getWaveformData: () => Float32Array;
  getFrequencyData: () => Uint8Array;
}

export function useAudioControl({ manager, audioService }: UseAudioControlProps): UseAudioControlReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array>(new Float32Array());
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array());

  // 状態変更の購読
  useEffect(() => {
    // 状態変更の購読
    const unsubscribe = audioService.subscribe((state: AudioPlaybackState) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.currentTime);
      setDuration(state.duration);

      // EffectManagerの更新
      if (manager) {
        manager.updateParams({
          currentTime: state.currentTime,
          duration: state.duration,
          isPlaying: state.isPlaying
        });
      }
    });

    // EffectManagerとの接続
    let managerCleanup: (() => void) | undefined;
    if (manager) {
      manager.connectAudioService(audioService);
      managerCleanup = () => {
        manager.disconnectAudioService();
      };
    }

    return () => {
      unsubscribe();
      managerCleanup?.();
      setError(null);
    };
  }, [manager, audioService]);

  // アナライザーデータの更新を最適化
  useEffect(() => {
    let rafId: number;
    const updateAnalyserData = () => {
      const analyser = audioService.getAnalyserNode();
      if (analyser && isPlaying) {
        const waveform = new Float32Array(analyser.frequencyBinCount);
        const frequency = new Uint8Array(analyser.frequencyBinCount);
        analyser.getFloatTimeDomainData(waveform);
        analyser.getByteFrequencyData(frequency);
        setWaveformData(waveform);
        setFrequencyData(frequency);
        rafId = requestAnimationFrame(updateAnalyserData);
      }
    };
    
    if (isPlaying) {
      rafId = requestAnimationFrame(updateAnalyserData);
    }
    
    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isPlaying, audioService]);

  // 再生制御
  const play = useCallback(async () => {
    try {
      setError(null);
      await audioService.resumeContext();
      await audioService.play();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to play audio');
      setError(err);
      throw err;
    }
  }, [audioService]);

  const pause = useCallback(async () => {
    try {
      setError(null);
      await audioService.pause();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to pause audio');
      setError(err);
      throw err;
    }
  }, [audioService]);

  const seek = useCallback(async (time: number) => {
    try {
      setError(null);
      await audioService.seek(time);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to seek audio');
      setError(err);
      throw err;
    }
  }, [audioService]);

  return {
    currentTime,
    isPlaying,
    duration,
    error,
    play,
    pause,
    seek,
    getAnalyser: () => audioService.getAnalyserNode(),
    getWaveformData: () => waveformData,
    getFrequencyData: () => frequencyData
  };
} 