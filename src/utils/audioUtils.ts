/**
 * オーディオ解析ユーティリティ
 * 波形データと周波数データの生成を行う
 */

/**
 * オーディオファイルをデコードしてAudioBufferを生成
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  const audioContext = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * AudioBufferから波形データを生成
 * @param audioBuffer デコードされたオーディオデータ
 * @param numberOfSamples 生成するサンプル数
 * @returns 正規化された波形データ（-1.0 ~ 1.0）
 */
export function generateWaveformData(audioBuffer: AudioBuffer, numberOfSamples: number): Float32Array {
  const channelData = audioBuffer.getChannelData(0); // モノラルとして処理
  const blockSize = Math.floor(channelData.length / numberOfSamples);
  const waveformData = new Float32Array(numberOfSamples);

  for (let i = 0; i < numberOfSamples; i++) {
    const start = i * blockSize;
    const end = start + blockSize;
    let max = 0;

    // ブロック内の最大振幅を検出
    for (let j = start; j < end; j++) {
      const amplitude = Math.abs(channelData[j]);
      if (amplitude > max) {
        max = amplitude;
      }
    }

    waveformData[i] = max;
  }

  // 波形データを正規化（-1.0 ~ 1.0）
  const maxAmplitude = Math.max(...waveformData);
  if (maxAmplitude > 0) {
    for (let i = 0; i < numberOfSamples; i++) {
      waveformData[i] /= maxAmplitude;
    }
  }

  return waveformData;
}

/**
 * AudioBufferから周波数データを生成
 * @param audioBuffer デコードされたオーディオデータ
 * @param fftSize FFTサイズ（2の累乗、e.g., 2048）
 * @returns 周波数データ（0 ~ 255）
 */
export function generateFrequencyData(audioBuffer: AudioBuffer, fftSize: number): Uint8Array {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData);

  return frequencyData;
}

/**
 * 時間（秒）をフレームインデックスに変換
 */
export function timeToFrameIndex(time: number, sampleRate: number): number {
  return Math.floor(time * sampleRate);
}

/**
 * フレームインデックスを時間（秒）に変換
 */
export function frameIndexToTime(frameIndex: number, sampleRate: number): number {
  return frameIndex / sampleRate;
}

/**
 * 指定時間の波形データを取得
 */
export function getWaveformAtTime(
  audioBuffer: AudioBuffer,
  time: number,
  windowSize: number
): Float32Array {
  const sampleRate = audioBuffer.sampleRate;
  const startFrame = timeToFrameIndex(time, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  const waveformData = new Float32Array(windowSize);

  for (let i = 0; i < windowSize; i++) {
    const frame = startFrame + i;
    if (frame < channelData.length) {
      waveformData[i] = channelData[frame];
    }
  }

  return waveformData;
}

/**
 * 指定時間の周波数データを取得
 */
export function getFrequencyAtTime(
  audioBuffer: AudioBuffer,
  time: number,
  fftSize: number
): Uint8Array {
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(analyser);

  // 指定時間までシーク
  source.start(0, time);

  const frequencyData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequencyData);

  return frequencyData;
}

/**
 * RMS（二乗平均平方根）を計算
 */
export function calculateRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
}

/**
 * デシベル値に変換
 */
export function toDecibels(value: number, minDecibels = -100): number {
  return value > 0 ? 20 * Math.log10(value) : minDecibels;
}

/**
 * ピーク値を検出
 */
export function detectPeaks(data: Float32Array, threshold = 0.5): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (
      data[i] > threshold &&
      data[i] > data[i - 1] &&
      data[i] > data[i + 1]
    ) {
      peaks.push(i);
    }
  }
  return peaks;
} 