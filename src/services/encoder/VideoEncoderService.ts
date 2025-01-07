import { VideoEncoderConfig } from '../../types/encoder';

export class VideoEncoderService {
  private encoder: VideoEncoder | null = null;
  private config: VideoEncoderConfig;
  private frameCount: number = 0;
  private keyFrameInterval: number;

  constructor(config: VideoEncoderConfig) {
    this.config = config;
    this.keyFrameInterval = config.keyFrameInterval ?? 2;
  }

  async initialize(): Promise<void> {
    // コーデックのサポートチェック
    const support = await VideoEncoder.isConfigSupported({
      codec: this.config.codec,
      width: this.config.width,
      height: this.config.height,
      bitrate: this.config.bitrate,
      framerate: this.config.frameRate
    });

    if (!support.supported) {
      throw new Error(`Unsupported video configuration: ${support.reason}`);
    }

    // エンコーダーの初期化
    this.encoder = new VideoEncoder({
      output: this.handleEncodedChunk.bind(this),
      error: this.handleError.bind(this)
    });

    await this.encoder.configure({
      codec: this.config.codec,
      width: this.config.width,
      height: this.config.height,
      bitrate: this.config.bitrate,
      framerate: this.config.frameRate
    });
  }

  private handleEncodedChunk(chunk: EncodedVideoChunk): void {
    // エンコード済みチャンクの処理
    // MP4Multiplexerに渡すなどの処理を実装
  }

  private handleError(error: Error): void {
    console.error('Video encoding error:', error);
    throw error;
  }

  async encodeFrame(frame: VideoFrame): Promise<void> {
    if (!this.encoder) {
      throw new Error('Encoder not initialized');
    }

    // キーフレームの判定
    const isKeyFrame = this.frameCount % (this.keyFrameInterval * this.config.frameRate) === 0;
    
    await this.encoder.encode(frame, {
      keyFrame: isKeyFrame
    });
    
    this.frameCount++;
    frame.close();
  }

  async flush(): Promise<void> {
    if (!this.encoder) {
      throw new Error('Encoder not initialized');
    }
    await this.encoder.flush();
  }

  getConfig(): VideoEncoderConfig {
    return { ...this.config };
  }
} 