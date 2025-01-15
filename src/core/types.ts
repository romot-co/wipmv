// src/core/types.ts
// 共有型定義

/**
 * 動画設定
 */
export interface VideoSettings {
  width: number;
  height: number;
  fps: number;
  bitrate: number;
}

/**
 * AudioBuffer をアプリ内部で扱う際に
 * どんな情報をまとめて持つか
 */
export interface AudioSource {
  /** 元のファイル */
  file?: File;
  /** デコード済み AudioBuffer */
  buffer: AudioBuffer;
  /** サンプリングレート */
  sampleRate: number;
  /** チャンネル数 */
  numberOfChannels: number;
  /** 再生総時間(秒) */
  duration: number;
  /** 波形データ */
  waveformData?: Float32Array[];
  /** 周波数データ */
  frequencyData?: Float32Array[][];
  /** 振幅データ */
  amplitudeData?: Float32Array[];
  /** 位相データ */
  phaseData?: Float32Array[];
  /** ステレオデータ */
  stereoData?: Float32Array[];
  /** ダイナミックレンジデータ */
  dynamicRangeData?: Float32Array[];
  /** スペクトル重心データ */
  spectralCentroidData?: Float32Array[];
  /** スペクトラルフラックスデータ */
  spectralFluxData?: Float32Array[];
}

/**
 * エフェクトの種類
 */
export enum EffectType {
  Background = 'background',
  Text = 'text',
  Waveform = 'waveform',
  Watermark = 'watermark'
}

/**
 * アニメーションのイージング関数の種類
 */
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

/**
 * 基本的なアニメーション設定
 */
export interface BaseAnimation {
  duration: number;
  delay?: number;
  easing?: EasingType;
}

/**
 * エフェクトの基本設定
 */
export interface BaseEffectConfig {
  id: string;
  type: EffectType;
  startTime?: number;
  endTime?: number;
  zIndex?: number;
  visible?: boolean;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * 全エフェクトの設定の共通型
 */
export type EffectConfig = BaseEffectConfig & (
  | BackgroundEffectConfig
  | TextEffectConfig
  | WaveformEffectConfig
  | WatermarkEffectConfig
);

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

export interface FadeAnimation extends BaseAnimation {
  type: 'fade';
  from?: number;
  to?: number;
}

export interface ScaleAnimation extends BaseAnimation {
  type: 'scale';
  from: number;
  to: number;
}

export interface MoveAnimation extends BaseAnimation {
  type: 'move';
  from: Position2D;
  to: Position2D;
}

export interface RotateAnimation extends BaseAnimation {
  type: 'rotate';
  from: number;
  to: number;
}

export interface ColorAnimation extends BaseAnimation {
  type: 'color';
  from: RGBAColor;
  to: RGBAColor;
}

export interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

/**
 * 色情報
 */
export interface Color {
  r: number;  // 0-255
  g: number;  // 0-255
  b: number;  // 0-255
  a: number;  // 0-1
}

/**
 * テキストアニメーション
 */
export type TextAnimation = 
  | { type: 'fade'; duration: number; delay?: number; easing?: string; from?: number; to?: number }
  | { type: 'scale'; duration: number; delay?: number; easing?: string; from: number; to: number }
  | { type: 'move'; duration: number; delay?: number; easing?: string; from: Position2D; to: Position2D }
  | { type: 'rotate'; duration: number; delay?: number; easing?: string; from: number; to: number }
  | { type: 'color'; duration: number; delay?: number; easing?: string; from: Color; to: Color };

/**
 * オーディオソース
 */
export interface AudioSource {
  file?: File;
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

/**
 * オーディオの再生状態
 */
export interface AudioPlaybackState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  loop: boolean;
}

/**
 * オーディオの視覚化パラメータ
 */
export interface AudioVisualParameters {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  waveformData?: Float32Array;
  frequencyData?: Float32Array;
}

/**
 * エラーの種類
 */
export enum ErrorType {
  // エフェクト関連
  EffectInitFailed = 'EffectInitFailed',
  EffectUpdateFailed = 'EffectUpdateFailed',
  EffectNotFound = 'EffectNotFound',
  EffectAlreadyExists = 'EffectAlreadyExists',
  
  // オーディオ関連
  AudioLoadFailed = 'AudioLoadFailed',
  AudioDecodeFailed = 'AudioDecodeFailed',
  AudioPlaybackFailed = 'AudioPlaybackFailed',
  AudioAnalysisFailed = 'AudioAnalysisFailed',
  
  // プロジェクト関連
  ProjectServiceError = 'ProjectServiceError',
  ProjectNotFound = 'ProjectNotFound',
  ProjectCreateFailed = 'ProjectCreateFailed',
  ProjectSaveFailed = 'ProjectSaveFailed',
  ProjectLoadFailed = 'ProjectLoadFailed',
  ProjectDeleteFailed = 'ProjectDeleteFailed',
  
  // データベース関連
  DatabaseError = 'DatabaseError',
  DatabaseConnectionFailed = 'DatabaseConnectionFailed',
  DatabaseOperationFailed = 'DatabaseOperationFailed',
  
  // エクスポート関連
  ExportInitFailed = 'ExportInitFailed',
  ExportRenderFailed = 'ExportRenderFailed',
  ExportEncodeFailed = 'ExportEncodeFailed'
}

/**
 * エラーメッセージのマッピング
 */
export const ErrorMessages: Record<ErrorType, string> = {
  // エフェクト関連
  EffectInitFailed: 'エフェクトの初期化に失敗しました',
  EffectUpdateFailed: 'エフェクトの更新に失敗しました',
  EffectNotFound: '指定されたエフェクトが見つかりません',
  EffectAlreadyExists: '同じIDのエフェクトが既に存在します',
  
  // オーディオ関連
  AudioLoadFailed: '音声ファイルの読み込みに失敗しました',
  AudioDecodeFailed: '音声ファイルのデコードに失敗しました',
  AudioPlaybackFailed: '音声の再生に失敗しました',
  AudioAnalysisFailed: '音声の解析に失敗しました',
  
  // プロジェクト関連
  ProjectServiceError: 'プロジェクト操作でエラーが発生しました',
  ProjectNotFound: '指定されたプロジェクトが見つかりません',
  ProjectCreateFailed: 'プロジェクトの作成に失敗しました',
  ProjectSaveFailed: 'プロジェクトの保存に失敗しました',
  ProjectLoadFailed: 'プロジェクトの読み込みに失敗しました',
  ProjectDeleteFailed: 'プロジェクトの削除に失敗しました',
  
  // データベース関連
  DatabaseError: 'データベース操作でエラーが発生しました',
  DatabaseConnectionFailed: 'データベースへの接続に失敗しました',
  DatabaseOperationFailed: 'データベース操作に失敗しました',
  
  // エクスポート関連
  ExportInitFailed: 'エクスポートの初期化に失敗しました',
  ExportRenderFailed: 'エクスポートのレンダリングに失敗しました',
  ExportEncodeFailed: 'エクスポートのエンコードに失敗しました'
};

/**
 * リソース管理用のインターフェース
 */
export interface Disposable {
  dispose(): void;
}

/**
 * プロジェクトデータ
 */
export interface ProjectData extends ProjectMetadata {
  version: string;
  videoSettings: VideoSettings;
  effects: EffectConfig[];
  audioInfo?: {
    fileName: string;
    duration: number;
    sampleRate: number;
    numberOfChannels: number;
  };
}

/**
 * プロジェクトのメタデータ
 */
export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 背景エフェクト設定
 */
export interface BackgroundEffectConfig extends BaseEffectConfig {
  type: EffectType.Background;
  backgroundType: 'color' | 'image' | 'gradient';
  color?: string;
  imageUrl?: string;
  gradientColors?: string[];
  gradientDirection?: 'horizontal' | 'vertical' | 'radial';
  fitMode?: 'cover' | 'contain' | 'fill' | 'center';
  animation?: BackgroundAnimation;
}

/**
 * テキストエフェクト設定
 */
export interface TextEffectConfig extends BaseEffectConfig {
  type: EffectType.Text;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  align: CanvasTextAlign;
  position: Position2D;
  animation?: TextAnimation;
}

/**
 * 波形エフェクト設定
 */
export interface WaveformAnimation {
  type: 'scale' | 'rotate' | 'pulse' | 'morph';
  duration: number;
  intensity: number;
  phase: number;
}

export interface WaveformEffectConfig extends BaseEffectConfig {
  type: EffectType.Waveform;
  waveformType: 'bar' | 'line' | 'circle';
  color: string;
  barWidth?: number;
  barSpacing?: number;
  mirror?: boolean;
  position: Position2D;
  size?: Size2D;
  sensitivity?: number;
  useColorBands?: boolean;
  smoothingFactor?: number;
  animation?: WaveformAnimation;
  audioSource?: AudioSource;
}

/**
 * ウォーターマークエフェクト設定
 */
export interface WatermarkEffectConfig extends BaseEffectConfig {
  type: EffectType.Watermark;
  imageUrl: string;
  position: Position2D;
  size?: Size2D;
  rotation?: number;
  tiled?: boolean;
  tileSpacing?: number;
}

export type BackgroundAnimation = FadeAnimation | ScaleAnimation | RotateAnimation;

/**
 * アプリケーション固有のエラー
 */
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
