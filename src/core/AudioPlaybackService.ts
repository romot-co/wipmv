/**
 * AudioPlaybackService.ts
 *
 * - 音声ファイルのデコード
 * - 再生/一時停止/停止/シーク
 * - onendedイベントで自然終了を検知
 * - AnalyserNodeにより波形データや周波数データを取得
 * - ループ設定
 *
 * ※ 描画用のrequestAnimationFrameは持ちません。
 *    EffectManagerが描画ループを担当します。
 */

export class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;

  private analyser: AnalyserNode | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  private _isPlaying = false;
  private _startTime = 0;
  private _startOffset = 0;
  private _loop = false;

  constructor() {
    // AudioContextを初期化
    this.audioContext = new AudioContext();

    // AnalyserNodeの生成
    if (this.audioContext) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      // 出力先はAudioContext.destination
      this.analyser.connect(this.audioContext.destination);
    }
  }

  /**
   * FileをデコードしてAudioBufferをセットする
   */
  public async decodeFile(file: File): Promise<void> {
    if (!this.audioContext) {
      throw new Error("AudioContextが初期化されていません");
    }
    const arrayBuffer = await file.arrayBuffer();
    const decoded = await this.audioContext.decodeAudioData(arrayBuffer);
    this.setAudioBuffer(decoded);
  }

  /**
   * 任意のAudioBufferをセット
   */
  public setAudioBuffer(buffer: AudioBuffer): void {
    this.audioBuffer = buffer;
    // 再生位置を0にリセット
    this._startOffset = 0;
  }

  /**
   * 再生
   */
  public async play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer || !this.analyser) return;

    // すでにsourceNodeがあれば止める
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.loop = this._loop;

    // 終了イベント
    source.onended = () => {
      if (this._isPlaying) {
        // 自然終了 or stop()時
        this._isPlaying = false;
        this._startOffset = 0; // 曲の頭に戻す
        this.sourceNode = null;
      }
    };

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
    if (!this._isPlaying || !this.sourceNode || !this.audioContext) return;

    const elapsed = this.audioContext.currentTime - this._startTime;
    this._startOffset += elapsed;

    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this._isPlaying = false;
  }

  /**
   * 停止（再生位置を0に戻す）
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
    this.stop(); // stop()で_offset=0にする
    this._startOffset = Math.max(0, time);

    if (wasPlaying) {
      await this.play();
    }
  }

  /**
   * 現在の再生位置(秒)
   */
  public getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (this._isPlaying) {
      // 今のcurrentTime - startTime + これまでのオフセット
      const elapsed = this.audioContext.currentTime - this._startTime;
      return this._startOffset + elapsed;
    }
    return this._startOffset;
  }

  /**
   * トータルの長さ(秒)
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
   * ループ設定
   */
  public setLoop(loop: boolean): void {
    this._loop = loop;
    if (this.sourceNode) {
      this.sourceNode.loop = loop;
    }
  }

  /**
   * AnalyserNodeの取得
   */
  public getAnalyserNode(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * AudioBufferの取得
   */
  public getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  /**
   * 波形データ(time-domain)を -1.0〜+1.0 のFloat32Arrayで返す
   */
  public getWaveformData(): Float32Array {
    if (!this.analyser) return new Float32Array();
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    const floatData = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      floatData[i] = (data[i] - 128) / 128;
    }
    return floatData;
  }

  /**
   * 周波数データ(0~255)を返す
   */
  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array();
    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqData);
    return freqData;
  }
}