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
        this.muxer?.addVideoChunk(chunk, meta);
      },
      error: (e) => console.error('VideoEncoder error:', e)
    });
    const videoCfg: VideoEncoderConfig = {
      codec: 'avc1.42001f',
      width: this.config.width,
      height: this.config.height,
      bitrate: this.config.videoBitrate,
      framerate: this.config.frameRate
    };
    this.videoEncoder.configure(videoCfg);

    // AudioEncoder
    this.audioEncoder = new AudioEncoder({
      output: (chunk, meta) => {
        this.muxer?.addAudioChunk(chunk, meta);
      },
      error: (e) => console.error('AudioEncoder error:', e)
    });
    const audioCfg: AudioEncoderConfig = {
      codec: 'mp4a.40.2',
      sampleRate: this.config.sampleRate,
      numberOfChannels: this.config.channels,
      bitrate: this.config.audioBitrate
    };
    this.audioEncoder.configure(audioCfg);
  }

  /**
   * Canvas => VideoFrame => VideoEncoder
   */
  public async encodeVideoFrame(canvas: HTMLCanvasElement, timestampUsec: number) {
    if (!this.videoEncoder) return;
    const bitmap = await createImageBitmap(canvas);
    const frame = new VideoFrame(bitmap, { timestamp: timestampUsec });
    this.videoEncoder.encode(frame);
    frame.close();
    bitmap.close();
  }

  /**
   * AudioBuffer => AudioData => AudioEncoder
   * @param startSample 何サンプル目から
   * @param sampleCount いくつのサンプルを切り出すか
   * @param timestampUsec タイムスタンプ(μs)
   */
  public async encodeAudioBuffer(
    audioBuffer: AudioBuffer,
    startSample: number,
    sampleCount: number,
    timestampUsec: number
  ) {
    if (!this.audioEncoder) return;
    const channelData = new Float32Array(sampleCount * audioBuffer.numberOfChannels);

    // インターリーブ（左右chを交互に詰める等）
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      const src = audioBuffer.getChannelData(ch);
      for (let i = 0; i < sampleCount; i++) {
        const srcIdx = startSample + i;
        if (srcIdx < src.length) {
          channelData[i * audioBuffer.numberOfChannels + ch] = src[srcIdx];
        }
      }
    }

    const audioData = new AudioData({
      format: 'f32', // or 'f32-planar' etc.
      sampleRate: audioBuffer.sampleRate,
      numberOfFrames: sampleCount,
      numberOfChannels: audioBuffer.numberOfChannels,
      timestamp: timestampUsec,
      data: channelData
    });

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