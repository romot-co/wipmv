import { AudioConfig, VideoConfig } from '../encoder';

export interface EncoderSettingsProps {
  videoConfig: VideoConfig;
  audioConfig: AudioConfig;
  onVideoConfigChange: (config: VideoConfig) => void;
  onAudioConfigChange: (config: AudioConfig) => void;
  onEncode: () => void;
  isEncoding: boolean;
  progress?: number;
} 