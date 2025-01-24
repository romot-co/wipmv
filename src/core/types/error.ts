/**
 * エラー関連の型定義
 */

/**
 * エラーの種類
 */
export enum ErrorType {
  // エフェクト関連
  EffectInitFailed = 'EffectInitFailed',
  EffectUpdateFailed = 'EffectUpdateFailed',
  EffectNotFound = 'EffectNotFound',
  EffectAlreadyExists = 'EffectAlreadyExists',
  EffectError = 'EffectError',
  
  // オーディオ関連
  AudioLoadFailed = 'AudioLoadFailed',
  AudioDecodeFailed = 'AudioDecodeFailed',
  AudioPlaybackFailed = 'AudioPlaybackFailed',
  AudioAnalysisFailed = 'AudioAnalysisFailed',
  AudioAnalysisCancelled = 'AudioAnalysisCancelled',
  
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
  EXPORT_INIT_FAILED = 'EXPORT_INIT_FAILED',
  EXPORT_RENDER_FAILED = 'EXPORT_RENDER_FAILED',
  EXPORT_ENCODE_FAILED = 'EXPORT_ENCODE_FAILED',
  EXPORT_CANCELLED = 'EXPORT_CANCELLED',
  
  // 再生エラー
  PlaybackError = 'PlaybackError',
  
  // エクスポートエラー
  ExportFailed = 'ExportFailed',
  
  // 未知のエラー
  UnknownError = 'UnknownError',
  
  // レンダラー関連
  RENDERER_INIT_FAILED = 'RENDERER_INIT_FAILED',
  RENDERER_ERROR = 'RENDERER_ERROR',
  
  // 新しいエラー
  InvalidState = 'InvalidState',
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
  EffectError: 'エフェクトでエラーが発生しました',
  
  // オーディオ関連
  AudioLoadFailed: '音声ファイルの読み込みに失敗しました',
  AudioDecodeFailed: '音声ファイルのデコードに失敗しました',
  AudioPlaybackFailed: '音声の再生に失敗しました',
  AudioAnalysisFailed: '音声の解析に失敗しました',
  AudioAnalysisCancelled: '音声解析がキャンセルされました',
  
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
  EXPORT_INIT_FAILED: 'エクスポートの初期化に失敗しました',
  EXPORT_RENDER_FAILED: 'エクスポートのレンダリングに失敗しました',
  EXPORT_ENCODE_FAILED: 'エクスポートのエンコードに失敗しました',
  EXPORT_CANCELLED: 'エクスポートがキャンセルされました',
  
  // 再生エラー
  PlaybackError: '再生中にエラーが発生しました',
  
  // エクスポートエラー
  ExportFailed: 'エクスポートに失敗しました',
  
  // 未知のエラー
  UnknownError: '未知のエラーが発生しました',
  
  // レンダラー関連
  RENDERER_INIT_FAILED: 'レンダラーの初期化に失敗しました',
  RENDERER_ERROR: 'レンダラーでエラーが発生しました',
  
  // 新しいエラー
  InvalidState: '無効な状態が検出されました',
};

/**
 * アプリケーションエラー
 */
export class AppError extends Error {
  constructor(
    public readonly type: ErrorType,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
} 