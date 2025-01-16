import { EffectBase } from '../../core/EffectBase';
import { WatermarkEffectConfig } from '../../core/types';

/**
 * ウォーターマークエフェクト
 * - 画像の表示（単一/タイル）
 * - 位置・サイズ・回転の制御
 * - ブレンドモード・不透明度の制御
 */
export class WatermarkEffect extends EffectBase<WatermarkEffectConfig> {
  private image: HTMLImageElement | null = null;
  private animationState: {
    progress: number;
    opacity: number;
    rotation: number;
    scale: number;
  } | null = null;

  constructor(config: WatermarkEffectConfig) {
    super({
      ...config,
      position: config.position ?? { x: 0, y: 0 },
      size: config.size ?? { width: 200, height: 200 },
      rotation: config.rotation ?? 0,
      opacity: config.opacity ?? 0.5,
      blendMode: config.blendMode ?? 'source-over',
      tiled: config.tiled ?? false
    });

    // 画像URLが指定されている場合は読み込みを開始
    if (config.imageUrl) {
      this.loadImage(config.imageUrl).catch(error => {
        console.error('Failed to load watermark image:', error);
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
    if (!config.animation) {
      this.animationState = null;
      return;
    }

    // アニメーションの進行度を計算
    const startTime = config.startTime ?? 0;
    const duration = config.animation.duration;
    const delay = config.animation.delay ?? 0;
    let progress = (currentTime - startTime - delay) / duration;

    // 進行度が範囲外の場合は更新しない
    if (progress < 0 || progress > 1) {
      this.animationState = null;
      return;
    }

    // イージングの適用
    progress = this.applyEasing(progress, config.animation.easing);

    // アニメーション状態の更新
    this.animationState = {
      progress,
      opacity: config.opacity ?? 0.5,
      rotation: config.rotation ?? 0,
      scale: 1
    };

    // アニメーション種別ごとの処理
    let from: number;
    let to: number;

    switch (config.animation.type) {
      case 'fade':
        from = config.animation.from ?? 0;
        to = config.animation.to ?? 1;
        this.animationState.opacity = from + (to - from) * progress;
        break;

      case 'rotate':
        from = config.animation.from ?? 0;
        to = config.animation.to ?? 360;
        this.animationState.rotation = (from + (to - from) * progress) * Math.PI / 180;
        break;

      case 'scale':
        from = config.animation.from ?? 0.5;
        to = config.animation.to ?? 1.5;
        this.animationState.scale = from + (to - from) * progress;
        break;
    }
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
   * ウォーターマークを描画
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.image) return;

    const config = this.getConfig();

    ctx.save();
    try {
      // 共通の描画設定
      ctx.globalAlpha = this.animationState?.opacity ?? config.opacity ?? 0.5;
      ctx.globalCompositeOperation = config.blendMode ?? 'source-over';

      if (config.tiled) {
        // タイル表示の場合
        this.drawTiledImage(ctx, ctx.canvas.width, ctx.canvas.height);
      } else {
        // 単一表示の場合
        this.drawSingleImage(ctx);
      }
    } finally {
      ctx.restore();
    }
  }

  /**
   * 単一画像の描画
   */
  private drawSingleImage(ctx: CanvasRenderingContext2D): void {
    if (!this.image) return;

    const config = this.getConfig();
    const size = config.size ?? { width: 200, height: 200 };
    const scale = this.animationState?.scale ?? 1;
    const rotation = this.animationState?.rotation ?? config.rotation ?? 0;
    const { x, y } = config.position;
    const { width, height } = size;

    // 中心を基準に回転・スケール
    ctx.translate(x + width / 2, y + height / 2);
    if (rotation !== 0) ctx.rotate(rotation);
    if (scale !== 1) ctx.scale(scale, scale);
    ctx.translate(-(x + width / 2), -(y + height / 2));

    // 画像を描画
    ctx.drawImage(this.image, x, y, width, height);
  }

  /**
   * タイル画像の描画
   */
  private drawTiledImage(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    if (!this.image) return;

    const config = this.getConfig();
    const size = config.size ?? { width: 200, height: 200 };
    const { width, height } = size;
    const scale = this.animationState?.scale ?? 1;
    const rotation = this.animationState?.rotation ?? config.rotation ?? 0;

    // パターンの作成
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = width;
    patternCanvas.height = height;
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return;

    // パターン用キャンバスに画像を描画
    patternCtx.drawImage(this.image, 0, 0, width, height);

    // パターンの作成と変形の適用
    const pattern = ctx.createPattern(patternCanvas, 'repeat');
    if (!pattern) return;

    // 変形行列の作成
    const matrix = new DOMMatrix();
    if (rotation !== 0) matrix.rotateSelf(rotation * 180 / Math.PI);
    if (scale !== 1) matrix.scaleSelf(scale, scale);
    pattern.setTransform(matrix);

    // パターンを適用して描画
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
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