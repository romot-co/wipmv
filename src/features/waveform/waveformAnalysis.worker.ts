/**
 * 波形解析用のWeb Worker
 * オーディオデータのオフライン解析を行い、ピークとRMS値を計算
 */

interface AnalyzeMessage {
  type: 'analyze';
  channelData: Float32Array;
  sampleRate: number;
  segmentCount: number;
}

interface ResultMessage {
  type: 'result';
  peaks: Float32Array;
  rms: Float32Array;
}

// メッセージハンドラ
self.onmessage = (e: MessageEvent<AnalyzeMessage>) => {
  if (e.data.type === 'analyze') {
    const { channelData, segmentCount } = e.data;
    const result = analyzeWaveform(channelData, segmentCount);
    self.postMessage(result, {
      transfer: [result.peaks.buffer, result.rms.buffer]
    });
  }
};

/**
 * 波形データを解析し、ピークとRMS値を計算
 */
function analyzeWaveform(
  channelData: Float32Array,
  segmentCount: number
): ResultMessage {
  const samplesPerSegment = Math.floor(channelData.length / segmentCount);
  const peaks = new Float32Array(segmentCount);
  const rms = new Float32Array(segmentCount);

  for (let i = 0; i < segmentCount; i++) {
    let maxPeak = 0;
    let sumSquares = 0;
    const startIndex = i * samplesPerSegment;
    const endIndex = Math.min(startIndex + samplesPerSegment, channelData.length);

    for (let j = startIndex; j < endIndex; j++) {
      const value = Math.abs(channelData[j]);
      maxPeak = Math.max(maxPeak, value);
      sumSquares += value * value;
    }

    peaks[i] = maxPeak;
    rms[i] = Math.sqrt(sumSquares / samplesPerSegment);
  }

  return {
    type: 'result',
    peaks,
    rms
  };
}

// TypeScriptのコンパイラに、これがモジュールであることを伝える
export {}; 