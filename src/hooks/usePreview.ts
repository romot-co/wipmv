import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  VisualEffectConfig,
  BackgroundEffectConfig,
  TextEffectConfig
} from '../types/effects';

/**
 * プレビュー管理フックの戻り値
 */
interface UsePreviewReturn {
  /** 再生中かどうか */
  isPlaying: boolean;
  /** 現在の再生時間（ミリ秒） */
  currentTime: number;
  /** 総再生時間（ミリ秒） */
  duration: number;
  /** 再生時間の設定 */
  setCurrentTime: (time: number) => void;
  /** 総再生時間の設定 */
  setDuration: (time: number) => void;
  /** キャンバスの初期化 */
  initializeCanvas: (canvas: HTMLCanvasElement, width: number, height: number) => void;
  /** エフェクトの更新 */
  updateEffects: (effects: VisualEffectConfig[]) => void;
  /** 再生 */
  play: (audioBuffer: AudioBuffer) => void;
  /** 一時停止 */
  pause: () => void;
  /** 停止 */
  stop: () => void;
}

/**
 * プレビューを管理するフック
 */
export function usePreview(): UsePreviewReturn {
  // 再生状態
  const [isPlaying, setIsPlaying] = useState(false);
  // 再生時間
  const [currentTime, setCurrentTime] = useState(0);
  // 総再生時間
  const [duration, setDuration] = useState(0);

  // AudioContext
  const audioContextRef = useRef<AudioContext | null>(null);
  // AudioSourceNode
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  // キャンバス
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // アニメーションフレームID
  const animationFrameRef = useRef<number | null>(null);
  // 開始時刻
  const startTimeRef = useRef<number>(0);

  // キャンバスの初期化
  const initializeCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number) => {
    canvasRef.current = canvas;
    canvas.width = width;
    canvas.height = height;
  }, []);

  // エフェクトの更新
  const updateEffects = useCallback((effects: VisualEffectConfig[]) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const canvas = canvasRef.current;

    // キャンバスのクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // エフェクトの描画
    effects.forEach(effect => {
      ctx.save();
      
      // ブレンドモードの設定
      if (effect.blendMode) {
        ctx.globalCompositeOperation = effect.blendMode;
      }
      
      // 不透明度の設定
      if (effect.opacity !== undefined) {
        ctx.globalAlpha = effect.opacity;
      }

      // 時間範囲のチェック
      const isInTimeRange = 
        (!effect.startTime || currentTime >= effect.startTime) &&
        (!effect.endTime || currentTime <= effect.endTime);

      if (isInTimeRange) {
        // エフェクトタイプに応じた描画処理
        switch (effect.type) {
          case 'background': {
            const bgEffect = effect as BackgroundEffectConfig;
            if (bgEffect.color) {
              ctx.fillStyle = bgEffect.color;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            break;
          }
          case 'waveform': {
            // TODO: 波形の描画処理を実装
            break;
          }
          case 'text': {
            const textEffect = effect as TextEffectConfig;
            if (textEffect.style && textEffect.layout) {
              ctx.font = `${textEffect.style.fontSize}px ${textEffect.style.font}`;
              ctx.fillStyle = textEffect.style.color;
              ctx.textAlign = textEffect.style.textAlign ?? 'center';
              ctx.textBaseline = textEffect.style.textBaseline ?? 'middle';
              
              const x = textEffect.layout.position.x * canvas.width;
              const y = textEffect.layout.position.y * canvas.height;
              
              ctx.fillText(textEffect.text, x, y);
            }
            break;
          }
          case 'watermark': {
            // TODO: ウォーターマークの描画処理を実装
            break;
          }
        }
      }

      ctx.restore();
    });
  }, [currentTime]);

  // 再生
  const play = useCallback((audioBuffer: AudioBuffer) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    sourceNodeRef.current = source;
    startTimeRef.current = audioContext.currentTime - (currentTime / 1000);
    
    source.start(0, currentTime / 1000);
    setIsPlaying(true);

    // 再生終了時の処理
    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // アニメーションフレームの開始
    const animate = () => {
      if (!isPlaying) return;
      
      const newTime = (audioContext.currentTime - startTimeRef.current) * 1000;
      setCurrentTime(newTime);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
  }, [currentTime, isPlaying]);

  // 一時停止
  const pause = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // 停止
  const stop = useCallback(() => {
    pause();
    setCurrentTime(0);
  }, [pause]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    setCurrentTime,
    setDuration,
    initializeCanvas,
    updateEffects,
    play,
    pause,
    stop
  };
} 