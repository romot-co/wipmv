import React, { useEffect, memo } from 'react';
import { Flex, Text } from '@radix-ui/themes';
import * as Slider from '@radix-ui/react-slider';
import './EffectTimeSettings.css';

/**
 * エフェクトの時間設定のプロパティ
 */
interface EffectTimeSettingsProps {
  startTime?: number;
  endTime?: number;
  duration?: number;
  onTimeChange: (startTime: number, endTime: number) => void;
  disabled?: boolean;
}

/**
 * エフェクトの時間設定コンポーネント
 * - 開始時刻と終了時刻の設定
 * - スライダーとテキスト入力による時間指定
 * - タイムラインプレビュー表示
 */
export const EffectTimeSettings = memo<EffectTimeSettingsProps>(({
  startTime = 0,
  endTime = 0,
  duration,
  onTimeChange,
  disabled = false
}) => {
  const isDisabled = disabled || duration === 0;

  useEffect(() => {
    const effectiveDuration = duration ?? 0;
    if (effectiveDuration > 0 && (startTime === 0 && endTime === 0)) {
      onTimeChange(0, effectiveDuration);
    }
  }, [duration, onTimeChange]);

  const formatTime = (seconds: number): string => {
    if (isDisabled) return '0:00.000';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${min}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const parseTime = (timeStr: string): number => {
    const [minSec, ms] = timeStr.split('.');
    const [min, sec] = minSec.split(':');
    return (
      parseInt(min, 10) * 60 +
      parseInt(sec, 10) +
      (ms ? parseInt(ms, 10) / 1000 : 0)
    );
  };

  const handleStartTimeChange = (value: string) => {
    if (isDisabled) return;
    const newStartTime = parseTime(value);
    if (isNaN(newStartTime) || newStartTime < 0 || newStartTime >= endTime) return;
    onTimeChange(newStartTime, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    if (isDisabled) return;
    const newEndTime = parseTime(value);
    const effectiveDuration = duration ?? 0;
    if (isNaN(newEndTime) || newEndTime <= startTime || newEndTime > effectiveDuration) return;
    onTimeChange(startTime, newEndTime);
  };

  return (
    <div className="effect-time-settings">
      <Flex direction="column" gap="3">
        <div>
          <Text as="label" size="2" weight="bold" mb="2">
            開始時刻
          </Text>
          <Flex gap="3" align="center">
            <input
              type="text"
              value={formatTime(startTime)}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="time-text"
              disabled={isDisabled}
            />
            <Slider.Root
              value={[startTime]}
              min={0}
              max={duration ?? 0}
              step={0.001}
              disabled={isDisabled}
              onValueChange={([value]) => {
                if (value < endTime) {
                  onTimeChange(value, endTime);
                }
              }}
              className="time-slider"
            >
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Root>
          </Flex>
        </div>

        <div>
          <Text as="label" size="2" weight="bold" mb="2">
            終了時刻
          </Text>
          <Flex gap="3" align="center">
            <input
              type="text"
              value={formatTime(endTime)}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              className="time-text"
              disabled={isDisabled}
            />
            <Slider.Root
              value={[endTime]}
              min={0}
              max={duration ?? 0}
              step={0.001}
              disabled={isDisabled}
              onValueChange={([value]) => {
                if (value > startTime) {
                  onTimeChange(startTime, value);
                }
              }}
              className="time-slider"
            >
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumb />
            </Slider.Root>
          </Flex>
        </div>

        <div className="time-preview">
          <div
            className="time-range"
            style={{
              left: `${(startTime / (duration || 1)) * 100}%`,
              width: `${((endTime - startTime) / (duration || 1)) * 100}%`,
              opacity: isDisabled ? 0.5 : 1,
            }}
          />
        </div>
      </Flex>
    </div>
  );
});

EffectTimeSettings.displayName = 'EffectTimeSettings'; 