/**
 * AudioPlaybackService
 *
 * - 単一のAudioContextを管理
 * - 音声ファイルのデコード（decodeFile）
 * - AudioBufferSourceNodeを使った再生・一時停止・停止・シークなどの操作
 * - AnalyserNodeを介したリアルタイム解析 (getWaveformData, getFrequencyData)
 *
 * React からは、このサービスを生成して渡すだけでOK。
 * 画面更新はやらず「音声再生や状態保持」に集中。
 */

export class AudioPlaybackService {
  private audioContext: AudioContext | null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private audioBuffer: AudioBuffer | null = null;

  private _isPlaying = false;
  private _startOffset = 0;
  private _startTime = 0;

  private loop = false; // ループするかどうか。自由に切り替え可能

  constructor() {
    // AudioContext を初期化
    this.audioContext = new AudioContext();

    // AnalyserNode の生成・初期設定
    if (this.audioContext) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048; // 必要に応じて変更可
      // シンプルに解析結果を出力先(destination) に直結
      this.analyser.connect(this.audioContext.destination);
    }
  }

  /**
   * decodeFile
   * ユーザーがアップロードした File を AudioBuffer に変換
   */
  public async decodeFile(file: File): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContextが初期化されていません');
    }
    const arrayBuffer = await file.arrayBuffer();
    const decodedBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    this.setAudioBuffer(decodedBuffer);
  }

  /**
   * setAudioBuffer
   */
  public setAudioBuffer(buffer: AudioBuffer): void {
    this.audioBuffer = buffer;
    this._startOffset = 0;
  }

  public getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  /**
   * 再生
   */
  public async play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) return;

    // すでにソースがあれば一度停止
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.loop = this.loop;
    source.connect(this.analyser);

    this._startTime = this.audioContext.currentTime;
    source.start(0, this._startOffset);
    this.sourceNode = source;
    this._isPlaying = true;
  }

  /**
   * 一時停止
   */
  public pause(): void {
    if (!this._isPlaying) return;
    if (this.sourceNode && this.audioContext) {
      const elapsed = this.audioContext.currentTime - this._startTime;
      this._startOffset += elapsed;
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this._isPlaying = false;
  }

  /**
   * 停止
   * 再生位置を0に戻す
   */
  public stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this._startOffset = 0;
    this._isPlaying = false;
  }

  /**
   * シーク
   */
  public async seek(time: number): Promise<void> {
    const wasPlaying = this._isPlaying;
    this.stop(); // _startOffset=0, _isPlaying=false
    this._startOffset = time >= 0 ? time : 0;

    if (wasPlaying) {
      await this.play();
    }
  }

  /**
   * 現在の再生位置を取得
   */
  public getCurrentTime(): number {
    if (this._isPlaying && this.audioContext) {
      return this._startOffset + (this.audioContext.currentTime - this._startTime);
    }
    return this._startOffset;
  }

  /**
   * 総再生時間を取得
   */
  public getDuration(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0;
  }

  /**
   * 再生中かどうか
   */
  public isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * AnalyserNodeを取得
   */
  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  public getWaveformData(): Float32Array {
    if (!this.analyser) return new Float32Array();
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    // 必要に応じて Uint8 => Float32 へ変換なども
    return Float32Array.from(data);
  }
  
  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array();
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  /**
   * ループ設定
   */
  public setLoop(loop: boolean): void {
    this.loop = loop;
    if (this.sourceNode) {
      this.sourceNode.loop = loop;
    }
  }
}