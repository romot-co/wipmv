import { AudioSource } from './types';
import FFT from 'fft.js';

export class AudioAnalyzer {
  private audioContext: AudioContext;
  private frameRate: number;
  private fftSize: number;
  private fft: FFT;

  constructor(frameRate: number = 30, fftSize: number = 2048) {
    this.audioContext = new AudioContext();
    this.frameRate = frameRate;
    this.fftSize = fftSize;
    this.fft = new FFT(fftSize);
  }

  /**
   * オーディオファイルを解析し、AudioSourceを生成
   */
  async processAudio(file: File): Promise<AudioSource> {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    // 各種解析データを抽出
    const waveformData = this.extractVolumeData(audioBuffer);
    const frequencyData = this.extractFrequencyData(audioBuffer);
    const stereoData = this.extractStereoData(audioBuffer);

    return {
      buffer: audioBuffer,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels: audioBuffer.numberOfChannels,
      duration: audioBuffer.duration,
      fileName: file.name,
      waveformData,
      frequencyData,
      stereoData,
      amplitudeData: [], // 不要なデータは空配列で返す
      phaseData: [],
      dynamicRangeData: [],
      spectralCentroidData: [],
      spectralFluxData: []
    };
  }

  /**
   * 音量データを抽出
   */
  private extractVolumeData(audioBuffer: AudioBuffer): Float32Array[] {
    const result: Float32Array[] = [];
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const volumeData = new Float32Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        volumeData[i] = Math.abs(channelData[i]);
      }
      result.push(volumeData);
    }
    return result;
  }

  /**
   * 周波数データを抽出
   */
  private extractFrequencyData(audioBuffer: AudioBuffer): Float32Array[][] {
    const result: Float32Array[][] = [];
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const freqData: Float32Array[] = [];
      
      // フレームレートに応じて分割
      const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);
      for (let i = 0; i < channelData.length; i += samplesPerFrame) {
        const frame = channelData.slice(i, i + samplesPerFrame);
        freqData.push(this.calculateFrequencyData(frame));
      }
      result.push(freqData);
    }
    return result;
  }

  /**
   * ステレオデータを抽出
   */
  private extractStereoData(audioBuffer: AudioBuffer): Float32Array[] {
    if (audioBuffer.numberOfChannels < 2) {
      return [new Float32Array(0)];
    }

    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);
    const stereoData = new Float32Array(leftChannel.length);

    for (let i = 0; i < leftChannel.length; i++) {
      stereoData[i] = Math.abs(leftChannel[i] - rightChannel[i]);
    }

    return [stereoData];
  }

  /**
   * FFTを使用して周波数データを計算
   */
  private calculateFrequencyData(data: Float32Array): Float32Array {
    const paddedData = new Float32Array(this.fftSize * 2);
    paddedData.set(data);
    const fftData = this.fft.createComplexArray();
    this.fft.realTransform(fftData, paddedData);
    const frequencyData = new Float32Array(this.fftSize / 2);

    for (let i = 0; i < frequencyData.length; i++) {
      const real = fftData[i * 2];
      const imag = fftData[i * 2 + 1];
      frequencyData[i] = Math.sqrt(real * real + imag * imag);
    }

    return frequencyData;
  }
}

export default AudioAnalyzer;