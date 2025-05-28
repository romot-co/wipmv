// src/core/VideoEncoderService.ts

import { AppError, ErrorType, ErrorMessages } from './types/error';
import { Disposable } from './types/base';

/**
 * VideoEncoderServiceの設定
 */
export interface EncoderConfig {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  sampleRate: number;
  channels: number;
  // ネイティブWebCodecs対応の設定
  codec?: 'avc1.4d0034' | 'avc1.42001f' | 'vp8' | 'vp09.00.10.08';
  keyFrameInterval?: number; // キーフレーム間隔（秒）
  hardwareAcceleration?: 'no-preference' | 'prefer-hardware' | 'prefer-software';
}

/**
 * エンコード進捗情報
 */
export interface ProgressInfo {
  framesProcessed: number;
  totalFrames: number;
  progress: number; // 0-1
  fps?: number;
}

/**
 * ネイティブWebCodecs APIを使用したビデオエンコーダーサービス
 */
export class VideoEncoderService implements Disposable {
  private encoder: VideoEncoder | null = null;
  private encodedChunks: EncodedVideoChunk[] = [];
  private isInitialized = false;
  private isEncoding = false;
  private frameIndex = 0;
  private totalFrames = 0;
  private nextKeyFrameTimestamp = 0;
  private keyFrameInterval: number;
  private startTime = 0;

  private onProgressCallback?: (progress: ProgressInfo) => void;

  constructor(private config: EncoderConfig) {
    console.log('VideoEncoderService: Constructor called with config:', config);
    this.encodedChunks = [];
    this.keyFrameInterval = (config.keyFrameInterval || 2) * 1_000_000; // 2秒間隔をマイクロ秒に変換
  }

  /**
   * エンコーダーの初期化
   */
  async initialize(): Promise<void> {
    try {
      console.log('VideoEncoderService: Initializing native WebCodecs encoder');

      // ブラウザサポートチェック
      if (typeof VideoEncoder === 'undefined') {
        throw new AppError(
          ErrorType.EXPORT_INIT_FAILED,
          'WebCodecs API is not supported in this browser'
        );
      }

      const codec = this.config.codec || 'avc1.4d0034';

      // コーデックサポートチェック
      const isSupported = await VideoEncoder.isConfigSupported({
        codec,
        width: this.config.width,
        height: this.config.height,
        bitrate: this.config.videoBitrate,
        framerate: this.config.frameRate,
        hardwareAcceleration: this.config.hardwareAcceleration || 'prefer-hardware'
      });

      if (!isSupported.supported) {
        throw new AppError(
          ErrorType.EXPORT_INIT_FAILED,
          `Codec ${codec} is not supported`
        );
      }

      // エンコーダー作成
      this.encoder = new VideoEncoder({
        output: (chunk, metadata) => {
          console.log(`Encoded chunk: ${chunk.type} frame, size: ${chunk.byteLength} bytes`);
          this.encodedChunks.push(chunk);

          // 進捗更新
          this.frameIndex++;
          if (this.onProgressCallback) {
            const elapsed = (performance.now() - this.startTime) / 1000;
            this.onProgressCallback({
              framesProcessed: this.frameIndex,
              totalFrames: this.totalFrames,
              progress: this.totalFrames > 0 ? this.frameIndex / this.totalFrames : 0,
              fps: elapsed > 0 ? this.frameIndex / elapsed : 0
            });
          }
        },
        error: (error) => {
          console.error('VideoEncoder error:', error);
          throw new AppError(ErrorType.EXPORT_ENCODE_FAILED, error.message);
        }
      });

      // エンコーダー設定
      this.encoder.configure({
        codec,
        width: this.config.width,
        height: this.config.height,
        bitrate: this.config.videoBitrate,
        framerate: this.config.frameRate,
        hardwareAcceleration: this.config.hardwareAcceleration || 'prefer-hardware'
      });

      this.isInitialized = true;
      console.log('VideoEncoderService: Initialized successfully');

    } catch (error) {
      throw new AppError(
        ErrorType.EXPORT_INIT_FAILED,
        `Failed to initialize encoder: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 進捗コールバックの設定
   */
  setProgressCallback(callback: (progress: ProgressInfo) => void): void {
    this.onProgressCallback = callback;
  }

  /**
   * エンコーディング開始
   */
  async startEncoding(totalFrames: number): Promise<void> {
    if (!this.isInitialized || !this.encoder) {
      throw new AppError(ErrorType.EXPORT_ENCODE_FAILED, 'Encoder not initialized');
    }

    if (this.isEncoding) {
      throw new AppError(ErrorType.EXPORT_ENCODE_FAILED, 'Encoding already in progress');
    }

    console.log(`VideoEncoderService: Starting encoding for ${totalFrames} frames`);
    this.isEncoding = true;
    this.frameIndex = 0;
    this.totalFrames = totalFrames;
    this.nextKeyFrameTimestamp = 0;
    this.encodedChunks = [];
    this.startTime = performance.now();
  }

  /**
   * フレームをエンコード
   */
  async encodeVideoFrame(
    canvas: HTMLCanvasElement,
    timestamp: number,
    duration: number = 33333 // デフォルト30fps
  ): Promise<void> {
    if (!this.encoder || !this.isEncoding) {
      throw new AppError(ErrorType.EXPORT_ENCODE_FAILED, 'Encoder not ready');
    }

    try {
      // HTMLCanvasElementからVideoFrameを作成
      const videoFrame = new VideoFrame(canvas, {
        timestamp: timestamp * 1_000_000, // マイクロ秒に変換
        duration: duration
      });

      // キーフレーム判定
      const keyFrame = timestamp * 1_000_000 >= this.nextKeyFrameTimestamp;
      if (keyFrame) {
        this.nextKeyFrameTimestamp = timestamp * 1_000_000 + this.keyFrameInterval;
        console.log(`Key frame at timestamp: ${timestamp}`);
      }

      // エンコード実行
      this.encoder.encode(videoFrame, { keyFrame });

      // VideoFrameリソースを解放
      videoFrame.close();

    } catch (error) {
      throw new AppError(
        ErrorType.EXPORT_ENCODE_FAILED,
        `Failed to encode frame: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * エンコーディング完了
   */
  async finalize(): Promise<Uint8Array> {
    if (!this.encoder || !this.isEncoding) {
      throw new AppError(ErrorType.EXPORT_FINALIZE_FAILED, 'No encoding in progress');
    }

    try {
      console.log('VideoEncoderService: Finalizing encoding...');

      // エンコーダーをフラッシュして残りのフレームを処理
      await this.encoder.flush();

      console.log(`VideoEncoderService: Encoded ${this.encodedChunks.length} chunks`);

      // MP4ファイルを作成
      const mp4Data = await this.createMP4File();

      this.isEncoding = false;
      console.log(`VideoEncoderService: Encoding completed successfully, output size: ${mp4Data.byteLength} bytes`);

      return mp4Data;

    } catch (error) {
      this.isEncoding = false;
      throw new AppError(
        ErrorType.EXPORT_FINALIZE_FAILED,
        `Failed to finalize encoding: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * MP4ファイルを作成（簡易実装）
   */
  private async createMP4File(): Promise<Uint8Array> {
    // 実際の実装では、mp4-muxerやWebM muxerを使用してコンテナに格納
    // ここでは一時的に生のchunksを結合（実際のMP4形式ではない）
    
    const totalSize = this.encodedChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const buffer = new ArrayBuffer(totalSize);
    const uint8Array = new Uint8Array(buffer);
    
    let offset = 0;
    for (const chunk of this.encodedChunks) {
      const chunkData = new Uint8Array(chunk.byteLength);
      chunk.copyTo(chunkData);
      uint8Array.set(chunkData, offset);
      offset += chunk.byteLength;
    }

    return uint8Array;
  }

  /**
   * 音声データの追加（将来の実装用）
   */
  async addAudioData(audioData: AudioBuffer): Promise<void> {
    // 音声エンコーディングの実装は今後追加
    console.log('VideoEncoderService: Audio encoding not yet implemented');
  }

  /**
   * リソースのクリーンアップ
   */
  dispose(): void {
    console.log('VideoEncoderService: Disposing resources');

    if (this.encoder) {
      try {
        if (this.encoder.state !== 'closed') {
          this.encoder.close();
        }
      } catch (error) {
        console.warn('Error closing encoder:', error);
      }
      this.encoder = null;
    }

    this.encodedChunks = [];
    this.isInitialized = false;
    this.isEncoding = false;
    this.onProgressCallback = undefined;

    console.log('VideoEncoderService: Disposed');
  }
}