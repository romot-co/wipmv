export interface AudioSource {
  timeData: Float32Array[];
  volumeData: Float32Array[];
  amplitudeData: Float32Array;
  frequencyData: Float32Array[];
  phaseData: Float32Array;
  stereoData: Float32Array[];
  dynamicRangeData: Float32Array[];
  sampleRate: number;
  numberOfChannels: number;
  rawData: ArrayBuffer;
  duration: number;
}

export interface AudioVisualParameters {
  timeData: Float32Array[];
  volume: Float32Array;
  amplitude: Float32Array;
  frequency: Float32Array;
  phase: Float32Array;
  stereo: Float32Array;
  dynamicRange: Float32Array;
  currentTime: number;
  audioSource: AudioSource;
}

export interface AudioConfig {
  codec: string;
  sampleRate: number;
  numberOfChannels: number;
  bitrate: number;
}

export const defaultAudioConfig: AudioConfig = {
  codec: 'mp4a.40.2',
  sampleRate: 48000,
  numberOfChannels: 2,
  bitrate: 192_000,
}; 