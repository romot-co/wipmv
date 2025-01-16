// src/components/PlaybackControls.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Flex, Button, Slider, Text, Tooltip } from '@radix-ui/themes';
import { PlayIcon, PauseIcon, TimerIcon, LoopIcon, SpeakerLoudIcon } from '@radix-ui/react-icons';
import './PlaybackControls.css';

interface Props {
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

export const PlaybackControls: React.FC<Props> = ({
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
  // シーク中の状態管理
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(currentTime);
  
  // 前回の再生位置を記憶
  const lastPlayedTimeRef = useRef(currentTime);

  // シーク開始時の処理
  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
    lastPlayedTimeRef.current = currentTime;
  }, [currentTime]);

  // シーク中の処理
  const handleSeekChange = useCallback((value: number[]) => {
    if (value.length > 0) {
      // 小数点以下3桁までの精度で丸める
      const newTime = Math.round(value[0] * 1000) / 1000;
      setSeekTime(newTime);
    }
  }, []);

  // シーク終了時の処理
  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
    if (Math.abs(seekTime - lastPlayedTimeRef.current) > 0.001) {
      onSeek(seekTime);
    }
  }, [seekTime, onSeek]);

  // 時間を「分:秒.ミリ秒」形式にフォーマット
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 100);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }, []);

  // 現在時刻と長さを正規化（小数点以下3桁まで）
  const normalizedCurrentTime = Math.round(currentTime * 1000) / 1000;
  const normalizedDuration = Math.round(duration * 1000) / 1000;

  // シーク中は表示を更新しない
  useEffect(() => {
    if (!isSeeking) {
      setSeekTime(normalizedCurrentTime);
    }
  }, [normalizedCurrentTime, isSeeking]);

  return (
    <div className="playback-controls fade-in">
      <Flex gap="4" align="center">
        <Tooltip content={isPlaying ? '一時停止' : '再生'}>
          <Button
            variant="soft"
            onClick={isPlaying ? onPause : onPlay}
            size="3"
            color="gray"
            className="hover-highlight"
          >
            {isPlaying ? <PauseIcon width="20" height="20" /> : <PlayIcon width="20" height="20" />}
          </Button>
        </Tooltip>
        
        <Flex align="center" gap="2" style={{ minWidth: '120px' }}>
          <TimerIcon />
          <Text size="2" color="gray" weight="medium">
            {formatTime(isSeeking ? seekTime : normalizedCurrentTime)}
          </Text>
        </Flex>

        <Flex direction="column" gap="1" style={{ flex: 1 }} className="seek-container">
          <Slider
            defaultValue={[0]}
            value={[isSeeking ? seekTime : normalizedCurrentTime]}
            min={0}
            max={normalizedDuration}
            step={0.001}  // より細かい精度でシーク可能に
            onValueChange={handleSeekChange}
            onPointerDown={handleSeekStart}
            onPointerUp={handleSeekEnd}
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

        <Flex align="center" gap="2" style={{ minWidth: '120px' }}>
          <Tooltip content="音量">
            <Button
              variant="soft"
              color="gray"
              size="2"
              className="hover-highlight"
            >
              <SpeakerLoudIcon width="16" height="16" />
            </Button>
          </Tooltip>
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(value) => value.length > 0 && onVolumeChange(value[0])}
            size="2"
            variant="surface"
            radius="full"
            className="active-element"
            style={{ width: '80px' }}
          />
        </Flex>

        <Tooltip content={loop ? 'ループ解除' : 'ループ再生'}>
          <Button
            variant="soft"
            color={loop ? 'blue' : 'gray'}
            size="2"
            onClick={() => onLoopChange(!loop)}
            className="hover-highlight"
          >
            <LoopIcon width="16" height="16" />
          </Button>
        </Tooltip>
      </Flex>
    </div>
  );
};
