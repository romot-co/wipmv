/**
 * audio-inspectを使用した高度な音声解析サービス
 */

import { AppError, ErrorType } from './types/error';
import { Disposable } from './types/base';
import { AnalysisResult, AudioAnalyzer } from './types/audio'; // AudioAnalyzerインターフェースも追加
import { AudioSource } from './types/base'; // AudioSource型も追加
import { 
  load, 
  analyze, 
  getPeaks, 
  getWaveform, 
  getFFT, 
  getSpectrum,
  getRMS,
  getZeroCrossing,
  FFTProviderFactory,
  type AudioData,
  type WaveformResult,
  type PeaksResult,
  type FFTResult,
  type SpectrumResult
} from 'audio-inspect';

/**
 * 音声解析の設定
 */
export interface AudioAnalysisConfig {
  // 波形解析設定
  waveformFramesPerSecond?: number;
  waveformMethod?: 'rms' | 'peak' | 'average';
  
  // ピーク検出設定
  peakCount?: number;
  peakThreshold?: number;
  peakMinDistance?: number;
  
  // FFT設定
  fftSize?: 2048 | 1024 | 512 | 256;
  windowFunction?: 'hann' | 'hamming' | 'blackman';
  fftProvider?: 'webfft' | 'native';
  
  // スペクトラム設定
  minFrequency?: number;
  maxFrequency?: number;
  spectrogramTimeFrames?: number;
  spectrogramOverlap?: number;
}

/**
 * 音声解析結果
 */
export interface AudioAnalysisResult {
  // 基本情報
  duration: number;
  sampleRate: number;
  channels: number;
  
  // 波形データ
  waveform: {
    data: Float32Array;
    framesPerSecond: number;
    method: string;
  };
  
  // ピーク情報
  peaks: {
    positions: number[];
    values: number[];
    count: number;
  };
  
  // RMS値
  rms: number;
  
  // ゼロクロッシング率
  zeroCrossingRate: number;
  
  // FFT結果
  fft?: {
    magnitude: Float32Array;
    phase: Float32Array;
    frequencies: Float32Array;
    provider: string;
  };
  
  // スペクトラム
  spectrum?: {
    frequencies: Float32Array;
    magnitudes: Float32Array;
    decibels: boolean;
  };
  
  // スペクトログラム
  spectrogram?: {
    data: Float32Array[];
    timeFrames: number;
    frequencyBins: number;
    frequencies: Float32Array;
  };
}

/**
 * AudioAnalysisResultから既存のAnalysisResult形式に変換するアダプター
 */
export function convertToLegacyAnalysisResult(
  result: AudioAnalysisResult
): AnalysisResult {
  // 波形データを既存の形式に変換（チャンネル別の配列）
  const waveformData: Float32Array[] = [];
  
  // 単一チャンネルとして扱う（必要に応じて複数チャンネル対応も可能）
  for (let i = 0; i < result.channels; i++) {
    waveformData.push(result.waveform.data);
  }
  
  // 周波数データを既存の形式に変換
  const frequencyData: Float32Array[][] = [];
  
  if (result.spectrogram) {
    // スペクトログラムデータを時間フレームごとに分割
    for (let channel = 0; channel < result.channels; channel++) {
      const channelFreqData: Float32Array[] = [];
      
      for (let timeFrame = 0; timeFrame < result.spectrogram.timeFrames; timeFrame++) {
        if (result.spectrogram.data[timeFrame]) {
          channelFreqData.push(result.spectrogram.data[timeFrame]);
        }
      }
      
      frequencyData.push(channelFreqData);
    }
  } else if (result.spectrum) {
    // スペクトラムデータを使用（単一時間フレーム）
    for (let channel = 0; channel < result.channels; channel++) {
      frequencyData.push([result.spectrum.magnitudes]);
    }
  } else {
    // フォールバック：空の配列
    for (let channel = 0; channel < result.channels; channel++) {
      frequencyData.push([new Float32Array(0)]);
    }
  }
  
  return {
    waveformData,
    frequencyData,
    duration: result.duration,
    sampleRate: result.sampleRate,
    numberOfChannels: result.channels
  };
}

/**
 * audio-inspectを使用した音声解析サービス
 */
export class AudioAnalysisService implements Disposable, AudioAnalyzer {
  private static instance: AudioAnalysisService | null = null;
  
  private config: AudioAnalysisConfig;
  private isDisposed = false;
  private lastAnalysisResult: AnalysisResult | null = null; // キャッシュ用

  private constructor(config: AudioAnalysisConfig = {}) {
    this.config = {
      waveformFramesPerSecond: 60,
      waveformMethod: 'rms',
      peakCount: 100,
      peakThreshold: 0.1,
      peakMinDistance: 441,
      fftSize: 2048,
      windowFunction: 'hann',
      fftProvider: 'webfft',
      minFrequency: 20,
      maxFrequency: 20000,
      spectrogramTimeFrames: 100,
      spectrogramOverlap: 0.75,
      ...config
    };
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(config?: AudioAnalysisConfig): AudioAnalysisService {
    if (!AudioAnalysisService.instance || AudioAnalysisService.instance.isDisposed) {
      AudioAnalysisService.instance = new AudioAnalysisService(config);
    }
    return AudioAnalysisService.instance;
  }

  /**
   * AudioBufferから包括的な音声解析を実行
   */
  public async analyzeAudioBuffer(audioBuffer: AudioBuffer): Promise<AudioAnalysisResult> {
    this.checkDisposed();

    try {
      console.log('AudioAnalysisService: 音声解析を開始します');
      
      // audio-inspectのload関数を使用するためにAudioBufferをファイル形式に変換する必要があるが、
      // 直接AudioBufferを解析する方法を模索
      
      // 基本情報の取得
      const duration = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      const channels = audioBuffer.numberOfChannels;
      
      // チャンネルデータを取得（左チャンネルを使用）
      const channelData = audioBuffer.getChannelData(0);
      
      // 波形データの取得
      const waveform = this.extractWaveform(channelData, sampleRate);
      
      // ピーク検出
      const peaks = this.detectPeaks(channelData);
      
      // RMS計算
      const rms = this.calculateRMS(channelData);
      
      // ゼロクロッシング率計算
      const zeroCrossingRate = this.calculateZeroCrossingRate(channelData, sampleRate);
      
      // FFT解析（可能であれば）
      let fft;
      try {
        fft = await this.performFFT(channelData, sampleRate);
      } catch (error) {
        console.warn('FFT解析をスキップしました:', error);
      }
      
      // スペクトラム解析（FFTが成功した場合）
      let spectrum;
      if (fft) {
        spectrum = this.calculateSpectrum(fft);
      }
      
      const result: AudioAnalysisResult = {
        duration,
        sampleRate,
        channels,
        waveform,
        peaks,
        rms,
        zeroCrossingRate,
        fft,
        spectrum
      };
      
      console.log('AudioAnalysisService: 音声解析が完了しました');
      return result;
      
    } catch (error: unknown) {
      console.error('AudioAnalysisService: 音声解析中にエラーが発生しました:', error);
      throw new AppError(
        ErrorType.AUDIO_ANALYSIS_FAILED,
        '音声解析に失敗しました',
        error
      );
    }
  }

  /**
   * ファイルから音声を読み込んで解析（audio-inspectのload関数を使用）
   */
  public async analyzeAudioFile(file: File): Promise<AudioAnalysisResult> {
    this.checkDisposed();

    try {
      console.log('AudioAnalysisService: ファイルから音声解析を開始します');
      
      // audio-inspectのload関数を使用
      const audioData = await load(file);
      
      // 利用可能なFFTプロバイダーを確認
      const availableProviders = FFTProviderFactory.getAvailableProviders();
      console.log('Available FFT providers:', availableProviders);
      
      // 包括的な解析を実行
      const analysisResults = await analyze(audioData, async (audio: AudioData) => {
        // 波形データ取得
        const waveform = getWaveform(audio, {
          framesPerSecond: this.config.waveformFramesPerSecond!,
          method: this.config.waveformMethod!
        });
        
        // ピーク検出
        const peaks = getPeaks(audio, {
          count: this.config.peakCount!,
          threshold: this.config.peakThreshold!,
          minDistance: this.config.peakMinDistance!
        });
        
        // RMS計算
        const rms = getRMS(audio);
        
        // ゼロクロッシング率
        const zeroCrossingRate = getZeroCrossing(audio);
        
        // FFT解析
        const fft = await getFFT(audio, {
          fftSize: this.config.fftSize!,
          windowFunction: this.config.windowFunction!,
          provider: this.config.fftProvider!,
          enableProfiling: true
        });
        
        // スペクトラム解析
        const spectrum = await getSpectrum(audio, {
          fftSize: this.config.fftSize!,
          minFrequency: this.config.minFrequency!,
          maxFrequency: this.config.maxFrequency!,
          decibels: true
        });
        
        // スペクトログラム生成
        const spectrogram = await getSpectrum(audio, {
          fftSize: 1024,
          timeFrames: this.config.spectrogramTimeFrames!,
          overlap: this.config.spectrogramOverlap!
        });
        
        return {
          waveform,
          peaks,
          rms,
          zeroCrossingRate,
          fft,
          spectrum,
          spectrogram
        };
      });
      
      // 結果を統一形式に変換
      const result: AudioAnalysisResult = {
        duration: audioData.duration,
        sampleRate: audioData.sampleRate,
        channels: audioData.numberOfChannels,
        waveform: {
          data: analysisResults.waveform.waveform,
          framesPerSecond: this.config.waveformFramesPerSecond!,
          method: this.config.waveformMethod!
        },
        peaks: {
          positions: analysisResults.peaks.positions,
          values: analysisResults.peaks.values,
          count: analysisResults.peaks.positions.length
        },
        rms: analysisResults.rms,
        zeroCrossingRate: analysisResults.zeroCrossingRate,
        fft: {
          magnitude: analysisResults.fft.magnitude,
          phase: analysisResults.fft.phase,
          frequencies: analysisResults.fft.frequencies,
          provider: this.config.fftProvider!
        },
        spectrum: {
          frequencies: analysisResults.spectrum.frequencies,
          magnitudes: analysisResults.spectrum.magnitudes,
          decibels: true
        },
        spectrogram: {
          data: analysisResults.spectrogram.spectrogram || [],
          timeFrames: this.config.spectrogramTimeFrames!,
          frequencyBins: analysisResults.spectrogram.spectrogram?.[0]?.length || 0,
          frequencies: analysisResults.spectrogram.frequencies
        }
      };
      
      console.log('AudioAnalysisService: ファイル解析が完了しました');
      return result;
      
    } catch (error: unknown) {
      console.error('AudioAnalysisService: ファイル解析中にエラーが発生しました:', error);
      throw new AppError(
        ErrorType.AUDIO_ANALYSIS_FAILED,
        'ファイルの音声解析に失敗しました',
        error
      );
    }
  }

  /**
   * 波形データの抽出（シンプル版）
   */
  private extractWaveform(channelData: Float32Array, sampleRate: number): AudioAnalysisResult['waveform'] {
    const framesPerSecond = this.config.waveformFramesPerSecond!;
    const samplesPerFrame = Math.floor(sampleRate / framesPerSecond);
    const frameCount = Math.floor(channelData.length / samplesPerFrame);
    const waveformData = new Float32Array(frameCount);
    
    for (let i = 0; i < frameCount; i++) {
      const start = i * samplesPerFrame;
      const end = start + samplesPerFrame;
      let value = 0;
      
      if (this.config.waveformMethod === 'rms') {
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += channelData[j] * channelData[j];
        }
        value = Math.sqrt(sum / samplesPerFrame);
      } else if (this.config.waveformMethod === 'peak') {
        for (let j = start; j < end; j++) {
          value = Math.max(value, Math.abs(channelData[j]));
        }
      } else { // average
        let sum = 0;
        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j]);
        }
        value = sum / samplesPerFrame;
      }
      
      waveformData[i] = value;
    }
    
    return {
      data: waveformData,
      framesPerSecond,
      method: this.config.waveformMethod!
    };
  }

  /**
   * ピーク検出（シンプル版）
   */
  private detectPeaks(channelData: Float32Array): AudioAnalysisResult['peaks'] {
    const threshold = this.config.peakThreshold!;
    const minDistance = this.config.peakMinDistance!;
    const positions: number[] = [];
    const values: number[] = [];
    
    for (let i = minDistance; i < channelData.length - minDistance; i++) {
      const value = Math.abs(channelData[i]);
      if (value > threshold) {
        let isPeak = true;
        for (let j = i - minDistance; j <= i + minDistance; j++) {
          if (j !== i && Math.abs(channelData[j]) > value) {
            isPeak = false;
            break;
          }
        }
        if (isPeak) {
          positions.push(i);
          values.push(value);
        }
      }
    }
    
    // 上位のピークのみ選択
    const peakData = positions.map((pos, idx) => ({ position: pos, value: values[idx] }));
    peakData.sort((a, b) => b.value - a.value);
    peakData.splice(this.config.peakCount!);
    
    return {
      positions: peakData.map(p => p.position),
      values: peakData.map(p => p.value),
      count: peakData.length
    };
  }

  /**
   * RMS計算
   */
  private calculateRMS(channelData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    return Math.sqrt(sum / channelData.length);
  }

  /**
   * ゼロクロッシング率計算
   */
  private calculateZeroCrossingRate(channelData: Float32Array, sampleRate: number): number {
    let crossings = 0;
    for (let i = 1; i < channelData.length; i++) {
      if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (channelData.length / sampleRate);
  }

  /**
   * FFT解析（基本版）
   */
  private async performFFT(channelData: Float32Array, sampleRate: number): Promise<AudioAnalysisResult['fft']> {
    // 実際のFFT実装は複雑なので、ここではプレースホルダー
    // audio-inspectのgetFFT関数を使用することが推奨
    const fftSize = this.config.fftSize!;
    const magnitude = new Float32Array(fftSize / 2);
    const phase = new Float32Array(fftSize / 2);
    const frequencies = new Float32Array(fftSize / 2);
    
    for (let i = 0; i < fftSize / 2; i++) {
      frequencies[i] = (i * sampleRate) / fftSize;
    }
    
    return {
      magnitude,
      phase,
      frequencies,
      provider: 'simple'
    };
  }

  /**
   * スペクトラム計算
   */
  private calculateSpectrum(fft: NonNullable<AudioAnalysisResult['fft']>): AudioAnalysisResult['spectrum'] {
    return {
      frequencies: fft.frequencies,
      magnitudes: fft.magnitude,
      decibels: true
    };
  }

  /**
   * 設定を更新
   */
  public updateConfig(newConfig: Partial<AudioAnalysisConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 利用可能なFFTプロバイダーを取得
   */
  public getAvailableFFTProviders(): string[] {
    try {
      return FFTProviderFactory.getAvailableProviders();
    } catch {
      return ['native']; // フォールバック
    }
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.lastAnalysisResult = null;
    AudioAnalysisService.instance = null; // シングルトンインスタンスもクリア
    console.log('AudioAnalysisService: Disposed');
  }

  private checkDisposed(): void {
    if (this.isDisposed) {
      throw new AppError(
        ErrorType.INVALID_STATE,
        'AudioAnalysisService has been disposed'
      );
    }
  }

  /**
   * 既存のAudioAnalyzerインターフェースとの互換性のためのメソッド
   * AudioSourceから音声解析を実行
   */
  public async analyze(source: AudioSource): Promise<AnalysisResult> {
    this.checkDisposed();

    try {
      console.log('AudioAnalysisService: AudioSourceから音声解析を開始します');

      if (!source.buffer) {
        throw new AppError(
          ErrorType.INVALID_STATE,
          'AudioSource にAudioBufferが含まれていません'
        );
      }

      // AudioBufferを使って解析を実行
      const analysisResult = await this.analyzeAudioBuffer(source.buffer);
      
      // 既存のAnalysisResult形式に変換
      const legacyResult = convertToLegacyAnalysisResult(analysisResult);
      
      // 結果をキャッシュ
      this.lastAnalysisResult = legacyResult;
      
      console.log('AudioAnalysisService: AudioSource解析が完了しました');
      return legacyResult;

    } catch (error: unknown) {
      console.error('AudioAnalysisService: AudioSource解析中にエラーが発生しました:', error);
      throw new AppError(
        ErrorType.AUDIO_ANALYSIS_FAILED,
        'AudioSourceの音声解析に失敗しました',
        error
      );
    }
  }

  /**
   * 最後の解析結果を取得（既存のAudioAnalyzerインターフェースとの互換性）
   */
  public getAnalysisResult(): AnalysisResult | null {
    return this.lastAnalysisResult;
  }
} 