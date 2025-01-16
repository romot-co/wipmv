/**
 * AudioPlaybackService
 * - AudioContextの生成と管理
 * - 音声ファイルのデコード・再生制御
 * - 再生状態の管理（再生/一時停止/シーク/ループ）
 */

import { AudioSource, AppError, ErrorType } from './types';

export class AudioPlaybackService {
  private static instance: AudioPlaybackService;
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

  public getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
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
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = this.volume;

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
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioBuffer = null;
    this.audioSource = null;
    this.gainNode = null;
  }

  // オーディオコンテキストの初期化
  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
    }
  }

  // オーディオソースの初期化
  private initAudioSource() {
    if (!this.audioContext || !this.audioBuffer) return;

    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
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
      this.currentTime = this.audioContext.currentTime - this.startTime;
      
      // ループが無効で終端に達した場合は停止
      if (!this.loop && this.currentTime >= this.getDuration()) {
        this.stop();
      }
    }
  }
}