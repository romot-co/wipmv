import { Position } from '../../../types';

/**
 * エイズを表す型
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * エフェクトの種類
 */
export type EffectType = 
  | 'background'
  | 'waveform'
  | 'text'
  | 'watermark';

/**
 * エフェクトの基本設定
 */
export interface EffectConfig {
  id: string;
  type: EffectType;
  position: Position;
  startTime?: number;
  endTime?: number;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
}

/**
 * ノードの種類
 */
export type NodeType = 
  | 'blend'
  | 'transform'
  | 'image'
  | 'text'
  | 'text-animation'
  | 'waveform-data'
  | 'waveform-style';

/**
 * ノードの基本設定
 */
export interface NodeConfig {
  type: NodeType;
  opacity?: number;
  blendMode?: GlobalCompositeOperation;
} 