// src/services/VideoEncoderService.ts

import { MP4Muxer } from './MP4Muxer';
import { AppError, ErrorType, ErrorMessages } from './types/error';
import { Disposable } from './types/base';

export interface EncoderConfig {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  sampleRate: number;      // AACサンプルレート
  channels: number;        // AACチャンネル数
}

/**
 * オフラインエンコードサービス（WebCodecs + mp4-muxer）
 */
export class VideoEncoderService implements Disposable {
  private videoEncoder: VideoEncoder | null = null;
  private audioEncoder: AudioEncoder | null = null;
  private muxer: MP4Muxer | null = null;
  private lastVideoTimestamp = 0;
  private lastAudioTimestamp = 0;
  private frameInterval: number;  // フレーム間隔（マイクロ秒）
  private samplesPerFrame: number; // 1フレームあたりのサンプル数
  private isCancelled: boolean = false;
  private isDisposed: boolean = false;

  constructor(private config: EncoderConfig) {
    // フレーム間隔を計算（マイクロ秒単位）
    this.frameInterval = Math.floor(1_000_000 / config.frameRate);
    // 1フレームあたりのサンプル数を計算
    this.samplesPerFrame = Math.floor(config.sampleRate / config.frameRate);
  }

  /**
   * エンコードをキャンセル
   */
  public cancel(): void {
    if (this.isDisposed) return;
    this.isCancelled = true;
    this.dispose();
  }

  /**
   * キャンセル状態をチェック
   * @throws {AppError} キャンセルされている場合
   */
  private checkCancellation(): void {
    if (this.isCancelled) {
      throw new AppError(
        ErrorType.EXPORT_CANCELLED,
        ErrorMessages[ErrorType.EXPORT_CANCELLED]
      );
    }
  }

  /**
   * リソースの状態チェック
   * @throws {AppError} リソースが破棄済みの場合
   */
  private checkDisposed(): void {
    if (this.isDisposed) {
      throw new AppError(
        ErrorType.EXPORT_INIT_FAILED,
        'エンコーダーは既に破棄されています'
      );
    }
  }

  public async initialize(): Promise<void> {
    this.checkDisposed();

    try {
      this.checkCancellation();

      // MP4Muxer
      this.muxer = new MP4Muxer(
        {
          codec: 'avc',
          width: this.config.width,
          height: this.config.height,
        },
        {
          codec: 'aac',
          sampleRate: this.config.sampleRate,
          channels: this.config.channels,
        }
      );

      // VideoEncoder
      this.videoEncoder = new VideoEncoder({
        output: (chunk, meta) => {
          if (this.muxer && !this.isCancelled) {
            this.lastVideoTimestamp = chunk.timestamp;
            this.muxer.addVideoChunk(chunk, meta);
          }
        },
        error: (e) => {
          console.error('VideoEncoder error:', e);
          this.dispose();
          throw new AppError(
            ErrorType.EXPORT_ENCODE_FAILED,
            ErrorMessages[ErrorType.EXPORT_ENCODE_FAILED],
            e
          );
        }
      });
      const videoCfg: VideoEncoderConfig = {
        codec: 'avc1.42001f',
        width: this.config.width,
        height: this.config.height,
        bitrate: this.config.videoBitrate,
        framerate: this.config.frameRate,
        latencyMode: 'quality',
        avc: { format: 'avc' }
      };
      await this.videoEncoder.configure(videoCfg);

      // AudioEncoder
      this.audioEncoder = new AudioEncoder({
        output: (chunk, meta) => {
          if (this.muxer && !this.isCancelled) {
            this.lastAudioTimestamp = chunk.timestamp;
            this.muxer.addAudioChunk(chunk, meta);
          }
        },
        error: (e) => {
          console.error('AudioEncoder error:', e);
          this.dispose();
          throw new AppError(
            ErrorType.EXPORT_ENCODE_FAILED,
            ErrorMessages[ErrorType.EXPORT_ENCODE_FAILED],
            e
          );
        }
      });
      const audioCfg: AudioEncoderConfig = {
        codec: 'mp4a.40.2', // AAC-LC
        sampleRate: this.config.sampleRate,
        numberOfChannels: this.config.channels,
        bitrate: this.config.audioBitrate
      };
      await this.audioEncoder.configure(audioCfg);
    } catch (error: unknown) {
      this.dispose();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EXPORT_INIT_FAILED,
        ErrorMessages[ErrorType.EXPORT_INIT_FAILED],
        error
      );
    }
  }

  /**
   * Canvas => VideoFrame => VideoEncoder
   */
  public async encodeVideoFrame(canvas: HTMLCanvasElement, frameIndex: number) {
    if (!this.videoEncoder || this.isDisposed) return;

    try {
      this.checkCancellation();

      // フレームインデックスからタイムスタンプを計算
      const timestampUs = frameIndex * this.frameInterval;

      // タイムスタンプの整合性チェック
      if (timestampUs < this.lastVideoTimestamp) {
        console.warn('Video timestamp is not monotonic:', timestampUs, this.lastVideoTimestamp);
        return; // 過去のフレームは無視
      }

      const bitmap = await createImageBitmap(canvas);
      const frame = new VideoFrame(bitmap, { 
        timestamp: timestampUs,
        duration: this.frameInterval
      });
      
      try {
        this.videoEncoder.encode(frame);
      } finally {
        frame.close();
        bitmap.close();
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EXPORT_RENDER_FAILED,
        ErrorMessages[ErrorType.EXPORT_RENDER_FAILED],
        error
      );
    }
  }

  /**
   * AudioBuffer => AudioData => AudioEncoder
   */
  public async encodeAudioBuffer(
    audioBuffer: AudioBuffer,
    frameIndex: number
  ) {
    if (!this.audioEncoder || this.isDisposed) return;

    try {
      this.checkCancellation();

      // フレームインデックスからサンプル位置を計算
      const startSample = frameIndex * this.samplesPerFrame;
      const sampleCount = Math.min(
        this.samplesPerFrame,
        audioBuffer.length - startSample
      );

      if (sampleCount <= 0) return;

      // タイムスタンプを計算（フレーム位置から）
      const timestampUs = frameIndex * this.frameInterval;

      // タイムスタンプの整合性チェック
      if (timestampUs < this.lastAudioTimestamp) {
        console.warn('Audio timestamp is not monotonic:', timestampUs, this.lastAudioTimestamp);
        return; // 過去のサンプルは無視
      }

      // チャンネルごとのデータを取得
      const numberOfChannels = audioBuffer.numberOfChannels;
      const channelData = new Float32Array(sampleCount * numberOfChannels);

      // インターリーブ形式でデータを詰める
      for (let ch = 0; ch < numberOfChannels; ch++) {
        const sourceData = audioBuffer.getChannelData(ch);
        for (let i = 0; i < sampleCount; i++) {
          const srcIdx = startSample + i;
          if (srcIdx < sourceData.length) {
            // クリッピングを適用（-1.0 から 1.0 の範囲に制限）
            channelData[i * numberOfChannels + ch] = Math.max(-1, Math.min(1, sourceData[srcIdx]));
          }
        }
      }

      // AudioDataを作成
      const audioData = new AudioData({
        format: 'f32',
        sampleRate: audioBuffer.sampleRate,
        numberOfFrames: sampleCount,
        numberOfChannels: numberOfChannels,
        timestamp: timestampUs,
        data: channelData
      });

      try {
        // エンコード
        this.audioEncoder.encode(audioData);
      } finally {
        audioData.close();
      }
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EXPORT_ENCODE_FAILED,
        ErrorMessages[ErrorType.EXPORT_ENCODE_FAILED],
        error
      );
    }
  }

  /**
   * 最終処理
   */
  public async finalize(): Promise<Uint8Array> {
    if (!this.videoEncoder || !this.audioEncoder || !this.muxer || this.isDisposed) {
      throw new AppError(
        ErrorType.EXPORT_ENCODE_FAILED,
        ErrorMessages[ErrorType.EXPORT_ENCODE_FAILED]
      );
    }

    try {
      this.checkCancellation();
      await this.videoEncoder.flush();
      await this.audioEncoder.flush();
      return this.muxer.finalize();
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        ErrorType.EXPORT_ENCODE_FAILED,
        ErrorMessages[ErrorType.EXPORT_ENCODE_FAILED],
        error
      );
    } finally {
      this.dispose();
    }
  }

  /**
   * リソースの解放
   * 以下の順序で解放を行う:
   * 1. エンコーダー（VideoEncoder, AudioEncoder）
   * 2. Muxer
   * 3. その他の状態をリセット
   */
  public dispose(): void {
    if (this.isDisposed) return;

    try {
      // 1. エンコーダーの解放
      if (this.videoEncoder) {
        try {
          this.videoEncoder.close();
        } catch (error: unknown) {
          console.error('VideoEncoderのクローズに失敗:', error);
        }
        this.videoEncoder = null;
      }

      if (this.audioEncoder) {
        try {
          this.audioEncoder.close();
        } catch (error: unknown) {
          console.error('AudioEncoderのクローズに失敗:', error);
        }
        this.audioEncoder = null;
      }

      // 2. Muxerの解放
      this.muxer = null;

      // 3. 状態のリセット
      this.lastVideoTimestamp = 0;
      this.lastAudioTimestamp = 0;
    } finally {
      this.isDisposed = true;
    }
  }
}