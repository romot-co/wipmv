// src/components/PlaybackControls.tsx
import React from 'react';
import './PlaybackControls.css';

interface Props {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

export const PlaybackControls: React.FC<Props> = ({
  currentTime,
  duration,
  isPlaying,
  onPlay,
  onPause,
  onSeek
}) => {
  // 時間を「分:秒」形式にフォーマット
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playback-controls">
      <button 
        className={`play-pause-button ${isPlaying ? 'playing' : ''}`}
        onClick={isPlaying ? onPause : onPlay}
        aria-label={isPlaying ? '一時停止' : '再生'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="seek-container">
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
        />
        <div className="time-display">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
