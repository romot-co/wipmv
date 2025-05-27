import { ErrorType, AudioSource, AnalysisResult, AudioAnalyzer, withAudioError } from './types/index';
import debug from 'debug';

const log = debug('app:AudioAnalyzerService');

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

    try {
      log('Web Worker初期化開始');
      this.worker = new Worker(
        new URL('./workers/audioAnalyzer.worker.ts', import.meta.url),
        { type: 'module' }
      );
      log('Web Worker初期化完了');
    } catch (error) {
      log('Web Worker初期化エラー:', error);
      throw new Error('Failed to initialize Web Worker');
    }
  }

  public async analyze(source: AudioSource): Promise<AnalysisResult> {
    console.warn('[AudioAnalyzerService] analyze called', new Date().toISOString());
    return withAudioError(
      async () => {
        log('音声解析開始');
        if (!this.worker) {
          log('Worker未初期化のため再初期化を試行');
          this.initWorker();
          if (!this.worker) {
            log('エラー: Worker再初期化失敗');
            throw new Error('Worker initialization failed');
          }
        }

        if (!source.buffer) {
          log('エラー: AudioBuffer未提供');
          throw new Error('AudioBuffer is not provided');
        }

        const buffer = source.buffer;
        log('解析対象バッファ:', {
          duration: buffer.duration,
          sampleRate: buffer.sampleRate,
          channels: buffer.numberOfChannels
        });

        return new Promise<AnalysisResult>((resolve, reject) => {
          if (!this.worker) return reject(new Error('Worker is not initialized'));

          this.worker.onmessage = (event) => {
            if (event.data.error) {
              log('Worker解析エラー:', event.data.error);
              reject(new Error(event.data.error));
              return;
            }

            if (event.data.type === 'success' && event.data.data) {
              const { waveformData, frequencyData } = event.data.data;
              this.analysisResult = {
                waveformData: waveformData as Float32Array[],
                frequencyData: frequencyData as Float32Array[][],
                duration: buffer.duration,
                sampleRate: buffer.sampleRate,
                numberOfChannels: buffer.numberOfChannels
              };
              log('音声解析完了');
              resolve(this.analysisResult);
            } else if (event.data.type === 'cancelled') {
              log('音声解析がキャンセルされました');
              reject(new Error('音声解析がキャンセルされました'));
            } else {
              log('不正な応答フォーマット:', event.data);
              reject(new Error('不正な応答フォーマット'));
            }
          };

          this.worker.onerror = (error) => {
            log('Workerエラー:', error);
            reject(new Error(`Worker error: ${error.message}`));
          };

          const channelData = Array.from(
            { length: buffer.numberOfChannels },
            (_, i) => buffer.getChannelData(i)
          );

          log('Workerにデータ送信');
          this.worker.postMessage({
            type: 'analyze',
            audioData: {
              channelData,
              sampleRate: buffer.sampleRate,
              duration: buffer.duration,
              numberOfChannels: buffer.numberOfChannels
            }
          });
        });
      },
      ErrorType.AUDIO_ANALYSIS_FAILED,
      '音声解析に失敗しました'
    );
  }

  public getAnalysisResult(): AnalysisResult | null {
    return this.analysisResult;
  }

  public dispose(): void {
    if (this.worker) {
      log('Worker終了処理開始');
      this.worker.terminate();
      this.worker = null;
      log('Worker終了処理完了');
    }
    this.analysisResult = null;
    AudioAnalyzerService.instance = null;
  }
}
