export class AudioAnalyzer {
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private analyzerNode: AnalyserNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.analyzerNode = this.audioContext.createAnalyser();
    this.analyzerNode.fftSize = 2048;
  }

  public setAudioBuffer(buffer: AudioBuffer): void {
    this.audioBuffer = buffer;
  }

  public getAudioData(time: number): Float32Array | undefined {
    if (!this.audioBuffer) return undefined;

    const sampleRate = this.audioBuffer.sampleRate;
    const startSample = Math.floor(time * sampleRate);
    const bufferSize = this.analyzerNode.frequencyBinCount;

    if (startSample >= this.audioBuffer.length) return undefined;

    const audioData = new Float32Array(bufferSize);
    this.audioBuffer.copyFromChannel(audioData, 0, startSample);
    return audioData;
  }

  public dispose(): void {
    this.analyzerNode.disconnect();
    this.audioBuffer = null;
  }
}

export default AudioAnalyzer;
