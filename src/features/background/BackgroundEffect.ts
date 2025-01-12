import { EffectBase } from '../../core/EffectBase';
import { AudioVisualParameters } from '../../core/types';
import { BackgroundEffectConfig } from './types';

/**
 * 背景エフェクト
 * 単色、画像、グラデーションの背景を描画する
 */
export class BackgroundEffect extends EffectBase {
  private image?: HTMLImageElement;

  constructor(config: BackgroundEffectConfig) {
    super(config);
    this.loadImage();
  }

  private loadImage(): void {
    const config = this.config as BackgroundEffectConfig;
    if (config.backgroundType === 'image' && config.imageUrl) {
      this.image = new Image();
      this.image.src = config.imageUrl;
    }
  }

  render(parameters: AudioVisualParameters, canvas: OffscreenCanvas): void {
    if (!this.isVisible(parameters.currentTime)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = this.config as BackgroundEffectConfig;
    const { width, height } = canvas;

    switch (config.backgroundType) {
      case 'color':
        if (config.color) {
          ctx.fillStyle = config.color;
          ctx.fillRect(0, 0, width, height);
        }
        break;

      case 'image':
        if (this.image?.complete) {
          ctx.drawImage(this.image, 0, 0, width, height);
        }
        break;

      case 'gradient':
        if (config.gradient?.colors.length) {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          const colors = config.gradient.colors;
          colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
          });
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        break;
    }
  }

  dispose(): void {
    if (this.image) {
      this.image.src = '';
    }
  }
} 