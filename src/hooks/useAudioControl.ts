/**
 * useAudioControl
 * - React Hooks でUI操作を簡単にする
 * - AudioPlaybackService のメソッドをラップし、再生/停止/シーク/エラー管理などを提供
 * - 進捗バーなどのために "currentTime" "duration" などをstate管理しても良いが
 *   毎フレーム更新する必要はなく、onPlay/onPause/onSeekのタイミング等適度でOK
 */

import { useCallback, useEffect, useState } from 'react';
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
        duration,
        error: null,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error("再生に失敗しました");
      setState((prev) => ({ ...prev, error }));
    }
  }, [audioService]);

  /**
   * pause
   */
  const pause = useCallback(() => {
    try {
      audioService.pause();
      setState((prev) => ({ ...prev, isPlaying: false, error: null }));
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
      setState((prev) => ({ ...prev, isPlaying: false, error: null, currentTime: 0 }));
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
        setState((prev) => ({
          ...prev,
          error: null,
          // シーク直後にcurrentTimeを同期
          currentTime: audioService.getCurrentTime(),
        }));
      } catch (err) {
        const error = err instanceof Error ? err : new Error("シークに失敗しました");
        setState((prev) => ({ ...prev, error }));
      }
    },
    [audioService]
  );

  /**
   * 進捗バーや現在時刻の表示に使いたい場合、
   * 例えば1秒に数回だけポーリングするなど
   */
  useEffect(() => {
    let timerId: number | null = null;
    if (state.isPlaying) {
      // 例えば500msごとにcurrentTimeを同期
      timerId = window.setInterval(() => {
        const currentTime = audioService.getCurrentTime();
        setState((prev) => ({ ...prev, currentTime }));
      }, 500);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [state.isPlaying, audioService]);

  return {
    state,
    play,
    pause,
    stop,
    seek,
  };
}