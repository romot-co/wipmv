/**
 * ビデオエンコーダーの設定
 */
export interface VideoEncoderConfig {
  // 基本設定
  width: number;
  height: number;
  frameRate: number;
  
  // エンコード設定
  codec: 'vp8' | 'vp9' | 'h264' | 'h265';
  bitrate: number;
  
  // 品質設定
  quality?: number; // 0-1の範囲
  keyFrameInterval?: number; // キーフレームの間隔（秒）
  
  // プリセット
  preset?: 'fast' | 'balanced' | 'quality';
}

/**
 * オーディオエンコーダーの設定
 */
export interface AudioEncoderConfig {
  // 基本設定
  sampleRate: number;
  channels: number;
  
  // エンコード設定
  codec: 'aac' | 'opus' | 'vorbis';
  bitrate: number;
  
  // 品質設定
  quality?: number; // 0-1の範囲
}

/**
 * 出力フォーマットの設定
 */
export interface OutputConfig {
  // コンテナフォーマット
  container: 'mp4' | 'webm' | 'mkv';
  
  // メタデータ
  metadata?: {
    title?: string;
    artist?: string;
    date?: string;
    comment?: string;
  };
}

/**
 * エンコード設定のプリセット
 */
export const encoderPresets = {
  // 高品質プリセット
  highQuality: {
    video: {
      codec: 'h264',
      bitrate: 8000000, // 8Mbps
      quality: 0.9,
      keyFrameInterval: 2,
      preset: 'quality'
    } as VideoEncoderConfig,
    audio: {
      codec: 'aac',
      bitrate: 320000, // 320kbps
      quality: 0.9
    } as AudioEncoderConfig
  },
  
  // バランス型プリセット
  balanced: {
    video: {
      codec: 'h264',
      bitrate: 4000000, // 4Mbps
      quality: 0.7,
      keyFrameInterval: 2,
      preset: 'balanced'
    } as VideoEncoderConfig,
    audio: {
      codec: 'aac',
      bitrate: 192000, // 192kbps
      quality: 0.7
    } as AudioEncoderConfig
  },
  
  // 軽量プリセット
  lightweight: {
    video: {
      codec: 'h264',
      bitrate: 2000000, // 2Mbps
      quality: 0.5,
      keyFrameInterval: 3,
      preset: 'fast'
    } as VideoEncoderConfig,
    audio: {
      codec: 'aac',
      bitrate: 128000, // 128kbps
      quality: 0.5
    } as AudioEncoderConfig
  }
}; 