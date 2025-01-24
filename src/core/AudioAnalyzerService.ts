import { AudioSource, AppError, ErrorType, ErrorMessages } from './types';
import { AudioPlaybackService } from './AudioPlaybackService';

interface AnalysisConfig {
  targetFps: number;      // 目標フレームレート
  fftSize: number;        // FFTサイズ
  hopSize: number;        // ホップサイズ
  maxDuration: number;    // 最大解析時間（秒）
  downsampleFactor: number; // ダウンサンプリング係数
}

/**
 * 音声解析サービス
 * - 音声ファイルの波形解析
 * - Web Workerを使用したオフライン解析
 * - 解析結果のキャッシュ管理
 */
export class AudioAnalyzerService {
  private static instance: AudioAnalyzerService | null = null;
  private worker: Worker | null = null;
  private analysisCache: Map<string, AudioSource> = new Map();
  private isAnalyzing = false;
  private abortController: AbortController | null = null;
  private audioService: AudioPlaybackService | null = null;

  // キャッシュサイズの制限
  private static readonly MAX_CACHE_SIZE = 10;

  private constructor() {
    // シングルトンのためprivate
  }

  public static getInstance(): AudioAnalyzerService {
    if (!AudioAnalyzerService.instance) {
      AudioAnalyzerService.instance = new AudioAnalyzerService();
    }
    return AudioAnalyzerService.instance;
  }

  public setAudioService(service: AudioPlaybackService): void {
    console.log('AudioAnalyzerService: AudioPlaybackServiceを設定');
    this.audioService = service;
  }

  public getAudioService(): AudioPlaybackService | null {
    return this.audioService;
  }

  /**
   * キャッシュキーの生成
   */
  private generateCacheKey(audioBuffer: AudioBuffer): string {
    return `${audioBuffer.duration}-${audioBuffer.sampleRate}-${audioBuffer.numberOfChannels}`;
  }

  /**
   * キャッシュの管理（古いエントリの削除）
   */
  private manageCache(): void {
    if (this.analysisCache.size > AudioAnalyzerService.MAX_CACHE_SIZE) {
      // 最も古いエントリを削除
      const oldestKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(oldestKey);
    }
  }

  /**
   * 音声データの解析を実行
   * @param audioBuffer デコード済みのAudioBuffer
   * @returns 解析結果（波形データ、周波数データ等）
   */
  public async analyzeAudio(audioBuffer: AudioBuffer): Promise<AudioSource> {
    if (!this.audioService) {
      throw new AppError(
        ErrorType.AudioAnalysisFailed,
        ErrorMessages[ErrorType.AudioAnalysisFailed]
      );
    }

    try {
      if (this.isAnalyzing) {
        console.log('既存の解析をキャンセル');
        this.cancelAnalysis();
      }

      this.isAnalyzing = true;
      this.abortController = new AbortController();

      // キャッシュチェック
      const cacheKey = this.generateCacheKey(audioBuffer);
      const cached = this.analysisCache.get(cacheKey);
      if (cached) {
        console.log('解析キャッシュがヒット');
        return cached;
      }

      console.log('音声解析開始:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        audioContext: this.audioService.getAudioContext()
      });

      // 解析設定の調整
      const config: AnalysisConfig = {
        targetFps: 60,
        fftSize: 2048,
        hopSize: 512,
        maxDuration: 300,
        downsampleFactor: 1
      };

      // 音声の長さに応じて設定を調整
      if (audioBuffer.duration > 60) { // 1分以上
        config.downsampleFactor = 2;
        config.targetFps = 30;
      }
      if (audioBuffer.duration > 180) { // 3分以上
        config.downsampleFactor = 4;
        config.targetFps = 20;
      }

      // Web Workerの初期化
      this.worker = new Worker(
        new URL('../workers/audioAnalyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // 解析の実行
      const result = await new Promise<AudioSource>((resolve, reject) => {
        if (!this.worker) {
          reject(new AppError(
            ErrorType.AudioAnalysisFailed,
            ErrorMessages[ErrorType.AudioAnalysisFailed]
          ));
          return;
        }

        // キャンセル時の処理
        this.abortController?.signal.addEventListener('abort', () => {
          console.log('音声解析がキャンセルされました');
          this.worker?.postMessage({ type: 'cancel' });
          reject(new AppError(
            ErrorType.AudioAnalysisCancelled,
            ErrorMessages[ErrorType.AudioAnalysisCancelled]
          ));
        });

        this.worker.onmessage = (e) => {
          if (e.data.type === 'success') {
            resolve({
              buffer: audioBuffer,
              duration: e.data.data.duration,
              sampleRate: e.data.data.sampleRate,
              numberOfChannels: e.data.data.numberOfChannels,
              waveformData: e.data.data.waveformData,
              frequencyData: e.data.data.frequencyData,
              file: null // 解析時は元のファイル情報は不要
            });
          } else if (e.data.type === 'cancelled') {
            reject(new AppError(
              ErrorType.AudioAnalysisCancelled,
              ErrorMessages[ErrorType.AudioAnalysisCancelled]
            ));
          } else {
            reject(new AppError(
              ErrorType.AudioAnalysisFailed,
              e.data.error || ErrorMessages[ErrorType.AudioAnalysisFailed],
              e.data.details
            ));
          }
        };

        this.worker.onerror = (e) => {
          console.error('Worker実行エラー:', e);
          reject(new AppError(
            ErrorType.AudioAnalysisFailed,
            e.error?.message || ErrorMessages[ErrorType.AudioAnalysisFailed],
            e.error
          ));
        };

        // 解析開始
        const channelDataArray = [];
        for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
          channelDataArray.push(audioBuffer.getChannelData(i));
        }
        
        this.worker.postMessage({
          type: 'analyze',
          audioData: {
            channelData: channelDataArray,
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration,
            numberOfChannels: audioBuffer.numberOfChannels
          },
          config
        });
      });

      // キャッシュの管理と更新
      this.manageCache();
      this.analysisCache.set(cacheKey, result);

      // Workerのクリーンアップ
      this.disposeWorker();
      this.isAnalyzing = false;
      this.abortController = null;

      console.log('音声解析完了:', {
        hasWaveformData: !!result.waveformData,
        hasFrequencyData: !!result.frequencyData
      });

      return result;

    } catch (error) {
      console.error('音声解析エラー:', error);
      this.disposeWorker();
      this.isAnalyzing = false;
      this.abortController = null;
      
      if (error instanceof AppError && error.type === ErrorType.AudioAnalysisCancelled) {
        throw error;
      }
      
      throw new AppError(
        ErrorType.AudioAnalysisFailed,
        error instanceof Error ? error.message : ErrorMessages[ErrorType.AudioAnalysisFailed],
        error
      );
    }
  }

  /**
   * Workerのクリーンアップ
   */
  private disposeWorker(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * キャッシュのクリア
   */
  public clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * 現在の解析をキャンセル
   */
  public cancelAnalysis(): void {
    if (this.isAnalyzing && this.abortController) {
      console.log('音声解析のキャンセルを要求');
      this.abortController.abort();
    }
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    console.log('AudioAnalyzerService: リソースの解放開始');
    this.cancelAnalysis();
    this.disposeWorker();
    this.clearCache();
    this.audioService = null;
    AudioAnalyzerService.instance = null;
    this.isAnalyzing = false;
    this.abortController = null;
    console.log('AudioAnalyzerService: リソースの解放完了');
  }
}