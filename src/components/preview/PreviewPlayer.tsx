import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EffectType } from '../../hooks/useEffects';
import './PreviewPlayer.css';

interface PreviewPlayerProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onTimeUpdate: (time: number) => void;
  onDrop: (file: File) => Promise<void>;
  onCanvasInit: (canvas: HTMLCanvasElement, width: number, height: number) => void;
  onSelectEffect: (type: EffectType | null) => void;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onTimeUpdate,
  onDrop,
  onCanvasInit,
  onSelectEffect
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [width] = useState(960);
  const [height] = useState(600);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  // キャンバスの初期化
  useEffect(() => {
    if (canvasRef.current) {
      onCanvasInit(canvasRef.current, width, height);
    }
    if (backgroundCanvasRef.current) {
      onCanvasInit(backgroundCanvasRef.current, width, height);
    }
  }, [onCanvasInit, width, height]);

  // ドラッグ&ドロップハンドラー
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const audioFile = files.find(file => file.type.startsWith('audio/'));
    
    if (audioFile) {
      try {
        await onDrop(audioFile);
      } catch (error) {
        console.error('Failed to load audio file:', error);
      }
    } else if (files.length > 0) {
      console.warn('ドロップされたファイルは音声ファイルではありません');
    }
  }, [onDrop]);

  // 背景エフェクトの選択
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectEffect('background');
  }, [onSelectEffect]);

  // 波形エフェクトの選択
  const handleWaveformClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectEffect('waveform');
  }, [onSelectEffect]);

  // 時間のフォーマット
  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // シークバーの変更ハンドラー
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onTimeUpdate(time);
  }, [onTimeUpdate]);

  return (
    <div className="preview-player">
      <div 
        className={`preview-canvas-container ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas
          ref={backgroundCanvasRef}
          className="preview-canvas background-canvas"
          width={width}
          height={height}
          onClick={handleBackgroundClick}
        />
        <canvas
          ref={canvasRef}
          className="preview-canvas main-canvas"
          width={width}
          height={height}
          onClick={handleWaveformClick}
        />
        {isDragging && (
          <div className="drop-overlay">
            <div className="drop-message">
              音声ファイルをドロップしてください
            </div>
          </div>
        )}
      </div>
      <div className="preview-controls">
        <button
          className="play-pause-button"
          onClick={onPlayPause}
          disabled={duration === 0}
        >
          {isPlaying ? '停止' : '再生'}
        </button>
        <div className="time-slider">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            disabled={duration === 0}
          />
        </div>
        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};

