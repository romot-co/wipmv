import FFT from 'fft.js';

interface AnalyzerWorkerMessage {
  type: 'analyze';
  audioData: Float32Array;
  sampleRate: number;
  frameRate: number;
  fftSize: number;
}

interface AnalyzerWorkerResponse {
  type: 'result';
  waveformData: Float32Array[];
  frequencyData: Float32Array[][];
  stereoData: Float32Array[];
}

self.addEventListener('message', (event: MessageEvent<AnalyzerWorkerMessage>) => {
  if (event.data.type !== 'analyze') return;

  const { audioData, sampleRate, frameRate, fftSize } = event.data;
  const fft = new FFT(fftSize);

  // 波形データの抽出
  const waveformData = extractVolumeData(audioData);

  // 周波数データの抽出
  const frequencyData = extractFrequencyData(audioData, sampleRate, frameRate, fft, fftSize);

  // ステレオデータは単一チャンネルなので空配列
  const stereoData: Float32Array[] = [new Float32Array(0)];

  const response: AnalyzerWorkerResponse = {
    type: 'result',
    waveformData: [waveformData],
    frequencyData: [frequencyData],
    stereoData
  };

  self.postMessage(response);
});

function extractVolumeData(audioData: Float32Array): Float32Array {
  const volumeData = new Float32Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) {
    volumeData[i] = Math.abs(audioData[i]);
  }
  return volumeData;
}

function extractFrequencyData(
  audioData: Float32Array,
  sampleRate: number,
  frameRate: number,
  fft: FFT,
  fftSize: number
): Float32Array[] {
  const freqData: Float32Array[] = [];
  const samplesPerFrame = Math.floor(sampleRate / frameRate);

  for (let i = 0; i < audioData.length; i += samplesPerFrame) {
    const frame = audioData.slice(i, i + samplesPerFrame);
    freqData.push(calculateFrequencyData(frame, fft, fftSize));
  }

  return freqData;
}

function calculateFrequencyData(data: Float32Array, fft: FFT, fftSize: number): Float32Array {
  const paddedData = new Float32Array(fftSize * 2);
  paddedData.set(data);
  const fftData = fft.createComplexArray();
  fft.realTransform(fftData, paddedData);
  const frequencyData = new Float32Array(fftSize / 2);

  for (let i = 0; i < frequencyData.length; i++) {
    const real = fftData[i * 2];
    const imag = fftData[i * 2 + 1];
    frequencyData[i] = Math.sqrt(real * real + imag * imag);
  }

  return frequencyData;
} 