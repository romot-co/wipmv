/**
 * 型定義のエクスポート
 */

// 基本型
export type {
  VideoSettings,
  AudioSource,
  CoordinateSystem,
  Position,
  Size,
  Rectangle,
  BoundingBox,
  Color,
  Disposable,
  BlendMode
} from './base';

export type { RenderContext } from './render';

// アニメーション関連
export type {
  EasingType,
  BaseAnimation,
  NumberAnimation,
  FadeAnimation,
  ScaleAnimation,
  RotateAnimation,
  SensitivityAnimation,
  MoveAnimation,
  ColorAnimation,
  WaveformAnimation,
  BackgroundAnimation,
  WatermarkAnimation,
  Animation
} from './animation';

// エフェクト関連
export type {
  EffectType,
  BaseEffectConfig,
  FontConfig,
  TextEffectConfig,
  BackgroundEffectConfig,
  WaveformEffectConfig,
  WatermarkEffectConfig,
  EffectConfig
} from './effect';

// エラー関連
export {
  ErrorType,
  ErrorMessages,
  AppError
} from './error';

// コア関連
export type {
  EffectBase,
  EffectManager,
  Renderer
} from './core';

// 状態管理関連
export type { AppPhase } from './state';
export type {
  AppState,
  ProjectState,
  AudioState,
  EffectState,
  UIState,
  ProgressState,
  HasAudioSource
} from './state';

// 音声解析関連
export type {
  AnalysisResult,
  AudioAnalyzer,
  AudioPlayback,
  AudioSourceControl,
  PlaybackState
} from './audio';
export { withAudioError } from './audio';
