import { BaseEffectNode } from '../base/BaseEffectNode';
import { AudioVisualParameters } from '../../../../types/audio';
import { BaseNodeConfig } from '../../../../types/effects/base';

export type TextAnimation = 'none' | 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut';

export interface TextAnimationOptions {
  animation: TextAnimation;
  startTime: number;
  endTime: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  slideDistance?: number;
}

export interface TextAnimationNodeConfig extends BaseNodeConfig {
  type: 'text-animation';
  animation: TextAnimation;
  startTime: number;
  endTime: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  slideDistance: number;
}

/**
 * テキストのアニメーションを処理するノード
 */
export class TextAnimationNode extends BaseEffectNode {
  private readonly animation: TextAnimation;
  private readonly startTime: number;
  private readonly endTime: number;
  private readonly fadeInDuration: number;
  private readonly fadeOutDuration: number;
  private readonly slideDistance: number;

  constructor(options: TextAnimationOptions) {
    super();
    this.animation = options.animation;
    this.startTime = options.startTime;
    this.endTime = options.endTime;
    this.fadeInDuration = options.fadeInDuration ?? 500;
    this.fadeOutDuration = options.fadeOutDuration ?? 500;
    this.slideDistance = options.slideDistance ?? 100;
  }

  protected onInitialize(): void {
    // 初期化は不要
  }

  process(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTime = parameters.currentTime;
    
    // 表示時間外の場合はスキップ
    if (currentTime < this.startTime || currentTime > this.endTime) {
      return;
    }

    ctx.save();

    // アニメーション効果の適用
    let opacity = 1;
    let offsetX = 0;
    const offsetY = 0;

    switch (this.animation) {
      case 'fadeIn':
        opacity = this.calculateFadeIn(currentTime);
        break;
      case 'fadeOut':
        opacity = this.calculateFadeOut(currentTime);
        break;
      case 'slideIn':
        offsetX = this.calculateSlideIn(currentTime);
        break;
      case 'slideOut':
        offsetX = this.calculateSlideOut(currentTime);
        break;
    }

    // 変換の適用
    ctx.globalAlpha = opacity;
    ctx.translate(offsetX, offsetY);

    // 次のノードに処理を渡す
    this.passToNext(parameters, canvas);

    ctx.restore();
  }

  private calculateFadeIn(currentTime: number): number {
    const elapsed = currentTime - this.startTime;
    return Math.min(1, elapsed / this.fadeInDuration);
  }

  private calculateFadeOut(currentTime: number): number {
    const remaining = this.endTime - currentTime;
    return Math.min(1, remaining / this.fadeOutDuration);
  }

  private calculateSlideIn(currentTime: number): number {
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(1, elapsed / this.fadeInDuration);
    return this.slideDistance * (1 - progress);
  }

  private calculateSlideOut(currentTime: number): number {
    const remaining = this.endTime - currentTime;
    const progress = Math.min(1, remaining / this.fadeOutDuration);
    return this.slideDistance * (1 - progress);
  }

  dispose(): void {
    // リソースの解放は不要
  }

  getConfig(): TextAnimationNodeConfig {
    return {
      type: 'text-animation',
      animation: this.animation,
      startTime: this.startTime,
      endTime: this.endTime,
      fadeInDuration: this.fadeInDuration,
      fadeOutDuration: this.fadeOutDuration,
      slideDistance: this.slideDistance
    };
  }
} 