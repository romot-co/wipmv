import { AudioSource } from '../../types';
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

  async processAudio(file: File): Promise<AudioSource> {
    const audioContext = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const numberOfChannels = audioBuffer.numberOfChannels;
    const timeData: Float32Array[] = [];
    const volumeData: Float32Array[] = [];
    const frequencyData: Float32Array[] = [];
    const stereoData: Float32Array[] = [];
    const dynamicRangeData: Float32Array[] = [];

    // 各チャンネルのデータを取得
    for (let channel = 0; channel < numberOfChannels; channel++) {
      timeData.push(audioBuffer.getChannelData(channel));
      volumeData.push(this.calculateVolume(timeData[channel]));
      frequencyData.push(this.calculateFrequency(timeData[channel], audioBuffer.sampleRate));
      stereoData.push(this.calculateStereo(timeData[channel]));
      dynamicRangeData.push(this.calculateDynamicRange(timeData[channel]));
    }

    // 全チャンネルの平均値を計算
    const amplitudeData = this.calculateAmplitude(timeData);
    const phaseData = this.calculatePhase(timeData);

    return {
      timeData,
      volumeData,
      amplitudeData,
      frequencyData,
      phaseData,
      stereoData,
      dynamicRangeData,
      sampleRate: audioBuffer.sampleRate,
      numberOfChannels,
      rawData: arrayBuffer,
      duration: audioBuffer.duration
    };
  }

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

  extractVolumeData(audioBuffer: AudioBuffer): Float32Array[] {
    const volumeData: Float32Array[] = [];
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const channelVolumeData = new Float32Array(Math.ceil(channelData.length / samplesPerFrame));

      for (let i = 0; i < channelData.length; i += samplesPerFrame) {
        const segment = channelData.slice(i, Math.min(i + samplesPerFrame, channelData.length));
        let sum = 0;

        for (let j = 0; j < segment.length; j++) {
          sum += segment[j] ** 2;
        }

        const rms = Math.sqrt(sum / segment.length);
        const volume = 20 * Math.log10(rms);
        channelVolumeData[Math.floor(i / samplesPerFrame)] = volume;
      }

      volumeData.push(channelVolumeData);
    }

    return volumeData;
  }

  extractAmplitudeData(audioBuffer: AudioBuffer): Float32Array[] {
    const amplitudeData: Float32Array[] = [];
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const channelAmplitudeData = new Float32Array(Math.ceil(channelData.length / this.fftSize));
      let fftIndex = 0;

      for (let i = 0; i < channelData.length; i += this.fftSize) {
        const segment = channelData.slice(i, Math.min(i + this.fftSize, channelData.length));
        const max = Math.max(...segment.map(Math.abs));
        channelAmplitudeData[fftIndex] = max;
        fftIndex++;
      }

      amplitudeData.push(this.interpolateData(channelAmplitudeData, Math.ceil(channelData.length / samplesPerFrame)));
    }

    return amplitudeData;
  }

  extractFrequencyData(audioBuffer: AudioBuffer): Float32Array[][] {
    const frequencyData: Float32Array[][] = [];
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const channelFrequencyData: Float32Array[] = [];

      for (let i = 0; i < channelData.length; i += this.fftSize) {
        const segment = channelData.slice(i, Math.min(i + this.fftSize, channelData.length));
        const frequencyDataSegment = this.calculateFrequencyData(segment);
        channelFrequencyData.push(frequencyDataSegment);
      }

      frequencyData.push(this.interpolateFrequencyData(channelFrequencyData, Math.ceil(channelData.length / samplesPerFrame)));
    }

    return frequencyData;
  }

  extractPhaseData(audioBuffer: AudioBuffer): Float32Array[] {
    const phaseData: Float32Array[] = [];
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const channelPhaseData = new Float32Array(Math.ceil(channelData.length / this.fftSize));
      let prevPhase = 0;
      let fftIndex = 0;

      for (let i = 0; i < channelData.length; i += this.fftSize) {
        const segment = channelData.slice(i, Math.min(i + this.fftSize, channelData.length));
        const frequencyData = this.calculateFrequencyData(segment);
        const phase = Math.atan2(frequencyData[1], frequencyData[0]);
        const phaseDiff = phase - prevPhase;
        channelPhaseData[fftIndex] = phaseDiff;
        prevPhase = phase;
        fftIndex++;
      }

      phaseData.push(this.interpolateData(channelPhaseData, Math.ceil(channelData.length / samplesPerFrame)));
    }

    return phaseData;
  }

  extractStereoData(audioBuffer: AudioBuffer): Float32Array[] {
    const stereoData = new Float32Array(Math.ceil(audioBuffer.duration * this.frameRate));
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    if (audioBuffer.numberOfChannels < 2) {
      console.error("Stereo data extraction requires at least two channels.");
      return [];
    }

    for (let i = 0; i < stereoData.length; i++) {
      const start = i * samplesPerFrame;
      const end = Math.min(start + samplesPerFrame, audioBuffer.length);
      let sumLeft = 0;
      let sumRight = 0;

      for (let j = start; j < end; j++) {
        sumLeft += audioBuffer.getChannelData(0)[j] ** 2;
        sumRight += audioBuffer.getChannelData(1)[j] ** 2;
      }

      const rmsLeft = Math.sqrt(sumLeft / samplesPerFrame);
      const rmsRight = Math.sqrt(sumRight / samplesPerFrame);
      const stereoBalance = (rmsLeft - rmsRight) / (rmsLeft + rmsRight);
      stereoData[i] = isNaN(stereoBalance) ? 0 : stereoBalance;
    }

    return [stereoData];
  }

  extractDynamicRangeData(audioBuffer: AudioBuffer): Float32Array[] {
    const dynamicRangeData: Float32Array[] = [];
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const channelDynamicRangeData = new Float32Array(Math.ceil(channelData.length / samplesPerFrame));

      for (let i = 0; i < channelData.length; i += samplesPerFrame) {
        const segment = channelData.slice(i, Math.min(i + samplesPerFrame, channelData.length));
        let maxValue = -Infinity;
        let minValue = Infinity;

        for (let j = 0; j < segment.length; j++) {
          maxValue = Math.max(maxValue, segment[j]);
          minValue = Math.min(minValue, segment[j]);
        }

        const dynamicRange = 20 * Math.log10(maxValue / Math.abs(minValue));
        channelDynamicRangeData[Math.floor(i / samplesPerFrame)] = dynamicRange;
      }

      dynamicRangeData.push(channelDynamicRangeData);
    }

    return dynamicRangeData;
  }

  extractSpectralCentroidData(audioBuffer: AudioBuffer): Float32Array[] {
    const spectralCentroidData: Float32Array[] = [];
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const channelSpectralCentroidData = new Float32Array(Math.ceil(channelData.length / this.fftSize));
      let fftIndex = 0;

      for (let i = 0; i < channelData.length; i += this.fftSize) {
        const segment = channelData.slice(i, Math.min(i + this.fftSize, channelData.length));
        const frequencyData = this.calculateFrequencyData(segment);
        const spectralCentroid = this.calculateSpectralCentroid(frequencyData, audioBuffer.sampleRate);
        channelSpectralCentroidData[fftIndex] = spectralCentroid;
        fftIndex++;
      }

      spectralCentroidData.push(this.interpolateData(channelSpectralCentroidData, Math.ceil(channelData.length / samplesPerFrame)));
    }

    return spectralCentroidData;
  }

  private calculateSpectralCentroid(frequencyData: Float32Array, sampleRate: number): number {
    const numerator = frequencyData.reduce((sum, amplitude, index) => {
      const frequency = (index + 0.5) * (sampleRate / this.fftSize);
      return sum + amplitude * frequency;
    }, 0);

    const denominator = frequencyData.reduce((sum, amplitude) => sum + amplitude, 0);

    return numerator / denominator;
  }

  extractSpectralFluxData(audioBuffer: AudioBuffer): Float32Array[] {
    const spectralFluxData: Float32Array[] = [];
    const samplesPerFrame = Math.floor(audioBuffer.sampleRate / this.frameRate);

    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      const channelSpectralFluxData = new Float32Array(Math.ceil(channelData.length / this.fftSize) - 1);
      let prevFrequencyData: Float32Array | null = null;
      let fftIndex = 0;

      for (let i = 0; i < channelData.length; i += this.fftSize) {
        const segment = channelData.slice(i, Math.min(i + this.fftSize, channelData.length));
        const frequencyData = this.calculateFrequencyData(segment);

        if (prevFrequencyData) {
          const spectralFlux = this.calculateSpectralFlux(prevFrequencyData, frequencyData);
          channelSpectralFluxData[fftIndex - 1] = spectralFlux;
        }

        prevFrequencyData = frequencyData;
        fftIndex++;
      }

      spectralFluxData.push(this.interpolateData(channelSpectralFluxData, Math.ceil(channelData.length / samplesPerFrame) - 1));
    }

    return spectralFluxData;
  }

  private calculateSpectralFlux(prevFrequencyData: Float32Array, currentFrequencyData: Float32Array): number {
    let spectralFlux = 0;

    for (let i = 0; i < prevFrequencyData.length; i++) {
      const diff = currentFrequencyData[i] - prevFrequencyData[i];
      spectralFlux += diff * diff;
    }

    return spectralFlux;
  }

  private interpolateData(data: Float32Array, length: number): Float32Array {
    const interpolatedData = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      const index = Math.floor((i / length) * data.length);
      interpolatedData[i] = data[index];
    }

    return interpolatedData;
  }

  private interpolateFrequencyData(data: Float32Array[], length: number): Float32Array[] {
    const interpolatedData: Float32Array[] = [];

    for (let i = 0; i < length; i++) {
      const index = Math.floor((i / length) * data.length);
      interpolatedData.push(data[index]);
    }

    return interpolatedData;
  }

  private calculateVolume(timeData: Float32Array): Float32Array {
    const frameSize = Math.floor(timeData.length / this.frameRate);
    const volumeData = new Float32Array(this.frameRate);

    for (let i = 0; i < this.frameRate; i++) {
      let sum = 0;
      for (let j = 0; j < frameSize; j++) {
        const index = i * frameSize + j;
        if (index < timeData.length) {
          sum += Math.abs(timeData[index]);
        }
      }
      volumeData[i] = sum / frameSize;
    }

    return volumeData;
  }

  private calculateFrequency(timeData: Float32Array, sampleRate: number): Float32Array {
    const fftSize = 2048;
    const frequencyData = new Float32Array(fftSize / 2);
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    const audioBuffer = audioContext.createBuffer(1, timeData.length, sampleRate);
    audioBuffer.getChannelData(0).set(timeData);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);

    analyser.getFloatFrequencyData(frequencyData);
    return frequencyData;
  }

  private calculateStereo(timeData: Float32Array): Float32Array {
    const frameSize = Math.floor(timeData.length / this.frameRate);
    const stereoData = new Float32Array(this.frameRate);

    for (let i = 0; i < this.frameRate; i++) {
      let leftSum = 0;
      let rightSum = 0;
      for (let j = 0; j < frameSize; j++) {
        const index = i * frameSize + j;
        if (index < timeData.length) {
          if (index % 2 === 0) {
            leftSum += Math.abs(timeData[index]);
          } else {
            rightSum += Math.abs(timeData[index]);
          }
        }
      }
      stereoData[i] = (leftSum - rightSum) / (leftSum + rightSum);
    }

    return stereoData;
  }

  private calculateDynamicRange(timeData: Float32Array): Float32Array {
    const frameSize = Math.floor(timeData.length / this.frameRate);
    const dynamicRangeData = new Float32Array(this.frameRate);

    for (let i = 0; i < this.frameRate; i++) {
      let min = Infinity;
      let max = -Infinity;
      for (let j = 0; j < frameSize; j++) {
        const index = i * frameSize + j;
        if (index < timeData.length) {
          min = Math.min(min, timeData[index]);
          max = Math.max(max, timeData[index]);
        }
      }
      dynamicRangeData[i] = max - min;
    }

    return dynamicRangeData;
  }

  private calculateAmplitude(timeData: Float32Array[]): Float32Array {
    const length = timeData[0].length;
    const amplitudeData = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const channelData of timeData) {
        sum += Math.abs(channelData[i]);
      }
      amplitudeData[i] = sum / timeData.length;
    }

    return amplitudeData;
  }

  private calculatePhase(timeData: Float32Array[]): Float32Array {
    const length = timeData[0].length;
    const phaseData = new Float32Array(length);

    if (timeData.length < 2) {
      return phaseData;
    }

    for (let i = 0; i < length; i++) {
      const phase = Math.atan2(timeData[1][i], timeData[0][i]);
      phaseData[i] = phase;
    }

    return phaseData;
  }
}

export default AudioAnalyzer;
