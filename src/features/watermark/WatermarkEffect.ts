import { EffectBase } from '../../core/types/core';
import { WatermarkEffectConfig } from '../../core/types/effect';
import { AnimationController } from '../../core/animation/AnimationController';
import { convertRect } from '../../utils/coordinates';

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
    console.log('WatermarkEffect: Initializing with config:', config);
    super({
      ...config,
      position: config.position ?? { x: 0, y: 0 },
      size: config.size ?? { width: 200, height: 200 },
      rotation: config.rotation ?? 0,
      opacity: config.opacity ?? 0.5,
      blendMode: config.blendMode ?? 'source-over',
      repeat: config.repeat ?? false
    }, true);

    // アニメーションコントローラーの初期化
    if (config.animation) {
      this.animationController = new AnimationController(config.animation);
    }

    // 画像URLが指定されている場合は読み込みを開始
    if (config.imageUrl) {
      console.log('WatermarkEffect: Image URL provided, loading image:', config.imageUrl);
      this.setImage(config.imageUrl).catch(error => {
        console.error('Failed to load watermark image:', error);
      });
    } else {
      console.log('WatermarkEffect: No image URL provided in config');
    }
  }

  /**
   * 画像を設定
   */
  async setImage(url: string): Promise<void> {
    console.log('WatermarkEffect.setImage called with URL:', url);
    if (!url) {
      console.log('WatermarkEffect: Empty URL provided, setting image to null');
      this.image = null;
      return;
    }

    try {
      const img = new Image();
      console.log('WatermarkEffect: Creating image element for:', url);
      img.src = url;
      await img.decode();
      console.log('WatermarkEffect: Image loaded successfully:', url);
      this.image = img;
    } catch (error) {
      console.error('Failed to load watermark image:', error);
      this.image = null;
      throw error;
    }
  }

  /**
   * 毎フレームの状態更新（必要であればアニメーションなどを処理）
   */
  update(currentTime: number): void {
    // 表示状態を更新
    this.visible = this.isActive(currentTime);
    if (!this.visible) return;

    // アニメーションコントローラーの更新
    if (this.config.animation && this.animationController) {
      const { startTime = 0, endTime = Infinity } = this.config;
      const duration = endTime === Infinity ? Infinity : endTime - startTime;
      this.animationController.update(currentTime, startTime, duration);
    }
  }

  /**
   * ウォーターマークを描画
   */
  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): void {
    if (!this.image) {
      console.log('WatermarkEffect.render: No image available, skipping render');
      return;
    }

    // console.log('WatermarkEffect.render: Rendering watermark effect', { 
    //   id: this.getId(),
    //   visible: this.isVisible(),
    //   config: this.config
    // });

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
      // 元の画像のアスペクト比を計算
      const origAspectRatio = this.image.width / this.image.height;
      
      // 指定されたサイズの横幅と高さからアスペクト比を維持した実際のサイズを計算
      let finalWidth = size.width * effectiveScale;
      let finalHeight = size.height * effectiveScale;
      
      // アスペクト比を維持するための調整
      if (finalWidth / finalHeight > origAspectRatio) {
        // 幅が広すぎる場合、高さに合わせる
        finalWidth = finalHeight * origAspectRatio;
      } else {
        // 高さが高すぎる場合、幅に合わせる
        finalHeight = finalWidth / origAspectRatio;
      }
      
      // 中央配置のための位置調整
      const x = position.x + (size.width - finalWidth) / 2;
      const y = position.y + (size.height - finalHeight) / 2;

      // console.log('WatermarkEffect: Maintaining aspect ratio', {
      //   originalSize: { width: this.image.width, height: this.image.height },
      //   aspectRatio: origAspectRatio,
      //   requestedSize: { width: size.width, height: size.height },
      //   finalSize: { width: finalWidth, height: finalHeight }
      // });

      if (effectiveRotation !== 0) {
        // 回転の中心を設定
        const centerX = x + finalWidth / 2;
        const centerY = y + finalHeight / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(effectiveRotation);
        ctx.translate(-centerX, -centerY);
      }

      ctx.drawImage(this.image, x, y, finalWidth, finalHeight);
      // console.log('WatermarkEffect.render: Image drawn at', {
      //   x, y, width: finalWidth, height: finalHeight
      // });
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

  getBoundingBox(canvasWidth: number, canvasHeight: number): { x: number; y: number; width: number; height: number; } | null {
    const {
      position = { x: 0.1, y: 0.1 },
      size = { width: 100, height: 50 },
      coordinateSystem = 'absolute'
    } = this.config;

    const absoluteRectData = convertRect(
      position,
      size,
      coordinateSystem,
      'absolute',
      { width: canvasWidth, height: canvasHeight }
    );

    return {
      x: absoluteRectData.position.x,
      y: absoluteRectData.position.y,
      width: absoluteRectData.size.width,
      height: absoluteRectData.size.height
    };
  }
} 