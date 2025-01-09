import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AudioSource } from '../../types/audio';
import { VisualEffect } from '../../services/effects/VisualEffect';
import { CanvasRenderer } from '../../services/effects/CanvasRenderer';
import { VisualEffectManager } from '../../services/effects/VisualEffectManager';
import './PreviewPlayer.css';

interface PreviewPlayerProps {
  audioSource: AudioSource | null;
  effects: VisualEffect[];
  width: number;
  height: number;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  audioSource,
  effects,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRendererRef = useRef<CanvasRenderer | null>(null);
  const effectManagerRef = useRef(new VisualEffectManager());
  const animationFrameRef = useRef<number>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // キャンバスレンダラーの初期化
  useEffect(() => {
    if (canvasRef.current) {
      console.log('Initializing canvas renderer');
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      canvasRendererRef.current = new CanvasRenderer(width, height, 30);
      canvasRendererRef.current.setCanvas(canvasRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height]);

  // エフェクトの更新と初期化
  useEffect(() => {
    if (!canvasRef.current) {
      console.warn('Canvas not ready');
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      console.warn('Context not available');
      return;
    }

    console.log('Updating effects:', {
      effectsCount: effects.length,
      effectTypes: effects.map(e => e.getName())
    });

    // エフェクトマネージャーの作成（未作成の場合のみ）
    if (!effectManagerRef.current) {
      effectManagerRef.current = new VisualEffectManager();
    }

    // 既存のエフェクトをクリア
    effectManagerRef.current.clearEffects();
    
    // 各エフェクトを登録
    effects.forEach(effect => {
      effectManagerRef.current?.registerEffect(effect);
    });

    // エフェクトマネージャーを初期化
    effectManagerRef.current.initialize(canvasRef.current, ctx);

    // 即時レンダリング
    if (canvasRendererRef.current && audioSource) {
      requestAnimationFrame(() => {
        if (canvasRendererRef.current) {
          canvasRendererRef.current.render(audioSource, currentTime, effectManagerRef.current!);
        }
      });
    }
  }, [effects, audioSource]);

  // オーディオソースの更新
  useEffect(() => {
    if (audioRef.current && audioSource) {
      const blob = new Blob([audioSource.rawData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audioSource]);

  // アニメーションフレームの更新
  const updateFrame = useCallback(() => {
    if (!audioSource || !canvasRendererRef.current || !audioRef.current || !effectManagerRef.current) return;

    const time = audioRef.current.currentTime * 1000;
    setCurrentTime(time);
    
    console.log('Rendering frame:', {
      time,
      effectsCount: effects.length,
      effectTypes: effects.map(e => e.constructor.name)
    });
    
    canvasRendererRef.current.render(audioSource, time, effectManagerRef.current);
    animationFrameRef.current = requestAnimationFrame(updateFrame);
  }, [audioSource, effects]);

  // 再生状態の管理
  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    } else {
      audioRef.current?.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // 一時停止時も現在のフレームを表示
      if (canvasRendererRef.current && audioSource && effectManagerRef.current) {
        canvasRendererRef.current.render(audioSource, currentTime, effectManagerRef.current);
      }
    }
  }, [isPlaying, updateFrame]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime * 1000);
      // シーク時も即時レンダリング
      if (canvasRendererRef.current && audioSource) {
        canvasRendererRef.current.render(audioSource, newTime * 1000, effectManagerRef.current);
      }
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="preview-player">
      <div className="preview-canvas-container">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="preview-canvas"
        />
      </div>
      
      <div className="preview-controls">
        <button
          className="play-pause-button"
          onClick={handlePlayPause}
          disabled={!audioSource}
        >
          {isPlaying ? '一時停止' : '再生'}
        </button>
        
        <div className="time-control">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={audioSource ? audioSource.duration : 0}
            step="0.1"
            value={currentTime / 1000}
            onChange={handleTimeChange}
            className="time-slider"
            disabled={!audioSource}
          />
          <span className="time-display">
            {audioSource ? formatTime(audioSource.duration * 1000) : '0:00'}
          </span>
        </div>
      </div>

      <audio ref={audioRef} />
    </div>
  );
};
