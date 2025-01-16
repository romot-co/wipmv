// src/components/PlaybackControls.tsx
import React from 'react';
import { Flex, Text, IconButton } from '@radix-ui/themes';
import * as Slider from '@radix-ui/react-slider';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerLoudIcon, 
  SpeakerOffIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  LoopIcon
} from '@radix-ui/react-icons';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onLoopChange: (loop: boolean) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentTime,
  duration,
  isPlaying,
  volume,
  loop,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onLoopChange
}) => {
  // 時間表示のフォーマット
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playback-controls">
      <Flex direction="column" gap="2">
        {/* シークバー */}
        <Flex gap="2" align="center">
          <Text size="1">{formatTime(currentTime)}</Text>
          <Slider.Root
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={([value]) => onSeek(value)}
            className="seek-slider"
          >
            <Slider.Track className="seek-track">
              <Slider.Range className="seek-range" />
            </Slider.Track>
            <Slider.Thumb className="seek-thumb" />
          </Slider.Root>
          <Text size="1">{formatTime(duration)}</Text>
        </Flex>

        {/* コントロールボタン */}
        <Flex gap="2" justify="center" align="center">
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
          >
            <ArrowLeftIcon />
          </IconButton>
          <IconButton
            size="3"
            variant="soft"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => onSeek(Math.min(duration, currentTime + 5))}
          >
            <ArrowRightIcon />
          </IconButton>

          {/* 音量コントロール */}
          <Flex gap="2" align="center">
            <IconButton
              size="2"
              variant="ghost"
              onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
            >
              {volume === 0 ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
            </IconButton>
            <Slider.Root
              value={[volume * 100]}
              max={100}
              step={1}
              onValueChange={([value]) => onVolumeChange(value / 100)}
              className="volume-slider"
              aria-label="音量"
            >
              <Slider.Track className="volume-track">
                <Slider.Range className="volume-range" />
              </Slider.Track>
              <Slider.Thumb className="volume-thumb" />
            </Slider.Root>
          </Flex>

          {/* ループ切り替え */}
          <IconButton
            size="2"
            variant={loop ? "soft" : "ghost"}
            onClick={() => onLoopChange(!loop)}
          >
            <LoopIcon />
          </IconButton>
        </Flex>
      </Flex>
    </div>
  );
};
