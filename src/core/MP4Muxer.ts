import { Muxer, ArrayBufferTarget, MuxerOptions } from 'mp4-muxer';

/**
 * MP4多重化サービス
 * エンコードされた音声と映像をMP4ファイルに多重化する
 */
export class MP4Muxer {
  private muxer: Muxer;
  private target: ArrayBufferTarget;
  private duration: number = 0;
  private currentOptions: MuxerOptions;

  constructor(
    width: number,
    height: number,
    fps: number,
    private readonly onData: (data: Uint8Array) => void,
    private readonly onFinish: () => void
  ) {
    this.target = new ArrayBufferTarget();
    this.currentOptions = {
      target: this.target,
      video: {
        codec: 'avc',
        width,
        height,
        frameRate: fps
      },
      fastStart: 'in-memory', // メタデータを先頭に配置し、ストリーミングに最適化
      firstTimestampBehavior: 'offset' // タイムスタンプを0から開始
    };
    this.muxer = new Muxer(this.currentOptions);
  }

  /**
   * 音声トラックを追加
   */
  addAudioTrack(sampleRate: number, channels: number): void {
    // 音声トラックの設定を追加
    this.currentOptions = {
      ...this.currentOptions,
      audio: {
        codec: 'aac',
        numberOfChannels: channels,
        sampleRate
      }
    };
    this.muxer = new Muxer(this.currentOptions);
  }

  /**
   * 映像チャンクを追加
   */
  addVideoChunk(chunk: EncodedVideoChunk, timestamp: number): void {
    this.muxer.addVideoChunk(chunk, undefined, timestamp);
    this.updateDuration(timestamp);
  }

  /**
   * 音声チャンクを追加
   */
  addAudioChunk(chunk: EncodedAudioChunk, timestamp: number): void {
    this.muxer.addAudioChunk(chunk, undefined, timestamp);
    this.updateDuration(timestamp);
  }

  /**
   * 多重化を完了
   */
  finish(): void {
    this.muxer.finalize();
    this.onData(this.target.buffer);
    this.onFinish();
  }

  private updateDuration(timestamp: number): void {
    this.duration = Math.max(this.duration, timestamp);
  }

  /**
   * 現在の動画の長さを取得
   */
  getDuration(): number {
    return this.duration;
  }
} 