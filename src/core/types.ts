// src/core/types.ts
// 共有型定義

/**
 * AudioBuffer をアプリ内部で扱う際に
 * どんな情報をまとめて持つか
 */
export interface AudioSource {
  /** デコード済み AudioBuffer */
  buffer: AudioBuffer;
  /** サンプリングレート */
  sampleRate: number;
  /** チャンネル数 */
  numberOfChannels: number;
  /** 再生総時間(秒) */
  duration: number;
  /** ファイル名など補足情報 */
  fileName?: string;
}

/**
 * ファイルを decode した結果をまとめた例
 */
export interface DecodeResult {
  buffer: AudioBuffer;
  sampleRate: number;
  numberOfChannels: number;
  duration: number;
}

/**
 * 基本的な列挙型
 * - エフェクトの種類
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
  id: string;         // エフェクトの一意のID
  type: EffectType;   // エフェクト種別
  visible: boolean;   // 表示非表示
  startTime?: number; // 表示開始時刻(秒)
  endTime?: number;   // 表示終了時刻(秒)
  zIndex: number;     // レイヤ順
  duration?: number;
}

/**
 * オーディオビジュアルパラメータ
 * - 描画処理に渡す情報
 */
export interface AudioVisualParameters {
  currentTime: number;     // 現在時刻(秒)
  duration: number;        // 全体の尺(秒)
  waveformData?: Float32Array;   // 波形データ(オプション)
  frequencyData?: Uint8Array;   // 周波数データ(オプション)
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
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  colors: {
    primary: string;
    secondary?: string;
    background?: string;
  };
  options?: {
    barWidth?: number;
    barSpacing?: number;
    smoothing?: number;
    style?: 'line' | 'bar' | 'mirror';
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

/**
 * エフェクト全体のUnion型
 * - どのエフェクトかを一元的に表す
 */
export type EffectConfig =
  | BackgroundEffectConfig
  | TextEffectConfig
  | WaveformEffectConfig
  | WatermarkEffectConfig;

/**
 * エンコーダー関連
 */
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

/**
 * エラー処理
 */
export enum ErrorType {
  EffectInitFailed = 'EffectInitFailed',
  EffectNotFound = 'EffectNotFound',
  EffectAlreadyExists = 'EffectAlreadyExists',
  EffectUpdateFailed = 'EffectUpdateFailed',
  AudioDecodeFailed = 'AudioDecodeFailed',
  ExportInitFailed = 'ExportInitFailed',
  ExportEncodeFailed = 'ExportEncodeFailed',
  ExportCanceled = 'ExportCanceled',
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
  [ErrorType.EffectInitFailed]: 'エフェクトの初期化に失敗しました',
  [ErrorType.EffectNotFound]: 'エフェクトが見つかりません',
  [ErrorType.EffectAlreadyExists]: '指定されたIDのエフェクトは既に存在します',
  [ErrorType.EffectUpdateFailed]: 'エフェクトの更新に失敗しました',
  [ErrorType.AudioDecodeFailed]: '音声ファイルのデコードに失敗しました',
  [ErrorType.ExportInitFailed]: 'エクスポートの初期化に失敗しました',
  [ErrorType.ExportEncodeFailed]: 'エクスポートのエンコードに失敗しました',
  [ErrorType.ExportCanceled]: 'エクスポートをキャンセルしました',
};

/**
 * EffectBase (共通機能を継承するための抽象クラス)
 * - 実際には src/core/EffectBase.ts に実装を置く
 */
export abstract class EffectBase {
  protected config: EffectConfig;

  constructor(config: EffectConfig) {
    this.config = config;
  }

  getConfig(): EffectConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<EffectConfig>): void {
    this.config = { ...this.config, ...newConfig } as EffectConfig;
  }

  /**
   * 表示状態をチェック（startTime, endTime, visible）
   */
  isVisible(currentTime: number): boolean {
    if (!this.config.visible) return false;
    if (this.config.startTime === undefined && this.config.endTime === undefined) {
      return true;
    }
    if (this.config.startTime !== undefined && currentTime < this.config.startTime) {
      return false;
    }
    if (this.config.endTime !== undefined && currentTime > this.config.endTime) {
      return false;
    }
    return true;
  }

  /**
   * エフェクトのz-indexを取得
   */
  getZIndex(): number {
    return this.config.zIndex;
  }

  /**
   * 派生クラスで個別実装するCanvas描画処理
   */
  abstract render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void;
}

/**
 * InspectorProps
 * - UIでのエフェクト編集用
 */
export interface InspectorProps {
  effect: EffectBase | undefined;
  onChange: (newConfig: Partial<EffectConfig>) => void;
}

export interface Disposable {
  dispose(): void;
}

export type { BaseEffectState } from './EffectBase';
