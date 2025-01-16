import { EffectBase } from '../../core/EffectBase';
import { BackgroundEffectConfig } from '../../core/types';

interface Size2D {
  width: number;
  height: number;
}

/**
 * 背景エフェクト
 * - 単色背景
 * - 画像背景（フィットモード対応）
 * - グラデーション背景
 * - アニメーション対応
 */
export class BackgroundEffect extends EffectBase<BackgroundEffectConfig> {
  private image: HTMLImageElement | null = null;
  private animationState: {
    progress: number;
    opacity: number;
    color: string;
  } | null = null;

  constructor(config: BackgroundEffectConfig) {
    super({
      ...config,
      backgroundType: config.backgroundType ?? 'color',
      color: config.color ?? '#000000',
      opacity: config.opacity ?? 1,
      blendMode: config.blendMode ?? 'source-over'
    });

    // 画像URLが指定されている場合は読み込みを開始
    if (config.imageUrl) {
      this.loadImage(config.imageUrl).catch(error => {
        console.error('Failed to load background image:', error);
      });
    }
  }

  /**
   * 画像の読み込み
   */
  private async loadImage(url: string): Promise<void> {
    const img = new Image();
    img.src = url;
    await img.decode();
    this.image = img;
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    if (!this.isActive(currentTime)) return;

    const config = this.getConfig();
    const animation = config.animation;
    if (!animation) {
      this.animationState = null;
      return;
    }

    // アニメーションの進行度を計算
    const startTime = config.startTime ?? 0;
    const duration = animation.duration;
    const delay = animation.delay ?? 0;
    let progress = (currentTime - startTime - delay) / duration;

    // 進行度が範囲外の場合は更新しない
    if (progress < 0 || progress > 1) {
      this.animationState = null;
      return;
    }

    // イージングの適用
    progress = this.applyEasing(progress, animation.easing);

    // アニメーション状態の更新
    this.animationState = {
      progress,
      opacity: config.opacity ?? 1,
      color: config.color ?? '#000000'
    };

    // アニメーション種別ごとの処理
    let fromColor: { r: number; g: number; b: number; a: number };
    let toColor: { r: number; g: number; b: number; a: number };
    let r: number;
    let g: number;
    let b: number;
    let a: number;
    let from: number;
    let to: number;

    switch (animation.type) {
      case 'fade':
        from = animation.from ?? 0;
        to = animation.to ?? 1;
        this.animationState.opacity = from + (to - from) * progress;
        break;

      case 'color':
        if ('from' in animation && 'to' in animation) {
          fromColor = animation.from;
          toColor = animation.to;
          r = Math.round(fromColor.r + (toColor.r - fromColor.r) * progress);
          g = Math.round(fromColor.g + (toColor.g - fromColor.g) * progress);
          b = Math.round(fromColor.b + (toColor.b - fromColor.b) * progress);
          a = fromColor.a + (toColor.a - fromColor.a) * progress;
          this.animationState.color = `rgba(${r},${g},${b},${a})`;
        }
        break;
    }
  }

  /**
   * 背景を描画
   */
  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    const size = { width, height };

    ctx.save();
    try {
      // 透明度とブレンドモードの設定
      ctx.globalAlpha = this.animationState?.opacity ?? this.config.opacity ?? 1;
      ctx.globalCompositeOperation = this.config.blendMode ?? 'source-over';

      // 背景タイプに応じて描画
      if (this.image) {
        this.drawImage(ctx, size);
      } else if (this.config.gradientColors) {
        this.drawGradient(ctx, size);
      } else {
        // 単色背景
        ctx.fillStyle = this.animationState?.color ?? this.config.color ?? '#000000';
        ctx.fillRect(0, 0, width, height);
      }
    } finally {
      ctx.restore();
    }
  }

  /**
   * 画像を設定
   */
  setImage(url: string): void {
    if (!url) {
      this.image = null;
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.image = img;
    };
    img.src = url;
  }

  /**
   * 画像を描画
   */
  private drawImage(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, size: Size2D): void {
    if (!this.image) return;

    const { width, height } = size;
    const { fitMode = 'cover' } = this.config;

    const imageAspect = this.image.width / this.image.height;
    const canvasAspect = width / height;

    let dw: number;
    let dh: number;

    if (fitMode === 'cover') {
      // キャンバス全体を覆うように画像を描画
      if (canvasAspect > imageAspect) {
        // キャンバスの方が横長の場合、幅に合わせる
        dw = width;
        dh = width / imageAspect;
      } else {
        // キャンバスの方が縦長の場合、高さに合わせる
        dh = height;
        dw = height * imageAspect;
      }
    } else {
      // アスペクト比を保持しながら、キャンバス内に収める
      if (canvasAspect > imageAspect) {
        // キャンバスの方が横長の場合、高さに合わせる
        dh = height;
        dw = height * imageAspect;
      } else {
        // キャンバスの方が縦長の場合、幅に合わせる
        dw = width;
        dh = width / imageAspect;
      }
    }

    // 中央に配置
    const dx = (width - dw) / 2;
    const dy = (height - dh) / 2;

    // 画像を描画
    ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height, dx, dy, dw, dh);
  }

  /**
   * グラデーション背景の描画
   */
  private drawGradient(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, size: Size2D): void {
    const colors = this.config.gradientColors ?? ['#000000', '#ffffff'];
    const direction = this.config.gradientDirection ?? 'horizontal';

    let gradient: CanvasGradient;
    if (direction === 'horizontal') {
      gradient = ctx.createLinearGradient(0, 0, size.width, 0);
    } else {
      gradient = ctx.createLinearGradient(0, 0, 0, size.height);
    }

    // カラーストップの設定
    const stopCount = colors.length;
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (stopCount - 1), color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.width, size.height);
  }

  /**
   * イージング関数の適用
   */
  private applyEasing(progress: number, easing?: string): number {
    switch (easing) {
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return 1 - (1 - progress) * (1 - progress);
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      default:
        return progress; // linear
    }
  }

  /**
   * リソースの解放
   */
  override dispose(): void {
    this.image = null;
    this.animationState = null;
    super.dispose();
  }
} 