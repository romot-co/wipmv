/**
 * オーディオビジュアライゼーションのパラメータ
 */
export interface AudioVisualParameters {
  // 時間関連
  currentTime: number;
  duration: number;

  // オーディオデータ
  timeData: Float32Array[];      // 時間領域データ（各チャンネル）
  frequencyData: Float32Array[]; // 周波数領域データ（各チャンネル）
  
  // オーディオ設定
  sampleRate: number;
  numberOfChannels: number;
  fftSize: number;

  // キャンバス情報
  canvas: {
    width: number;
    height: number;
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  };
}

/**
 * オーディオ設定
 */
export interface AudioConfig {
  codec: string;
  sampleRate: number;
  numberOfChannels: number;
  bitrate: number;
}

/**
 * オーディオソース
 */
export interface AudioSource {
  timeData: Float32Array[];
  frequencyData: Float32Array[];
  sampleRate: number;
  numberOfChannels: number;
  duration: number;
  rawData: ArrayBuffer;
}

export const DEFAULT_FFT_SIZE = 2048;
export const DEFAULT_SAMPLE_RATE = 48000;
export const DEFAULT_CHANNELS = 2; 