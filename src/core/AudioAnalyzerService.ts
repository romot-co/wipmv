import { ErrorType, AudioSource, AnalysisResult, AudioAnalyzer, withAudioError } from './types/index';

/**
 * 音声解析サービス
 * - シングルトンパターンで実装
 * - Web Workerを使用した非同期解析
 * - 波形データと周波数データの生成
 */
export class AudioAnalyzerService implements AudioAnalyzer {
  private static instance: AudioAnalyzerService | null = null;
  private worker: Worker | null = null;
  private analysisResult: AnalysisResult | null = null;

  private constructor() {
    this.initWorker();
  }

  public static getInstance(): AudioAnalyzerService {
    if (!AudioAnalyzerService.instance) {
      AudioAnalyzerService.instance = new AudioAnalyzerService();
    }
    return AudioAnalyzerService.instance;
  }

  private initWorker(): void {
    if (this.worker) return;

    this.worker = new Worker(
      new URL('./workers/audioAnalyzer.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }

  public async analyze(source: AudioSource): Promise<AnalysisResult> {
    return withAudioError(
      async () => {
        if (!this.worker) {
          throw new Error('Worker is not initialized');
        }

        if (!source.buffer) {
          throw new Error('AudioBuffer is not provided');
        }

        const buffer = source.buffer;

        return new Promise<AnalysisResult>((resolve, reject) => {
          if (!this.worker) return reject(new Error('Worker is not initialized'));

          this.worker.onmessage = (event) => {
            const { waveformData, frequencyData } = event.data;
            this.analysisResult = {
              waveformData,
              frequencyData,
              duration: buffer.duration,
              sampleRate: buffer.sampleRate,
              numberOfChannels: buffer.numberOfChannels
            };
            resolve(this.analysisResult);
          };

          this.worker.onerror = (error) => {
            reject(new Error(`Worker error: ${error.message}`));
          };

          const channelData = Array.from(
            { length: buffer.numberOfChannels },
            (_, i) => buffer.getChannelData(i)
          );

          this.worker.postMessage({
            channelData,
            sampleRate: buffer.sampleRate,
            duration: buffer.duration
          });
        });
      },
      ErrorType.AudioAnalysisFailed,
      '音声解析に失敗しました'
    );
  }

  public getAnalysisResult(): AnalysisResult | null {
    return this.analysisResult;
  }

  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.analysisResult = null;
    AudioAnalyzerService.instance = null;
  }
}