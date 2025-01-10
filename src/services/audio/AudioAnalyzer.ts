import { AudioSource } from '../../types/audio';

/**
 * AudioBufferからAudioSourceを生成するクラス
 */
export class AudioAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private fftSize: number;
  private bufferSource: AudioBufferSourceNode | null = null;
  private lastAnalyzedBuffer: AudioBuffer | null = null;
  private lastAnalyzedResult: AudioSource | null = null;
  private isDisposed: boolean = false;

  constructor(fftSize: number = 2048) {
    this.audioContext = new AudioContext({ latencyHint: 'interactive' });
    this.analyser = this.audioContext.createAnalyser();
    this.fftSize = fftSize;
    this.analyser.fftSize = fftSize;
  }

  /**
   * AudioBufferからAudioSourceを生成します
   */
  analyze(audioBuffer: AudioBuffer): AudioSource | null {
    if (this.isDisposed) {
      console.warn('AudioAnalyzer is already disposed');
      return null;
    }

    try {
      // 同じバッファの場合はキャッシュを返す
      if (this.lastAnalyzedBuffer === audioBuffer && this.lastAnalyzedResult) {
        return this.lastAnalyzedResult;
      }

      // 各種データを格納する配列を初期化
      const timeData: Float32Array[] = [];
      const volumeData: Float32Array[] = [];
      const frequencyData: Float32Array[] = [];
      const stereoData: Float32Array[] = [];
      const dynamicRangeData: Float32Array[] = [];

      // チャンネルごとのデータを取得
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        
        // 時間領域データ（コピーを作成）
        const timeDataCopy = new Float32Array(channelData.length);
        timeDataCopy.set(channelData);
        timeData.push(timeDataCopy);

        // ボリュームデータ（RMS）
        const volume = new Float32Array(1);
        let sumSquares = 0;
        for (let i = 0; i < channelData.length; i++) {
          sumSquares += channelData[i] * channelData[i];
        }
        volume[0] = Math.sqrt(sumSquares / channelData.length);
        volumeData.push(volume);

        // 周波数データ（一時的なバッファを使用）
        const tempSource = this.audioContext.createBufferSource();
        const tempAnalyser = this.audioContext.createAnalyser();
        
        try {
          tempSource.buffer = audioBuffer;
          tempAnalyser.fftSize = this.fftSize;
          tempSource.connect(tempAnalyser);

          const frequencyBuffer = new Float32Array(tempAnalyser.frequencyBinCount);
          tempAnalyser.getFloatFrequencyData(frequencyBuffer);
          const frequencyDataCopy = new Float32Array(frequencyBuffer.length);
          frequencyDataCopy.set(frequencyBuffer);
          frequencyData.push(frequencyDataCopy);
        } finally {
          // クリーンアップ
          tempSource.disconnect();
          tempAnalyser.disconnect();
        }

        // ステレオデータ（パンニング）
        const stereo = new Float32Array(1);
        stereo[0] = channel === 0 ? -1 : 1;
        stereoData.push(stereo);

        // ダイナミックレンジ
        const dynamicRange = new Float32Array(1);
        let max = -Infinity;
        let min = Infinity;
        for (let i = 0; i < channelData.length; i++) {
          const value = channelData[i];
          if (value > max) max = value;
          if (value < min) min = value;
        }
        dynamicRange[0] = max - min;
        dynamicRangeData.push(dynamicRange);
      }

      // 振幅データ（全チャンネルの平均）
      const amplitudeData = new Float32Array(audioBuffer.length);
      for (let i = 0; i < audioBuffer.length; i++) {
        let sum = 0;
        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
          sum += Math.abs(audioBuffer.getChannelData(channel)[i]);
        }
        amplitudeData[i] = sum / audioBuffer.numberOfChannels;
      }

      // 位相データ（簡易的な実装）
      const phaseData = new Float32Array(audioBuffer.length);
      const channel0Data = audioBuffer.getChannelData(0);
      const channel1Data = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : null;
      
      for (let i = 0; i < audioBuffer.length; i++) {
        phaseData[i] = Math.atan2(
          channel0Data[i],
          channel1Data ? channel1Data[i] : 0
        );
      }

      // 結果をキャッシュ
      this.lastAnalyzedBuffer = audioBuffer;
      this.lastAnalyzedResult = {
        timeData,
        volumeData,
        amplitudeData,
        frequencyData,
        phaseData,
        stereoData,
        dynamicRangeData,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        rawData: audioBuffer.getChannelData(0).buffer,
        duration: audioBuffer.duration
      };

      return this.lastAnalyzedResult;
    } catch (error) {
      console.error('Error analyzing audio buffer:', error);
      return null;
    }
  }

  /**
   * リソースをクリーンアップします
   */
  dispose(): void {
    if (this.isDisposed) return;

    try {
      if (this.bufferSource) {
        this.bufferSource.disconnect();
        this.bufferSource = null;
      }
      if (this.analyser) {
        this.analyser.disconnect();
      }
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(console.error);
      }
      this.lastAnalyzedBuffer = null;
      this.lastAnalyzedResult = null;
      this.isDisposed = true;
    } catch (error) {
      console.error('Error disposing AudioAnalyzer:', error);
    }
  }

  /**
   * AudioContextの状態を確認します
   */
  async ensureContext(): Promise<void> {
    if (this.isDisposed) {
      throw new Error('AudioAnalyzer is already disposed');
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

export default AudioAnalyzer;
