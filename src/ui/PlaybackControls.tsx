// src/components/PlaybackControls.tsx
import React from 'react';

interface Props {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
}

export const PlaybackControls: React.FC<Props> = ({
  currentTime,
  duration,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onSeek
}) => {
  return (
    <div>
      <button onClick={isPlaying ? onPause : onPlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={onStop}>Stop</button>
      <input
        type="range"
        min={0}
        max={duration}
        step={0.01}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
      />
      <span>{currentTime.toFixed(2)} / {duration.toFixed(2)}</span>
    </div>
  );
};
