/**
 * 波形分析を行うWeb Worker
 * メインスレッドから波形データを受け取り、分析結果を返す
 */

interface WaveformAnalysisOptions {
  smoothing?: number;
  responsive?: boolean;
}

interface WaveformAnalysisMessage {
  data: Float32Array;
  options: WaveformAnalysisOptions;
}

self.onmessage = (e: MessageEvent<WaveformAnalysisMessage>) => {
  const { data, options } = e.data;
  
  // スムージング処理
  const smoothed = smoothData(data, options.smoothing ?? 0.5);
  
  // ピーク値の計算
  const peaks = calculatePeaks(data);
  
  // RMS（二乗平均平方根）の計算
  const rms = calculateRMS(data);
  
  // 結果を返送
  self.postMessage({
    smoothed: smoothed,
    peaks: peaks,
    rms: rms
  });
};

/**
 * 波形データをスムージング
 */
function smoothData(data: Float32Array, factor: number): Float32Array {
  if (factor <= 0) return data;
  if (factor >= 1) factor = 0.9999;

  const smoothed = new Float32Array(data.length);
  let lastValue = data[0];

  for (let i = 0; i < data.length; i++) {
    const currentValue = data[i];
    smoothed[i] = lastValue + factor * (currentValue - lastValue);
    lastValue = smoothed[i];
  }

  return smoothed;
}

/**
 * ピーク値を計算
 */
function calculatePeaks(data: Float32Array): Float32Array {
  const peaks = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    peaks[i] = Math.abs(data[i]);
  }
  return peaks;
}

/**
 * RMS（二乗平均平方根）を計算
 */
function calculateRMS(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i] * data[i];
  }
  return Math.sqrt(sum / data.length);
} 