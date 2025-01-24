// src/core/types.ts
// 共有型定義

/**
 * 動画設定
 */
export interface VideoSettings {
  width: number;
  height: number;
  frameRate: number;  // fpsと同じ
  videoBitrate: number;  // bitrateと同じ
  audioBitrate: number;
}

/**
 * AudioBuffer をアプリ内部で扱う際に
 * どんな情報をまとめて持つか
 */
export interface AudioSource {
  buffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  waveformData?: Float32Array[];
  frequencyData?: Uint8Array[];
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
export type BlendMode = GlobalCompositeOperation;

export interface BaseEffectConfig {
  id: string;
  type: EffectType;
  visible?: boolean;
  zIndex?: number;
  position: Position;
  size: Size;
  coordinateSystem?: CoordinateSystem;
  opacity?: number;
  blendMode?: BlendMode;
  startTime?: number;
  endTime?: number;
  animation?: BaseAnimation;
}

/**
 * 全エフェクトの設定の共通型
 */
export type EffectConfig = 
  | BackgroundEffectConfig 
  | TextEffectConfig 
  | WaveformEffectConfig 
  | WatermarkEffectConfig;

/**
 * 座標系
 */
export type CoordinateSystem = 'relative' | 'absolute';

/**
 * 座標
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * サイズ
 */
export interface Size {
  width: number;
  height: number;
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
 * テキストアニメーション設定
 */
export type TextAnimation = 
  | { type: 'fade'; duration: number; delay?: number; easing?: EasingType; from?: number; to?: number }
  | { type: 'scale'; duration: number; delay?: number; easing?: EasingType; from: number; to: number }
  | { type: 'move'; duration: number; delay?: number; easing?: EasingType; from: Position; to: Position }
  | { type: 'rotate'; duration: number; delay?: number; easing?: EasingType; from: number; to: number }
  | { type: 'color'; duration: number; delay?: number; easing?: EasingType; from: string; to: string };

/**
 * テキストエフェクト設定
 */
export interface TextEffectConfig extends BaseEffectConfig {
  type: EffectType.Text;
  text: string;
  font?: {
    family: string;
    size: number;
    weight?: number | string;
  };
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  color: string;
  position: Position;
  alignment?: 'left' | 'center' | 'right';
  animation?: TextAnimation;
}

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
  waveformData?: Float32Array[] | null;
  frequencyData?: Uint8Array[] | null;
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
  ExportEncodeFailed = 'ExportEncodeFailed',
  
  // 再生エラー
  PlaybackError = 'PlaybackError',
  
  // エクスポートエラー
  ExportFailed = 'ExportFailed',
  
  // 未知のエラー
  UnknownError = 'UnknownError'
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
  ExportEncodeFailed: 'エクスポートのエンコードに失敗しました',
  
  // 再生エラー
  PlaybackError: '再生中にエラーが発生しました',
  
  // エクスポートエラー
  ExportFailed: 'エクスポートに失敗しました',
  
  // 未知のエラー
  UnknownError: '未知のエラーが発生しました'
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
export interface ProjectData {
  id: string;
  name: string;
  videoSettings: VideoSettings;
  effects: EffectConfig[];
  audioBuffer: AudioBuffer | null;
  createdAt: number;
  updatedAt: number;
}

/**
 * アプリケーションエラー
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

/**
 * プロジェクトのメタデータ
 */
export interface ProjectMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * 背景エフェクト設定
 */
export interface BackgroundEffectConfig extends BaseEffectConfig {
  type: EffectType.Background;
  backgroundType: 'solid' | 'gradient' | 'image';
  color?: string;
  gradientColors?: [string, string];
  gradientDirection?: number;
  imageUrl?: string;
  imageSize?: 'cover' | 'contain' | 'stretch';
  imagePosition?: Position;
}

/**
 * 波形エフェクト設定
 */
export interface WaveformAnimation extends BaseAnimation {
  type: 'fade' | 'scale' | 'sensitivity' | 'color';
  from?: number | string;
  to?: number | string;
}

export interface WaveformEffectConfig extends BaseEffectConfig {
  type: EffectType.Waveform;
  displayMode: 'waveform' | 'frequency';
  waveformType: 'bar' | 'line' | 'circle';
  barWidth: number;
  barGap: number;
  sensitivity: number;
  color: string;
  smoothingFactor: number;
  mirror: { vertical: boolean; horizontal: boolean };
  channelMode: 'mono' | 'stereo' | 'leftOnly' | 'rightOnly';
  windowSeconds: number;
  samplesPerSecond: number;
  useColorBands?: boolean;
  colorBands?: {
    ranges: Array<{
      min: number;
      max: number;
      color: string;
    }>;
  };
}

/**
 * ウォーターマークエフェクト設定
 */
export interface WatermarkAnimation extends BaseAnimation {
  type: 'fade' | 'scale' | 'rotate';
  from?: number;
  to?: number;
}

export interface WatermarkEffectConfig extends BaseEffectConfig {
  type: EffectType.Watermark;
  imageUrl?: string;
  rotation?: number;
  repeat?: boolean;
}

export type BackgroundAnimation = FadeAnimation | ScaleAnimation | RotateAnimation | ColorAnimation;
