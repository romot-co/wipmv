export * from './audio';
export * from './video';
export * from './effects';
export * from './fft'; 

export type VideoConfig = {
  codec: string;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
};

export type VideoEncoderConfig = VideoConfig & {
  onEncodedChunk?: (chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata) => void;
};

export type AudioConfig = {
  codec: string;
  sampleRate: number;
  numberOfChannels: number;
  bitrate: number;
};

export type AudioEncoderConfig = AudioConfig & {
  onEncodedChunk?: (chunk: EncodedAudioChunk, meta: EncodedAudioChunkMetadata) => void;
}; 