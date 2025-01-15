/**
 * AudioPlaybackService.ts
 * 
 * 音声ファイルの再生を管理するサービス
 * - デコード、再生/一時停止/停止/シーク
 * - 再生状態とイベント管理
 * - エラーハンドリング
 */

import {
  AudioSource,
  AudioPlaybackState,
  AppError,
  ErrorType,
  Disposable
} from './types';

/**
 * 音声再生を管理するサービス
 * - Web Audio APIを使用
 * - シングルトンパターン
 * - 再生状態の管理
 * - リソース管理
 */
export class AudioPlaybackService implements Disposable {
  private static instance: AudioPlaybackService | null = null;
  
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private audioSource: AudioSource | null = null;
  
  private startTime: number = 0;
  private pausedTime: number = 0;
  private volume: number = 1;
  private loop: boolean = true;
  private isPlaying: boolean = false;
  private onPlaybackEnd: (() => void) | null = null;

  private constructor() {
    // シングルトンなのでprivate
  }

  public static getInstance(): AudioPlaybackService {
    if (!AudioPlaybackService.instance) {
      AudioPlaybackService.instance = new AudioPlaybackService();
    }
    return AudioPlaybackService.instance;
  }

  /**
   * 音声ソースを設定
   */
  public async setAudioSource(source: AudioSource): Promise<void> {
    try {
      this.stopAndCleanup();
      
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      
      this.audioBuffer = source.buffer;
      this.audioSource = source;
      
      this.startTime = 0;
      this.pausedTime = 0;
      this.isPlaying = false;
      
    } catch (error) {
      throw new AppError(
        ErrorType.AudioLoadFailed,
        'Failed to set audio source',
        error
      );
    }
  }

  /**
   * 音声ソースを取得
   */
  public getAudioSource(): AudioSource | null {
    return this.audioSource;
  }

  /**
   * 再生
   */
  public play(): void {
    if (!this.audioContext || !this.audioBuffer) {
      throw new AppError(
        ErrorType.AudioPlaybackFailed,
        'No audio source loaded'
      );
    }

    if (this.isPlaying) return;

    try {
      this.sourceNode = this.audioContext.createBufferSource();
      this.sourceNode.buffer = this.audioBuffer;
      this.sourceNode.connect(this.gainNode!);
      
      // ループ設定
      this.sourceNode.loop = this.loop;
      
      // 再生終了時のコールバック
      this.sourceNode.onended = () => {
        if (this.onPlaybackEnd) {
          this.onPlaybackEnd();
        }
        this.isPlaying = false;
      };
      
      const offset = this.pausedTime;
      this.startTime = this.audioContext.currentTime - offset;
      this.sourceNode.start(0, offset);
      this.isPlaying = true;
      
    } catch (error) {
      throw new AppError(
        ErrorType.AudioPlaybackFailed,
        'Failed to start playback',
        error
      );
    }
  }

  /**
   * 一時停止
   */
  public pause(): void {
    if (!this.isPlaying) return;

    try {
      this.sourceNode?.stop();
      this.pausedTime = this.audioContext!.currentTime - this.startTime;
      this.isPlaying = false;
      
    } catch (error) {
      throw new AppError(
        ErrorType.AudioPlaybackFailed,
        'Failed to pause playback',
        error
      );
    }
  }

  /**
   * シーク
   */
  public seek(time: number): void {
    if (time < 0 || time > this.getDuration()) {
      throw new AppError(
        ErrorType.AudioPlaybackFailed,
        'Invalid seek time'
      );
    }

    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }

    this.pausedTime = time;
    
    if (wasPlaying) {
      this.play();
    }
  }

  /**
   * 音量設定
   */
  public setVolume(volume: number): void {
    if (volume < 0 || volume > 1) {
      throw new AppError(
        ErrorType.AudioPlaybackFailed,
        'Invalid volume value'
      );
    }

    this.volume = volume;
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
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

  /**
   * 再生終了時のコールバックを設定
   */
  public setOnPlaybackEnd(callback: () => void): void {
    this.onPlaybackEnd = callback;
  }

  /**
   * 再生状態を取得
   */
  public getPlaybackState(): AudioPlaybackState {
    return {
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      isPlaying: this.isPlaying,
      volume: this.volume,
      loop: this.loop
    };
  }

  /**
   * 現在時刻を取得
   */
  private getCurrentTime(): number {
    if (!this.audioContext || !this.audioBuffer) return 0;
    
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedTime;
  }

  /**
   * 総再生時間を取得
   */
  private getDuration(): number {
    return this.audioBuffer?.duration ?? 0;
  }

  /**
   * リソースを解放
   */
  public dispose(): void {
    this.stopAndCleanup();
    this.audioContext?.close();
    this.audioContext = null;
    this.audioBuffer = null;
    this.audioSource = null;
    this.onPlaybackEnd = null;
  }

  /**
   * 再生を停止してリソースをクリーンアップ
   */
  private stopAndCleanup(): void {
    if (this.isPlaying) {
      this.sourceNode?.stop();
    }
    this.sourceNode?.disconnect();
    this.gainNode?.disconnect();
    this.sourceNode = null;
    this.gainNode = null;
    this.startTime = 0;
    this.pausedTime = 0;
    this.isPlaying = false;
  }
}