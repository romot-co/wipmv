/**
 * audio-inspect ライブラリの型定義
 */

declare module 'audio-inspect' {
  // 基本的な音声データ型
  export interface AudioData {
    duration: number;
    sampleRate: number;
    numberOfChannels: number;
    getChannelData(channel: number): Float32Array;
  }

  // 波形データの結果
  export interface WaveformResult {
    waveform: Float32Array;
    framesPerSecond: number;
    method: string;
  }

  // ピーク検出の結果
  export interface PeaksResult {
    positions: number[];
    values: number[];
  }

  // FFTの結果
  export interface FFTResult {
    magnitude: Float32Array;
    phase: Float32Array;
    frequencies: Float32Array;
    provider: string;
  }

  // スペクトラムの結果
  export interface SpectrumResult {
    frequencies: Float32Array;
    magnitudes: Float32Array;
    spectrogram?: Float32Array[];
  }

  // 音声解析のオプション
  export interface WaveformOptions {
    framesPerSecond?: number;
    channel?: number;
    method?: 'rms' | 'peak' | 'average';
  }

  export interface PeaksOptions {
    count?: number;
    threshold?: number;
    channel?: number;
    minDistance?: number;
  }

  export interface FFTOptions {
    fftSize?: number;
    windowFunction?: string;
    channel?: number;
    provider?: string;
    enableProfiling?: boolean;
  }

  export interface SpectrumOptions {
    fftSize?: number;
    minFrequency?: number;
    maxFrequency?: number;
    decibels?: boolean;
    timeFrames?: number;
    overlap?: number;
  }

  // メイン関数群
  export function load(file: File | ArrayBuffer): Promise<AudioData>;
  
  export function analyze<T>(
    audio: AudioData, 
    analyzer: (audio: AudioData) => Promise<T> | T
  ): Promise<T>;
  
  export function getPeaks(audio: AudioData, options?: PeaksOptions): PeaksResult;
  
  export function getWaveform(audio: AudioData, options?: WaveformOptions): WaveformResult;
  
  export function getFFT(audio: AudioData, options?: FFTOptions): Promise<FFTResult>;
  
  export function getSpectrum(audio: AudioData, options?: SpectrumOptions): Promise<SpectrumResult>;
  
  export function getRMS(audio: AudioData, options?: { channel?: number }): number;
  
  export function getZeroCrossing(audio: AudioData, options?: { channel?: number }): number;

  // FFTプロバイダーファクトリー
  export const FFTProviderFactory: {
    getAvailableProviders(): string[];
  };
} 