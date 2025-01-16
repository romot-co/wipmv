import {
  AudioSource,
  AppError,
  ErrorType
} from './types';

/**
 * 音声解析を制御するサービス
 * - オフライン解析による波形データと周波数データの生成
 * - エラーハンドリング
 */
export class AudioAnalyzerService {
  private static instance: AudioAnalyzerService;
  private worker: Worker | null;
  private isAnalyzing: boolean;

  private constructor() {
    this.worker = null;
    this.isAnalyzing = false;
  }

  public static getInstance(): AudioAnalyzerService {
    if (!AudioAnalyzerService.instance) {
      AudioAnalyzerService.instance = new AudioAnalyzerService();
    }
    return AudioAnalyzerService.instance;
  }

  /**
   * 音声データの解析
   * AudioPlaybackServiceから受け取ったAudioBufferを解析し、
   * 結果をAudioSourceに追加して返す
   */
  public async analyzeAudio(audioSource: AudioSource): Promise<AudioSource> {
    try {
      console.log('オーディオ解析を開始...');
      
      // オフライン解析の実行
      const analyzedData = await this.analyzeOffline(audioSource.buffer);
      
      // 解析結果をAudioSourceに追加
      const updatedSource: AudioSource = {
        ...audioSource,
        waveformData: analyzedData.waveformData,
        frequencyData: analyzedData.frequencyData,
        amplitudeData: analyzedData.amplitudeData,
        phaseData: analyzedData.phaseData,
        stereoData: analyzedData.stereoData,
        dynamicRangeData: analyzedData.dynamicRangeData,
        spectralCentroidData: analyzedData.spectralCentroidData,
        spectralFluxData: analyzedData.spectralFluxData
      };

      console.log('解析結果:', {
        waveformDataLength: analyzedData.waveformData.length,
        frequencyDataLength: analyzedData.frequencyData.length,
        duration: audioSource.duration,
        sampleRate: audioSource.sampleRate
      });

      return updatedSource;
      
    } catch (error) {
      console.error('音声解析エラー:', error);
      throw new AppError(
        ErrorType.AudioAnalysisFailed,
        'Failed to analyze audio buffer',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * オフラインでの音声解析
   * WebWorkerを使用して別スレッドで実行
   */
  private async analyzeOffline(audioBuffer: AudioBuffer): Promise<{
    waveformData: Float32Array[];
    frequencyData: Float32Array[][];
    amplitudeData: Float32Array[];
    phaseData: Float32Array[];
    stereoData: Float32Array[];
    dynamicRangeData: Float32Array[];
    spectralCentroidData: Float32Array[];
    spectralFluxData: Float32Array[];
  }> {
    return new Promise((resolve, reject) => {
      if (this.isAnalyzing) {
        reject(new AppError(
          ErrorType.AudioAnalysisFailed,
          'Analysis is already in progress'
        ));
        return;
      }

      this.isAnalyzing = true;

      // AudioBufferからFloat32Arrayを抽出
      const channelData: Float32Array[] = [];
      for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        channelData.push(audioBuffer.getChannelData(i));
      }

      // WebWorkerにメッセージを送信
      const worker = new Worker(new URL('../workers/audioAnalyzer.worker.ts', import.meta.url));
      worker.onmessage = (event) => {
        this.isAnalyzing = false;
        resolve(event.data);
        worker.terminate();
      };

      worker.onerror = (error) => {
        this.isAnalyzing = false;
        reject(new AppError(
          ErrorType.AudioAnalysisFailed,
          'Audio analysis worker failed',
          error
        ));
        worker.terminate();
      };

      worker.postMessage({
        channelData,
        sampleRate: audioBuffer.sampleRate,
        length: audioBuffer.length
      });
    });
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isAnalyzing = false;
  }
}