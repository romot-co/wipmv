export interface AudioSource {
  timeData: Float32Array[];
  volumeData: Float32Array[];
  amplitudeData: Float32Array;
  frequencyData: Float32Array[];
  phaseData: Float32Array;
  stereoData: Float32Array[];
  dynamicRangeData: Float32Array[];
  sampleRate: number;
  numberOfChannels: number;
  rawData: ArrayBuffer;
  duration: number;
}

export interface AudioVisualParameters {
  timeData: Float32Array[];
  volume: Float32Array;
  amplitude: Float32Array;
  frequency: Float32Array;
  phase: Float32Array;
  stereo: Float32Array;
  dynamicRange: Float32Array;
  currentTime: number;
  audioSource: AudioSource;
}

export interface AudioConfig {
  codec: string;
  sampleRate: number;
  numberOfChannels: number;
  bitrate: number;
}

export const defaultAudioConfig: AudioConfig = {
  codec: 'mp4a.40.2',
  sampleRate: 48000,
  numberOfChannels: 2,
  bitrate: 192_000,
};

// 基本的なオーディオ分析結果
export interface AudioAnalysis {
  timeData: Float32Array[];      // 波形表示用の時間領域データ
  amplitudeData: Float32Array;   // 振幅データ
  duration: number;              // 音源の長さ
  sampleRate: number;           // サンプルレート
  numberOfChannels: number;     // チャンネル数
}

// 拡張オーディオ分析結果（スペクトラムアナライザなどの追加機能用）
export interface AdvancedAudioAnalysis extends AudioAnalysis {
  frequencyData: Float32Array[];  // 周波数領域データ
  phaseData: Float32Array;        // 位相データ
  stereoData: Float32Array[];     // ステレオ情報
  dynamicRangeData: Float32Array[]; // ダイナミックレンジ
}

// オーディオアナライザの設定オプション
export interface AudioAnalyzerOptions {
  fftSize?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

// レンダリング時のオーディオパラメータ
export interface AudioRenderParams {
  currentTime: number;
  audioAnalysis: AudioAnalysis | null;
} 