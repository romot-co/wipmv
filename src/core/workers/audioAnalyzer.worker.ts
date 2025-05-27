import FFT from 'fft.js';
import debug from 'debug';

const log = debug('app:audioAnalyzerWorker');

interface AudioData {
  readonly channelData: Float32Array[];  // 複数チャンネルに対応
  readonly sampleRate: number;
  readonly duration: number;
  readonly numberOfChannels: number;
}

interface AnalysisConfig {
  readonly targetFps: number;      // 目標フレームレート
  readonly fftSize: number;        // FFTサイズ
  readonly hopSize: number;        // ホップサイズ
  readonly maxDuration: number;    // 最大解析時間（秒）
  readonly downsampleFactor: number; // ダウンサンプリング係数
}

interface WorkerMessage {
  readonly type: 'analyze' | 'cancel';
  readonly audioData?: AudioData;
  readonly config?: Partial<AnalysisConfig>;
}

// デフォルト設定
const DEFAULT_CONFIG: AnalysisConfig = {
  targetFps: 60,
  fftSize: 2048,
  hopSize: 512,
  maxDuration: 300, // 5分
  downsampleFactor: 1
};

// キャンセルフラグ
let isCancelled = false;

/**
 * 音声データのダウンサンプリング
 */
function downsampleAudio(data: Float32Array, factor: number): Float32Array {
  if (factor <= 1) return data;
  
  const length = Math.floor(data.length / factor);
  const result = new Float32Array(length);
  
  for (let i = 0; i < length; i++) {
    let sum = 0;
    for (let j = 0; j < factor; j++) {
      const idx = i * factor + j;
      if (idx < data.length) {
        sum += data[idx];
      }
    }
    result[i] = sum / factor;
  }
  
  return result;
}

/**
 * FFT処理の実装
 */
function computeFFT(data: Float32Array, fftSize: number): Float32Array {
  // キャンセルチェック
  if (isCancelled) {
    throw new Error('cancelled');
  }

  const fft = new FFT(fftSize);
  const out = fft.createComplexArray();
  const input = new Float32Array(fftSize);

  // ハニング窓を適用
  for (let i = 0; i < fftSize; i++) {
    if (i < data.length) {
      const windowValue = 0.5 * (1 - Math.cos(2 * Math.PI * i / fftSize));
      input[i] = data[i] * windowValue;
    }
  }

  // FFT計算
  fft.realTransform(out, input);

  // パワースペクトルの計算（メモリ効率化）
  const magnitudes = new Float32Array(fftSize / 2);
  for (let i = 0; i < fftSize / 2; i++) {
    const real = out[2 * i];
    const imag = out[2 * i + 1];
    magnitudes[i] = Math.sqrt(real * real + imag * imag) / fftSize;
  }

  // メモリ解放のヒント
  out.length = 0;

  return magnitudes;
}

/**
 * 音声解析処理
 */
async function analyzeAudio(audioData: AudioData, config: AnalysisConfig = DEFAULT_CONFIG) {
  try {
    const { channelData, duration, sampleRate, numberOfChannels } = audioData;
    
    // 長すぎる音声のチェック
    if (duration > config.maxDuration) {
      throw new Error(`音声が長すぎます（最大${config.maxDuration}秒）`);
    }

    const waveformData: Float32Array[] = [];
    // ★ 時間変化する周波数データを格納する配列 (Float32Array[]) の配列
    const frequencyFrames: Float32Array[][] = Array.from({ length: numberOfChannels }, () => []);

    // 各チャンネルを処理
    for (let channel = 0; channel < numberOfChannels; channel++) {
      // キャンセルチェック
      if (isCancelled) {
        throw new Error('cancelled');
      }

      // ダウンサンプリング
      const downsampledData = downsampleAudio(
        channelData[channel],
        config.downsampleFactor
      );

      // 波形データの抽出
      const samplesPerSecond = config.targetFps;
      const totalSamples = Math.ceil(duration * samplesPerSecond);
      const currentWaveformData = new Float32Array(totalSamples);
      const samplesPerPoint = Math.floor(downsampledData.length / totalSamples);

      // 波形データの生成（RMS値とピーク値を組み合わせて使用）
      for (let i = 0; i < totalSamples; i++) {
        // キャンセルチェック（定期的に）
        if (i % 100 === 0 && isCancelled) {
          throw new Error('cancelled');
        }

        const startSample = i * samplesPerPoint;
        const endSample = Math.min(startSample + samplesPerPoint, downsampledData.length);
        let sumSquares = 0;
        let peakValue = 0;
        
        for (let j = startSample; j < endSample; j++) {
          const sample = Math.abs(downsampledData[j]);
          sumSquares += sample * sample;
          peakValue = Math.max(peakValue, sample);
        }
        
        const rms = Math.sqrt(sumSquares / (endSample - startSample));
        currentWaveformData[i] = rms * 0.7 + peakValue * 0.3;
      }

      waveformData.push(currentWaveformData);

      // 周波数データの解析（時間変化を保持）
      const numFrames = Math.floor((downsampledData.length - config.fftSize) / config.hopSize) + 1;
      const channelFrequencyFrames: Float32Array[] = []; // このチャンネルのフレーム別周波数データ

      for (let frame = 0; frame < numFrames; frame++) {
        // キャンセルチェック（定期的に）
        if (frame % 10 === 0 && isCancelled) {
          throw new Error('cancelled');
        }

        const startIndex = frame * config.hopSize;
        const segment = downsampledData.slice(startIndex, startIndex + config.fftSize);
        
        if (segment.length === config.fftSize) {
          const fftMagnitudes = computeFFT(segment, config.fftSize);
          channelFrequencyFrames.push(fftMagnitudes); // ★ フレームごとの結果を配列に追加
        }
      }

      frequencyFrames[channel] = channelFrequencyFrames; // ★ チャンネルの結果を格納
    }

    return {
      duration,
      sampleRate: sampleRate / config.downsampleFactor,
      numberOfChannels,
      waveformData,
      frequencyData: frequencyFrames // ★ フレームごとのデータ配列の配列
    };

  } catch (error) {
    if (error instanceof Error && error.message === 'cancelled') {
      log('音声解析がキャンセルされました');
      return { type: 'cancelled' };
    }
    console.error('音声解析エラー:', error);
    throw error;
  }
}

// メッセージハンドラ
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  // console.log('Worker: 受信メッセージ:', e); // 受信したイベント全体をログ出力
  try {
    if (e.data.type === 'cancel') {
      log('Worker: キャンセル要求を受信');
      isCancelled = true;
      return;
    }

    if (e.data.type !== 'analyze') {
      throw new Error('不正なメッセージタイプです');
    }
    
    if (!e.data.audioData?.channelData) {
      throw new Error('音声データが不正です');
    }

    // キャンセルフラグをリセット
    isCancelled = false;

    // 設定をマージ
    const config: AnalysisConfig = {
      ...DEFAULT_CONFIG,
      ...e.data.config
    };

    // 音声の長さに応じて設定を調整
    let adjustedConfig = { ...config };
    if (e.data.audioData.duration > 60) { // 1分以上
      adjustedConfig = {
        ...config,
        downsampleFactor: Math.max(2, config.downsampleFactor),
        targetFps: Math.min(30, config.targetFps)
      };
    }

    log('Worker: 解析開始', {
      sampleRate: e.data.audioData.sampleRate,
      duration: e.data.audioData.duration,
      numberOfChannels: e.data.audioData.numberOfChannels,
      channelsLength: e.data.audioData.channelData.map(ch => ch.length),
      config: adjustedConfig
    });
    
    const result = await analyzeAudio(e.data.audioData, adjustedConfig);

    // 結果に基づいてメッセージを送信
    if (result && 'waveformData' in result && 'frequencyData' in result) {
      // 成功した場合
      log('Worker: 解析完了、結果を送信');
      const transferableObjects: Transferable[] = [];
      result.waveformData!.forEach(arr => transferableObjects.push(arr.buffer));
      result.frequencyData!.forEach(channelFrames => 
        channelFrames.forEach(frame => transferableObjects.push(frame.buffer))
      );
      // ★ postMessage の呼び出し方を修正
      self.postMessage({ type: 'success', data: result }, { transfer: transferableObjects });
    } else if (result && 'type' in result && result.type === 'cancelled') {
      // キャンセルされた場合
      log('Worker: 解析キャンセルを通知');
      self.postMessage({ type: 'cancelled' });
    } else {
      // その他のエラーケース（analyzeAudio内でエラーが投げられなかった場合）
      console.error('Worker: 不明な解析結果', result);
      self.postMessage({ type: 'error', error: '不明な解析結果です' });
    }

  } catch (error) {
    console.error('Worker: エラー発生', error);
    self.postMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : '音声解析に失敗しました',
      details: error
    });
  }
};

export {};
