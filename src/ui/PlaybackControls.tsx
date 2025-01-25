// src/components/PlaybackControls.tsx
import React, { useEffect, useState } from 'react';
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
  // スライダーの内部状態
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(currentTime);

  // 再生時間が更新されたら、ドラッグ中でない場合のみスライダーの値を更新
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isDragging]);

  // 再生状態が変更されたときの処理を追加
  useEffect(() => {
    if (isPlaying) {
      // 再生中は定期的に更新
      const intervalId = setInterval(() => {
        if (!isDragging) {
          setSliderValue(currentTime);
        }
      }, 16.67); // 約60fps

      return () => clearInterval(intervalId);
    }
  }, [isPlaying, currentTime, isDragging]);

  // 時間表示のフォーマット
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // スライダーの値を制限
  const clampedCurrentTime = Math.max(0, Math.min(sliderValue, duration));

  return (
    <div className="playback-controls">
      <Flex direction="column" gap="2">
        {/* シークバー */}
        <Flex gap="2" align="center">
          <Text size="1" className="time-display">{formatTime(clampedCurrentTime)}</Text>
          <Slider.Root
            value={[clampedCurrentTime]}
            max={Math.max(duration, 0.1)} // 0除算を防ぐ
            step={0.1}
            onValueChange={([value]) => {
              setSliderValue(value);
              // ドラッグ中は更新を抑制
              if (!isDragging) {
                onSeek(value);
              }
            }}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => {
              // 先にシーク処理を実行してから、ドラッグ状態を解除
              onSeek(sliderValue);
              setIsDragging(false);
            }}
            className="seek-slider"
          >
            <Slider.Track className="seek-track">
              <Slider.Range className="seek-range" />
            </Slider.Track>
            <Slider.Thumb className="seek-thumb" />
          </Slider.Root>
          <Text size="1" className="time-display">{formatTime(duration)}</Text>
        </Flex>

        {/* コントロールボタン */}
        <Flex gap="2" justify="center" align="center">
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => onSeek(Math.max(0, clampedCurrentTime - 5))}
            disabled={!duration}
          >
            <ArrowLeftIcon />
          </IconButton>
          <IconButton
            size="3"
            variant="soft"
            onClick={isPlaying ? onPause : onPlay}
            disabled={!duration}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => onSeek(Math.min(duration, clampedCurrentTime + 5))}
            disabled={!duration}
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
            variant="ghost"
            onClick={() => onLoopChange(!loop)}
          >
            <LoopIcon style={{ color: loop ? 'var(--accent-9)' : undefined }} />
          </IconButton>
        </Flex>
      </Flex>
    </div>
  );
};
