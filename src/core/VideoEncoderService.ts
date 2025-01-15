// src/services/VideoEncoderService.ts

import { MP4Muxer } from './MP4Muxer';

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
export class VideoEncoderService {
  private videoEncoder: VideoEncoder | null = null;
  private audioEncoder: AudioEncoder | null = null;
  private muxer: MP4Muxer | null = null;
  private lastVideoTimestamp = 0;
  private lastAudioTimestamp = 0;

  constructor(private config: EncoderConfig) {}

  public async initialize(): Promise<void> {
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
        if (this.muxer) {
          this.lastVideoTimestamp = chunk.timestamp;
          this.muxer.addVideoChunk(chunk, meta);
        }
      },
      error: (e) => console.error('VideoEncoder error:', e)
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
        if (this.muxer) {
          this.lastAudioTimestamp = chunk.timestamp;
          this.muxer.addAudioChunk(chunk, meta);
        }
      },
      error: (e) => console.error('AudioEncoder error:', e)
    });
    const audioCfg: AudioEncoderConfig = {
      codec: 'mp4a.40.2', // AAC-LC
      sampleRate: this.config.sampleRate,
      numberOfChannels: this.config.channels,
      bitrate: this.config.audioBitrate
    };
    await this.audioEncoder.configure(audioCfg);
  }

  /**
   * Canvas => VideoFrame => VideoEncoder
   */
  public async encodeVideoFrame(canvas: HTMLCanvasElement, timestampUs: number) {
    if (!this.videoEncoder) return;

    // タイムスタンプの整合性チェック
    if (timestampUs < this.lastVideoTimestamp) {
      console.warn('Video timestamp is not monotonic:', timestampUs, this.lastVideoTimestamp);
      timestampUs = this.lastVideoTimestamp + 1;
    }

    const bitmap = await createImageBitmap(canvas);
    const frame = new VideoFrame(bitmap, { 
      timestamp: timestampUs,
      duration: Math.floor(1_000_000 / this.config.frameRate)
    });
    this.videoEncoder.encode(frame);
    frame.close();
    bitmap.close();
  }

  /**
   * AudioBuffer => AudioData => AudioEncoder
   */
  public async encodeAudioBuffer(
    audioBuffer: AudioBuffer,
    startSample: number,
    sampleCount: number,
    timestampUs: number
  ) {
    if (!this.audioEncoder) return;

    // タイムスタンプの整合性チェック
    if (timestampUs < this.lastAudioTimestamp) {
      console.warn('Audio timestamp is not monotonic:', timestampUs, this.lastAudioTimestamp);
      timestampUs = this.lastAudioTimestamp + 1;
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

    // エンコード
    this.audioEncoder.encode(audioData);
    audioData.close();
  }

  /**
   * 最終処理
   */
  public async finalize(): Promise<Uint8Array> {
    if (!this.videoEncoder || !this.audioEncoder || !this.muxer) {
      throw new Error('Not initialized properly');
    }

    await this.videoEncoder.flush();
    await this.audioEncoder.flush();
    return this.muxer.finalize();
  }

  public dispose() {
    this.videoEncoder?.close();
    this.audioEncoder?.close();
    this.videoEncoder = null;
    this.audioEncoder = null;
    this.muxer = null;
  }
}