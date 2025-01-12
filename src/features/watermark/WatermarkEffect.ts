import { EffectBase } from '../../core/EffectBase';
import { WatermarkEffectConfig, AudioVisualParameters } from '../../core/types';

/**
 * ウォーターマークエフェクト
 * 画像をウォーターマークとして描画する
 */
export class WatermarkEffect extends EffectBase {
  protected override config: WatermarkEffectConfig;
  private image: HTMLImageElement | null = null;
  private imageLoaded = false;

  constructor(config: WatermarkEffectConfig) {
    super(config);
    this.config = config;
    this.loadImage();
  }

  private loadImage(): void {
    if (!this.config.imageUrl) {
      this.imageLoaded = false;
      this.image = null;
      return;
    }

    // 既存の画像がある場合はクリーンアップ
    if (this.image) {
      this.image.src = '';
      this.image.onload = null;
      this.image.onerror = null;
    }

    this.imageLoaded = false;
    this.image = new Image();
    
    this.image.onload = () => {
      this.imageLoaded = true;
    };

    this.image.onerror = () => {
      this.imageLoaded = false;
      this.image = null;
      console.error('Failed to load watermark image:', this.config.imageUrl);
    };

    this.image.src = this.config.imageUrl;
  }

  override updateConfig(newConfig: Partial<WatermarkEffectConfig>): void {
    super.updateConfig(newConfig);
    
    // 画像URLが変更された場合は再ロード
    if ('imageUrl' in newConfig) {
      this.loadImage();
    }
  }

  render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;
    if (!this.image?.complete || !this.imageLoaded) return;

    const { position, style } = this.config;
    const { width = this.image.width, height = this.image.height } = position;

    ctx.save();

    // スタイルの適用
    ctx.globalAlpha = style.opacity;
    if (style.blendMode) {
      ctx.globalCompositeOperation = style.blendMode;
    }

    // 位置とサイズの設定
    ctx.translate(position.x + width / 2, position.y + height / 2);
    if (position.rotation) {
      ctx.rotate(position.rotation);
    }
    if (position.scale) {
      ctx.scale(position.scale, position.scale);
    }
    ctx.translate(-width / 2, -height / 2);

    // 画像の描画
    ctx.drawImage(this.image, 0, 0, width, height);

    ctx.restore();
  }

  dispose(): void {
    if (this.image) {
      this.image.src = '';
      this.image.onload = null;
      this.image.onerror = null;
      this.image = null;
    }
  }
} 