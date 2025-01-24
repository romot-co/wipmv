/**
 * 座標変換ユーティリティ
 * - 相対座標と絶対座標の変換
 * - サイズの変換
 * - 矩形の変換
 * - リサイズ時の更新処理
 */

import { Position, Size, CoordinateSystem } from '../core/types/base';

/**
 * 座標を変換
 * - 相対座標 (0-1) と絶対座標 (ピクセル) の相互変換
 */
export function convertPosition(
  position: Position,
  fromSystem: CoordinateSystem,
  toSystem: CoordinateSystem,
  canvasSize: { width: number; height: number }
): Position {
  if (fromSystem === toSystem) return position;

  if (fromSystem === 'relative' && toSystem === 'absolute') {
    // 相対座標 -> 絶対座標
    return {
      x: position.x * canvasSize.width,
      y: position.y * canvasSize.height,
    };
  } else {
    // 絶対座標 -> 相対座標
    return {
      x: position.x / canvasSize.width,
      y: position.y / canvasSize.height,
    };
  }
}

/**
 * サイズを変換
 * - 相対サイズ (0-1) と絶対サイズ (ピクセル) の相互変換
 */
export function convertSize(
  size: Size,
  fromSystem: CoordinateSystem,
  toSystem: CoordinateSystem,
  canvasSize: { width: number; height: number }
): Size {
  if (fromSystem === toSystem) return size;

  if (fromSystem === 'relative' && toSystem === 'absolute') {
    // 相対サイズ -> 絶対サイズ
    return {
      width: size.width * canvasSize.width,
      height: size.height * canvasSize.height,
    };
  } else {
    // 絶対サイズ -> 相対サイズ
    return {
      width: size.width / canvasSize.width,
      height: size.height / canvasSize.height,
    };
  }
}

/**
 * 矩形を変換
 * - 位置とサイズを一括で変換
 */
export function convertRect(
  position: Position,
  size: Size,
  fromSystem: CoordinateSystem,
  toSystem: CoordinateSystem,
  canvasSize: { width: number; height: number }
): { position: Position; size: Size } {
  return {
    position: convertPosition(position, fromSystem, toSystem, canvasSize),
    size: convertSize(size, fromSystem, toSystem, canvasSize),
  };
}

/**
 * リサイズ時の座標とサイズを更新
 * - 相対座標の場合はそのまま
 * - 絶対座標の場合は新しいキャンバスサイズに合わせて更新
 */
export function updateRectForResize(
  position: Position,
  size: Size,
  system: CoordinateSystem,
  oldCanvasSize: { width: number; height: number },
  newCanvasSize: { width: number; height: number }
): { position: Position; size: Size } {
  if (system === 'relative') return { position, size };

  // 一旦相対座標に変換
  const relativeRect = convertRect(
    position,
    size,
    'absolute',
    'relative',
    oldCanvasSize
  );

  // 新しいキャンバスサイズで絶対座標に戻す
  return convertRect(
    relativeRect.position,
    relativeRect.size,
    'relative',
    'absolute',
    newCanvasSize
  );
}

/**
 * 座標が有効か検証
 */
export function isValidPosition(position: Position, system: CoordinateSystem): boolean {
  if (system === 'relative') {
    return position.x >= 0 && position.x <= 1 && position.y >= 0 && position.y <= 1;
  }
  return position.x >= 0 && position.y >= 0;
}

/**
 * サイズが有効か検証
 */
export function isValidSize(size: Size, system: CoordinateSystem): boolean {
  if (system === 'relative') {
    return size.width >= 0 && size.width <= 1 && size.height >= 0 && size.height <= 1;
  }
  return size.width >= 0 && size.height >= 0;
} 