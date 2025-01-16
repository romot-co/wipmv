/// <reference lib="webworker" />
import FFT from 'fft.js';

interface AudioData {
  readonly channelData: Float32Array;
  readonly sampleRate: number;
  readonly duration: number;
  readonly numberOfChannels: number;
}

interface WorkerMessage {
  readonly type: 'analyze';
  readonly audioData: AudioData;
}

// FFTサイズとホップサイズの定義
const FFT_SIZE = 2048;
const HOP_SIZE = FFT_SIZE / 4;

// FFT処理の実装
function computeFFT(data: Float32Array): Float32Array {
  const fft = new FFT(FFT_SIZE);
  const out = fft.createComplexArray();
  const input = new Float32Array(FFT_SIZE);

  // ハニング窓を適用
  for (let i = 0; i < FFT_SIZE; i++) {
    if (i < data.length) {
      const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / FFT_SIZE));
      input[i] = data[i] * windowValue;
    }
  }

  // FFT計算
  fft.realTransform(out, input);

  // パワースペクトルの計算
  const magnitudes = new Float32Array(FFT_SIZE / 2);
  for (let i = 0; i < FFT_SIZE / 2; i++) {
    const real = out[2 * i];
    const imag = out[2 * i + 1];
    magnitudes[i] = Math.sqrt(real * real + imag * imag) / FFT_SIZE;
  }

  return magnitudes;
}

// 音声解析処理
const analyzeAudio = (audioData: AudioData) => {
  try {
    const { channelData, duration, sampleRate } = audioData;

    // 波形データの抽出（1秒あたり60サンプル）
    const samplesPerSecond = 60;
    const totalSamples = Math.ceil(duration * samplesPerSecond);
    const waveformData = new Float32Array(totalSamples);
    const samplesPerPoint = Math.floor(channelData.length / totalSamples);

    // 波形データの生成（RMS値を使用）
    for (let i = 0; i < totalSamples; i++) {
      const startSample = i * samplesPerPoint;
      const endSample = Math.min(startSample + samplesPerPoint, channelData.length);
      let sum = 0;
      
      for (let j = startSample; j < endSample; j++) {
        sum += channelData[j] * channelData[j];
      }
      
      waveformData[i] = Math.sqrt(sum / (endSample - startSample));
    }

    // 周波数データの解析
    const numFrames = Math.floor((channelData.length - FFT_SIZE) / HOP_SIZE) + 1;
    const frequencyData = new Float32Array(FFT_SIZE / 2);

    // 各フレームでFFTを計算し、平均を取る
    for (let frame = 0; frame < numFrames; frame++) {
      const startIndex = frame * HOP_SIZE;
      const segment = channelData.slice(startIndex, startIndex + FFT_SIZE);
      const fft = computeFFT(segment);

      // 周波数ビンごとに加算
      for (let i = 0; i < FFT_SIZE / 2; i++) {
        frequencyData[i] += fft[i];
      }
    }

    // 平均化
    for (let i = 0; i < FFT_SIZE / 2; i++) {
      frequencyData[i] /= numFrames;
    }

    return {
      duration,
      sampleRate,
      numberOfChannels: audioData.numberOfChannels,
      waveformData: [waveformData],
      frequencyData: [frequencyData]
    };

  } catch (error) {
    console.error('音声解析エラー:', error);
    throw new Error(error instanceof Error ? error.message : '音声解析に失敗しました');
  }
};

// メッセージハンドラ
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  try {
    if (e.data.type !== 'analyze') {
      throw new Error('不正なメッセージタイプです');
    }
    
    if (!e.data.audioData?.channelData) {
      throw new Error('音声データが不正です');
    }

    console.log('Worker: 解析開始', {
      sampleRate: e.data.audioData.sampleRate,
      duration: e.data.audioData.duration,
      dataLength: e.data.audioData.channelData.length
    });
    
    const result = analyzeAudio(e.data.audioData);
    
    console.log('Worker: 解析完了', {
      waveformLength: result.waveformData?.[0]?.length,
      frequencyLength: result.frequencyData?.[0]?.length
    });

    self.postMessage({ 
      type: 'success', 
      data: result 
    });
  } catch (error) {
    console.error('Worker: エラー発生', error);
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : '音声解析に失敗しました',
      details: error
    });
  }
}; 