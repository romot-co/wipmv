import { EffectBase } from '../../core/EffectBase';
import { BackgroundEffectConfig, AudioVisualParameters } from '../../core/types';

/**
 * 背景エフェクト
 * 単色、画像、グラデーションの背景を描画する
 */
export class BackgroundEffect extends EffectBase {
  protected override config: BackgroundEffectConfig;

  constructor(config: BackgroundEffectConfig) {
    super(config);
    this.config = config;
  }

  render(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    params: AudioVisualParameters
  ): void {
    if (!this.isVisible(params.currentTime)) return;

    const { width, height } = ctx.canvas;

    switch (this.config.backgroundType) {
      case 'color':
        if (this.config.color) {
          ctx.fillStyle = this.config.color;
          ctx.fillRect(0, 0, width, height);
        }
        break;

      case 'image':
        if (this.config.imageUrl) {
          // 画像の描画処理
          // TODO: 画像のロードと描画を実装
        }
        break;

      case 'gradient':
        if (this.config.gradient) {
          const { colors, angle } = this.config.gradient;
          if (colors.length < 2) break;

          // 角度に基づいて開始点と終了点を計算
          const angleRad = (angle * Math.PI) / 180;
          const cos = Math.cos(angleRad);
          const sin = Math.sin(angleRad);
          const x1 = width / 2 - cos * width / 2;
          const y1 = height / 2 - sin * height / 2;
          const x2 = width / 2 + cos * width / 2;
          const y2 = height / 2 + sin * height / 2;

          const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
          colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
          });

          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
        break;
    }
  }
} 