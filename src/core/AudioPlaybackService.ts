/**
 * AudioPlaybackService.ts
 *
 * - 音声ファイルのデコード
 * - 再生/一時停止/停止/シーク
 * - onendedイベントで自然終了を検知
 * - ループ設定
 */

import { AudioSource } from './types';
import { AudioAnalyzer } from './AudioAnalyzerService';

export class AudioPlaybackService {
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private audioSource: AudioSource | null = null;
  private _isPlaying = false;
  private _startTime = 0;
  private _startOffset = 0;
  private _loop = false;
  private _onEnded: (() => void) | null = null;

  constructor() {
    this.audioContext = new AudioContext();
  }

  /**
   * ファイルをデコードし、オフライン解析を実行
   */
  public async decodeFile(file: File): Promise<void> {
    if (!this.audioContext) {
      throw new Error('AudioContext is not initialized');
    }

    const analyzer = new AudioAnalyzer();
    this.audioSource = await analyzer.processAudio(file);
    this.audioBuffer = this.audioSource.buffer;
  }

  /**
   * 再生開始
   */
  public async play(): Promise<void> {
    if (!this.audioContext || !this.audioBuffer) return;

    // 既存のソースノードを停止
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
    }

    // 新しいソースノードを作成
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this._loop;
    this.sourceNode.connect(this.audioContext.destination);

    // onendedイベントを設定
    this.sourceNode.onended = () => {
      this._isPlaying = false;
      this._onEnded?.();
    };

    // 再生開始
    const offset = this._startOffset % this.audioBuffer.duration;
    this._startTime = this.audioContext.currentTime - offset;
    this.sourceNode.start(0, offset);
    this._isPlaying = true;
  }

  /**
   * 一時停止
   */
  public pause(): void {
    if (!this._isPlaying) return;

    this.sourceNode?.stop();
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this._startOffset = this.getCurrentTime();
    this._isPlaying = false;
  }

  /**
   * 停止（最初に戻る）
   */
  public stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this._startOffset = 0;
    this._isPlaying = false;
    this._startTime = 0;
  }

  /**
   * 指定時間にシーク
   */
  public async seek(time: number): Promise<void> {
    const wasPlaying = this._isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this._startOffset = time;
    if (wasPlaying) {
      await this.play();
    }
  }

  /**
   * 現在の再生時間を取得
   */
  public getCurrentTime(): number {
    if (!this.audioContext || !this._isPlaying) {
      return this._startOffset;
    }
    const elapsed = this.audioContext.currentTime - this._startTime;
    return this._startOffset + elapsed;
  }

  /**
   * 総再生時間を取得
   */
  public getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  /**
   * 再生中かどうかを取得
   */
  public isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * ループ設定を変更
   */
  public setLoop(loop: boolean): void {
    this._loop = loop;
    if (this.sourceNode) {
      this.sourceNode.loop = loop;
    }
  }

  /**
   * 再生終了時のコールバックを設定
   */
  public onEnded(callback: () => void): void {
    this._onEnded = callback;
  }

  /**
   * AudioSourceを取得
   */
  public getAudioSource(): AudioSource | null {
    return this.audioSource;
  }

  // オーディオバッファを取得
  getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }
}