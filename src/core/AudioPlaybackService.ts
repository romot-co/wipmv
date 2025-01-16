/**
 * AudioPlaybackService.ts
 * 
 * 音声ファイルの再生を管理するサービス
 * - 音声データの一元管理（デコード、バッファ管理）
 * - 再生制御（再生/一時停止/停止/シーク）
 * - 時刻管理（ループ再生を含む）
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
 * - アプリケーション全体で唯一のAudioContext管理
 * - 音声データの一元管理
 * - 正確な時刻管理
 */
export class AudioPlaybackService implements Disposable {
  private static instance: AudioPlaybackService | null = null;
  
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private analyzerNode: AnalyserNode | null = null;
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
   * AudioContextとノードの初期化
   * アプリケーション全体で唯一のAudioContextを管理
   */
  private initializeAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      
      // GainNodeの初期化
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      
      // AnalyserNodeの初期化
      this.analyzerNode = this.audioContext.createAnalyser();
      this.analyzerNode.fftSize = 2048;
      this.analyzerNode.smoothingTimeConstant = 0.8;
      this.analyzerNode.connect(this.gainNode);
    }
  }

  /**
   * 音声ファイルのデコードとソース設定
   */
  public async loadAudio(file: File): Promise<AudioSource> {
    try {
      const arrayBuffer = await this.readFile(file);
      this.initializeAudioContext();
      
      if (!this.audioContext) {
        throw new AppError(
          ErrorType.AudioLoadFailed,
          'AudioContext initialization failed'
        );
      }

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return this.setAudioBuffer(audioBuffer);
      
    } catch (error) {
      throw new AppError(
        ErrorType.AudioLoadFailed,
        'Failed to load audio file',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * AudioBufferの設定
   */
  private async setAudioBuffer(buffer: AudioBuffer): Promise<AudioSource> {
    this.stopAndCleanup();
    this.audioBuffer = buffer;
    
    // AudioSourceの作成（この時点では波形データなし）
    const audioSource: AudioSource = {
      buffer: buffer,
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      numberOfChannels: buffer.numberOfChannels
    };
    
    this.audioSource = audioSource;
    return audioSource;
  }

  /**
   * 音声ソースを設定（解析結果を含む）
   */
  public async setAudioSource(source: AudioSource): Promise<void> {
    try {
      this.stopAndCleanup();
      this.audioBuffer = source.buffer;
      this.audioSource = source;
      
      // 状態のリセット
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
   * アナライザーノードを取得
   */
  public getAnalyzerNode(): AnalyserNode | null {
    return this.analyzerNode;
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
      
      // AnalyserNode -> GainNode -> destination の順に接続
      this.sourceNode.connect(this.analyzerNode!);
      
      // ループ設定
      this.sourceNode.loop = this.loop;
      
      // 再生終了時のコールバック
      this.sourceNode.onended = () => {
        if (!this.loop) {
          if (this.onPlaybackEnd) {
            this.onPlaybackEnd();
          }
          this.isPlaying = false;
        } else {
          // ループ時は時刻をリセット
          this.startTime = this.audioContext!.currentTime;
          this.pausedTime = 0;
        }
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
      this.pausedTime = this.getCurrentTime();
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
   * 現在時刻を取得（ループを考慮）
   */
  private getCurrentTime(): number {
    if (!this.audioContext || !this.audioBuffer) return 0;
    
    if (this.isPlaying) {
      const currentTime = this.audioContext.currentTime - this.startTime;
      if (this.loop) {
        // ループ時は duration で割った余りを返す
        return currentTime % this.audioBuffer.duration;
      }
      return currentTime;
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
   * ファイルの読み込み
   */
  private async readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new AppError(
            ErrorType.AudioDecodeFailed,
            'Failed to read audio file'
          ));
        }
      };
      reader.onerror = () => {
        reject(new AppError(
          ErrorType.AudioDecodeFailed,
          'Failed to read audio file'
        ));
      };
      reader.readAsArrayBuffer(file);
    });
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
    this.startTime = 0;
    this.pausedTime = 0;
    this.isPlaying = false;
  }
}