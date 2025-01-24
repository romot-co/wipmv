import { EffectBase } from '../../core/types/core';
import { WatermarkEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';

/**
 * ウォーターマークエフェクト
 * - 画像の表示（単一/タイル）
 * - 位置・サイズ・回転の制御
 * - ブレンドモード・不透明度の制御
 */
export class WatermarkEffect extends EffectBase<WatermarkEffectConfig> {
  private image: HTMLImageElement | null = null;
  private animationController: AnimationController | null = null;

  constructor(config: WatermarkEffectConfig) {
    super({
      ...config,
      position: config.position ?? { x: 0, y: 0 },
      size: config.size ?? { width: 200, height: 200 },
      rotation: config.rotation ?? 0,
      opacity: config.opacity ?? 0.5,
      blendMode: config.blendMode ?? 'source-over',
      repeat: config.repeat ?? false
    });

    // アニメーションコントローラーの初期化
    if (config.animation) {
      this.animationController = new AnimationController(config.animation);
    }

    // 画像URLが指定されている場合は読み込みを開始
    if (config.imageUrl) {
      this.setImage(config.imageUrl).catch(error => {
        console.error('Failed to load watermark image:', error);
      });
    }
  }

  /**
   * 画像を設定
   */
  async setImage(url: string): Promise<void> {
    if (!url) {
      this.image = null;
      return;
    }

    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      this.image = img;
    } catch (error) {
      console.error('Failed to load watermark image:', error);
      this.image = null;
      throw error;
    }
  }

  /**
   * 現在時刻に応じて内部状態を更新
   */
  update(currentTime: number): void {
    if (this.config.animation && this.animationController) {
      const { startTime = 0, endTime = Infinity } = this.config;
      const duration = endTime - startTime;
      this.animationController.update(currentTime, startTime, duration);
    }
  }

  /**
   * ウォーターマークを描画
   */
  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    if (!this.image) return;

    const { width, height } = ctx.canvas;
    const {
      position,
      size,
      rotation = 0,
      opacity = 0.5,
      blendMode = 'source-over',
      repeat = false
    } = this.config;

    // アニメーション値の適用
    const effectiveOpacity = this.animationController?.getValue<number>('opacity') ?? opacity;
    const effectiveScale = this.animationController?.getValue<number>('scale') ?? 1;
    const effectiveRotation = this.animationController?.getValue<number>('rotate') ?? rotation;

    ctx.save();
    ctx.globalAlpha = effectiveOpacity;
    ctx.globalCompositeOperation = blendMode;

    if (repeat) {
      // タイル状に描画
      const pattern = ctx.createPattern(this.image, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // 単一画像として描画
      const scaledWidth = size.width * effectiveScale;
      const scaledHeight = size.height * effectiveScale;
      const x = position.x + (size.width - scaledWidth) / 2;
      const y = position.y + (size.height - scaledHeight) / 2;

      if (effectiveRotation !== 0) {
        // 回転の中心を設定
        const centerX = x + scaledWidth / 2;
        const centerY = y + scaledHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(effectiveRotation);
        ctx.translate(-centerX, -centerY);
      }

      ctx.drawImage(this.image, x, y, scaledWidth, scaledHeight);
    }

    ctx.restore();
  }

  /**
   * リソースの解放
   */
  dispose(): void {
    this.image = null;
    this.animationController = null;
  }
} 