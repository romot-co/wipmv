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
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRendererRef = useRef<CanvasRenderer | null>(null);
  const effectManagerRef = useRef<VisualEffectManager>(new VisualEffectManager());
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  // キャンバスの初期化
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvasRendererRef.current = new CanvasRenderer(width, height, 30);
    canvasRendererRef.current.setCanvas(canvasRef.current);

    effectManagerRef.current.clearEffects();
    effects.forEach(effect => {
      effectManagerRef.current.registerEffect(effect);
    });
    effectManagerRef.current.initialize(canvasRef.current, ctx);
  }, [width, height, effects]);

  // オーディオの初期化
  const initializeAudio = useCallback(async () => {
    if (!audioSource) return;

    try {
      // AudioContextの初期化（既存のものを再利用）
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext({
          latencyHint: 'interactive',
          sampleRate: audioSource.sampleRate
        });
      }

      // GainNodeの作成（既存のものをクリーンアップ）
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // AudioBufferの作成
      const newAudioBuffer = audioContextRef.current.createBuffer(
        audioSource.numberOfChannels,
        audioSource.timeData[0].length,
        audioSource.sampleRate
      );

      for (let channel = 0; channel < audioSource.numberOfChannels; channel++) {
        newAudioBuffer.copyToChannel(audioSource.timeData[channel], channel);
      }

      setAudioBuffer(newAudioBuffer);
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setIsReady(false);
    }
  }, [audioSource]);

  // レンダリングループ
  const renderFrame = useCallback((timestamp: number) => {
    if (!canvasRendererRef.current || !audioSource || !effectManagerRef.current || !audioContextRef.current || !audioBufferSourceRef.current) return;

    // フレームレート制御（30fps）
    const frameInterval = 1000 / 30;
    const elapsed = timestamp - lastFrameTimeRef.current;
    
    if (elapsed < frameInterval) {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      return;
    }

    // パフォーマンスモニタリング（120フレームごと）
    frameCountRef.current++;
    if (frameCountRef.current % 120 === 0) {
      const fps = 1000 / elapsed;
      console.log(`Current FPS: ${fps.toFixed(1)}`);
    }

    lastFrameTimeRef.current = timestamp;

    const currentTimeMs = (audioContextRef.current.currentTime - startTimeRef.current) * 1000;
    
    // 再生が終了位置を超えた場合
    if (currentTimeMs >= audioSource.duration * 1000) {
      if (audioBufferSourceRef.current) {
        audioBufferSourceRef.current.stop();
        audioBufferSourceRef.current.disconnect();
        audioBufferSourceRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }

      if (canvasRendererRef.current) {
        canvasRendererRef.current.stopPlayback();
      }

      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    setCurrentTime(currentTimeMs);
    
    // キャンバスのクリアと再描画
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    }
    
    canvasRendererRef.current.render(
      audioSource,
      currentTimeMs,
      effectManagerRef.current
    );

    animationFrameRef.current = requestAnimationFrame(renderFrame);
  }, [audioSource, width, height]);

  // 再生制御
  const startPlayback = useCallback(async () => {
    if (!audioContextRef.current || !audioBuffer) return;

    try {
      // AudioContextの状態確認と再開
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 既存のソースをクリーンアップ
      if (audioBufferSourceRef.current) {
        try {
          audioBufferSourceRef.current.stop();
          audioBufferSourceRef.current.disconnect();
        } catch (error) {
          // すでに停止している場合は無視
        }
        audioBufferSourceRef.current = null;
      }

      // 新しいGainNodeの作成
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = 1.0;

      // 新しいソースの作成
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      source.playbackRate.value = 1.0;

      // 再生開始時刻の設定
      const offset = currentTime / 1000;
      startTimeRef.current = audioContextRef.current.currentTime - offset;
      lastFrameTimeRef.current = performance.now();
      
      // 再生開始
      source.start(0, offset);
      audioBufferSourceRef.current = source;

      // 終了時のハンドリング
      source.onended = () => {
        if (currentTime >= audioBuffer.duration * 1000) {
          stopPlayback();
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };

      setIsPlaying(true);

      // レンダリング開始
      if (canvasRendererRef.current) {
        canvasRendererRef.current.startPlayback();
      }
      animationFrameRef.current = requestAnimationFrame(renderFrame);

    } catch (error) {
      console.error('Failed to start playback:', error);
      setIsPlaying(false);
    }
  }, [audioBuffer, currentTime, renderFrame]);

  // 停止処理
  const stopPlayback = useCallback(() => {
    if (canvasRendererRef.current) {
      canvasRendererRef.current.stopPlayback();
    }

    if (audioBufferSourceRef.current) {
      try {
        audioBufferSourceRef.current.stop();
        audioBufferSourceRef.current.disconnect();
      } catch (error) {
        // すでに停止している場合のエラーを無視
      }
      audioBufferSourceRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }

    setIsPlaying(false);
  }, []);

  // 初期化
  useEffect(() => {
    initializeCanvas();
    initializeAudio();

    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
    };
  }, [initializeCanvas, initializeAudio, stopPlayback]);

  // 再生状態の管理
  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  // UI イベントハンドラ
  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    setCurrentTime(newTime);
    if (isPlaying) {
      stopPlayback();
      setIsPlaying(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // エフェクトの更新監視
  useEffect(() => {
    if (canvasRef.current && effectManagerRef.current) {
      effectManagerRef.current.clearEffects();
      effects.forEach(effect => {
        effectManagerRef.current.registerEffect(effect);
      });
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        effectManagerRef.current.initialize(canvasRef.current, ctx);
      }
    }
  }, [effects]);

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
          disabled={!isReady}
        >
          {isPlaying ? '一時停止' : '再生'}
        </button>
        
        <div className="time-control">
          <span className="time-display">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={audioSource ? audioSource.duration * 1000 : 0}
            step="100"
            value={currentTime}
            onChange={handleTimeChange}
            className="time-slider"
            disabled={!isReady}
          />
          <span className="time-display">
            {audioSource ? formatTime(audioSource.duration * 1000) : '0:00'}
          </span>
        </div>
      </div>
    </div>
  );
};

