import { BaseEffectConfig, Position } from './base';

/** テキストアニメーション */
export type TextAnimation = 'none' | 'fade' | 'slide';

/** テキストスタイル設定 */
export interface TextStyleConfig {
  /** フォント */
  font: string;
  /** フォントサイズ */
  fontSize: number;
  /** 文字色 */
  color: string;
  /** テキストの配置 */
  textAlign?: CanvasTextAlign;
  /** テキストのベースライン */
  textBaseline?: CanvasTextBaseline;
}

/** テキストアニメーション設定 */
export interface TextAnimationConfig {
  /** アニメーションの種類 */
  type: TextAnimation;
  /** アニメーション時間 (ms) */
  duration: number;
  /** 開始遅延時間 (ms) */
  delay?: number;
  /** イージング関数 */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

/** テキストエフェクト設定 */
export interface TextEffectConfig extends BaseEffectConfig {
  type: 'text';
  
  /** 表示するテキスト */
  text: string;
  
  /** スタイル設定 */
  style: TextStyleConfig;
  
  /** レイアウト設定 */
  layout: {
    /** 表示位置 */
    position: Position;
    /** 配置 */
    alignment?: 'left' | 'center' | 'right';
  };
  
  /** アニメーション設定 */
  animation?: TextAnimationConfig;
} 