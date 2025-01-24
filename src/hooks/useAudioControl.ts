/**
 * useAudioControl
 * - React Hooks でUI操作を簡単にする
 * - AudioPlaybackService のメソッドをラップし、再生/停止/シーク/エラー管理などを提供
 */

import { useCallback, useEffect, useRef } from 'react';
import { AudioPlaybackService } from '../core/AudioPlaybackService';
import { AppError, ErrorType } from '../core/types';
import { useApp } from '../contexts/AppContext';

export function useAudioControl(audioService: AudioPlaybackService) {
  const { audioState, setAudioState, handleError } = useApp();

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
    const playbackState = audioService.getPlaybackState();
    setAudioState({
      isPlaying: playbackState.isPlaying,
      currentTime: Math.round(playbackState.currentTime * 1000) / 1000, // 小数点以下3桁に正規化
      duration: Math.round(playbackState.duration * 1000) / 1000 // 小数点以下3桁に正規化
    });
    
    rafIdRef.current = requestAnimationFrame(updateTime);
  }, [audioService, setAudioState]);

  /**
   * play
   */
  const play = useCallback(async () => {
    try {
      await audioService.play();
      const playbackState = audioService.getPlaybackState();
      setAudioState({
        isPlaying: true,
        duration: Math.round(playbackState.duration * 1000) / 1000 // 小数点以下3桁に正規化
      });

      // 再生開始時にRAFを開始
      if (rafIdRef.current === null) {
        lastUpdateTimeRef.current = performance.now();
        rafIdRef.current = requestAnimationFrame(updateTime);
      }
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError(ErrorType.AudioPlaybackFailed, '再生に失敗しました');
      handleError('audio', error);
      throw error;
    }
  }, [audioService, setAudioState, handleError, updateTime]);

  /**
   * pause
   */
  const pause = useCallback(async () => {
    try {
      await audioService.pause();
      setAudioState({ isPlaying: false });

      // 一時停止時にRAFを停止
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError(ErrorType.AudioPlaybackFailed, '一時停止に失敗しました');
      handleError('audio', error);
      throw error;
    }
  }, [audioService, setAudioState, handleError]);

  /**
   * stop
   */
  const stop = useCallback(async () => {
    try {
      await audioService.pause(); // 一時停止
      await audioService.seek(0); // 先頭にシーク
      setAudioState({ 
        isPlaying: false, 
        currentTime: 0 
      });

      // 停止時にRAFを停止
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    } catch (err) {
      const error = err instanceof AppError ? err : new AppError(ErrorType.AudioPlaybackFailed, '停止に失敗しました');
      handleError('audio', error);
      throw error;
    }
  }, [audioService, setAudioState, handleError]);

  /**
   * seek
   */
  const seek = useCallback(
    async (time: number) => {
      try {
        await audioService.seek(time);
        const playbackState = audioService.getPlaybackState();
        setAudioState({
          currentTime: Math.round(playbackState.currentTime * 1000) / 1000 // 小数点以下3桁に正規化
        });
      } catch (err) {
        const error = err instanceof AppError ? err : new AppError(ErrorType.AudioPlaybackFailed, 'シークに失敗しました');
        handleError('audio', error);
        throw error;
      }
    },
    [audioService, setAudioState, handleError]
  );

  // 音量設定
  const setVolume = useCallback(
    (volume: number) => {
      try {
        audioService.setVolume(volume);
        setAudioState({ volume });
      } catch (err) {
        const error = err instanceof AppError ? err : new AppError(ErrorType.AudioPlaybackFailed, '音量設定に失敗しました');
        handleError('audio', error);
        throw error;
      }
    },
    [audioService, setAudioState, handleError]
  );

  // ループ設定
  const setLoop = useCallback(
    (loop: boolean) => {
      try {
        audioService.setLoop(loop);
        setAudioState({ loop });
      } catch (err) {
        const error = err instanceof AppError ? err : new AppError(ErrorType.AudioPlaybackFailed, 'ループ設定に失敗しました');
        handleError('audio', error);
        throw error;
      }
    },
    [audioService, setAudioState, handleError]
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
    state: audioState,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setLoop
  };
}