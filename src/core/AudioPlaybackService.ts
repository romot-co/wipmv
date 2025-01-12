/*単一の AudioContext を使い、
	•	ファイルのデコード
	•	AudioBufferSourceNode の再生/停止/シーク
	•	AnalyserNode でのリアルタイム解析

などを担うサービスクラスです。 */

export class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;

  private audioBuffer: AudioBuffer | null = null;

  // 状態管理用
  private isPlaying = false;
  private startOffset = 0;   // 再生開始時点
  private startTime = 0;     // AudioContext.currentTime での再生開始タイミング

  constructor() {
    this.ensureContext();
  }

  /**
   * AudioContext を生成 (まだなければ)
   */
  private ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
    }
  }

  /**
   * ファイルデコード
   */
  public async decodeFile(file: File): Promise<AudioBuffer> {
    this.ensureContext();
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const arrayBuffer = await file.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    return this.audioBuffer;
  }

  /**
   * AudioBuffer を直接セットするパターン
   */
  public setAudioBuffer(buffer: AudioBuffer) {
    this.ensureContext();
    this.audioBuffer = buffer;
  }

  /**
   * 再生開始
   */
  public play() {
    if (!this.audioContext || !this.audioBuffer) return;

    // もし既に再生してたら一旦停止
    if (this.isPlaying) {
      this.stop();
    }

    // 再度ソースを作成
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    // Source -> analyser -> destination
    this.sourceNode.connect(this.analyser!);
    this.analyser!.connect(this.audioContext.destination);

    // 再生終了時
    this.sourceNode.onended = () => {
      this.isPlaying = false;
      this.sourceNode?.disconnect();
      this.sourceNode = null;
      // 終了時に任意のコールバック処理等
    };

    // 開始
    this.startTime = this.audioContext.currentTime;
    this.sourceNode.start(0, this.startOffset);
    this.isPlaying = true;
  }

  /**
   * 一時停止
   */
  public pause() {
    if (!this.isPlaying || !this.sourceNode) return;

    const currentPos = this.getCurrentTime();
    this.stop();
    this.startOffset = currentPos;
  }

  /**
   * 停止 (再生位置を0に戻す)
   */
  public stop() {
    if (!this.isPlaying || !this.sourceNode) return;

    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;
    this.startOffset = 0;
  }

  /**
   * シーク (一時停止して再度 start)
   */
  public seek(timeSec: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.stop();
    }
    this.startOffset = Math.min(timeSec, this.getDuration());
    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * 現在の再生時間(秒)
   */
  public getCurrentTime(): number {
    if (!this.isPlaying || !this.audioContext) {
      return this.startOffset;
    }
    return (this.audioContext.currentTime - this.startTime) + this.startOffset;
  }

  /**
   * トータル再生時間
   */
  public getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  /**
   * AnalyserNode 取得 (波形表示や周波数分析に使用)
   */
  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * AudioContext の状態を確認
   */
  public get isSuspended(): boolean {
    return this.audioContext?.state === 'suspended';
  }

  /**
   * AudioContext を再開
   */
  public async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * リソース解放
   */
  public dispose() {
    this.stop();
    this.analyser?.disconnect();
    this.audioContext?.close();
    this.audioContext = null;
    this.sourceNode = null;
    this.analyser = null;
    this.audioBuffer = null;
  }
}