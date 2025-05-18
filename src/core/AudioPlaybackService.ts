/**
 * AudioPlaybackService
 * - AudioContextの生成と管理
 * - 音声ファイルのデコード・再生制御
 * - 再生状態の管理（再生/一時停止/シーク/ループ）
 */

import { ErrorType, AudioSource, AudioPlayback, AudioSourceControl, PlaybackState, withAudioError, AppError } from './types/index';
import debug from 'debug';

const log = debug('app:AudioPlaybackService');

/**
 * 再生状態を管理するクラス
 */
class PlaybackStateManager {
  private state: PlaybackState;
  private listeners: Set<(state: PlaybackState) => void> = new Set();

  constructor() {
    this.state = {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      volume: 1,
      loop: false
    };
  }

  update(partial: Partial<PlaybackState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  get(): PlaybackState {
    return { ...this.state };
  }

  addListener(callback: (state: PlaybackState) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (state: PlaybackState) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.get();
    this.listeners.forEach(listener => listener(state));
  }
}

/**
 * オーディオ再生サービス
 * - シングルトンパターンで実装
 * - AudioContextの管理
 * - 再生/一時停止/停止の制御
 * - 音量/ループの設定
 * - 再生位置の取得/設定
 */
export class AudioPlaybackService implements AudioPlayback, AudioSourceControl {
  private static instance: AudioPlaybackService | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private audioSource: AudioSource | null = null;
  private startTime = 0;
  private pausedTime = 0;
  private stateManager: PlaybackStateManager;
  private isPlaying = false;
  private offset = 0;
  private duration = 0;
  private volume = 1;
  private loop = false;
  private lastLogTime: { [key: string]: number } = {};

  private shouldLog(key: string, intervalMs: number = 1000): boolean {
    const now = performance.now();
    const lastTime = this.lastLogTime[key] || 0;
    if (now - lastTime > intervalMs) {
      this.lastLogTime[key] = now;
      return true;
    }
    return false;
  }

  private constructor() {
    this.stateManager = new PlaybackStateManager();
  }

  public static getInstance(): AudioPlaybackService {
    if (!AudioPlaybackService.instance) {
      AudioPlaybackService.instance = new AudioPlaybackService();
    }
    return AudioPlaybackService.instance;
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext) {
      if (this.shouldLog('audio-context-init')) {
        log('AudioContext: 初期化開始');
      }
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.stateManager.get().volume;
      if (this.shouldLog('audio-context-init')) {
        log('AudioContext: 初期化完了');
      }
    }
    return this.audioContext;
  }

  public getAudioContext(): AudioContext {
    return this.initAudioContext();
  }

  public async setAudioSource(source: AudioSource): Promise<void> {
    return withAudioError(
      async () => {
        if (this.shouldLog('audio-source-set')) {
          log('AudioSource設定開始:', {
            hasBuffer: !!source.buffer,
            hasWaveformData: !!source.waveformData,
            hasFrequencyData: !!source.frequencyData
          });
        }

        this.stop();
        this.initAudioContext();
        this.audioBuffer = source.buffer;
        this.audioSource = source;

        if (!this.audioContext) {
          throw new Error('AudioContext is not initialized');
        }

        const duration = this.audioBuffer?.duration || 0;
        if (this.shouldLog('audio-source-set')) {
          log('オーディオソース設定: duration =', duration);
        }
        
        this.stateManager.update({
          currentTime: 0,
          duration: duration,
          isPlaying: false,
          volume: this.stateManager.get().volume,
          loop: this.stateManager.get().loop
        });

        if (this.shouldLog('audio-source-set')) {
          log('AudioSource設定完了');
        }
      },
      ErrorType.AudioPlaybackFailed,
      'オーディオソースの設定に失敗しました'
    );
  }

  public getAudioSource(): AudioSource | null {
    return this.audioSource;
  }

  private initAudioSource(): void {
    if (!this.audioContext || !this.audioBuffer) return;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.loop = this.stateManager.get().loop;

    if (this.gainNode) {
      this.sourceNode.connect(this.gainNode);
    }
  }

  public play(): void {
    if (this.isPlaying || !this.audioContext) return;
    
    this.startTime = this.audioContext.currentTime;
    this.offset = this.pausedTime;

    if (!this.audioBuffer || !this.gainNode) return;

    if (this.shouldLog('playback')) {
      log('再生開始:', {
        duration: this.audioBuffer.duration,
        currentTime: this.getCurrentTime(),
        offset: this.offset,
        loop: this.loop,
        pausedTime: this.pausedTime
      });
    }

    this.isPlaying = true;
    this.duration = this.audioBuffer.duration;

    this.initAudioSource();
    if (this.sourceNode) {
      this.sourceNode.loop = this.loop;
      this.sourceNode.start(0, this.offset);
    }
    
    this.stateManager.update({
      currentTime: this.offset,
      duration: this.duration,
      isPlaying: true,
      volume: this.volume,
      loop: this.loop
    });
    
    this.updatePlaybackState();
  }

  public pause(): void {
    if (!this.isPlaying || !this.audioContext || !this.sourceNode) return;
    
    // 現在の再生位置を保存
    const currentTime = this.getCurrentTime();
    this.pausedTime = currentTime;
    this.offset = currentTime;
    
    // 再生を停止
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    this.isPlaying = false;
    
    // 状態を更新
    this.stateManager.update({
      currentTime: currentTime,
      isPlaying: false
    });
  }

  public stop(): void {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.pausedTime = 0;
    this.stateManager.update({ isPlaying: false, currentTime: 0 });
  }

  public seek(time: number): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) {
      if (this.sourceNode) {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
    }
    
    this.offset = Math.max(0, Math.min(time, this.getDuration()));
    this.stateManager.update({ currentTime: this.offset });
    
    if (wasPlaying) {
      this.play();
    }
  }

  public getCurrentTime(): number {
    if (!this.audioContext || !this.audioBuffer) return 0;
    
    if (this.isPlaying) {
      const elapsed = this.audioContext.currentTime - this.startTime;
      let currentTime = this.offset + elapsed;
      
      if (this.loop && currentTime >= this.audioBuffer.duration) {
        currentTime = currentTime % this.audioBuffer.duration;
        // ループ時の処理を修正
        if (Math.abs(currentTime - this.offset) > this.audioBuffer.duration) {
          this.offset = currentTime;
          this.startTime = this.audioContext.currentTime;
        }
      } else if (!this.loop && currentTime >= this.audioBuffer.duration) {
        this.pause();
        return this.audioBuffer.duration;
      }
      
      if (this.shouldLog('get-current-time')) {
        log('getCurrentTime詳細:', {
          elapsed,
          currentTime,
          offset: this.offset,
          audioContextTime: this.audioContext.currentTime,
          startTime: this.startTime,
          duration: this.audioBuffer.duration,
          isPlaying: this.isPlaying,
          loop: this.loop,
          pausedTime: this.pausedTime
        });
      }
      
      return Math.min(currentTime, this.audioBuffer.duration);
    }
    
    return this.offset;
  }

  public getDuration(): number {
    return this.audioBuffer?.duration || 0;
  }

  public getPlaybackState(): PlaybackState {
    const state = this.stateManager.get();
    return {
      ...state,
      currentTime: this.getCurrentTime()
    };
  }

  private updatePlaybackState(): void {
    if (!this.audioContext || !this.audioBuffer) return;

    const currentTime = this.getCurrentTime();
    const duration = this.audioBuffer.duration;

    if (this.shouldLog('playback-state')) {
      log('再生状態更新:', {
        currentTime,
        duration,
        isPlaying: this.isPlaying,
        loop: this.loop,
        audioContextTime: this.audioContext.currentTime,
        startTime: this.startTime,
        offset: this.offset
      });
    }

    this.stateManager.update({
      currentTime,
      duration,
      isPlaying: this.isPlaying,
      volume: this.volume,
      loop: this.loop
    });

    if (this.isPlaying) {
      window.requestAnimationFrame(() => {
        try {
          if (!this.loop && currentTime >= duration) {
            if (this.shouldLog('playback-end')) {
              log('再生終了判定:', {
                currentTime,
                duration,
                loop: this.loop
              });
            }
            this.isPlaying = false;
            this.offset = 0;
            this.stateManager.update({
              currentTime: 0,
              isPlaying: false
            });
            return;
          }
          this.updatePlaybackState();
        } catch (error) {
          console.error('再生状態更新エラー:', error);
          if (this.isPlaying) {
            window.requestAnimationFrame(() => this.updatePlaybackState());
          }
        }
      });
    }
  }

  public setVolume(value: number): void {
    const volume = Math.max(0, Math.min(1, value));
    this.volume = volume;
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
    this.stateManager.update({ volume });
  }

  public setLoop(value: boolean): void {
    this.loop = value;
    if (this.sourceNode) {
      this.sourceNode.loop = value;
    }
    this.stateManager.update({ loop: value });
    
    if (this.shouldLog('loop-change')) {
      log('ループ設定変更:', {
        loop: value,
        currentTime: this.getCurrentTime(),
        isPlaying: this.isPlaying
      });
    }
  }

  public dispose(): void {
    log('AudioPlaybackService: リソースの解放開始');
    
    this.stop();
    
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioBuffer = null;
    this.audioSource = null;
    AudioPlaybackService.instance = null;
    
    log('AudioPlaybackService: リソースの解放完了');
  }

  public async decodeAudioData(buffer: ArrayBuffer): Promise<AudioBuffer> {
    log('オーディオデコード開始');
    
    // AudioContextの初期化
    const audioContext = this.initAudioContext();

    try {
      const audioBuffer = await audioContext.decodeAudioData(buffer);
      log('オーディオデコード完了:', {
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

  public addStateChangeListener(callback: (state: PlaybackState) => void): void {
    this.stateManager.addListener(callback);
  }

  public removeStateChangeListener(callback: (state: PlaybackState) => void): void {
    this.stateManager.removeListener(callback);
  }
}