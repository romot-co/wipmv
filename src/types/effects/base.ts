/**
 * エフェクトタイプ
 */
export type EffectType = 'background' | 'waveform' | 'text' | 'watermark';

/**
 * 位置情報（0-1）
 */
export interface Position {
  /** X座標（0-1） */
  x: number;
  /** Y座標（0-1） */
  y: number;
}

/**
 * サイズ情報（0-1）
 */
export interface Size {
  /** 幅（0-1） */
  width: number;
  /** 高さ（0-1） */
  height: number;
}

/**
 * ブレンドモード
 */
export type BlendMode = 
  | 'source-over'
  | 'normal'
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
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

/**
 * ノードタイプ
 */
export type NodeType = 
  | 'blend'
  | 'transform'
  | 'image'
  | 'color'
  | 'text'
  | 'text-animation'
  | 'waveform-data'
  | 'waveform-style'
  | 'waveform-line'
  | 'waveform-bar'
  | 'waveform-area'
  | 'background';

/**
 * 基本ノード設定
 */
export interface BaseNodeConfig {
  /** ノードタイプ */
  type: NodeType;
}

/**
 * 基本エフェクト設定
 */
export interface BaseEffectConfig {
  /** エフェクトID */
  id: string;
  /** エフェクトタイプ */
  type: EffectType;
  /** 不透明度（0-1） */
  opacity?: number;
  /** ブレンドモード */
  blendMode?: BlendMode;
  /** 表示開始時間（秒） */
  startTime?: number;
  /** 表示終了時間（秒） */
  endTime?: number;
  /** 表示/非表示 */
  visible?: boolean;
  /** 重ね順（大きいほど手前） */
  zIndex?: number;
}

// エクスポート用のエイリアス
export type EffectConfig = BaseEffectConfig; 