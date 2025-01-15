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
      // AudioContextの初期化（解析用）
      const analyzeContext = new AudioContext();
      
      // アナライザーノードの設定
      this.analyzerNode = analyzeContext.createAnalyser();
      this.analyzerNode.fftSize = 2048;
      this.analyzerNode.smoothingTimeConstant = 0.8;
      this.analyzerNode.minDecibels = -90;
      this.analyzerNode.maxDecibels = -10;

      // データバッファの初期化
      this.waveformData = new Float32Array(this.analyzerNode.frequencyBinCount);
      this.frequencyData = new Uint8Array(this.analyzerNode.frequencyBinCount);

      // オフライン解析の実行
      const analyzedData = await this.analyzeOffline(audioBuffer);
      console.log('解析結果:', {
        waveformDataLength: analyzedData.waveformData.length,
        frequencyDataLength: analyzedData.frequencyData.length,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        hasAnalyzerNode: !!this.analyzerNode,
        hasWaveformData: !!this.waveformData,
        hasFrequencyData: !!this.frequencyData,
        fftSize: this.analyzerNode.fftSize,
        frequencyBinCount: this.analyzerNode.frequencyBinCount
      });

      // 解析用のAudioContextをクローズ
      await analyzeContext.close();

      // 解析結果を返す
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
      console.error('音声解析エラー:', error);
      throw new AppError(
        ErrorType.AudioDecodeFailed,
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
   * リアルタイムの波形データ取得
   */
  public getWaveformData(): Float32Array | null {
    if (!this.analyzerNode || !this.waveformData) {
      console.warn('アナライザーノードまたは波形データが初期化されていません', {
        hasAnalyzerNode: !!this.analyzerNode,
        hasWaveformData: !!this.waveformData,
        fftSize: this.analyzerNode?.fftSize,
        frequencyBinCount: this.analyzerNode?.frequencyBinCount
      });
      return null;
    }

    try {
      this.analyzerNode.getFloatTimeDomainData(this.waveformData);
      const hasData = this.waveformData.some(value => value !== 0);
      if (!hasData) {
        console.debug('波形データが空です');
        return null;
      }
      return this.waveformData;
    } catch (error) {
      console.error('波形データの取得に失敗:', error);
      return null;
    }
  }

  /**
   * リアルタイムの周波数データ取得
   */
  public getFrequencyData(): Uint8Array | null {
    if (!this.analyzerNode || !this.frequencyData) {
      console.warn('アナライザーノードまたは周波数データが初期化されていません', {
        hasAnalyzerNode: !!this.analyzerNode,
        hasFrequencyData: !!this.frequencyData,
        fftSize: this.analyzerNode?.fftSize,
        frequencyBinCount: this.analyzerNode?.frequencyBinCount
      });
      return null;
    }

    try {
      this.analyzerNode.getByteFrequencyData(this.frequencyData);
      const hasData = this.frequencyData.some(value => value !== 0);
      if (!hasData) {
        console.debug('周波数データが空です');
        return null;
      }
      return this.frequencyData;
    } catch (error) {
      console.error('周波数データの取得に失敗:', error);
      return null;
    }
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