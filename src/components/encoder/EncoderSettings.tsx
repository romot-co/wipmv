import React, { useState } from 'react';
import { VideoEncoderConfig, AudioEncoderConfig, OutputConfig, encoderPresets } from '../../types/encoder';

interface EncoderSettingsProps {
  onSettingsChange: (settings: {
    video: VideoEncoderConfig;
    audio: AudioEncoderConfig;
    output: OutputConfig;
  }) => void;
}

export const EncoderSettings: React.FC<EncoderSettingsProps> = ({ onSettingsChange }) => {
  const [selectedPreset, setSelectedPreset] = useState<keyof typeof encoderPresets>('balanced');
  const [videoConfig, setVideoConfig] = useState<VideoEncoderConfig>(encoderPresets.balanced.video);
  const [audioConfig, setAudioConfig] = useState<AudioEncoderConfig>(encoderPresets.balanced.audio);
  const [outputConfig, setOutputConfig] = useState<OutputConfig>({
    container: 'mp4',
    metadata: {
      title: '',
      artist: '',
      date: new Date().toISOString().split('T')[0],
      comment: ''
    }
  });

  // プリセット変更時の処理
  const handlePresetChange = (preset: keyof typeof encoderPresets) => {
    setSelectedPreset(preset);
    setVideoConfig(encoderPresets[preset].video);
    setAudioConfig(encoderPresets[preset].audio);
    onSettingsChange({
      video: encoderPresets[preset].video,
      audio: encoderPresets[preset].audio,
      output: outputConfig
    });
  };

  // ビデオ設定変更時の処理
  const handleVideoConfigChange = (changes: Partial<VideoEncoderConfig>) => {
    const newConfig = { ...videoConfig, ...changes };
    setVideoConfig(newConfig);
    onSettingsChange({ video: newConfig, audio: audioConfig, output: outputConfig });
  };

  // オーディオ設定変更時の処理
  const handleAudioConfigChange = (changes: Partial<AudioEncoderConfig>) => {
    const newConfig = { ...audioConfig, ...changes };
    setAudioConfig(newConfig);
    onSettingsChange({ video: videoConfig, audio: newConfig, output: outputConfig });
  };

  // 出力設定変更時の処理
  const handleOutputConfigChange = (changes: Partial<OutputConfig>) => {
    const newConfig = { ...outputConfig, ...changes };
    setOutputConfig(newConfig);
    onSettingsChange({ video: videoConfig, audio: audioConfig, output: newConfig });
  };

  return (
    <div className="encoder-settings">
      <h3>エンコード設定</h3>
      
      {/* プリセット選択 */}
      <div className="settings-section">
        <h4>プリセット</h4>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value as keyof typeof encoderPresets)}
        >
          <option value="highQuality">高品質</option>
          <option value="balanced">バランス</option>
          <option value="lightweight">軽量</option>
        </select>
      </div>

      {/* ビデオ設定 */}
      <div className="settings-section">
        <h4>ビデオ設定</h4>
        <div className="setting-item">
          <label>解像度:</label>
          <input
            type="number"
            value={videoConfig.width}
            onChange={(e) => handleVideoConfigChange({ width: Number(e.target.value) })}
          />
          x
          <input
            type="number"
            value={videoConfig.height}
            onChange={(e) => handleVideoConfigChange({ height: Number(e.target.value) })}
          />
        </div>
        <div className="setting-item">
          <label>フレームレート:</label>
          <input
            type="number"
            value={videoConfig.frameRate}
            onChange={(e) => handleVideoConfigChange({ frameRate: Number(e.target.value) })}
          />
        </div>
        <div className="setting-item">
          <label>コーデック:</label>
          <select
            value={videoConfig.codec}
            onChange={(e) => handleVideoConfigChange({ codec: e.target.value as VideoEncoderConfig['codec'] })}
          >
            <option value="h264">H.264</option>
            <option value="h265">H.265</option>
            <option value="vp8">VP8</option>
            <option value="vp9">VP9</option>
          </select>
        </div>
      </div>

      {/* オーディオ設定 */}
      <div className="settings-section">
        <h4>オーディオ設定</h4>
        <div className="setting-item">
          <label>サンプリングレート:</label>
          <select
            value={audioConfig.sampleRate}
            onChange={(e) => handleAudioConfigChange({ sampleRate: Number(e.target.value) })}
          >
            <option value="44100">44.1kHz</option>
            <option value="48000">48kHz</option>
            <option value="96000">96kHz</option>
          </select>
        </div>
        <div className="setting-item">
          <label>チャンネル数:</label>
          <select
            value={audioConfig.channels}
            onChange={(e) => handleAudioConfigChange({ channels: Number(e.target.value) })}
          >
            <option value="1">モノラル</option>
            <option value="2">ステレオ</option>
          </select>
        </div>
        <div className="setting-item">
          <label>コーデック:</label>
          <select
            value={audioConfig.codec}
            onChange={(e) => handleAudioConfigChange({ codec: e.target.value as AudioEncoderConfig['codec'] })}
          >
            <option value="aac">AAC</option>
            <option value="opus">Opus</option>
            <option value="vorbis">Vorbis</option>
          </select>
        </div>
      </div>

      {/* 出力設定 */}
      <div className="settings-section">
        <h4>出力設定</h4>
        <div className="setting-item">
          <label>コンテナ形式:</label>
          <select
            value={outputConfig.container}
            onChange={(e) => handleOutputConfigChange({ container: e.target.value as OutputConfig['container'] })}
          >
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
            <option value="mkv">MKV</option>
          </select>
        </div>
        <div className="setting-item">
          <label>タイトル:</label>
          <input
            type="text"
            value={outputConfig.metadata?.title ?? ''}
            onChange={(e) => handleOutputConfigChange({
              metadata: { ...outputConfig.metadata, title: e.target.value }
            })}
          />
        </div>
      </div>
    </div>
  );
}; 