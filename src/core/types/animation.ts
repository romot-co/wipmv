import { Position, Color } from './base';

/**
 * アニメーション関連の型定義
 */

/**
 * アニメーションのイージング関数の種類
 */
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

/**
 * アニメーション設定の基本型
 */
export interface BaseAnimation {
  type: 'color' | 'move' | 'scale' | 'rotate' | 'sensitivity' | 'fade' | 'number';
  from?: number | Position | Color;
  to?: number | Position | Color;
  delay?: number;
  duration: number;
  easing?: EasingType;
}

/**
 * 数値アニメーション
 */
export interface NumberAnimation extends BaseAnimation {
  type: 'number';
  from: number;
  to: number;
}

/**
 * フェードアニメーション
 */
export interface FadeAnimation extends BaseAnimation {
  type: 'fade';
  from: number;
  to: number;
}

/**
 * スケールアニメーション
 */
export interface ScaleAnimation extends BaseAnimation {
  type: 'scale';
  from: number;
  to: number;
}

/**
 * 回転アニメーション
 */
export interface RotateAnimation extends BaseAnimation {
  type: 'rotate';
  from: number;
  to: number;
}

/**
 * 感度アニメーション
 */
export interface SensitivityAnimation extends BaseAnimation {
  type: 'sensitivity';
  from: number;
  to: number;
}

/**
 * 移動アニメーション
 */
export interface MoveAnimation extends BaseAnimation {
  type: 'move';
  from: Position;
  to: Position;
}

/**
 * 色アニメーション
 */
export interface ColorAnimation extends BaseAnimation {
  type: 'color';
  from: Color;
  to: Color;
}

/**
 * 波形エフェクト用アニメーション
 */
export interface WaveformAnimation extends BaseAnimation {
  type: 'fade' | 'scale' | 'sensitivity' | 'color';
  from?: number | Color;
  to?: number | Color;
}

/**
 * 背景エフェクト用アニメーション
 */
export type BackgroundAnimation = 
  | FadeAnimation 
  | ScaleAnimation 
  | RotateAnimation 
  | ColorAnimation;

/**
 * ウォーターマークエフェクト用アニメーション
 */
export interface WatermarkAnimation extends BaseAnimation {
  type: 'fade' | 'scale' | 'rotate';
  from?: number;
  to?: number;
}

/**
 * アニメーションの共通型
 */
export type Animation = 
  | NumberAnimation
  | FadeAnimation
  | ScaleAnimation
  | RotateAnimation
  | SensitivityAnimation
  | MoveAnimation
  | ColorAnimation
  | WaveformAnimation
  | WatermarkAnimation; 
