/**
 * AudioPlaybackService
 * - AudioContextの生成と管理
 * - 音声ファイルのデコード・再生制御
 * - 再生状態の管理（再生/一時停止/シーク/ループ）
 */

import { ErrorType, AudioSource, AudioPlayback, AudioSourceControl, PlaybackState, withAudioError, AppError } from './types/index';

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
        console.log('AudioContext: 初期化開始');
      }
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.stateManager.get().volume;
      if (this.shouldLog('audio-context-init')) {
        console.log('AudioContext: 初期化完了');
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
          console.log('AudioSource設定開始:', {
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
          console.log('オーディオソース設定: duration =', duration);
        }
        
        this.stateManager.update({
          currentTime: 0,
          duration: duration,
          isPlaying: false,
          volume: this.stateManager.get().volume,
          loop: this.stateManager.get().loop
        });

        if (this.shouldLog('audio-source-set')) {
          console.log('AudioSource設定完了');
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
    // シーク時はoffsetを使用、それ以外はpausedTimeを使用
    if (this.offset !== this.pausedTime) {
      this.pausedTime = this.offset;
    } else {
      this.offset = this.pausedTime;
    }

    if (!this.audioBuffer || !this.gainNode) return;

    if (this.shouldLog('playback')) {
      console.log('再生開始:', {
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
    
    // 先にisPlayingをfalseにして無限再帰を防ぐ
    this.isPlaying = false;
    
    // 現在の再生位置を保存（isPlayingがfalseなのでoffsetが返される）
    const currentTime = this.getCurrentTime();
    this.pausedTime = currentTime;
    this.offset = currentTime;
    
    // 再生を停止
    this.sourceNode.stop();
    this.sourceNode.disconnect();
    this.sourceNode = null;
    
    // 状態を更新
    this.stateManager.update({
      currentTime: currentTime,
      isPlaying: false
    });
  }

  public stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        console.debug('SourceNode already stopped');
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.offset = 0;
    this.pausedTime = 0;
    this.stateManager.update({ isPlaying: false, currentTime: 0 });
  }

  public seek(time: number): void {
    const wasPlaying = this.isPlaying;
    
    // 現在の再生を停止
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch (error) {
        // SourceNodeが既に停止されている場合のエラーを無視
        console.debug('SourceNode already stopped');
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    // シーク位置を設定
    this.offset = Math.max(0, Math.min(time, this.getDuration()));
    this.pausedTime = this.offset; // pausedTimeも同期
    this.isPlaying = false; // 一旦停止状態にする
    
    // 状態を更新
    this.stateManager.update({ 
      currentTime: this.offset,
      isPlaying: false 
    });
    
    // 再生中だった場合は再開
    if (wasPlaying) {
      // 少し遅延を入れてから再生を開始
      setTimeout(() => {
        this.play();
      }, 10);
    }
    
    if (this.shouldLog('seek')) {
      console.log('シーク実行:', {
        time,
        offset: this.offset,
        wasPlaying,
        willResumePlayback: wasPlaying
      });
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
        // 音声終了時は直接停止処理を行う（pauseメソッドを呼ばない）
        if (this.sourceNode) {
          this.sourceNode.stop();
          this.sourceNode.disconnect();
          this.sourceNode = null;
        }
        this.isPlaying = false;
        this.offset = this.audioBuffer.duration;
        this.pausedTime = this.audioBuffer.duration;
        
        this.stateManager.update({
          currentTime: this.audioBuffer.duration,
          isPlaying: false
        });
        
        return this.audioBuffer.duration;
      }
      
      if (this.shouldLog('get-current-time')) {
        console.log('getCurrentTime詳細:', {
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
      console.log('再生状態更新:', {
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
              console.log('再生終了判定:', {
                currentTime,
                duration,
                loop: this.loop
              });
            }
            this.isPlaying = false;
            // 再生終了時も現在位置を保持（0にリセットしない）
            this.offset = duration;
            this.pausedTime = duration;
            this.stateManager.update({
              currentTime: duration,
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
      console.log('ループ設定変更:', {
        loop: value,
        currentTime: this.getCurrentTime(),
        isPlaying: this.isPlaying
      });
    }
  }

  public dispose(): void {
    console.log('AudioPlaybackService: リソースの解放開始');
    
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
    
    console.log('AudioPlaybackService: リソースの解放完了');
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

  public addStateChangeListener(callback: (state: PlaybackState) => void): void {
    this.stateManager.addListener(callback);
  }

  public removeStateChangeListener(callback: (state: PlaybackState) => void): void {
    this.stateManager.removeListener(callback);
  }
}