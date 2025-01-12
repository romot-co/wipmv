import { useCallback, useRef, useState, useEffect } from 'react';
import { EffectManager } from '../core/EffectManager';

interface UseAudioControlProps {
  manager: EffectManager | null;
}

export function useAudioControl({ manager }: UseAudioControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // AudioContextの初期化
  const initAudioContext = useCallback(() => {
    if (!manager) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.connect(audioContextRef.current.destination);
      }

      // オーディオバッファが設定されている場合は再生準備
      const audioBuffer = manager.getAudioBuffer();
      if (audioBuffer) {
        manager.updateDuration(audioBuffer.duration);
        console.debug('AudioContextの初期化完了', {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          numberOfChannels: audioBuffer.numberOfChannels
        });
      }
    } catch (error) {
      console.error('AudioContextの初期化に失敗しました:', error);
    }
  }, [manager]);

  // 再生位置の更新
  const updateCurrentTime = useCallback(() => {
    if (!audioContextRef.current || !manager) return;

    const update = () => {
      if (isPlaying) {
        const currentTime = audioContextRef.current!.currentTime - startTimeRef.current;
        setCurrentTime(currentTime);
        manager.updateTime(currentTime);
        animationFrameRef.current = requestAnimationFrame(update);

        console.debug('再生位置の更新', {
          currentTime,
          audioContextTime: audioContextRef.current!.currentTime,
          startTime: startTimeRef.current
        });
      }
    };

    update();
  }, [manager, isPlaying]);

  // 再生
  const play = useCallback(async () => {
    if (!audioContextRef.current || !manager) return;

    try {
      console.debug('再生開始', {
        audioContext: audioContextRef.current.state,
        hasAnalyser: !!analyserRef.current,
        hasAudioBuffer: !!manager.getAudioBuffer(),
        currentTime
      });

      // AudioContextが停止している場合は再開
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 既存のソースノードを停止・解放
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }

      // 新しいソースノードを作成
      const source = audioContextRef.current.createBufferSource();
      const audioBuffer = manager.getAudioBuffer();
      if (!audioBuffer) {
        console.error('オーディオバッファが設定されていません');
        return;
      }

      source.buffer = audioBuffer;
      source.connect(analyserRef.current!);
      sourceNodeRef.current = source;

      // 再生終了時の処理
      source.onended = () => {
        console.debug('再生終了');
        setIsPlaying(false);
        manager.stop();
      };

      // 再生開始
      startTimeRef.current = audioContextRef.current.currentTime - currentTime;
      source.start(0, currentTime);
      
      setIsPlaying(true);
      manager.start();
      updateCurrentTime();
    } catch (error) {
      console.error('再生に失敗しました:', error);
      setIsPlaying(false);
      manager.stop();
    }
  }, [manager, currentTime, updateCurrentTime]);

  // 一時停止
  const pause = useCallback(async () => {
    if (!audioContextRef.current || !manager) return;

    try {
      console.debug('一時停止');

      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      setIsPlaying(false);
      manager.stop();
    } catch (error) {
      console.error('一時停止に失敗しました:', error);
    }
  }, [manager]);

  // シーク
  const seek = useCallback(async (time: number) => {
    if (!audioContextRef.current || !manager) return;

    console.debug('シーク開始', { 
      time, 
      isPlaying,
      currentAudioBuffer: manager.getAudioBuffer()?.duration
    });

    try {
      const wasPlaying = isPlaying;
      if (wasPlaying) {
        await pause();
      }

      // 再生位置を更新
      setCurrentTime(time);
      manager.updateTime(time);

      // 再生中だった場合は再開
      if (wasPlaying) {
        await play();
      }

      console.debug('シーク完了', { time, wasPlaying });
    } catch (error) {
      console.error('シークに失敗しました:', error);
    }
  }, [manager, isPlaying, pause, play]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      console.debug('useAudioControl クリーンアップ');
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // AudioContextの初期化
  useEffect(() => {
    initAudioContext();
  }, [initAudioContext]);

  return {
    isPlaying,
    currentTime,
    play,
    pause,
    seek,
    initAudioContext
  };
} 