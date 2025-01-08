import { AudioEncoderConfig } from '../../types';

export class AudioEncoderService {
  private encoder: AudioEncoder;
  private config: AudioEncoderConfig;

  constructor(config: AudioEncoderConfig) {
    this.config = config;
    this.encoder = new AudioEncoder({
      output: (chunk: EncodedAudioChunk, meta: EncodedAudioChunkMetadata) => {
        if (this.config.onEncodedChunk) {
          this.config.onEncodedChunk(chunk, meta);
        }
      },
      error: (error: Error) => {
        console.error('Audio encoding error:', error);
      }
    });
  }

  async initialize(): Promise<void> {
    const encoderConfig: AudioEncoderConfig = {
      codec: this.config.codec,
      sampleRate: this.config.sampleRate,
      numberOfChannels: this.config.numberOfChannels,
      bitrate: this.config.bitrate
    };

    const support = await AudioEncoder.isConfigSupported(encoderConfig);
    if (!support.supported) {
      throw new Error('Unsupported audio encoder configuration');
    }

    this.encoder.configure(encoderConfig);
  }

  async encodeAudio(data: AudioData): Promise<void> {
    this.encoder.encode(data);
  }

  async flush(): Promise<void> {
    await this.encoder.flush();
    this.encoder.close();
  }
}
