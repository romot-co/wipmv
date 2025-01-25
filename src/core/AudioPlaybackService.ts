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
  }

  get(): PlaybackState {
    return { ...this.state };
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
  private stateUpdateTimer: number | null = null;

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
      console.log('AudioContext: 初期化開始');
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.stateManager.get().volume;
      console.log('AudioContext: 初期化完了');
    }
    return this.audioContext;
  }

  public getAudioContext(): AudioContext {
    return this.initAudioContext();
  }

  public async setAudioSource(source: AudioSource): Promise<void> {
    return withAudioError(
      async () => {
        console.log('AudioSource設定開始:', {
          hasBuffer: !!source.buffer,
          hasWaveformData: !!source.waveformData,
          hasFrequencyData: !!source.frequencyData
        });

        this.stop();
        this.initAudioContext();
        this.audioBuffer = source.buffer;
        this.audioSource = source;

        if (!this.audioContext) {
          throw new Error('AudioContext is not initialized');
        }

        // duration設定を確実に行う
        const duration = this.audioBuffer?.duration || 0;
        console.log('オーディオソース設定: duration =', duration);
        
        this.stateManager.update({
          currentTime: 0,
          duration: duration,
          isPlaying: false,
          volume: this.stateManager.get().volume,
          loop: this.stateManager.get().loop
        });

        console.log('AudioSource設定完了');
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
    if (!this.audioContext || !this.audioBuffer || !this.gainNode) return;

    console.log('再生開始:', {
      duration: this.audioBuffer.duration,
      currentTime: this.getCurrentTime(),
      offset: this.offset,
      loop: this.loop
    });

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime;
    this.duration = this.audioBuffer.duration;

    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.loop = this.loop;
    
    this.sourceNode.onended = () => {
      console.log('再生終了イベント:', {
        loop: this.loop,
        currentTime: this.getCurrentTime(),
        duration: this.duration,
        offset: this.offset
      });

      if (this.loop && this.audioContext) {
        this.offset = 0;
        this.startTime = this.audioContext.currentTime;
        this.play();
      } else {
        this.isPlaying = false;
        this.offset = 0;
        this.updatePlaybackState();
      }
    };

    this.sourceNode.start(0, this.offset);
    
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
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.pausedTime = this.getCurrentTime();
    this.stateManager.update({ isPlaying: false });
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
      
      // ループ再生時の位置調整
      if (this.loop && currentTime >= this.audioBuffer.duration) {
        currentTime = currentTime % this.audioBuffer.duration;
      } else if (!this.loop && currentTime >= this.audioBuffer.duration) {
        currentTime = this.audioBuffer.duration;
        this.isPlaying = false;
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

    console.log('再生状態更新:', {
      currentTime,
      duration,
      isPlaying: this.isPlaying,
      loop: this.loop,
      audioContextTime: this.audioContext.currentTime,
      startTime: this.startTime,
      offset: this.offset
    });

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
            console.log('再生終了判定:', {
              currentTime,
              duration,
              loop: this.loop
            });
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
}