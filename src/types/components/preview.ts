import { Position, Size } from '../common';
import { AudioSource } from '../core';
import { VisualEffectConfig } from '../effects';
import { EffectType } from '../effects/base';
import { VisualEffect } from '../effects';

/**
 * プレビュープレイヤーのプロパティ
 */
export interface PreviewPlayerProps {
  /** 現在の再生時間（ミリ秒） */
  currentTime: number;
  /** 総再生時間（ミリ秒） */
  duration: number;
  /** 再生中かどうか */
  isPlaying: boolean;
  /** オーディオバッファ */
  audioBuffer: AudioBuffer | null;
  /** エフェクトリスト */
  effects: VisualEffect[];
  /** 選択中のエフェクトタイプ */
  selectedEffectType: EffectType | null;
  /** 再生/一時停止の切り替え */
  onPlayPause: () => void;
  /** 再生時間の更新 */
  onTimeUpdate: (time: number) => void;
  /** オーディオファイルのドロップ */
  onDrop: (file: File) => Promise<void>;
  /** キャンバスの初期化 */
  onCanvasInit: (canvas: HTMLCanvasElement, width: number, height: number) => void;
  /** エフェクトの選択 */
  onSelectEffect: (type: EffectType | null) => void;
}

export interface BoundingBoxProps {
  initialPosition: Position;
  initialSize: Size;
  onPositionChange: (position: Position) => void;
  onSizeChange: (size: Size) => void;
  onSelect: () => void;
  isSelected: boolean;
  lockHorizontal?: boolean;
  lockVertical?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
} 