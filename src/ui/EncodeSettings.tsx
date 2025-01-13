import React from 'react';
import './EncodeSettings.css';

export interface EncodeSettingsProps {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  onSettingsChange: (settings: {
    width: number;
    height: number;
    frameRate: number;
    videoBitrate: number;
    audioBitrate: number;
  }) => void;
}

export const EncodeSettings: React.FC<EncodeSettingsProps> = ({
  width,
  height,
  frameRate,
  videoBitrate,
  audioBitrate,
  onSettingsChange,
}) => {
  const handleChange = (
    key: keyof EncodeSettingsProps,
    value: string | number
  ) => {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numValue)) return;

    onSettingsChange({
      width,
      height,
      frameRate,
      videoBitrate,
      audioBitrate,
      [key]: numValue,
    });
  };

  return (
    <div className="encode-settings">
      <h3>エンコード設定</h3>
      
      <div className="setting-group">
        <label>
          解像度
          <div className="resolution-inputs">
            <input
              type="number"
              value={width}
              onChange={(e) => handleChange('width', e.target.value)}
              min={480}
              max={3840}
              step={2}
            />
            x
            <input
              type="number"
              value={height}
              onChange={(e) => handleChange('height', e.target.value)}
              min={360}
              max={2160}
              step={2}
            />
          </div>
        </label>
      </div>

      <div className="setting-group">
        <label>
          フレームレート (fps)
          <input
            type="number"
            value={frameRate}
            onChange={(e) => handleChange('frameRate', e.target.value)}
            min={24}
            max={60}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          映像ビットレート (Mbps)
          <input
            type="number"
            value={videoBitrate / 1000000}
            onChange={(e) =>
              handleChange('videoBitrate', parseFloat(e.target.value) * 1000000)
            }
            min={1}
            max={50}
            step={0.5}
          />
        </label>
      </div>

      <div className="setting-group">
        <label>
          音声ビットレート (kbps)
          <input
            type="number"
            value={audioBitrate / 1000}
            onChange={(e) =>
              handleChange('audioBitrate', parseInt(e.target.value, 10) * 1000)
            }
            min={64}
            max={320}
            step={32}
          />
        </label>
      </div>
    </div>
  );
}; 