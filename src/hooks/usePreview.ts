import { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasRenderer } from '../services/effects/CanvasRenderer';
import { VisualEffect } from '../services/effects/VisualEffect';
import { VisualEffectManager } from '../services/effects/VisualEffectManager';

export const usePreview = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRendererRef = useRef<CanvasRenderer | null>(null);
  const effectManagerRef = useRef<VisualEffectManager>(new VisualEffectManager());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // 時間更新処理
  const updateTime = useCallback(() => {
    if (!isPlaying || !audioContextRef.current) return;

    const currentAudioTime = audioContextRef.current.currentTime - startTimeRef.current;
    setCurrentTime(currentAudioTime * 1000);

    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying]);

  // 再生状態の監視
  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateTime);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateTime]);

  // キャンバスの初期化
  const initializeCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    // 背景キャンバスと主キャンバスを区別して管理
    if (canvas.classList.contains('background-canvas')) {
      backgroundCanvasRef.current = canvas;
    } else {
      mainCanvasRef.current = canvas;
    }

    // 両方のキャンバスが初期化された後にレンダラーを設定
    if (mainCanvasRef.current && backgroundCanvasRef.current && !canvasRendererRef.current) {
      canvasRendererRef.current = new CanvasRenderer(width, height, 30);
      canvasRendererRef.current.setCanvas(mainCanvasRef.current);
      canvasRendererRef.current.setBackgroundCanvas(backgroundCanvasRef.current);
    }
  }, []);

  // エフェクトの更新
  const updateEffects = useCallback((effects: VisualEffect[]) => {
    if (!mainCanvasRef.current || !backgroundCanvasRef.current) return;

    const mainCtx = mainCanvasRef.current.getContext('2d');
    const bgCtx = backgroundCanvasRef.current.getContext('2d');
    if (!mainCtx || !bgCtx) return;

    effectManagerRef.current.clearEffects();
    effects.forEach(effect => {
      effectManagerRef.current.registerEffect(effect);
    });
    effectManagerRef.current.initialize(backgroundCanvasRef.current, bgCtx);
    effectManagerRef.current.initialize(mainCanvasRef.current, mainCtx);

    // レンダリングを開始
    if (canvasRendererRef.current) {
      canvasRendererRef.current.render(
        new AudioContext().createBuffer(2, 44100, 44100), // ダミーのAudioBuffer
        0,
        effectManagerRef.current
      );
      canvasRendererRef.current.startPlayback();
    }
  }, []);

  // 再生制御
  const play = useCallback(async (audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioBufferSourceRef.current) {
      audioBufferSourceRef.current.stop();
      audioBufferSourceRef.current.disconnect();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    
    const offset = currentTime / 1000;
    startTimeRef.current = audioContextRef.current.currentTime - offset;
    
    source.start(0, offset);
    audioBufferSourceRef.current = source;
    setIsPlaying(true);

    // 再生終了時の処理
    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
  }, [currentTime]);

  const stop = useCallback(() => {
    if (audioBufferSourceRef.current) {
      audioBufferSourceRef.current.stop();
      audioBufferSourceRef.current.disconnect();
      audioBufferSourceRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (canvasRendererRef.current) {
        canvasRendererRef.current.dispose();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stop]);

  return {
    isPlaying,
    currentTime,
    duration,
    setCurrentTime,
    setDuration,
    initializeCanvas,
    updateEffects,
    play,
    stop
  };
}; 