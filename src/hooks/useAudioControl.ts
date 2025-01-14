/**
 * useAudioControl
 *
 * AudioPlaybackServiceの再生状態をReactのstateに同期し、
 * 再生や一時停止、シークなどの操作を提供する。
 * 波形/周波数データもラップして返すことで、コンポーネント側は
 * 「useAudioControl から取得した関数を呼ぶだけで完結」する。
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioPlaybackService } from '../core/AudioPlaybackService';

interface UseAudioControlState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  error: Error | null;
}

interface UseAudioControlReturn {
  state: UseAudioControlState;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => Promise<void>;
  getAnalyser: () => AnalyserNode | null;
  getWaveformData: () => Float32Array;
  getFrequencyData: () => Uint8Array;
}

export function useAudioControl(
  audioService: AudioPlaybackService
): UseAudioControlReturn {
  const [state, setState] = useState<UseAudioControlState>({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    error: null,
  });

  const rafIdRef = useRef<number | null>(null);

  /**
   * 再生状況をフレームごとに更新
   */
  const updateFrame = useCallback(() => {
    if (!audioService) return;

    const currentTime = audioService.getCurrentTime();
    const duration = audioService.getDuration();
    const isPlaying = audioService.isPlaying();

    setState((prev) => ({
      ...prev,
      currentTime,
      duration,
      isPlaying,
    }));

    if (isPlaying) {
      rafIdRef.current = requestAnimationFrame(updateFrame);
    } else {
      rafIdRef.current = null;
    }
  }, [audioService]);

  useEffect(() => {
    if (rafIdRef.current == null) {
      rafIdRef.current = requestAnimationFrame(updateFrame);
    }
    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [updateFrame]);

  /**
   * play
   */
  const play = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      await audioService.play();
      if (rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(updateFrame);
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error('再生に失敗しました');
      setState((prev) => ({ ...prev, error: e }));
      throw e;
    }
  }, [audioService, updateFrame]);

  /**
   * pause
   */
  const pause = useCallback(() => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      audioService.pause();
    } catch (err) {
      const e = err instanceof Error ? err : new Error('一時停止に失敗しました');
      setState((prev) => ({ ...prev, error: e }));
      throw e;
    }
  }, [audioService]);

  /**
   * stop
   */
  const stop = useCallback(() => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      audioService.stop();
    } catch (err) {
      const e = err instanceof Error ? err : new Error('停止に失敗しました');
      setState((prev) => ({ ...prev, error: e }));
      throw e;
    }
  }, [audioService]);

  /**
   * seek
   */
  const seek = useCallback(async (time: number) => {
    try {
      setState((prev) => ({ ...prev, error: null }));
      await audioService.seek(time);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('シークに失敗しました');
      setState((prev) => ({ ...prev, error: e }));
      throw e;
    }
  }, [audioService]);

  /**
   * AnalyserNodeを取得
   */
  const getAnalyser = useCallback(() => {
    return audioService.getAnalyserNode();
  }, [audioService]);

  /**
   * 波形データを取得
   */
  const getWaveformData = useCallback(() => {
    return audioService.getWaveformData();
  }, [audioService]);

  /**
   * 周波数データを取得
   */
  const getFrequencyData = useCallback(() => {
    return audioService.getFrequencyData();
  }, [audioService]);

  return {
    state,
    play,
    pause,
    stop,
    seek,
    getAnalyser,
    getWaveformData,
    getFrequencyData,
  };
}