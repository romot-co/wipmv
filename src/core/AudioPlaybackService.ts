/**
 * AudioPlaybackService
 * - AudioContextの生成と管理
 * - 音声ファイルのデコード・再生制御
 * - 再生状態の管理（再生/一時停止/シーク/ループ）
 */

import { AppError, ErrorType, AudioSource } from './types';

/**
 * オーディオ再生サービス
 * - シングルトンパターンで実装
 * - AudioContextの管理
 * - 再生/一時停止/停止の制御
 * - 音量/ループの設定
 * - 再生位置の取得/設定
 */
export class AudioPlaybackService {
  private static instance: AudioPlaybackService | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioSource: AudioSource | null = null;
  private startTime = 0;
  private pausedTime = 0;
  private isPlaying = false;
  private volume = 1;
  private loop = false;
  private currentTime = 0;

  private constructor() {
    // シングルトンのため private
  }

  public static getInstance(): AudioPlaybackService {
    if (!AudioPlaybackService.instance) {
      AudioPlaybackService.instance = new AudioPlaybackService();
    }
    return AudioPlaybackService.instance;
  }

  // AudioContextの生成を一元化
  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      console.log('AudioContext: 初期化開始');
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
      console.log('AudioContext: 初期化完了');
    }
    return this.audioContext;
  }

  // 外部からのAudioContext取得用
  public getAudioContext(): AudioContext {
    return this.initAudioContext();
  }

  public async setAudioSource(source: AudioSource): Promise<void> {
    console.log('AudioSource設定開始:', {
      hasBuffer: !!source.buffer,
      hasWaveformData: !!source.waveformData,
      hasFrequencyData: !!source.frequencyData,
      waveformDataLength: source.waveformData?.[0]?.length,
      frequencyDataLength: source.frequencyData?.[0]?.length
    });

    // 既存の再生を停止
    this.stop();

    // AudioContextの初期化
    this.initAudioContext();

    // AudioBufferの設定
    this.audioBuffer = source.buffer;
    this.audioSource = source;

    // GainNodeの初期化
    if (!this.audioContext) {
      throw new AppError(
        ErrorType.AudioPlaybackFailed,
        'AudioContext is not initialized'
      );
    }

    console.log('AudioSource設定完了:', {
      hasWaveformData: !!source.waveformData,
      hasFrequencyData: !!source.frequencyData
    });
  }

  public getAudioSource(): AudioSource | null {
    return this.audioSource;
  }

  public play(): void {
    if (!this.audioContext || !this.audioBuffer) {
      throw new AppError(
        ErrorType.PlaybackError,
        'AudioContext or AudioBuffer is not initialized'
      );
    }

    console.log('[DEBUG] 再生開始:', {
      duration: this.audioBuffer.duration,
      sampleRate: this.audioBuffer.sampleRate,
      numberOfChannels: this.audioBuffer.numberOfChannels,
      hasAudioSource: !!this.audioSource,
      hasWaveformData: this.audioSource?.waveformData?.length,
      hasFrequencyData: this.audioSource?.frequencyData?.length,
      currentTime: this.getCurrentTime(),
      volume: this.volume,
      loop: this.loop
    });

    this.initAudioSource();
    
    if (this.audioSource) {
      const offset = this.pausedTime;
      this.startTime = this.audioContext.currentTime - offset;
      this.sourceNode?.start(0, offset);
      this.isPlaying = true;
      
      // 定期的に再生状態を更新
      const updateInterval = setInterval(() => {
        if (!this.isPlaying) {
          clearInterval(updateInterval);
          return;
        }
        this.updatePlaybackState();
      }, 100);
    }
  }

  public pause(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.pausedTime = this.getCurrentTime();
    this.isPlaying = false;
  }

  public stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.pausedTime = 0;
    this.isPlaying = false;
  }

  public seek(time: number): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      this.pause();
    }
    this.pausedTime = Math.max(0, Math.min(time, this.getDuration()));
    if (wasPlaying) {
      this.play();
    }
  }

  public getCurrentTime(): number {
    if (!this.audioContext || !this.audioBuffer) return 0;
    
    if (this.isPlaying) {
      const currentTime = this.audioContext.currentTime - this.startTime;
      if (this.loop) {
        return currentTime % this.audioBuffer.duration;
      }
      return Math.min(currentTime, this.audioBuffer.duration);
    }
    return this.pausedTime;
  }

  public getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  public getPlaybackState() {
    return {
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
      isPlaying: this.isPlaying
    };
  }

  public setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setLoop(value: boolean): void {
    this.loop = value;
    if (this.sourceNode) {
      this.sourceNode.loop = value;
    }
  }

  public getLoop(): boolean {
    return this.loop;
  }

  public dispose(): void {
    console.log('AudioPlaybackService: リソースの解放開始');
    
    // 再生を停止
    this.stop();
    
    // sourceNodeの解放
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    // gainNodeの解放
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    // AudioContextの解放
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioBuffer = null;
    this.audioSource = null;
    AudioPlaybackService.instance = null;
    
    console.log('AudioPlaybackService: リソースの解放完了');
  }

  // オーディオソースの初期化
  private initAudioSource() {
    if (!this.audioContext || !this.audioBuffer) return;

    // 既存のsourceNodeを解放
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this.loop;
    
    if (this.gainNode) {
      this.sourceNode.connect(this.gainNode);
    }
  }

  // 再生状態の更新
  private updatePlaybackState() {
    if (!this.audioContext || !this.audioSource) return;
    
    if (this.isPlaying) {
      const prevTime = this.currentTime;
      this.currentTime = this.audioContext.currentTime - this.startTime;
      
      // デバッグ情報: 再生状態の更新
      console.log('[DEBUG] 再生状態更新:', {
        currentTime: this.currentTime,
        timeDelta: this.currentTime - prevTime,
        isPlaying: this.isPlaying,
        hasAudioSource: !!this.audioSource,
        hasWaveformData: this.audioSource?.waveformData?.length,
        hasFrequencyData: this.audioSource?.frequencyData?.length
      });
      
      // ループが無効で終端に達した場合は停止
      if (!this.loop && this.currentTime >= this.getDuration()) {
        this.stop();
      }
    }
  }

  public async decodeAudioData(buffer: ArrayBuffer): Promise<AudioBuffer> {
    console.log('オーディオデコード開始');
    
    // AudioContextの初期化
    const audioContext = this.initAudioContext();

    try {
      const audioBuffer = await audioContext.decodeAudioData(buffer);
      console.log('オーディオデコード完了:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      });
      return audioBuffer;
    } catch (error) {
      console.error('オーディオデコードエラー:', error);
      throw new AppError(
        ErrorType.AudioDecodeFailed,
        error instanceof Error ? error.message : 'オーディオデコードに失敗しました',
        error
      );
    }
  }
}