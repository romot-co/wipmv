import { useCallback, useRef, useState, useEffect } from 'react';
import { EffectManager } from '../core/EffectManager';

interface UseAudioControlProps {
  effectManager: EffectManager | null;
}

export function useAudioControl({ effectManager }: UseAudioControlProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // AudioContextの初期化
  const initAudioContext = useCallback(() => {
    if (!effectManager) return;

    try {
      // 既存のAudioContextがあれば閉じる
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.connect(audioContext.destination);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // 初期状態では停止
      audioContext.suspend();

      // オーディオバッファが設定されている場合は再生準備
      const audioBuffer = effectManager.getAudioBuffer();
      if (audioBuffer) {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyser);
        sourceNodeRef.current = source;
      }
    } catch (error) {
      console.error('AudioContextの初期化に失敗しました:', error);
    }
  }, [effectManager]);

  // ソースノードの作成
  const createSourceNode = useCallback((startTime: number = 0) => {
    if (!effectManager || !audioContextRef.current || !analyserRef.current) return null;

    try {
      const audioBuffer = effectManager.getAudioBuffer();
      if (!audioBuffer) return null;

      // 既存のソースノードを停止
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current);
      source.start(0, startTime);
      sourceNodeRef.current = source;

      return source;
    } catch (error) {
      console.error('ソースノードの作成に失敗しました:', error);
      return null;
    }
  }, [effectManager]);

  // 再生位置の更新
  const updateCurrentTime = useCallback(() => {
    if (!audioContextRef.current || !effectManager) return;

    const update = () => {
      if (isPlaying) {
        const currentTime = audioContextRef.current!.currentTime - startTimeRef.current;
        setCurrentTime(currentTime);
        effectManager.updateTime(currentTime);
        animationFrameRef.current = requestAnimationFrame(update);
      }
    };

    update();
  }, [effectManager, isPlaying]);

  // 再生
  const play = useCallback(async () => {
    if (!audioContextRef.current || !effectManager) return;

    try {
      // AudioContextの状態をチェック
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = createSourceNode(currentTime);
      if (!source) return;

      // 開始時刻を記録
      startTimeRef.current = audioContextRef.current.currentTime - currentTime;
      
      setIsPlaying(true);
      effectManager.start();
      updateCurrentTime();
    } catch (error) {
      console.error('再生に失敗しました:', error);
    }
  }, [effectManager, currentTime, createSourceNode, updateCurrentTime]);

  // 一時停止
  const pause = useCallback(async () => {
    if (!audioContextRef.current || !effectManager) return;

    try {
      await audioContextRef.current.suspend();
      
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
      effectManager.stop();
    } catch (error) {
      console.error('一時停止に失敗しました:', error);
    }
  }, [effectManager]);

  // シーク
  const seek = useCallback(async (time: number) => {
    if (!audioContextRef.current || !effectManager) return;

    const wasPlaying = isPlaying;
    
    try {
      // 一旦停止
      await pause();

      // 再生位置を更新
      setCurrentTime(time);
      effectManager.updateTime(time);

      // 再生中だった場合は再開
      if (wasPlaying) {
        await play();
      }
    } catch (error) {
      console.error('シークに失敗しました:', error);
    }
  }, [effectManager, isPlaying, pause, play]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    play,
    pause,
    seek,
    initAudioContext,
  };
} 