interface AudioAnalyzerWorkerData {
  channelData: Float32Array[];
  sampleRate: number;
  length: number;
}

interface AnalysisData {
  waveformData: Float32Array[];
  frequencyData: Float32Array[][];
  amplitudeData: Float32Array[];
  phaseData: Float32Array[];
  stereoData: Float32Array[];
  dynamicRangeData: Float32Array[];
  spectralCentroidData: Float32Array[];
  spectralFluxData: Float32Array[];
}

self.onmessage = async (event: MessageEvent<AudioAnalyzerWorkerData>) => {
  const { channelData, sampleRate, length } = event.data;
  console.log('Worker: 解析開始', { channels: channelData.length, sampleRate, length });

  try {
    // 波形データの解析
    console.log('Worker: 波形データの解析開始');
    const waveformData = channelData.map(channel => {
      return analyzeWaveform(channel);
    });
    console.log('Worker: 波形データの解析完了', waveformData.length);

    // 周波数データの解析
    console.log('Worker: 周波数データの解析開始');
    const frequencyData = channelData.map(channel => {
      return analyzeFrequency(channel);
    });
    console.log('Worker: 周波数データの解析完了', frequencyData.length);

    // 振幅データの解析
    console.log('Worker: 振幅データの解析開始');
    const amplitudeData = channelData.map(channel => {
      return analyzeAmplitude(channel);
    });
    console.log('Worker: 振幅データの解析完了');

    // 位相データの解析
    console.log('Worker: 位相データの解析開始');
    const phaseData = channelData.map(channel => {
      return analyzePhase(channel);
    });
    console.log('Worker: 位相データの解析完了');

    // ステレオデータの解析
    console.log('Worker: ステレオデータの解析開始');
    const stereoData = analyzeStereo(channelData);
    console.log('Worker: ステレオデータの解析完了');

    // ダイナミックレンジの解析
    console.log('Worker: ダイナミックレンジの解析開始');
    const dynamicRangeData = channelData.map(channel => {
      return analyzeDynamicRange(channel);
    });
    console.log('Worker: ダイナミックレンジの解析完了');

    // スペクトル重心の解析
    console.log('Worker: スペクトル重心の解析開始');
    const spectralCentroidData = channelData.map(channel => {
      return analyzeSpectralCentroid(channel, sampleRate);
    });
    console.log('Worker: スペクトル重心の解析完了');

    // スペクトラルフラックスの解析
    console.log('Worker: スペクトラルフラックスの解析開始');
    const spectralFluxData = channelData.map(channel => {
      return analyzeSpectralFlux(channel);
    });
    console.log('Worker: スペクトラルフラックスの解析完了');

    // データの検証
    const isValid = validateAnalysisData({
      waveformData,
      frequencyData,
      amplitudeData,
      phaseData,
      stereoData,
      dynamicRangeData,
      spectralCentroidData,
      spectralFluxData
    });

    if (!isValid) {
      throw new Error('解析データの検証に失敗しました');
    }

    // 結果を返信
    console.log('Worker: 解析結果の送信開始');
    self.postMessage({
      waveformData,
      frequencyData,
      amplitudeData,
      phaseData,
      stereoData,
      dynamicRangeData,
      spectralCentroidData,
      spectralFluxData
    });
    console.log('Worker: 解析結果の送信完了');

  } catch (error: unknown) {
    console.error('Worker: エラー発生', error);
    if (error instanceof Error) {
      throw new Error('Failed to analyze audio data: ' + error.message);
    } else {
      throw new Error('Failed to analyze audio data: Unknown error');
    }
  }
};

function validateAnalysisData(data: AnalysisData): boolean {
  // 各データの存在チェック
  if (!data.waveformData || !data.frequencyData) {
    console.error('必須データが欠落しています');
    return false;
  }

  // データの長さチェック
  if (data.waveformData.length === 0 || data.frequencyData.length === 0) {
    console.error('データが空です');
    return false;
  }

  // データの型チェック
  if (!Array.isArray(data.waveformData) || !Array.isArray(data.frequencyData)) {
    console.error('データの型が不正です');
    return false;
  }

  return true;
}

// 波形データの解析
function analyzeWaveform(channelData: Float32Array): Float32Array {
  return channelData;
}

// 周波数データの解析
function analyzeFrequency(channelData: Float32Array): Float32Array[] {
  const fftSize = 2048;
  const hopSize = fftSize / 4;
  const numFrames = Math.floor((channelData.length - fftSize) / hopSize) + 1;
  const frames: Float32Array[] = [];

  for (let i = 0; i < numFrames; i++) {
    const frame = new Float32Array(fftSize);
    const startIndex = i * hopSize;
    frame.set(channelData.slice(startIndex, startIndex + fftSize));
    frames.push(performFFT(frame));
  }

  return frames;
}

// FFTの実行
function performFFT(frame: Float32Array): Float32Array {
  // ここにFFTの実装を追加
  // 簡易的な実装として、同じデータを返す
  return frame;
}

// 振幅データの解析
function analyzeAmplitude(channelData: Float32Array): Float32Array {
  const frameSize = 1024;
  const hopSize = frameSize / 2;
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize) + 1;
  const amplitudes = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    const startIndex = i * hopSize;
    const frame = channelData.slice(startIndex, startIndex + frameSize);
    amplitudes[i] = Math.max(...frame.map(Math.abs));
  }

  return amplitudes;
}

// 位相データの解析
function analyzePhase(channelData: Float32Array): Float32Array {
  // 簡易的な実装として、同じデータを返す
  return channelData;
}

// ステレオデータの解析
function analyzeStereo(channelData: Float32Array[]): Float32Array[] {
  if (channelData.length < 2) {
    return [new Float32Array(channelData[0].length)];
  }

  const stereoData = new Float32Array(channelData[0].length);
  for (let i = 0; i < channelData[0].length; i++) {
    stereoData[i] = Math.abs(channelData[0][i] - channelData[1][i]);
  }

  return [stereoData];
}

// ダイナミックレンジの解析
function analyzeDynamicRange(channelData: Float32Array): Float32Array {
  const frameSize = 1024;
  const hopSize = frameSize / 2;
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize) + 1;
  const dynamicRange = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    const startIndex = i * hopSize;
    const frame = channelData.slice(startIndex, startIndex + frameSize);
    const max = Math.max(...frame);
    const min = Math.min(...frame);
    dynamicRange[i] = max - min;
  }

  return dynamicRange;
}

// スペクトル重心の解析
function analyzeSpectralCentroid(channelData: Float32Array, sampleRate: number): Float32Array {
  const frameSize = 2048;
  const hopSize = frameSize / 4;
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize) + 1;
  const centroid = new Float32Array(numFrames);

  for (let i = 0; i < numFrames; i++) {
    const startIndex = i * hopSize;
    const frame = channelData.slice(startIndex, startIndex + frameSize);
    const spectrum = performFFT(frame);
    
    let weightedSum = 0;
    let sum = 0;
    
    for (let j = 0; j < spectrum.length / 2; j++) {
      const magnitude = Math.abs(spectrum[j]);
      weightedSum += j * magnitude;
      sum += magnitude;
    }
    
    centroid[i] = sum !== 0 ? (weightedSum / sum) * (sampleRate / frameSize) : 0;
  }

  return centroid;
}

// スペクトラルフラックスの解析
function analyzeSpectralFlux(channelData: Float32Array): Float32Array {
  const frameSize = 2048;
  const hopSize = frameSize / 4;
  const numFrames = Math.floor((channelData.length - frameSize) / hopSize) + 1;
  const flux = new Float32Array(numFrames);
  
  let prevSpectrum: Float32Array | null = null;
  
  for (let i = 0; i < numFrames; i++) {
    const startIndex = i * hopSize;
    const frame = channelData.slice(startIndex, startIndex + frameSize);
    const spectrum = performFFT(frame);
    
    if (prevSpectrum) {
      let fluxSum = 0;
      for (let j = 0; j < spectrum.length / 2; j++) {
        const diff = Math.abs(spectrum[j]) - Math.abs(prevSpectrum[j]);
        fluxSum += diff > 0 ? diff : 0;
      }
      flux[i] = fluxSum;
    }
    
    prevSpectrum = spectrum;
  }
  
  return flux;
} 