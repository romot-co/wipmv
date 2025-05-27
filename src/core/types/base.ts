/**
 * 基本的な型定義
 */

/**
 * 動画設定 (webcodecs-encoder対応)
 */
export interface VideoSettings {
  width: number;
  height: number;
  frameRate: number;
  videoBitrate: number;
  audioBitrate: number;
  // WebCodecs Encoder固有の設定
  codec?: {
    video?: 'avc' | 'hevc' | 'vp8' | 'vp9' | 'av1';
    audio?: 'aac' | 'opus';
  };
  container?: 'mp4' | 'webm';
  latencyMode?: 'quality' | 'realtime';
  sampleRate?: number;
  channels?: number;
  hardwareAcceleration?: 'no-preference' | 'prefer-hardware' | 'prefer-software';
  codecString?: {
    video?: string;
    audio?: string;
  };
  audioEncoderConfig?: {
    bitrateMode?: 'constant' | 'variable';
  };
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
