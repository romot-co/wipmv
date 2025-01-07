export const VIDEO_RESOLUTIONS = {
  '4K': { width: 3840, height: 2160 },
  '2K': { width: 2560, height: 1440 },
  'FULL_HD': { width: 1920, height: 1080 },
  'HD': { width: 1280, height: 720 },
} as const;

export const VIDEO_FRAMERATES = [24, 30, 60] as const;
export const VIDEO_CODECS = ['avc1', 'hevc', 'vp9', 'av1'] as const;

export const DEFAULT_VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  framerate: 30,
  codec: 'avc1.42001f',
  bitrate: 5_000_000,
} as const; 