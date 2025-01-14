// src/components/PlaybackControls.tsx
import React, { useCallback } from 'react';
import { Flex, Button, Slider, Text, Box } from '@radix-ui/themes';
import { PlayIcon, PauseIcon, TimerIcon } from '@radix-ui/react-icons';
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

  // シーク処理のハンドラー
  const handleSeek = useCallback((value: number[]) => {
    if (value.length > 0) {
      onSeek(value[0]);
    }
  }, [onSeek]);

  return (
    <Box className="playback-controls fade-in">
      <Flex gap="4" align="center">
        <Button
          variant="soft"
          onClick={isPlaying ? onPause : onPlay}
          aria-label={isPlaying ? '一時停止' : '再生'}
          size="3"
          color="gray"
          className="hover-highlight"
        >
          {isPlaying ? <PauseIcon width="20" height="20" /> : <PlayIcon width="20" height="20" />}
        </Button>
        
        <Flex align="center" gap="2" style={{ minWidth: '80px' }}>
          <TimerIcon />
          <Text size="2" color="gray" weight="medium">
            {formatTime(currentTime)}
          </Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ flex: 1 }} className="seek-container">
          <Slider
            defaultValue={[0]}
            value={[currentTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            size="2"
            variant="surface"
            radius="full"
            className="active-element"
          />
        </Flex>

        <Flex align="center" gap="2" style={{ minWidth: '80px', justifyContent: 'flex-end' }}>
          <Text size="2" color="gray" weight="medium">
            {formatTime(duration)}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};
