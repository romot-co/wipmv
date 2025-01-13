import React from 'react';
import './EffectTimeSettings.css';

interface EffectTimeSettingsProps {
  startTime: number;
  endTime: number;
  duration: number;
  onTimeChange: (startTime: number, endTime: number) => void;
}

export const EffectTimeSettings: React.FC<EffectTimeSettingsProps> = ({
  startTime,
  endTime,
  duration,
  onTimeChange,
}) => {
  const formatTime = (seconds: number): string => {
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
    const newStartTime = parseTime(value);
    if (isNaN(newStartTime) || newStartTime < 0 || newStartTime >= endTime) return;
    onTimeChange(newStartTime, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    const newEndTime = parseTime(value);
    if (isNaN(newEndTime) || newEndTime <= startTime || newEndTime > duration) return;
    onTimeChange(startTime, newEndTime);
  };

  const handleStartSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = parseFloat(e.target.value);
    if (newStartTime < endTime) {
      onTimeChange(newStartTime, endTime);
    }
  };

  const handleEndSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = parseFloat(e.target.value);
    if (newEndTime > startTime) {
      onTimeChange(startTime, newEndTime);
    }
  };

  return (
    <div className="effect-time-settings">
      <div className="time-setting">
        <label>開始時刻</label>
        <div className="time-inputs">
          <input
            type="text"
            value={formatTime(startTime)}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            className="time-text"
          />
          <input
            type="range"
            min={0}
            max={duration}
            step={0.001}
            value={startTime}
            onChange={handleStartSliderChange}
            className="time-slider"
          />
        </div>
      </div>

      <div className="time-setting">
        <label>終了時刻</label>
        <div className="time-inputs">
          <input
            type="text"
            value={formatTime(endTime)}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            className="time-text"
          />
          <input
            type="range"
            min={0}
            max={duration}
            step={0.001}
            value={endTime}
            onChange={handleEndSliderChange}
            className="time-slider"
          />
        </div>
      </div>

      <div className="time-preview">
        <div
          className="time-range"
          style={{
            left: `${(startTime / duration) * 100}%`,
            width: `${((endTime - startTime) / duration) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}; 