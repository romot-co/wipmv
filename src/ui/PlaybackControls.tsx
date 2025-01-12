import { FC, useCallback } from 'react';

interface PlaybackControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
}

export const PlaybackControls: FC<PlaybackControlsProps> = ({
  currentTime,
  duration,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
}) => {
  // 再生/一時停止の切り替え
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  // シーク処理
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek(time);
  }, [onSeek]);

  // 時間のフォーマット
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  if (duration === 0) return null;

  return (
    <div className="playback-controls">
      <button
        onClick={handlePlayPause}
        className="play-pause-button"
      >
        {isPlaying ? '一時停止' : '再生'}
      </button>
      <div className="seek-container">
        <span className="time">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="seek-bar"
        />
        <span className="time">{formatTime(duration)}</span>
      </div>
    </div>
  );
}; 