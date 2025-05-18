/**
 * エラー関連の型定義
 */

/**
 * エラーの種類
 */
export enum ErrorType {
  // General
  GENERIC_ERROR = 'GENERIC_ERROR',
  UNKNOWN = 'unknown',

  // File/Audio Context
  FILE_LOAD_ERROR = 'file/load-error',
  AUDIO_CONTEXT_ERROR = 'audio/context-error',
  DECODE_AUDIO_DATA_ERROR = 'audio/decode-error',
  AudioDecodeFailed = 'audio/decode-failed',

  // Playback
  PLAYBACK_ERROR = 'playback/error',
  SEEK_ERROR = 'playback/seek-error',
  AudioPlaybackFailed = 'playback/failed',

  // Export Process
  EXPORT_INIT_FAILED = 'export/init-failed',
  EXPORT_RENDER_FAILED = 'export/render-failed',
  EXPORT_ENCODE_FAILED = 'export/encode-failed',
  EXPORT_FINALIZE_FAILED = 'export/finalize-failed',
  EXPORT_CANCELLED = 'export/cancelled',

  // Analysis
  AUDIO_ANALYSIS_FAILED = 'analysis/failed',

  // Effects
  EFFECT_CONFIG_INVALID = 'effect/config-invalid',
  EFFECT_NOT_FOUND = 'effect/not-found',

  // Project
  ProjectCreateFailed = 'project/create-failed',
  ProjectLoadFailed = 'project/load-failed',
  ProjectSaveFailed = 'project/save-failed',
  ProjectNotFound = 'project/not-found',
  ProjectDeleteFailed = 'project/delete-failed',

  // Renderer
  RENDERER_ERROR = 'renderer/error',

  // App State/General Operation
  INVALID_STATE = 'app/invalid-state',
  OPERATION_ABORTED = 'operation/aborted',
}

/**
 * エラーメッセージのマッピング
 */
export const ErrorMessages: { [key in ErrorType]: string } = {
  [ErrorType.GENERIC_ERROR]: '一般的なエラーが発生しました。',
  [ErrorType.UNKNOWN]: '不明なエラーが発生しました。',

  [ErrorType.FILE_LOAD_ERROR]: 'ファイルの読み込みに失敗しました。',
  [ErrorType.AUDIO_CONTEXT_ERROR]: 'オーディオコンテキストの初期化に失敗しました。',
  [ErrorType.DECODE_AUDIO_DATA_ERROR]: 'オーディオデータのデコード中にエラーが発生しました。',
  [ErrorType.AudioDecodeFailed]: 'オーディオデータのデコードに失敗しました。',

  [ErrorType.PLAYBACK_ERROR]: '再生中にエラーが発生しました。',
  [ErrorType.SEEK_ERROR]: 'シーク（再生位置の移動）中にエラーが発生しました。',
  [ErrorType.AudioPlaybackFailed]: '音声の再生に失敗しました。',

  [ErrorType.EXPORT_INIT_FAILED]: 'エクスポートの初期化に失敗しました。ブラウザが対応していないか、設定に誤りがある可能性があります。',
  [ErrorType.EXPORT_RENDER_FAILED]: 'ビデオフレームのレンダリング中にエラーが発生しました。',
  [ErrorType.EXPORT_ENCODE_FAILED]: 'エンコード中にエラーが発生しました。',
  [ErrorType.EXPORT_FINALIZE_FAILED]: 'エクスポートの最終処理に失敗しました。',
  [ErrorType.EXPORT_CANCELLED]: 'エクスポートがキャンセルされました。',

  [ErrorType.AUDIO_ANALYSIS_FAILED]: '音声解析中にエラーが発生しました。',

  [ErrorType.EFFECT_CONFIG_INVALID]: 'エフェクトの設定が無効です。',
  [ErrorType.EFFECT_NOT_FOUND]: '指定されたエフェクトが見つかりません。',

  [ErrorType.ProjectCreateFailed]: 'プロジェクトの作成に失敗しました。',
  [ErrorType.ProjectLoadFailed]: 'プロジェクトの読み込みに失敗しました。',
  [ErrorType.ProjectSaveFailed]: 'プロジェクトの保存に失敗しました。',
  [ErrorType.ProjectNotFound]: '指定されたプロジェクトが見つかりません。',
  [ErrorType.ProjectDeleteFailed]: 'プロジェクトの削除に失敗しました。',

  [ErrorType.RENDERER_ERROR]: 'レンダリング処理中にエラーが発生しました。',

  [ErrorType.INVALID_STATE]: 'アプリケーションが予期しない状態です。処理を続行できません。',
  [ErrorType.OPERATION_ABORTED]: '操作が中断されました。',
};

/**
 * アプリケーションエラー
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly cause?: unknown;

  constructor(type: ErrorType, message?: string, cause?: unknown) {
    super(message || ErrorMessages[type] || `Unknown error type: ${type}`);
    this.name = 'AppError';
    this.type = type;
    this.cause = cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}
