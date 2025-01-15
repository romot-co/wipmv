/**
 * useAudioControl
 * - React Hooks でUI操作を簡単にする
 * - AudioPlaybackService のメソッドをラップし、再生/停止/シーク/エラー管理などを提供
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { AudioPlaybackService } from '../core/AudioPlaybackService';

interface AudioControlState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: Error | null;
}

export function useAudioControl(audioService: AudioPlaybackService) {
  const [state, setState] = useState<AudioControlState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    error: null,
  });

  // RAF用のref
  const rafIdRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  /**
   * 時間更新処理
   */
  const updateTime = useCallback(() => {
    const now = performance.now();
    // 16.67ms (約60fps) 以上経過していない場合はスキップ
    if (now - lastUpdateTimeRef.current < 16.67) {
      rafIdRef.current = requestAnimationFrame(updateTime);
      return;
    }

    lastUpdateTimeRef.current = now;
    const currentTime = audioService.getCurrentTime();
    setState(prev => ({
      ...prev,
      currentTime: Math.round(currentTime * 1000) / 1000 // 小数点以下3桁に正規化
    }));
    
    rafIdRef.current = requestAnimationFrame(updateTime);
  }, [audioService]);

  /**
   * play
   */
  const play = useCallback(async () => {
    try {
      await audioService.play();
      const duration = audioService.getDuration();
      setState((prev) => ({
        ...prev,
        isPlaying: true,
        duration: Math.round(duration * 1000) / 1000, // 小数点以下3桁に正規化
        error: null,
      }));

      // 再生開始時にRAFを開始
      if (rafIdRef.current === null) {
        lastUpdateTimeRef.current = performance.now();
        rafIdRef.current = requestAnimationFrame(updateTime);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("再生に失敗しました");
      setState((prev) => ({ ...prev, error }));
    }
  }, [audioService, updateTime]);

  /**
   * pause
   */
  const pause = useCallback(() => {
    try {
      audioService.pause();
      setState((prev) => ({ ...prev, isPlaying: false, error: null }));

      // 一時停止時にRAFを停止
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("一時停止に失敗しました");
      setState((prev) => ({ ...prev, error }));
    }
  }, [audioService]);

  /**
   * stop
   */
  const stop = useCallback(() => {
    try {
      audioService.stop();
      setState((prev) => ({ 
        ...prev, 
        isPlaying: false, 
        error: null, 
        currentTime: 0 
      }));

      // 停止時にRAFを停止
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("停止に失敗しました");
      setState((prev) => ({ ...prev, error }));
    }
  }, [audioService]);

  /**
   * seek
   */
  const seek = useCallback(
    async (time: number) => {
      try {
        await audioService.seek(time);
        const currentTime = audioService.getCurrentTime();
        setState((prev) => ({
          ...prev,
          error: null,
          currentTime: Math.round(currentTime * 1000) / 1000 // 小数点以下3桁に正規化
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error("シークに失敗しました");
        setState((prev) => ({ ...prev, error }));
      }
    },
    [audioService]
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return {
    state,
    play,
    pause,
    stop,
    seek,
  };
}