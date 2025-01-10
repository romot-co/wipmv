import React, { useState } from 'react';
import { WaveformPreview } from './WaveformPreview';
import './WaveformSettings.css';

interface WaveformSettingsProps {
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  onTimeUpdate: (time: number) => void;
}

export const WaveformSettings: React.FC<WaveformSettingsProps> = ({
  audioBuffer,
  currentTime,
  duration,
  onTimeUpdate,
}) => {
  const [color, setColor] = useState('#4a9eff');
  const [lineWidth, setLineWidth] = useState(1);

  return (
    <div className="waveform-settings">
      <WaveformPreview
        audioBuffer={audioBuffer}
        currentTime={currentTime}
        duration={duration}
        onTimeUpdate={onTimeUpdate}
        color={color}
        lineWidth={lineWidth}
      />
      <div className="waveform-settings-controls">
        <div className="waveform-settings-control">
          <label>色:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div className="waveform-settings-control">
          <label>線の太さ:</label>
          <input
            type="range"
            min="1"
            max="5"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}; 