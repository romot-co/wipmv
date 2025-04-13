import { AudioSource } from './base';
import { ErrorType } from './error';

/**
 * 音声解析の結果
 */
export interface AnalysisResult {
  waveformData: Float32Array[];
  frequencyData: Float32Array[][];
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

/**
 * 音声解析インターフェース
 */
export interface AudioAnalyzer {
  analyze(source: AudioSource): Promise<AnalysisResult>;
  getAnalysisResult(): AnalysisResult | null;
  dispose(): void;
}

/**
 * エラーハンドリングのためのユーティリティ関数
 */
export async function withAudioError<T>(
  fn: () => Promise<T>,
  errorType: ErrorType,
  message: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw {
      type: errorType,
      message: message,
      details: error
    };
  }
}

/**
 * 再生状態
 */
export interface PlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
}

/**
 * 音声再生インターフェース
 */
export interface AudioPlayback {
  play(): void;
  pause(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  setLoop(loop: boolean): void;
  getPlaybackState(): PlaybackState;
  dispose(): void;
}

/**
 * 音声ソース制御インターフェース
 */
export interface AudioSourceControl {
  getAudioSource(): AudioSource | null;
  setAudioSource(source: AudioSource): Promise<void>;
} 