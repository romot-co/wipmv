import { useEffect, useState, useCallback } from 'react';
import { EffectManager } from '../core/EffectManager';
import { AudioPlaybackService, AudioPlaybackState } from '../core/AudioPlaybackService';

interface UseAudioControlProps {
  manager: EffectManager | null;
  audioService: AudioPlaybackService;
}

export function useAudioControl({ manager, audioService }: UseAudioControlProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);

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
          duration: state.duration
        });
      }
    });

    // EffectManagerとの接続
    let managerCleanup: (() => void) | undefined;
    if (manager) {
      managerCleanup = manager.connectAudioService(audioService);
    }

    return () => {
      unsubscribe();
      managerCleanup?.();
      setError(null);
    };
  }, [manager, audioService]);

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

  const stop = useCallback(async () => {
    try {
      setError(null);
      await audioService.stop();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to stop audio');
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
    stop,
    seek,
    getAnalyser: () => audioService.getAnalyserNode()
  };
} 