import { Animation, EasingType } from '../types/animation';
import { Color, Position } from '../types/base';

/**
 * アニメーション制御クラス
 */
export class AnimationController {
  private startTime: number = 0;
  private isPlaying: boolean = false;
  private animation: Animation | null = null;

  constructor(animation?: Animation) {
    if (animation) {
      this.setAnimation(animation);
    }
  }

  /**
   * アニメーションを設定
   */
  setAnimation(animation: Animation | null): void {
    this.animation = animation;
    this.startTime = 0;
    this.isPlaying = false;
  }

  /**
   * アニメーションを開始
   */
  start(currentTime: number): void {
    if (!this.animation || this.isPlaying) return;
    this.startTime = currentTime - (this.animation.delay || 0);
    this.isPlaying = true;
  }

  /**
   * アニメーションを停止
   */
  stop(): void {
    this.isPlaying = false;
  }

  /**
   * アニメーションをリセット
   */
  reset(): void {
    this.startTime = 0;
    this.isPlaying = false;
  }

  /**
   * アニメーション値を更新
   */
  update(currentTime: number, startTime: number, duration: number): void {
    if (!this.animation) return;
    
    if (!this.isPlaying) {
      this.start(startTime);
    }
    
    if (currentTime >= startTime + duration) {
      this.stop();
    }
  }

  /**
   * アニメーション値を取得
   */
  getValue<T extends number | Position | Color>(propertyName: string): T | null {
    if (!this.animation || !this.isPlaying) return null;

    const value = this.getCurrentValue();
    if (!value) return null;

    switch (propertyName) {
      case 'opacity':
      case 'scale':
      case 'rotate':
      case 'sensitivity':
        return value as T;
      case 'position':
        return value as T;
      case 'color':
        return value as T;
      default:
        return null;
    }
  }

  /**
   * 現在の値を取得
   */
  private getCurrentValue(): number | Position | Color | null {
    if (!this.animation || !this.isPlaying) return null;

    const elapsed = performance.now() - this.startTime;
    const duration = this.animation.duration;
    
    // 遅延時間中は開始値を返す
    if (elapsed < (this.animation.delay || 0)) {
      return this.getInitialValue();
    }

    // アニメーション終了後は最終値を返す
    if (elapsed >= duration + (this.animation.delay || 0)) {
      this.isPlaying = false;
      return this.getFinalValue();
    }

    // 進行度を計算
    let progress = (elapsed - (this.animation.delay || 0)) / duration;
    
    // イージング関数を適用
    progress = this.applyEasing(progress, this.animation.easing);

    return this.interpolate(progress);
  }

  /**
   * 初期値を取得
   */
  private getInitialValue(): number | Position | Color {
    if (!this.animation) throw new Error('Animation is not set');

    const from = this.animation.from;
    if (from === undefined) throw new Error('Initial value is not set');

    switch (this.animation.type) {
      case 'move':
        if (typeof from !== 'object' || !('x' in from) || !('y' in from)) {
          throw new Error('Invalid position value');
        }
        return from;
      case 'color':
        if (typeof from !== 'object' || !('r' in from) || !('g' in from) || !('b' in from)) {
          throw new Error('Invalid color value');
        }
        return from;
      case 'fade':
      case 'scale':
      case 'rotate':
      case 'sensitivity':
        if (typeof from !== 'number') {
          throw new Error('Invalid number value');
        }
        return from;
      default:
        throw new Error('Invalid animation type');
    }
  }

  /**
   * 最終値を取得
   */
  private getFinalValue(): number | Position | Color {
    if (!this.animation) throw new Error('Animation is not set');

    const to = this.animation.to;
    if (to === undefined) throw new Error('Final value is not set');

    switch (this.animation.type) {
      case 'move':
        if (typeof to !== 'object' || !('x' in to) || !('y' in to)) {
          throw new Error('Invalid position value');
        }
        return to;
      case 'color':
        if (typeof to !== 'object' || !('r' in to) || !('g' in to) || !('b' in to)) {
          throw new Error('Invalid color value');
        }
        return to;
      case 'fade':
      case 'scale':
      case 'rotate':
      case 'sensitivity':
        if (typeof to !== 'number') {
          throw new Error('Invalid number value');
        }
        return to;
      default:
        throw new Error('Invalid animation type');
    }
  }

  /**
   * 値を補間
   */
  private interpolate(progress: number): number | Position | Color {
    if (!this.animation) throw new Error('Animation is not set');

    const from = this.getInitialValue();
    const to = this.getFinalValue();

    switch (this.animation.type) {
      case 'move': {
        const fromPos = from as Position;
        const toPos = to as Position;
        if (!fromPos || !toPos || typeof fromPos.x !== 'number' || typeof fromPos.y !== 'number' ||
            typeof toPos.x !== 'number' || typeof toPos.y !== 'number') {
          throw new Error('Invalid position value');
        }
        return {
          x: this.lerp(fromPos.x, toPos.x, progress),
          y: this.lerp(fromPos.y, toPos.y, progress)
        };
      }
      case 'color': {
        const fromColor = from as Color;
        const toColor = to as Color;
        if (!fromColor || !toColor || typeof fromColor.r !== 'number' || typeof fromColor.g !== 'number' ||
            typeof fromColor.b !== 'number' || typeof toColor.r !== 'number' || typeof toColor.g !== 'number' ||
            typeof toColor.b !== 'number') {
          throw new Error('Invalid color value');
        }
        return {
          r: Math.round(this.lerp(fromColor.r, toColor.r, progress)),
          g: Math.round(this.lerp(fromColor.g, toColor.g, progress)),
          b: Math.round(this.lerp(fromColor.b, toColor.b, progress)),
          a: this.lerp(fromColor.a ?? 1, toColor.a ?? 1, progress)
        };
      }
      case 'fade':
      case 'scale':
      case 'rotate':
      case 'sensitivity': {
        const fromNum = from as number;
        const toNum = to as number;
        if (typeof fromNum !== 'number' || typeof toNum !== 'number') {
          throw new Error('Invalid number value');
        }
        return this.lerp(fromNum, toNum, progress);
      }
      default:
        throw new Error('Invalid animation type');
    }
  }

  /**
   * 線形補間
   */
  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * イージング関数を適用
   */
  private applyEasing(progress: number, easing: EasingType = 'linear'): number {
    switch (easing) {
      case 'linear':
        return progress;
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return progress * (2 - progress);
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      default:
        return progress;
    }
  }
}
