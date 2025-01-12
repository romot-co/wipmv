import { MP4Muxer } from './MP4Muxer';

/**
 * WebCodecsのサポート状況を確認
 */
export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'VideoEncoder' in window &&
    'AudioEncoder' in window &&
    'VideoFrame' in window &&
    'AudioData' in window
  );
}

/**
 * エンコーダーサービス
 * 音声と映像のエンコードを管理する
 */
export class EncoderService {
  private videoEncoder?: VideoEncoder;
  private audioEncoder?: AudioEncoder;
  private videoConfig: VideoEncoderConfig;
  private audioConfig: AudioEncoderConfig;
  private videoKeyFrameInterval: number;
  private isEncoding: boolean = false;
  private muxer: MP4Muxer;
  private currentVideoTime: number = 0;
  private currentAudioTime: number = 0;
  private encodedData: Uint8Array[] = [];

  constructor(
    width: number,
    height: number,
    fps: number = 30,
    videoBitrate: number = 5_000_000,
    audioBitrate: number = 128_000
  ) {
    if (!isWebCodecsSupported()) {
      throw new Error('WebCodecs is not supported in this browser');
    }

    this.videoConfig = {
      codec: 'vp8',
      width,
      height,
      bitrate: videoBitrate,
      framerate: fps,
    };

    this.audioConfig = {
      codec: 'opus',
      sampleRate: 48000,
      numberOfChannels: 2,
      bitrate: audioBitrate,
    };

    this.videoKeyFrameInterval = fps * 2; // 2秒ごとにキーフレーム
    this.muxer = new MP4Muxer(
      width,
      height,
      fps,
      (data: Uint8Array) => this.encodedData.push(data),
      () => console.log('Muxing completed')
    );
  }

  /**
   * エンコーダーを初期化
   */
  async initialize(): Promise<void> {
    try {
      // VideoEncoderの初期化
      this.videoEncoder = new VideoEncoder({
        output: this.handleVideoChunk.bind(this),
        error: this.handleError.bind(this),
      });

      // AudioEncoderの初期化
      this.audioEncoder = new AudioEncoder({
        output: this.handleAudioChunk.bind(this),
        error: this.handleError.bind(this),
      });

      // エンコーダーの設定
      await this.videoEncoder.configure(this.videoConfig);
      await this.audioEncoder.configure(this.audioConfig);

      // Muxerの音声トラック追加
      this.muxer.addAudioTrack(this.audioConfig.sampleRate, this.audioConfig.numberOfChannels);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to initialize encoders'));
    }
  }

  /**
   * 映像フレームをエンコード
   */
  async encodeVideoFrame(frame: VideoFrame, timestamp: number): Promise<void> {
    if (!this.videoEncoder || !this.isEncoding) return;

    try {
      const keyFrame = timestamp % this.videoKeyFrameInterval === 0;
      await this.videoEncoder.encode(frame, { keyFrame });
      this.currentVideoTime = timestamp;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to encode video frame'));
    } finally {
      frame.close();
    }
  }

  /**
   * 音声データをエンコード
   */
  async encodeAudioData(audioData: AudioData): Promise<void> {
    if (!this.audioEncoder || !this.isEncoding) return;

    try {
      await this.audioEncoder.encode(audioData);
      this.currentAudioTime = audioData.timestamp || 0;
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to encode audio data'));
    } finally {
      audioData.close();
    }
  }

  /**
   * AudioBufferから音声データを処理
   */
  async processAudioBuffer(audioBuffer: AudioBuffer, timestamp: number): Promise<void> {
    try {
      const numberOfFrames = audioBuffer.length;
      const numberOfChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;

      // チャンネルデータの取得
      const channelData = new Array(numberOfChannels);
      for (let i = 0; i < numberOfChannels; i++) {
        channelData[i] = audioBuffer.getChannelData(i);
      }

      // AudioDataの作成
      const audioData = new AudioData({
        format: 'f32',
        sampleRate,
        numberOfFrames,
        numberOfChannels,
        timestamp,
        data: new Float32Array(numberOfFrames * numberOfChannels),
      });

      await this.encodeAudioData(audioData);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to process audio buffer'));
    }
  }

  /**
   * エンコードを開始
   */
  start(): void {
    this.isEncoding = true;
    this.currentVideoTime = 0;
    this.currentAudioTime = 0;
    this.encodedData = [];
  }

  /**
   * エンコードを停止
   */
  async stop(): Promise<void> {
    this.isEncoding = false;

    try {
      if (this.videoEncoder) {
        await this.videoEncoder.flush();
      }
      if (this.audioEncoder) {
        await this.audioEncoder.flush();
      }
      this.muxer.finish();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Failed to flush encoders'));
    }
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.isEncoding = false;
    if (this.videoEncoder) {
      this.videoEncoder.close();
    }
    if (this.audioEncoder) {
      this.audioEncoder.close();
    }
  }

  /**
   * エンコード済みのMP4データを取得
   */
  getEncodedData(): Uint8Array {
    return this.concatUint8Arrays(this.encodedData);
  }

  /**
   * エンコードの進行状況を取得
   */
  getDuration(): number {
    return this.muxer.getDuration();
  }

  private handleVideoChunk(chunk: EncodedVideoChunk): void {
    this.muxer.addVideoChunk(chunk, this.currentVideoTime);
  }

  private handleAudioChunk(chunk: EncodedAudioChunk): void {
    this.muxer.addAudioChunk(chunk, this.currentAudioTime);
  }

  private handleError(error: Error): void {
    console.error('Encoder error:', error);
    this.isEncoding = false;
    this.dispose();
    throw error;
  }

  private concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }
} 