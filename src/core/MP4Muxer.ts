// src/services/encoder/MP4Muxer.ts

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

/**
 * 映像設定
 */
export interface MP4VideoConfig {
  width: number;
  height: number;
  codec?: 'avc' | 'hevc' | 'vp9' | 'av1';
}

/**
 * 音声設定
 */
export interface MP4AudioConfig {
  sampleRate: number;
  channels: number;
  codec?: 'aac' | 'opus'; // 'aac' | 'opus' のみ許可
}

/**
 * MP4Muxer
 * - EncodedAudioChunk / EncodedVideoChunk を受け取り、
 *   mp4-muxer で多重化し、最終的にMP4を生成する。
 */
export class MP4Muxer {
  private muxer: Muxer<ArrayBufferTarget>;
  private target: ArrayBufferTarget;
  private isAudioConfigured = false;
  private isVideoConfigured = false;

  constructor(
    private readonly videoConfig: MP4VideoConfig,
    private readonly audioConfig: MP4AudioConfig
  ) {
    // 内部バッファ
    this.target = new ArrayBufferTarget();

    // mp4-muxer の設定
    // ※ ここでは映像・音声とも初期化時点でセットする例（あとから追加でもOK）
    this.muxer = new Muxer<ArrayBufferTarget>({
      target: this.target,
      video: {
        codec: videoConfig.codec ?? 'avc',
        width: videoConfig.width,
        height: videoConfig.height,
      },
      audio: {
        codec: audioConfig.codec ?? 'aac',
        sampleRate: audioConfig.sampleRate,
        numberOfChannels: audioConfig.channels,
      },
      fastStart: 'in-memory', // MP4のメタデータを先頭に配置
    });
    this.isAudioConfigured = true;
    this.isVideoConfigured = true;
  }

  /**
   * 映像チャンクを追加
   * @param chunk EncodedVideoChunk
   * @param meta EncodedVideoChunkMetadata
   */
  addVideoChunk(chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata): void {
    if (!this.isVideoConfigured) {
      console.warn('Video track not configured yet.');
      return;
    }
    this.muxer.addVideoChunk(chunk, meta);
  }

  /**
   * 音声チャンクを追加
   * @param chunk EncodedAudioChunk
   * @param meta EncodedAudioChunkMetadata
   */
  addAudioChunk(chunk: EncodedAudioChunk, meta?: EncodedAudioChunkMetadata): void {
    if (!this.isAudioConfigured) {
      console.warn('Audio track not configured yet.');
      return;
    }
    this.muxer.addAudioChunk(chunk, meta);
  }

  /**
   * すべてのチャンクを追加し終わったら呼ぶ
   * @returns MP4バイナリ（Uint8Array）
   */
  finalize(): Uint8Array {
    this.muxer.finalize();
    return new Uint8Array(this.target.buffer);
  }
}
