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
    scale: number;
    rotation: number;
  } | null = null;

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

    // アニメーション状態の初期化
    if (config.animation) {
      this.animationState = {
        progress: 0,
        opacity: config.opacity ?? 0.5,
        scale: 1,
        rotation: config.rotation ?? 0
      };
    }

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
    if (this.config.animation && this.animationState) {
      const { animation } = this.config;
      const { startTime = 0, endTime = 0 } = this.config;
      const duration = endTime - startTime;
      
      // 進行度を計算（0-1）
      const progress = Math.max(0, Math.min((currentTime - startTime) / duration, 1));
      this.animationState.progress = progress;

      // アニメーションタイプに応じて値を更新
      switch (animation.type) {
        case 'fade':
          this.animationState.opacity = this.lerp(
            animation.from ?? 0,
            animation.to ?? 1,
            progress
          );
          break;
        case 'scale':
          this.animationState.scale = this.lerp(
            animation.from ?? 0.5,
            animation.to ?? 1.5,
            progress
          );
          break;
        case 'rotate':
          this.animationState.rotation = this.lerp(
            animation.from ?? 0,
            animation.to ?? Math.PI * 2,
            progress
          );
          break;
      }
    }
  }

  private lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  /**
   * ウォーターマークを描画
   */
  render(ctx: CanvasRenderingContext2D): void {
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

    // アニメーション状態の適用
    const effectiveOpacity = this.animationState?.opacity ?? opacity;
    const scale = this.animationState?.scale ?? 1;
    const effectiveRotation = this.animationState?.rotation ?? rotation;

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
      const scaledWidth = size.width * scale;
      const scaledHeight = size.height * scale;
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
  override dispose(): void {
    this.image = null;
    this.animationState = null;
    super.dispose();
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
} 