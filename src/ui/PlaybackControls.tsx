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
  // 時間を「分:秒.ミリ秒」形式にフォーマット
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // シーク処理のハンドラー
  const handleSeek = useCallback((value: number[]) => {
    if (value.length > 0) {
      // 小数点以下3桁までの精度で丸める
      const seekTime = Math.round(value[0] * 1000) / 1000;
      onSeek(seekTime);
    }
  }, [onSeek]);

  // 現在時刻と長さを正規化（小数点以下3桁まで）
  const normalizedCurrentTime = Math.round(currentTime * 1000) / 1000;
  const normalizedDuration = Math.round(duration * 1000) / 1000;

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
        
        <Flex align="center" gap="2" style={{ minWidth: '120px' }}>
          <TimerIcon />
          <Text size="2" color="gray" weight="medium">
            {formatTime(normalizedCurrentTime)}
          </Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ flex: 1 }} className="seek-container">
          <Slider
            defaultValue={[0]}
            value={[normalizedCurrentTime]}
            min={0}
            max={normalizedDuration}
            step={0.001}  // より細かい精度でシーク可能に
            onValueChange={handleSeek}
            size="2"
            variant="surface"
            radius="full"
            className="active-element"
          />
        </Flex>

        <Flex align="center" gap="2" style={{ minWidth: '120px', justifyContent: 'flex-end' }}>
          <Text size="2" color="gray" weight="medium">
            {formatTime(normalizedDuration)}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};
