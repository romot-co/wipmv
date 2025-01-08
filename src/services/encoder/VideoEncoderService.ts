import { VideoEncoderConfig } from '../../types';

export class VideoEncoderService {
  private encoder: VideoEncoder;
  private config: VideoEncoderConfig;

  constructor(config: VideoEncoderConfig) {
    this.config = config;
    this.encoder = new VideoEncoder({
      output: (chunk: EncodedVideoChunk, meta: EncodedVideoChunkMetadata) => {
        if (this.config.onEncodedChunk) {
          this.config.onEncodedChunk(chunk, meta);
        }
      },
      error: (error: Error) => {
        console.error('Video encoding error:', error);
      }
    });
  }

  async initialize(): Promise<void> {
    const encoderConfig: VideoEncoderConfig = {
      codec: this.config.codec,
      width: this.config.width,
      height: this.config.height,
      bitrate: this.config.bitrate,
      framerate: this.config.framerate
    };

    const support = await VideoEncoder.isConfigSupported(encoderConfig);
    if (!support.supported) {
      throw new Error('Unsupported video encoder configuration');
    }

    this.encoder.configure(encoderConfig);
  }

  async encodeFrame(frame: VideoFrame, options?: VideoEncoderEncodeOptions): Promise<void> {
    this.encoder.encode(frame, options);
  }

  async flush(): Promise<void> {
    await this.encoder.flush();
    this.encoder.close();
  }
}
