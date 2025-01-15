import {
  AudioSource,
  AppError,
  ErrorType
} from './types';

/**
 * 音声解析を制御するサービス
 * - Web Audio APIを使用した音声解析
 * - 波形データと周波数データの生成
 * - エラーハンドリング
 */
export class AudioAnalyzerService {
  private static instance: AudioAnalyzerService;
  private audioContext: AudioContext | null;
  private analyzerNode: AnalyserNode | null;
  private waveformData: Float32Array | null;
  private frequencyData: Uint8Array | null;
  private worker: Worker | null;
  private isAnalyzing: boolean;

  private constructor() {
    this.audioContext = null;
    this.analyzerNode = null;
    this.waveformData = null;
    this.frequencyData = null;
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
   * 音声ファイルの解析
   */
  public async analyzeAudio(audioBuffer: AudioBuffer): Promise<AudioSource> {
    try {
      // AudioContextの初期化
      this.audioContext = new AudioContext();

      // アナライザーノードの設定
      this.analyzerNode = this.audioContext.createAnalyser();
      this.analyzerNode.fftSize = 2048;
      this.waveformData = new Float32Array(this.analyzerNode.frequencyBinCount);
      this.frequencyData = new Uint8Array(this.analyzerNode.frequencyBinCount);

      // オフライン解析の実行
      const analyzedData = await this.analyzeOffline(audioBuffer);

      return {
        buffer: audioBuffer,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        waveformData: analyzedData.waveformData,
        frequencyData: analyzedData.frequencyData,
        amplitudeData: analyzedData.amplitudeData,
        phaseData: analyzedData.phaseData,
        stereoData: analyzedData.stereoData,
        dynamicRangeData: analyzedData.dynamicRangeData,
        spectralCentroidData: analyzedData.spectralCentroidData,
        spectralFluxData: analyzedData.spectralFluxData
      };
    } catch (error) {
      throw new AppError(
        ErrorType.AudioDecodeFailed,
        'Failed to analyze audio buffer',
        error
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

      // WebWorkerの初期化
      this.worker = new Worker(new URL('../workers/audioAnalyzer.worker.ts', import.meta.url));

      // WebWorkerからの結果受信
      this.worker.onmessage = (event) => {
        this.isAnalyzing = false;
        this.worker?.terminate();
        this.worker = null;
        resolve(event.data);
      };

      // WebWorkerでのエラー処理
      this.worker.onerror = (error) => {
        this.isAnalyzing = false;
        this.worker?.terminate();
        this.worker = null;
        reject(new AppError(
          ErrorType.AudioAnalysisFailed,
          'Failed to analyze audio in worker',
          error
        ));
      };

      // 解析開始
      this.worker.postMessage({
        audioBuffer: audioBuffer,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels
      });
    });
  }

  /**
   * リアルタイムの波形データ取得
   */
  public getWaveformData(): Float32Array | null {
    if (!this.analyzerNode || !this.waveformData) return null;

    this.analyzerNode.getFloatTimeDomainData(this.waveformData);
    return this.waveformData;
  }

  /**
   * リアルタイムの周波数データ取得
   */
  public getFrequencyData(): Uint8Array | null {
    if (!this.analyzerNode || !this.frequencyData) return null;

    this.analyzerNode.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  /**
   * リソースの解放
   */
  public dispose(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.analyzerNode) {
      this.analyzerNode.disconnect();
      this.analyzerNode = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.waveformData = null;
    this.frequencyData = null;
    this.isAnalyzing = false;
  }

  /**
   * ファイルの読み込み
   */
  private async readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new AppError(
            ErrorType.AudioDecodeFailed,
            'Failed to read audio file'
          ));
        }
      };
      reader.onerror = () => {
        reject(new AppError(
          ErrorType.AudioDecodeFailed,
          'Failed to read audio file'
        ));
      };
      reader.readAsArrayBuffer(file);
    });
  }
}