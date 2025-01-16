import { AudioSource, AppError, ErrorType } from './types';

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

  private constructor() {
    // シングルトンのためprivate
  }

  public static getInstance(): AudioAnalyzerService {
    if (!AudioAnalyzerService.instance) {
      AudioAnalyzerService.instance = new AudioAnalyzerService();
    }
    return AudioAnalyzerService.instance;
  }

  /**
   * 音声データの解析を実行
   * @param audioBuffer デコード済みのAudioBuffer
   * @returns 解析結果（波形データ、周波数データ等）
   */
  public async analyzeAudio(audioBuffer: AudioBuffer): Promise<AudioSource> {
    try {
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
        numberOfChannels: audioBuffer.numberOfChannels
      });

      // Web Workerの初期化
      this.worker = new Worker(
        new URL('../workers/audioAnalyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // 解析の実行
      const result = await new Promise<AudioSource>((resolve, reject) => {
        if (!this.worker) {
          reject(new AppError(ErrorType.AudioAnalysisFailed, 'Worker initialization failed'));
          return;
        }

        this.worker.onmessage = (e) => {
          if (e.data.type === 'success') {
            // 解析結果を適切なサイズに変換
            const waveformData = e.data.data.waveformData?.map((channel: Float32Array) => {
              // 60fps想定で1秒あたりのサンプル数を計算
              const samplesPerSecond = Math.floor(audioBuffer.sampleRate / 60);
              const totalSamples = Math.floor(audioBuffer.duration * 60); // 60fps
              
              const resampledData = new Float32Array(totalSamples);
              for (let i = 0; i < totalSamples; i++) {
                const originalIndex = Math.floor(i * samplesPerSecond / 60);
                resampledData[i] = channel[originalIndex] || 0;
              }
              return resampledData;
            });

            const frequencyData = e.data.data.frequencyData?.map((channel: Float32Array) => {
              // 周波数データも同様に60fpsに合わせる
              const samplesPerSecond = Math.floor(audioBuffer.sampleRate / 60);
              const totalSamples = Math.floor(audioBuffer.duration * 60);
              
              const resampledData = new Uint8Array(totalSamples);
              for (let i = 0; i < totalSamples; i++) {
                const originalIndex = Math.floor(i * samplesPerSecond / 60);
                resampledData[i] = Math.min(255, Math.floor(channel[originalIndex] * 255)) || 0;
              }
              return resampledData;
            });

            resolve({
              buffer: audioBuffer,
              duration: e.data.data.duration,
              sampleRate: e.data.data.sampleRate,
              numberOfChannels: e.data.data.numberOfChannels,
              waveformData,
              frequencyData
            });
          } else {
            reject(new AppError(
              ErrorType.AudioAnalysisFailed,
              e.data.error || '音声解析に失敗しました',
              e.data.details
            ));
          }
        };

        this.worker.onerror = (e) => {
          console.error('Worker実行エラー:', e);
          reject(new AppError(
            ErrorType.AudioAnalysisFailed,
            e.error?.message || '音声解析中にエラーが発生しました',
            e.error
          ));
        };

        // 解析リクエストの送信
        this.worker.postMessage({
          type: 'analyze',
          audioData: {
            channelData: audioBuffer.getChannelData(0),
            sampleRate: audioBuffer.sampleRate,
            duration: audioBuffer.duration,
            numberOfChannels: audioBuffer.numberOfChannels
          }
        });
      });

      // キャッシュの更新
      this.analysisCache.set(cacheKey, result);

      // Workerのクリーンアップ
      this.disposeWorker();

      console.log('音声解析完了:', {
        hasWaveformData: !!result.waveformData,
        hasFrequencyData: !!result.frequencyData
      });

      return result;

    } catch (error) {
      console.error('音声解析エラー:', error);
      this.disposeWorker();
      throw new AppError(
        ErrorType.AudioAnalysisFailed,
        error instanceof Error ? error.message : '音声解析に失敗しました',
        error
      );
    }
  }

  /**
   * キャッシュキーの生成
   */
  private generateCacheKey(audioBuffer: AudioBuffer): string {
    return `${audioBuffer.duration}-${audioBuffer.sampleRate}-${audioBuffer.numberOfChannels}`;
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
   * リソースの解放
   */
  public dispose(): void {
    this.disposeWorker();
    this.clearCache();
  }
}