/**
 * 基本的な列挙型
 */
export enum EffectType {
  Background = 'background',
  Text = 'text',
  Waveform = 'waveform',
  Watermark = 'watermark',
}

/**
 * 共通型定義
 */
export interface Position2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export interface Rectangle extends Position2D, Size2D {}

export interface BaseAnimation {
  duration: number;
  delay?: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  repeat?: boolean;
  repeatCount?: number;
}

/**
 * エフェクト基本設定
 */
export interface BaseEffectConfig {
  type: EffectType;
  visible: boolean;
  startTime?: number;
  endTime?: number;
  zIndex: number;
}

/**
 * オーディオビジュアルパラメータ
 */
export interface AudioVisualParameters {
  currentTime: number;
  duration: number;
  waveformData?: Float32Array;
  frequencyData?: Uint8Array;
}

/**
 * 背景エフェクト
 */
export type BackgroundType = 'color' | 'image' | 'gradient';

export interface BackgroundEffectConfig extends BaseEffectConfig {
  type: EffectType.Background;
  backgroundType: BackgroundType;
  color?: string;
  imageUrl?: string;
  gradient?: {
    colors: string[];
    angle: number;
  };
}

/**
 * テキストエフェクト
 */
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight?: string | number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
}

export interface TextAnimation extends BaseAnimation {
  type: 'fade' | 'scale' | 'slide';
}

export interface TextEffectConfig extends BaseEffectConfig {
  type: EffectType.Text;
  text: string;
  style: TextStyle;
  position: Position2D;
  animation?: TextAnimation;
}

/**
 * 波形エフェクト
 */
export type WaveformStyle = 'line' | 'bar' | 'mirror';

export interface WaveformColors {
  primary: string;
  secondary?: string;
  background?: string;
}

export interface WaveformEffectConfig extends BaseEffectConfig {
  type: EffectType.Waveform;
  style: WaveformStyle;
  colors: WaveformColors;
  position: Rectangle;
  options?: {
    barWidth?: number;
    barSpacing?: number;
    smoothing?: number;
    mirror?: boolean;
    responsive?: boolean;
  };
}

/**
 * ウォーターマークエフェクト
 */
export interface WatermarkPosition extends Position2D {
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
}

export interface WatermarkStyle {
  opacity: number;
  blendMode?: GlobalCompositeOperation;
  tint?: string;
}

export interface WatermarkEffectConfig extends BaseEffectConfig {
  type: EffectType.Watermark;
  imageUrl: string;
  position: WatermarkPosition;
  style: WatermarkStyle;
  repeat?: boolean;
  margin?: Position2D;
}

export interface EncoderService {
  initialize(options: EncoderOptions): Promise<void>;
  addVideoFrame(frame: ImageData): Promise<void>;
  addAudioData(data: AudioData): Promise<void>;
  stop(): Promise<void>;
  dispose(): void;
}

export interface EncoderOptions {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
}

export enum ErrorType {
  // オーディオ関連のエラー
  AudioLoadFailed = 'AUDIO_LOAD_FAILED',
  AudioDecodeFailed = 'AUDIO_DECODE_FAILED',
  AudioAnalysisFailed = 'AUDIO_ANALYSIS_FAILED',

  // エフェクト関連のエラー
  EffectCreateFailed = 'EFFECT_CREATE_FAILED',
  EffectUpdateFailed = 'EFFECT_UPDATE_FAILED',
  EffectNotFound = 'EFFECT_NOT_FOUND',
  InvalidEffectConfig = 'INVALID_EFFECT_CONFIG',

  // エクスポート関連のエラー
  ExportInitFailed = 'EXPORT_INIT_FAILED',
  ExportEncodeFailed = 'EXPORT_ENCODE_FAILED',
  ExportCanceled = 'EXPORT_CANCELED',
}

export class AppError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// エラーメッセージの日本語化
export const ErrorMessages: Record<ErrorType, string> = {
  [ErrorType.AudioLoadFailed]: 'オーディオファイルの読み込みに失敗しました',
  [ErrorType.AudioDecodeFailed]: 'オーディオデータのデコードに失敗しました',
  [ErrorType.AudioAnalysisFailed]: 'オーディオ解析に失敗しました',
  [ErrorType.EffectCreateFailed]: 'エフェクトの作成に失敗しました',
  [ErrorType.EffectUpdateFailed]: 'エフェクトの更新に失敗しました',
  [ErrorType.EffectNotFound]: '指定されたエフェクトが見つかりません',
  [ErrorType.InvalidEffectConfig]: 'エフェクトの設定が無効です',
  [ErrorType.ExportInitFailed]: 'エクスポートの初期化に失敗しました',
  [ErrorType.ExportEncodeFailed]: 'エンコード処理に失敗しました',
  [ErrorType.ExportCanceled]: 'エクスポートがキャンセルされました',
}; 