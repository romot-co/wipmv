/**
 * 基本的な型定義
 */

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
  file: File | null;
  buffer: AudioBuffer | null;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  waveformData?: Float32Array[];
  frequencyData?: Float32Array[][] | Uint8Array[];
}

/**
 * 座標系
 */
export type CoordinateSystem = 'relative' | 'absolute';

/**
 * 座標とサイズの基本型
 */
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Position, Size {}

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
 * リソース管理用のインターフェース
 */
export interface Disposable {
  dispose(): void;
}

/**
 * ブレンドモード
 */
export type BlendMode = 
  | 'source-over'  // normal
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'; 
