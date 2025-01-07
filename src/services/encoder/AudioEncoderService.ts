import { AudioEncoderConfig } from '../../types/encoder';

export class AudioEncoderService {
  private encoder: AudioEncoder | null = null;
  private config: AudioEncoderConfig;

  constructor(config: AudioEncoderConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // コーデックのサポートチェック
    const support = await AudioEncoder.isConfigSupported({
      codec: this.config.codec,
      sampleRate: this.config.sampleRate,
      numberOfChannels: this.config.channels,
      bitrate: this.config.bitrate
    });

    if (!support.supported) {
      throw new Error('Unsupported audio configuration');
    }

    // エンコーダーの初期化
    this.encoder = new AudioEncoder({
      output: this.handleEncodedChunk.bind(this),
      error: this.handleError.bind(this)
    });

    await this.encoder.configure({
      codec: this.config.codec,
      sampleRate: this.config.sampleRate,
      numberOfChannels: this.config.channels,
      bitrate: this.config.bitrate
    });
  }

  private handleEncodedChunk(chunk: EncodedAudioChunk): void {
    // エンコード済みチャンクの処理
    // MP4Multiplexerに渡すなどの処理を実装
  }

  private handleError(error: Error): void {
    console.error('Audio encoding error:', error);
    throw error;
  }

  async encodeAudioData(audioData: AudioData): Promise<void> {
    if (!this.encoder) {
      throw new Error('Encoder not initialized');
    }

    await this.encoder.encode(audioData);
    audioData.close();
  }

  async flush(): Promise<void> {
    if (!this.encoder) {
      throw new Error('Encoder not initialized');
    }
    await this.encoder.flush();
  }

  getConfig(): AudioEncoderConfig {
    return { ...this.config };
  }
} 