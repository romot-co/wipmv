import { Muxer, ArrayBufferTarget, MuxerOptions } from 'mp4-muxer';

interface VideoConfig {
  codec: string;
  width: number;
  height: number;
  frameRate: number;
}

interface AudioConfig {
  codec: string;
  numberOfChannels: number;
  sampleRate: number;
}

/**
 * MP4多重化サービス
 * エンコードされた音声と映像をMP4ファイルに多重化する
 */
export class MP4Muxer {
  private muxer: Muxer;
  private target: ArrayBufferTarget;
  private duration: number = 0;
  private currentOptions: MuxerOptions & {
    video?: VideoConfig;
    audio?: AudioConfig;
  };

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
      fastStart: true, // メタデータを先頭に配置し、ストリーミングに最適化
      firstTimestampBehavior: 'offset' // タイムスタンプを0から開始
    };
    this.muxer = new Muxer(this.currentOptions as MuxerOptions);
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
    this.muxer = new Muxer(this.currentOptions as MuxerOptions);
  }

  /**
   * 映像チャンクを追加
   */
  addVideoChunk(chunk: EncodedVideoChunk, timestamp: number): void {
    this.muxer.addVideoChunk(chunk, timestamp);
    this.updateDuration(timestamp);
  }

  /**
   * 音声チャンクを追加
   */
  addAudioChunk(chunk: EncodedAudioChunk, timestamp: number): void {
    this.muxer.addAudioChunk(chunk, timestamp);
    this.updateDuration(timestamp);
  }

  /**
   * 多重化を完了し、MP4ファイルをダウンロード
   */
  async finish(): Promise<void> {
    try {
      await this.muxer.finalize();
      
      // MP4データを取得
      const mp4Data = this.target.buffer;
      
      // ダウンロード用のBlobを作成
      const blob = new Blob([mp4Data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      // ダウンロード用の一時的なリンクを作成
      const a = document.createElement('a');
      a.href = url;
      a.download = `output_${new Date().getTime()}.mp4`;
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // コールバックを呼び出し
      this.onData(mp4Data);
      this.onFinish();
    } catch (error) {
      console.error('MP4の多重化に失敗しました:', error);
      throw error;
    }
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