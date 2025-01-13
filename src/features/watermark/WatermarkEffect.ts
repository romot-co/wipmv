import { EffectBase } from '../../core/EffectBase';
import { WatermarkEffectConfig, AudioVisualParameters } from '../../core/types';
import { ImageLoader } from '../../core/ImageLoader';

export class WatermarkEffect extends EffectBase {
  private image: HTMLImageElement | null = null;
  private imageLoader: ImageLoader;

  constructor(config: WatermarkEffectConfig) {
    super(config);
    this.imageLoader = ImageLoader.getInstance();
    this.loadImage();
  }

  private async loadImage(): Promise<void> {
    const config = this.getConfig<WatermarkEffectConfig>();
    if (!config.imageUrl) {
      this.image = null;
      return;
    }
    
    try {
      // SVGの場合、Base64エンコードされたデータURLに変換
      if (config.imageUrl.startsWith('<svg')) {
        const svgBlob = new Blob([config.imageUrl], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const result = await this.imageLoader.loadImage(url);
        URL.revokeObjectURL(url);
        this.image = result?.image || null;
      } else {
        const result = await this.imageLoader.loadImage(config.imageUrl);
        this.image = result?.image || null;
      }
    } catch (error) {
      console.error('Failed to load watermark image:', error);
      this.image = null;
    }
  }

  public updateConfig(newConfig: Partial<WatermarkEffectConfig>): void {
    super.updateConfig(newConfig);
    if ('imageUrl' in newConfig) {
      this.loadImage();
    }
  }

  public render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.image || !this.isVisible(params.currentTime)) return;

    const config = this.getConfig<WatermarkEffectConfig>();
    const { position, style } = config;

    ctx.save();
    try {
      // 透明度の設定
      ctx.globalAlpha = style.opacity;

      // ブレンドモードの設定
      if (style.blendMode) {
        ctx.globalCompositeOperation = style.blendMode;
      }

      // 位置とサイズの計算
      const width = position.width || this.image.width * (position.scale || 1);
      const height = position.height || this.image.height * (position.scale || 1);
      const x = position.x;
      const y = position.y;

      // 回転の適用
      if (position.rotation) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((position.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // 画像の描画
      if (config.repeat) {
        // パターンとして繰り返し描画
        const pattern = ctx.createPattern(this.image, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(x, y, width, height);
        }
      } else {
        // 単一画像として描画
        ctx.drawImage(this.image, x, y, width, height);
      }

      // 色調の適用
      if (style.tint) {
        ctx.fillStyle = style.tint;
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(x, y, width, height);
      }
    } finally {
      ctx.restore();
    }
  }

  public dispose(): void {
    if (this.image) {
      this.image = null;
    }
    if (this.imageLoader) {
      const config = this.getConfig<WatermarkEffectConfig>();
      if (config.imageUrl) {
        this.imageLoader.removeFromCache(config.imageUrl);
      }
    }
  }
} 