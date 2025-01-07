export const AUDIO_SAMPLE_RATES = [44100, 48000, 96000] as const;
export const AUDIO_CHANNELS = [1, 2] as const;
export const AUDIO_CODECS = ['aac', 'opus'] as const;

export const DEFAULT_AUDIO_CONFIG = {
  codec: 'mp4a.40.2',
  sampleRate: 48000,
  numberOfChannels: 2,
  bitrate: 192_000,
} as const;

export const FFT_SIZES = [512, 1024, 2048, 4096] as const;
export const DEFAULT_FFT_SIZE = 2048; 