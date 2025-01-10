import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { PreviewCanvas } from './PreviewCanvas';
import { useEffects } from '../../hooks/useEffects';
import { AudioAnalyzer } from '../../services/audio/AudioAnalyzer';
import './PreviewPlayer.css';

interface PreviewPlayerProps {
  width: number;
  height: number;
  audioSource?: AudioBuffer;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = memo(({
  width,
  height,
  audioSource
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState<Float32Array>();

  const audioContextRef = useRef<AudioContext>();
  const audioAnalyzerRef = useRef<AudioAnalyzer>();
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const FPS = 60;
  const frameInterval = 1000 / FPS;

  const { effects, initializeDefaultEffects } = useEffects();

  // オーディオコンテキストの初期化
  useEffect(() => {
    audioContextRef.current = new AudioContext();
    audioAnalyzerRef.current = new AudioAnalyzer(audioContextRef.current);
    initializeDefaultEffects();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [initializeDefaultEffects]);

  // オーディオソースの設定
  useEffect(() => {
    if (!audioSource || !audioAnalyzerRef.current) return;

    audioAnalyzerRef.current.setAudioBuffer(audioSource);
    setDuration(audioSource.duration);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [audioSource]);

  // アニメーションフレームの最適化
  const animate = useCallback((timestamp: number) => {
    if (!audioAnalyzerRef.current) return;

    // フレームレート制御
    if (timestamp - lastFrameTimeRef.current < frameInterval) {
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const startTime = performance.now() - (currentTime * 1000);
    const newTime = (timestamp - startTime) / 1000;

    if (newTime >= duration) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    setCurrentTime(newTime);
    const data = audioAnalyzerRef.current.getAudioData(newTime);
    if (data) {
      setAudioData(data);
    }

    lastFrameTimeRef.current = timestamp;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [currentTime, duration]);

  // 再生制御
  useEffect(() => {
    if (!audioAnalyzerRef.current) return;

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, animate]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioAnalyzerRef.current) {
      const data = audioAnalyzerRef.current.getAudioData(newTime);
      if (data) {
        setAudioData(data);
      }
    }
  }, []);

  return (
    <div className="preview-player">
      <PreviewCanvas
        width={width}
        height={height}
        currentTime={currentTime}
        audioData={audioData}
        effects={effects}
      />
      <div className="controls">
        <button onClick={handlePlayPause}>
          {isPlaying ? '停止' : '再生'}
        </button>
        <input
          type="range"
          min="0"
          max={duration}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
        />
        <span>{currentTime.toFixed(2)} / {duration.toFixed(2)}</span>
      </div>
    </div>
  );
});

