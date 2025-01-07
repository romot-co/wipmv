export interface VideoConfig {
  codec: string;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
}

export const defaultVideoConfig: VideoConfig = {
  width: 1920,
  height: 1080,
  framerate: 30,
  codec: 'avc1.42001f',
  bitrate: 5_000_000,
}; 