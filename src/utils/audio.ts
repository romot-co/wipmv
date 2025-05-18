const SUPPORTED_FORMATS = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/aac',
  'audio/x-m4a'
];

export const isAudioFormatSupported = (mimeType: string): boolean => {
  return SUPPORTED_FORMATS.includes(mimeType.toLowerCase());
};
